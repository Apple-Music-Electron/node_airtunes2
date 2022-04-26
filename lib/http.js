const net = require('net');

// ...

const HttpMessage = (parseStartLine, writeStartLine) => {
    const instance = {};

    instance.parse = buffer => {
        const messageObject = {};

        // ...

        let bodyIndex       = buffer.indexOf('\r\n\r\n');
        let headerString    = buffer.slice(0, bodyIndex).toString();
        let body            = buffer.slice(bodyIndex + 4);

        headerString.replace(/\r\n/g, '\n');

        const lines         = headerString.split('\n');

        bodyIndex += 2;

        // ...

        let line = lines.shift();
        parseStartLine(line, messageObject);

        // ...

        messageObject.headers = {};

        line = lines.shift();
        while (line)
        {
            const headerName    = line.substr(0, line.indexOf(':'));
            const headerValue   = line.substr(line.indexOf(':') + 1);

            messageObject.headers[headerName] = headerValue.trim();
            
            line = lines.shift();
        }  

        // ...

        if (messageObject.headers['Content-Length'] && messageObject.headers['Content-Length'] != 0)
        {
            messageObject.body = body;
        }

        return messageObject;
    };

    instance.write = messageObject => {
        let messageString = writeStartLine(messageObject);
        messageString += '\r\n';

        if (messageObject.body)
        {
            messageObject.headers['Content-Length'] = Buffer.byteLength(messageObject.body);
        }

        for (const header in messageObject.headers)
        {
            messageString += `${header}: ${messageObject.headers[header]}\r\n`;
        }

        messageString += '\r\n';

        const buffer = Buffer.from(messageString);
        
        if (!messageObject.body)
        {
            return buffer;
        }

        return Buffer.concat([buffer, messageObject.body], buffer.length + messageObject.body.length);
    };

    return instance;
};

const HttpRequest
    = () => HttpMessage(
        () => {},   // currently not parsing requests.
        messageObject => `${messageObject.method} ${messageObject.path} HTTP/1.1`
    );

const HttpResponse
    = () => HttpMessage(
        (line, messageObject) => messageObject.statusCode = parseInt(line.split(' ')[1]),
        () => {}    // currently not writing responses.
    );

// ...

class HttpClient
{
    constructor()
    {
        this.resolveQueue       = [];
        this.pendingResponse    = null;
    }

    // ....

    parseResponse(data)
    {
        const res = HttpResponse().parse(data);
        if (res.headers['Content-Length'] > 0)
        {
            const remaining = res.headers['Content-Length'] - res.body.byteLength;
            if (remaining > 0)
            {
                // not all data for this response's corresponding request was read. Create a pending response object
                // to use for further reads.
                this.pendingResponse = {
                    res, 
                    remaining
                };
            }
        }

        if (!this.pendingResponse)
        {
            const rr = this.resolveQueue.shift();
            res.statusCode === 200 
                ? rr.resolve(res)
                : rr.resolve(null);
        }
    }

    // ...

    connect(host, port = 80)
    {
        this.host = host;

        return new Promise(resolve => {
            this.socket = net.connect(
                {
                    host,
                    port
                },
                resolve
            );

            this.socket.on('data', data => {
                if (!this.pendingResponse)
                {
                    // there is no response pending, parse the data.
                    this.parseResponse(data);
                }
                else
                {
                    // incoming data for the pending response.
                    this.pendingResponse.res.body = Buffer.concat(
                        [this.pendingResponse.res.body, data], 
                        data.byteLength + this.pendingResponse.res.body.byteLength
                    );

                    this.pendingResponse.remaining -= data.byteLength;
                    if (this.pendingResponse.remaining === 0)
                    {
                        // all remaining data for the pending response has been read; resolve the promise for the 
                        // corresponding request.
                        const rr = this.resolveQueue.shift();
                        this.pendingResponse.res.statusCode === 200 
                            ? rr.resolve(this.pendingResponse.res)
                            : rr.reject(new Error(`HTTP status: ${this.pendingResponse.res.statusCode}`));

                        this.pendingResponse = null;
                    }
                }
            });
        });
    }

    request(method, path, headers, body)
    {
        headers = headers || {};
        // headers['Host'] = `${this.host}:${this.socket.remotePort}`;

        const data = HttpRequest().write({
            method,
            path,
            headers,
            body
        });

        // ...

        return new Promise((resolve, reject) => {
            this.resolveQueue.push({ resolve, reject });
            this.socket.write(data);
        });
    }

    close()
    {
        this.socket.end();
    }
}

// ...

module.exports = () => new HttpClient();