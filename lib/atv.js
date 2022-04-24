const crypto            = require('crypto');
const fs                = require('fs');

const bplistCreator     = require('bplist-creator');
const bplistParser      = require('bplist-parser');

const SRP               = require('./srp');
const ATVAuthenticator  = require('./atvAuthenticator')
const httpClientFactory = require('./http');

// ...
// Configuration.
const loadConfig = configFilePath => !fs.existsSync(configFilePath) ? null : JSON.parse(fs.readFileSync(configFilePath));
const saveConfig = (configFilePath, config) => fs.writeFileSync(configFilePath, JSON.stringify(config, null, '\t'));

// ...

class ATV
{
    constructor(addr, port)
    {
        this.addr = addr;
        this.port = port || 7000;

        this.httpClient = httpClientFactory();
        this.auth_secret = null
    }

    // ...

    auth(configFilePath, authenticator)
    {
        async function auth(owner)
        {
            await owner.httpClient.connect(owner.addr, owner.port);

            let conf = loadConfig(configFilePath);
            if (!conf || !conf['auth_secret'])
            {
                // a pairing does not exist and must be performed.
                
                // ...
                // SRP parameters. 
                const srp = new SRP(2048);

                let I = '366B4165DD64AD3A';
                let P;
                let s;
                let B;
                let a;
                let A;
                let M1;
                
                await owner.httpClient.request('POST', '/pair-pin-start')
                    .then(() => authenticator())
                    .then(pin => {
                        P = pin;

                        return owner.httpClient.request(
                            'POST',
                            '/pair-setup-pin', 
                            { 
                                'Content-Type': 'application/x-apple-binary-plist' 
                            }, 
                            bplistCreator({ 
                                user: '366B4165DD64AD3A',
                                method: 'pin'
                            })
                        )
                    })
                    .then(res => {
                        const { pk, salt } = bplistParser.parseBuffer(res.body)[0];
                        
                        s = salt.toString('hex');
                        B = pk.toString('hex');
            
                        // SRP: Generate random auth_secret, 'a'; if pairing is successful, it'll be utilized in 
                        // subsequent session authentication(s).
                        a = crypto.randomBytes(32).toString('hex');
            
                        // SRP: Compute A and M1. 
                        A   = srp.A(a);
                        M1  = srp.M1(I, P, s, a, B);

                        return owner.httpClient.request(
                            'POST',
                            '/pair-setup-pin',
                            {
                                'Content-Type': 'application/x-apple-binary-plist'
                            },
                            bplistCreator({
                                pk: Buffer.from(A, 'hex'),
                                proof: Buffer.from(M1, 'hex')
                            })
                        );
                    })
                    .then(() => {
                        // confirm the auth secret (a).
                        const { epk, authTag } = ATVAuthenticator.confirm(a, srp.K(I, P, s, a, B));
            
                        // complete pair-setup-pin by registering the auth secret with the target device.
                        return owner.httpClient.request(
                            'POST',
                            '/pair-setup-pin',
                            {
                                'Content-Type': 'application/x-apple-binary-plist'
                            },
                            bplistCreator({
                                epk: Buffer.from(epk, 'hex'),
                                authTag: Buffer.from(authTag, 'hex')
                            })
                        );
                    })
                    .then(() => {
                        // save the auth secret for subsequent session authentication(s).
                        !conf && (conf = {});
                        conf['auth_secret'] = a;
                        saveConfig(configFilePath, conf);  
                    });
            }

            // ...
            // Authenticate session with the target device using existing pairing information.
            const verifier = ATVAuthenticator.verifier(conf['auth_secret']);

            return owner.httpClient.request(
                'POST',
                '/pair-verify',
                {
                    'Content-Type': 'application/octet-stream'
                },
                verifier.verifierBody
            )
            .then(res => {
                const atv_pub   = res.body.slice(0, 32).toString('hex');
                const atv_data  = res.body.slice(32).toString('hex'); 
        
                const shared    = ATVAuthenticator.shared(verifier.v_pri, atv_pub);
                const signed    = ATVAuthenticator.signed(conf['auth_secret'], verifier.v_pub, atv_pub);
                const signature = Buffer.from(
                    Buffer.from([0x00, 0x00, 0x00, 0x00]).toString('hex') + 
                    ATVAuthenticator.signature(shared, atv_data, signed),
                    'hex'
                );

                return owner.httpClient.request(
                    'POST',
                    '/pair-verify',
                    {
                        'Content-Type': 'application/octet-stream'
                    },
                    signature
                );
            });
        };

        return auth(this);
    }

    authSecret() {
        return this.auth_secret;
    }

    authSimple(authenticator){
        async function auth(owner)
        {
        await owner.httpClient.connect(owner.addr, owner.port);

            let conf = null
            if (!conf || !conf['auth_secret'])
            {
                // a pairing does not exist and must be performed.
                
                // ...
                // SRP parameters. 
                const srp = new SRP(2048);

                let I = '366B4165DD64AD3A';
                let P;
                let s;
                let B;
                let a;
                let A;
                let M1;
                
                await owner.httpClient.request('POST', '/pair-pin-start')
                    .then(() => authenticator())
                    .then(pin => {
                        P = pin;

                        return owner.httpClient.request(
                            'POST',
                            '/pair-setup-pin', 
                            { 
                                'Content-Type': 'application/x-apple-binary-plist' 
                            }, 
                            bplistCreator({ 
                                user: '366B4165DD64AD3A',
                                method: 'pin'
                            })
                        )
                    })
                    .then(res => {
                        const { pk, salt } = bplistParser.parseBuffer(res.body)[0];
                        
                        s = salt.toString('hex');
                        B = pk.toString('hex');
            
                        // SRP: Generate random auth_secret, 'a'; if pairing is successful, it'll be utilized in 
                        // subsequent session authentication(s).
                        a = crypto.randomBytes(32).toString('hex');
            
                        // SRP: Compute A and M1. 
                        A   = srp.A(a);
                        M1  = srp.M1(I, P, s, a, B);

                        return owner.httpClient.request(
                            'POST',
                            '/pair-setup-pin',
                            {
                                'Content-Type': 'application/x-apple-binary-plist'
                            },
                            bplistCreator({
                                pk: Buffer.from(A, 'hex'),
                                proof: Buffer.from(M1, 'hex')
                            })
                        );
                    }).then(() => {
                        // confirm the auth secret (a).
                        const { epk, authTag } = ATVAuthenticator.confirm(a, srp.K(I, P, s, a, B));
            
                        // complete pair-setup-pin by registering the auth secret with the target device.
                        return owner.httpClient.request(
                            'POST',
                            '/pair-setup-pin',
                            {
                                'Content-Type': 'application/x-apple-binary-plist'
                            },
                            bplistCreator({
                                epk: Buffer.from(epk, 'hex'),
                                authTag: Buffer.from(authTag, 'hex')
                            })
                        );
                    })
                    .then(() => {
                        // save the auth secret for subsequent session authentication(s).
                        console.log(a); owner.auth_secret = a;})
        }}
        return auth(this);
    }

    verifySimple(secret){
        // ...
            // Authenticate session with the target device using existing pairing information.
            const verifier = ATVAuthenticator.verifier(secret);

            return owner.httpClient.request(
                'POST',
                '/pair-verify',
                {
                    'Content-Type': 'application/octet-stream'
                },
                verifier.verifierBody
            )
            .then(res => {
                const atv_pub   = res.body.slice(0, 32).toString('hex');
                const atv_data  = res.body.slice(32).toString('hex'); 
        
                const shared    = ATVAuthenticator.shared(verifier.v_pri, atv_pub);
                const signed    = ATVAuthenticator.signed(secret, verifier.v_pub, atv_pub);
                const signature = Buffer.from(
                    Buffer.from([0x00, 0x00, 0x00, 0x00]).toString('hex') + 
                    ATVAuthenticator.signature(shared, atv_data, signed),
                    'hex'
                );

                return owner.httpClient.request(
                    'POST',
                    '/pair-verify',
                    {
                        'Content-Type': 'application/octet-stream'
                    },
                    signature
                );
            });
    }

    play(videoUrl)
    {
        return this.httpClient.request(
            'POST',
            '/play',
            {
                'Content-Type': 'application/x-apple-binary-plist'
            },
            bplistCreator({
                'Content-Location': videoUrl,
                'Start-Location': 0
            })
        );
    }

    stop()
    {
        return this.httpClient.request('POST', '/stop');
    }

    close()
    {
        this.httpClient.close();
    }
}

// ...

module.exports = ATV;