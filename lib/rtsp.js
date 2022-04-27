var net = require('net'),
    crypto = require('crypto'),
    events = require('events'),
    util = require('util'),
    fs = require('fs'),
    config = require('./config.js'),
    nu = require('./num_util.js');
const bplistCreator     = require('bplist-creator');
const bplistParser      = require('bplist-parser');   
const SRP               = require('./srp');
const ATVAuthenticator  = require('./atvAuthenticator')
const ATV = require('./atv');
const { method } = require('lodash');
var INFO = -1;
    OPTIONS = 0,
    ANNOUNCE = 1,
    SETUP = 2,
    RECORD = 3,
    SETVOLUME = 4,
    PLAYING = 5,
    TEARDOWN = 6,
    CLOSED = 7,
    SETDAAP = 8,
    SETART = 9,
    PAIR_VERIFY_1 = 10,
    PAIR_VERIFY_2 = 11,
    OPTIONS2 = 12,
    AUTH_SETUP = 13;

function Client(volume, password, audioOut, options) {
  events.EventEmitter.call(this);

  this.audioOut = audioOut;
  this.status = PAIR_VERIFY_1;
  this.socket = null;
  this.cseq = 0;
  this.announceId = null;
  this.activeRemote = nu.randomInt(9);
  this.dacpId = nu.randomHex(8);
  this.session = null;
  this.timeout = null;
  this.volume = volume;
  this.password = password;
  this.passwordTried = false;
  this.requireEncryption = false;
  this.trackInfo = null;
  this.artwork = null;
  this.artworkContentType = null;
  this.callback = null;
  this.controlPort = null;
  this.timingPort  = null;
  this.heartBeat = null;
  this.pair_verify_1_verifier = null;
  this.pair_verify_1_signature = null;
  this.code_digest = null;
  this.authSecret = null;
  this.mode = options?.mode ?? 0;
  this.dnstxt = options?.txt ?? [];
  this.alacEncoding = options?.alacEncoding ?? true;
}

util.inherits(Client, events.EventEmitter);

exports.Client = Client;

Client.prototype.startHandshake = function(udpServers, host, port) {
  var self = this;
  this.startTimeout();

  this.controlPort = udpServers.control.port;
  this.timingPort  = udpServers.timing.port;


  this.socket = net.connect(port, host, async function() {
    self.clearTimeout();
   
    if (self.password != null && self.mode == 0) {
      let atv = new ATV(host,port);
      await atv.authSimple(() => new Promise((resolve, reject) => {return self.password}));
      self.authSecret = atv.authSecret()
      console.log("ed",atv.authSecret())
      self.sendNextRequest();
      self.startHeartBeat();
    } else {
      if (self.mode != 2) {
        console.log("AUTH_SETUP","nah")
        self.status = OPTIONS;
        self.sendNextRequest();
        self.startHeartBeat();
      } else {
        self.status = AUTH_SETUP;
        console.log("AUTH_SETUP","yah")
        self.sendNextRequest();
        self.startHeartBeat();
      }

      
    }
  });

  var blob = '';
  this.socket.on('data', function(data) {
    self.clearTimeout();

    /*
     * I wish I could use node's HTTP parser for this...
     * I assume that all responses have empty bodies.
     */
    var rawData = data
    if ((data.toString().includes('bplist'))){
      const splitIndex = data.indexOf('\r\n\r\n');
      if (splitIndex === -1) {
        throw new Error('Data does not contain CRLFCRLF');
      }
      const headData = data.slice(0, splitIndex);
      const rawBodyData = data.slice(splitIndex + 4);
    try{ 
    self.parseObject(plist.parse(rawBodyData));
    } catch (e){
      console.log(e)
    } 
    }
    // if ((data.toString().includes('application/octet-stream'))){
    //   const splitIndex = data.indexOf('\r\n\r\n');
    //   if (splitIndex === -1) {
    //     throw new Error('Data does not contain CRLFCRLF');
    //   }
    //   const headData = data.slice(0, splitIndex);
    //   const rawBodyData = data.slice(splitIndex + 4);
    // try{ 
    // self.parseObject(plist.parse(rawBodyData));
    // } catch (e){
    //   console.log(e)
    // } 
    // }
    data = data.toString();

    blob += data;
    var endIndex = blob.indexOf('\r\n\r\n');

    if (endIndex < 0) {
      return;
    }

    endIndex += 4;

    blob = blob.substring(0, endIndex);

    self.processData(blob, rawData);

    blob = data.substring(endIndex);
  });

  this.socket.on('error', function(err) {
    self.socket = null;
    console.log(err.code);
    if(err.code === 'ECONNREFUSED'){
      console.log('block');
      self.cleanup('connection_refused');}
    else
      self.cleanup('rtsp_socket', err.code);
  });

  this.socket.on('end', function() {
    console.log('block2');
    self.cleanup('disconnected');
  });
};

Client.prototype.startTimeout = function() {
  var self = this;

  this.timeout = setTimeout(function() {
    console.log('timeout');
    self.cleanup('timeout');
  }, config.rtsp_timeout);
};

Client.prototype.clearTimeout = function() {
  if(this.timeout !== null) {
    clearTimeout(this.timeout);
    this.timeout = null;
  }
};

Client.prototype.teardown = function() {
  if(this.status === CLOSED) {
    this.emit('end', 'stopped');
    return;
  }

  this.status = TEARDOWN;
  this.sendNextRequest();
};

Client.prototype.setVolume = function(volume, callback) {
  if(this.status !== PLAYING)
    return;

  this.volume = volume;
  this.callback = callback;
  this.status = SETVOLUME;
  this.sendNextRequest();
};

Client.prototype.setPasscode = async function(passcode) {
  this.password = passcode;
  let atv = new ATV(host,port);
  await atv.authSimple(() => new Promise((resolve, reject) => {return self.password}));
  self.authSecret = atv.authSecret()
  this.status = PAIR_VERIFY_1;
  self.sendNextRequest();
}

Client.prototype.startHeartBeat = function() {
  var self = this;

  if (config.rtsp_heartbeat > 0){
    this.heartBeat = setInterval(function() {
      self.sendHeartBeat(function(){
        //console.log('HeartBeat sent!');
      });
    }, config.rtsp_heartbeat);
  }
};

Client.prototype.sendHeartBeat = function(callback) {
  if(this.status !== PLAYING)
    return;

  this.status = OPTIONS;
  this.callback = callback;
  this.sendNextRequest();
};

Client.prototype.setTrackInfo = function(name, artist, album, callback) {
  if(this.status !== PLAYING)
    return;

  this.trackInfo = {
    name: name,
    artist: artist,
    album: album
  };
  this.status = SETDAAP;
  this.callback = callback;
  this.sendNextRequest();
};

Client.prototype.setArtwork = function(art, contentType, callback) {
  if(this.status !== PLAYING)
    return;

  if (typeof contentType == 'function') {
    callback = contentType;
    contentType = null;
  }

  if (typeof art == 'string') {
    var self = this;
    if (contentType === null) {
      var ext = art.slice(-4);
      if (ext == ".jpg" || ext == "jpeg") {
        contentType = "image/jpeg";
      } else if (ext == ".png") {
        contentType = "image/png";
      } else if (ext == ".gif") {
        contentType = "image/gif";
      } else {
        return self.cleanup('unknown_art_file_ext');
      }
    }
    return fs.readFile(art, function(err, data) {
      if (err !== null) {
        return self.cleanup('invalid_art_file');
      }
      self.setArtwork(data, contentType, callback);
    });
  }

  if (contentType === null)
    return this.cleanup('no_art_content_type');

  this.artworkContentType = contentType;
  this.artwork = art;
  this.status = SETART;
  this.callback = callback;
  this.sendNextRequest();
};

Client.prototype.nextCSeq = function() {
  this.cseq += 1;

  return this.cseq;
};

Client.prototype.cleanup = function(type, msg) {
  this.emit('end', type, msg);
  this.status = CLOSED;
  this.trackInfo = null;
  this.artwork = null;
  this.artworkContentType = null;
  this.callback = null;
  this.removeAllListeners();

  if(this.timeout) {
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  if (this.heartBeat) {
    clearInterval(this.heartBeat);
    this.heartBeat = null;
  }

  if(this.socket) {
    this.socket.destroy();
    this.socket = null;
  }
};

function parseResponse(blob) {
  var response = {}, lines = blob.split('\r\n');


  // if (lines[0].match(/^Audio-Latency/)) {
  //     let tmp = lines[0];
  //     lines[0] = lines[1];
  //     lines[1] = tmp;
  // }

  var codeRes = /(\w+)\/(\S+) (\d+) (.*)/.exec(lines[0]);
  if(!codeRes) {
    response.code = 599;
    response.status = 'UNEXPECTED ' + lines[0];

    return response;
  }

  response.code = parseInt(codeRes[3], 10);
  response.status = codeRes[4];

  var headers = {};
  lines.slice(1).forEach(function(line) {
    var res = /([^:]+):\s*(.*)/.exec(line);

    if(!res)
      return;

    headers[res[1]] = res[2];
  });

  response.headers = headers;
  //console.log(response);
  return response;
}

function parseResponse2(blob) {

  var response = {}, lines = blob.split('\r\n');
  console.log(lines);

  if (lines[0].match(/^Audio-Latency/)) {
      let tmp = lines[0];
      lines[0] = lines[1];
      lines[1] = tmp;
  }

  var codeRes = /(\w+)\/(\S+) (\d+) (.*)/.exec(lines[0]);
  if(!codeRes) {
    response.code = 599;
    response.status = 'UNEXPECTED ' + lines[0];

    return response;
  }

  response.code = parseInt(codeRes[3], 10);
  response.status = codeRes[4];
  
  var headers = {};
  lines.slice(1).forEach(function(line) {
    var res = /([^:]+):\s*(.*)/.exec(line);

    if(!res)
      return;

    headers[res[1]] = res[2];
  });

  response.headers = headers;
  console.log('res: ', response);
  return response;
}

function md5(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);

  return md5sum.digest('hex').toUpperCase();
}

function md5norm(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);

  return md5sum.digest('hex');
}

Client.prototype.makeHead = function(method, uri, di, clear = false) {
  var head = method + ' ' + uri + ' RTSP/1.0' 
  if (!clear){
    head += 'CSeq: ' + this.nextCSeq() + '\r\n' +
    'User-Agent: ' + config.user_agent + '\r\n' +
    'DACP-ID: ' + this.dacpId + '\r\n' +
    'Client-Instance: ' + this.dacpId + '\r\n' +
    (this.session ? 'Session: ' + this.session + '\r\n' : '') +
    'Active-Remote: ' + this.activeRemote + '\r\n'};

  if(di) {
    var ha1 = md5(di.username + ':' + di.realm + ':' + di.password);
    var ha2 = md5(method + ':' + uri);
    var diResponse = md5(ha1 + ':' + di.nonce + ':' + ha2);

    head += 'Authorization: Digest ' +
      'username="' + di.username + '", ' +
      'realm="' + di.realm + '", ' +
      'nonce="' + di.nonce + '", ' +
      'uri="' + uri + '", ' +
      'response="' + diResponse + '"\r\n';
  }

  return head;
}

Client.prototype.makeHeadWithURL = function(method, digestInfo) {
  return this.makeHead(method, 'rtsp://' + this.socket.address().address + '/' + this.announceId, digestInfo);
}

Client.prototype.makeRtpInfo = function() {
  var nextSeq = this.audioOut.lastSeq + 1;
  var rtpSyncTime = nextSeq*config.frames_per_packet + 2*config.sampling_rate;
  return 'RTP-Info: seq=' + nextSeq + ';rtptime=' + rtpSyncTime + '\r\n';
};

Client.prototype.sendNextRequest = function(di) {
  var request = '', body = '';
  console.log('REQUEST STS', this.status);
  switch(this.status) {
  case PAIR_VERIFY_1:
    request = ''
    request += this.makeHead("POST","/pair-verify", "", true);
    request += 'Content-Type: application/octet-stream\r\n'
    this.pair_verify_1_verifier = ATVAuthenticator.verifier(this.authSecret);
    console.log(this.authSecret)
    request += 'Content-Length:' + Buffer.byteLength(this.pair_verify_1_verifier.verifierBody) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),this.pair_verify_1_verifier.verifierBody]))
    request = ''
    break;
  case PAIR_VERIFY_2:
    request = ''
    request += this.makeHead("POST","/pair-verify", "", true);
    request += 'Content-Type: application/octet-stream\r\n'
    request += 'Content-Length:' + Buffer.byteLength(this.pair_verify_1_signature) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),this.pair_verify_1_signature]))
    request = ''
    // const verifier = ATVAuthenticator.verifier('3c0591f41d1236c9ce5078sscd6fcd42f71f374b8b6dff33fea825366f1c34f828');
    // request += 'Content-Length:' + Buffer.byteLength(verifier.verifierBody) + '\r\n\r\n';
    // this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),verifier.verifierBody]))
    // request = ''  
  break;
  case AUTH_SETUP:
    request = ''
    request += this.makeHead("POST","/auth-setup", di);
    request += 'Content-Length:' + 33 + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),
    Buffer.from([0x01, // unencrypted
            0x59,0x02,0xed,0xe9,0x0d,0x4e,0xf2,0xbd, // static Curve 25519 key
            0x4c,0xb6,0x8a,0x63,0x30,0x03,0x82,0x07,
            0xa9,0x4d,0xbd,0x50,0xd8,0xaa,0x46,0x5b,
            0x5d,0x8c,0x01,0x2a,0x0c,0x7e,0x1d,0x4e])
          ]))
    request = ''
    // this.status = OPTIONS;
    // this.sendNextRequest()
  break;
  case OPTIONS:
    request += this.makeHead('OPTIONS', '*', di);
    request += 'Apple-Challenge: SdX9kFJVxgKVMFof/Znj4Q\r\n\r\n';
  break;  
  case OPTIONS2:
      
      request = ''
      request += this.makeHead('OPTIONS', '*', di);
      request += this.code_digest;
      this.socket.write(Buffer.from(request, 'utf-8'))
      console.log("yas")
      request = ''
  break;
  case ANNOUNCE:
    this.announceId = nu.randomInt(8);

    body =
      'v=0\r\n' +
      'o=iTunes ' + this.announceId +' 0 IN IP4 ' + this.socket.address().address + '\r\n' +
      's=iTunes\r\n' +
      'c=IN IP4 ' + this.socket.address().address + '\r\n' +
      't=0 0\r\n' +
      'm=audio 0 RTP/AVP 96\r\n';
    if (!this.alacEncoding){
      body = body + 'a=rtpmap:96 L16/44100/2\r\n' +
      'a=fmtp:96 352 0 16 40 10 14 2 255 0 0 44100\r\n'} else {
      body = body + 'a=rtpmap:96 AppleLossless\r\n' +
      'a=fmtp:96 352 0 16 40 10 14 2 255 0 0 44100\r\n' 
      }
;
    if (this.requireEncryption) {
      body +=
        'a=rsaaeskey:' + config.rsa_aeskey_base64 + '\r\n' +
        'a=aesiv:' + config.iv_base64 + '\r\n';
    }

    request += this.makeHeadWithURL('ANNOUNCE', di);
    request +=
      'Content-Type: application/sdp\r\n' +
      'Content-Length: ' + body.length + '\r\n\r\n';

    request += body;
    //console.log(request);
    break;
  case SETUP:
    request += this.makeHeadWithURL('SETUP', di);
    request +=
      'Transport: RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;' +
      'control_port=' + this.controlPort + ';' +
      'timing_port=' + this.timingPort + '\r\n\r\n';
    //console.log(request);  
    break;

  case RECORD:
    request += this.makeHeadWithURL('RECORD', di);
    request += 'Range: npt=0-\r\n' + this.makeRtpInfo()+ '\r\n';
    //console.log(request);
    break;

  case SETVOLUME:
    var attenuation =
      this.volume === 0.0 ?
      -144.0 :
      (-30.0)*(100 - this.volume)/100.0;

    body = 'volume: ' + attenuation + '\r\n';

    request += this.makeHeadWithURL('SET_PARAMETER', di);
    request +=
      'Content-Type: text/parameters\r\n' +
      'Content-Length: ' + body.length + '\r\n\r\n';

    request += body;
    //console.log(request);
    break;

  case SETDAAP:
    var name = this.daapEncode('minm', this.trackInfo.name);
    var artist = this.daapEncode('asar', this.trackInfo.artist);
    var album = this.daapEncode('asal', this.trackInfo.album);
    var daapInfo = this.daapEncodeList('mlit', name, artist, album);

    var head = this.makeHeadWithURL('SET_PARAMETER', di);
    head += this.makeRtpInfo();
    head +=
      'Content-Type: application/x-dmap-tagged\r\n' +
      'Content-Length: ' + daapInfo.length + '\r\n\r\n';

    var buf = new Buffer(head.length);
    buf.write(head, 0, head.length, 'ascii');
    request = Buffer.concat([buf, daapInfo]);
    //console.log(request);
    break;

  case SETART:
    var head = this.makeHeadWithURL('SET_PARAMETER', di);
    head += this.makeRtpInfo();
    head +=
      'Content-Type: ' + this.artworkContentType + '\r\n' +
      'Content-Length: ' + this.artwork.length + '\r\n\r\n';

    var buf = new Buffer(head.length);
    buf.write(head, 0, head.length, 'ascii');
    request = Buffer.concat([buf, this.artwork]);
    //console.log(request);
    break;

  case TEARDOWN:
    this.socket.end(this.makeHead('TEARDOWN', '', di) + '\r\n');
    console.log('teardown');
    this.cleanup('stopped');
    // return here since the socket is closed
    return;

  default:
    return;
  }

  this.startTimeout();
  this.socket.write(request);
};

Client.prototype.daapEncodeList = function(field) {
  var values = Array.prototype.slice.call(arguments);
  values.shift();
  var value = Buffer.concat(values);
  var buf = new Buffer(field.length + 4);
  buf.write(field, 0, field.length, 'ascii');
  buf.writeUInt32BE(value.length, field.length);
  return Buffer.concat([buf, value]);
};

Client.prototype.daapEncode = function(field, value) {
  var buf = new Buffer(field.length + value.length + 4);
  buf.write(field, 0, field.length, 'ascii');
  buf.writeUInt32BE(value.length, field.length);
  buf.write(value, field.length + 4, value.length, 'ascii');
  return buf;
};

Client.prototype.parsePorts = function(headers) {
  function parsePort(name, transport) {
    var re = new RegExp(name + '=(\\d+)');
    var res = re.exec(transport);

    return res ? parseInt(res[1]) : null;
  }

  var transport = headers['Transport'],
      rtspConfig = {
        audioLatency: parseInt(headers['Audio-Latency']),
        requireEncryption: this.requireEncryption
      },
      names = ['server_port', 'control_port', 'timing_port'];

  for(var i = 0; i < names.length; i++) {
    var name = names[i];
    var port = parsePort(name, transport);

    if(port === null) {
      console.log('parseport');
      this.cleanup('parse_ports', transport);
      return false;
    } else
      rtspConfig[name] = port;
  }

  this.emit('config', rtspConfig);

  return true;
}

function parseAuthenticate(auth, field) {
  var re = new RegExp(field + '="([^"]+)"'),
      res = re.exec(auth);

  return res ? res[1] : null;
}

Client.prototype.processData = function(blob, rawData) {
  var response = parseResponse2(blob),
      headers = response.headers;
    console.log('status',this.status);
  if (this.status != OPTIONS && this.mode == 0) {
    if(response.code === 401) {
      if(!this.password) {
        console.log('nopass');
        if (this.status == OPTIONS2){
        this.cleanup('no_password');}
        return;
    }

    if(this.passwordTried) {
      console.log('badpass');
      this.cleanup('bad_password');

      return;
    } else
      this.passwordTried = true;

    var auth = headers['WWW-Authenticate'];
    
    var di = {
      realm: parseAuthenticate(auth, 'realm'),
      nonce: parseAuthenticate(auth, 'nonce'),
      username: 'Radioline',
      password: this.password
    };
    console.log()
    this.sendNextRequest(di);
    return;
  }

  if(response.code === 453) {
    console.log('busy');
    this.cleanup('busy');
    return;
  }

  if(response.code !== 200) {
    console.log(response.status);
    this.cleanup(response.status);
    return;
  }} else if (this.mode == 1){
        if(response.code === 401) {
          if(!this.password) {
            console.log('nopass');
            this.cleanup('no_password');
            return;
        }

        if(this.passwordTried) {
          console.log('badpass');
          this.cleanup('bad_password');

          return;
        } else
          this.passwordTried = true;

        var auth = headers['WWW-Authenticate'];
        
        var di = {
          realm: parseAuthenticate(auth, 'realm'),
          nonce: parseAuthenticate(auth, 'nonce'),
          username: 'Radioline',
          password: this.password
        };
        console.log(di)
        this.sendNextRequest(di);
        return;
      }

      if(response.code === 453) {
        console.log('busy');
        this.cleanup('busy');
        return;
      }

      if(response.code !== 200) {
        console.log(response.status);
        this.cleanup(response.status);
        return;
      }
  }
   

  // password was accepted (or not needed)
  this.passwordTried = false;

  switch(this.status) {
    case PAIR_VERIFY_1:
      let buf1 = Buffer.from(rawData).slice(rawData.length - 96,rawData.length)
      console.log('verify2',Buffer.byteLength(buf1))
      const atv_pub   = buf1.slice(0, 32).toString('hex');
      const atv_data  = buf1.slice(32).toString('hex'); 

      const shared    = ATVAuthenticator.shared(this.pair_verify_1_verifier.v_pri, atv_pub);
      const signed    = ATVAuthenticator.signed(this.authSecret, this.pair_verify_1_verifier.v_pub, atv_pub);
      this.pair_verify_1_signature = Buffer.from(
          Buffer.from([0x00, 0x00, 0x00, 0x00]).toString('hex') + 
          ATVAuthenticator.signature(shared, atv_data, signed),
          'hex'
      );
      console.log('verify2', Buffer.byteLength(this.pair_verify_1_signature))
      this.status = PAIR_VERIFY_2
    break;
    case PAIR_VERIFY_2:
      this.status = OPTIONS 
    break;
    case AUTH_SETUP:
      this.status = OPTIONS 
    break;
    case OPTIONS:
      /*
       * Devices like Apple TV and Zeppelin Air do not support encryption.
       * Only way of checking that: they do not reply to Apple-Challenge
       */
      if(headers['Apple-Response'])
        this.requireEncryption = true;
      // console.log("yeah22332",headers['WWW-Authenticate'],response.code)
      if (headers['WWW-Authenticate'] != null & response.code === 401) {
          let auth = headers['WWW-Authenticate'];
          let realm = parseAuthenticate(auth, 'realm');
          let nonce = parseAuthenticate(auth, 'nonce');
          let uri = "*"
          let user = "iTunes"
          let methodx = "OPTIONS"
          let pwd = this.password
          ha1 = md5norm(`${user}:${realm}:${pwd}`)
          ha2 = md5norm(`${methodx}:${uri}`)
          di_response = md5(`${ha1}:${nonce}:${ha2}`)
          this.code_digest = `Authorization: Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${di_response}" \r\n\r\n`
          this.status = OPTIONS2;
      } else {
        this.status = this.session? PLAYING: ANNOUNCE;
      }

    break;
    case OPTIONS2:
        /*
         * Devices like Apple TV and Zeppelin Air do not support encryption.
         * Only way of checking that: they do not reply to Apple-Challenge
         */
        // if(headers['Apple-Response'])
        //   this.requireEncryption = true;
  
        this.status = this.session? PLAYING: ANNOUNCE;

  
    break;
    case ANNOUNCE:
      this.status = SETUP;
      break;

    case SETUP:
      this.status = RECORD;
      this.session = headers['Session'];
      this.parsePorts(headers);
      break;

    case RECORD:
      this.status = SETVOLUME;
      this.emit('ready');
      break;

    case SETVOLUME:
      this.status = PLAYING;
      break;

    case SETDAAP:
      this.status = PLAYING;
      break;

    case SETART:
      this.status = PLAYING;
      break;
  }

  if (this.callback != null) {
    this.callback();
  }

  this.sendNextRequest();
}

Client.prototype.parseObject = function(plist){
  console.log('plist', plist)
  // if (plist['timingPort'] != null && plist['timingPort'] != 0){console.log('plist', 'timingPort',plist['timingPort']); this.timingPort = plist['timingPort']} 
  // if (plist['eventPort'] != null){
  //   console.log('plist', 'eventPort',plist['eventPort']); this.controlPort = plist['eventPort']
  //   if (this.timingPort != this.eventPort + 1){this.controlPort = this.eventPort + 1}
  // } 
  // if (plist["streams"][0]['dataPort'] != null && plist["streams"][0]['dataPort'] != this.dataPort ){
  //   console.log('plist', 'dataPort',plist["streams"][0]['dataPort']); this.dataPort = plist["streams"][0]['dataPort'];
  //   console.log('plist', 'controlPort',plist["streams"][0]['controlPort']); this.controlPort = plist["streams"][0]['controlPort'];
  //   names = ['server_port', 'control_port', 'timing_port'];

  // }
} 