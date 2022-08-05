var net = require('net'),
    crypto = require('crypto'),
    events = require('events'),
    util = require('util'),
    fs = require('fs'),
    config = require('./config.js'),
    nu = require('./num_util.js');
const bplistCreator = require('bplist-creator');
const bplistParser   = require('bplist-parser');   
const LegacySRP = require('./srp');
const {SRP, SRPClient, SrpClient}  = require('fast-srp-hap');
const ATVAuthenticator  = require('./atvAuthenticator')
const tlv = require('./homekit/tlv').default;
const enc = require('./homekit/encryption').default;
const Credentials = require('./homekit/credentials').Credentials;
const { method } = require('lodash');
const { hexString2ArrayBuffer } = require('./util.js');
const ed25519_js = require('@noble/ed25519');
const curve25519_js = require('curve25519-js');
const varint = require('varint');
const struct = require('python-struct');
const { default: number } = require('./homekit/number.js');
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
    AUTH_SETUP = 13,
    PAIR_PIN_START = 14,
    PAIR_PIN_SETUP_1 = 15,
    PAIR_PIN_SETUP_2 = 16,
    PAIR_PIN_SETUP_3 = 17,
    PAIR_SETUP_1 = 18,
    PAIR_SETUP_2 = 19,
    PAIR_SETUP_3 = 20,
    PAIR_VERIFY_HAP_1 = 21
    PAIR_VERIFY_HAP_2 = 22,
    SETUP_AP2_1 = 23,
    SETUP_AP2_2 = 24,
    SETPEERS = 25,
    FLUSH = 26;

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
  this.eventPort   = 32242;
  this.heartBeat = null;
  this.pair_verify_1_verifier = null;
  this.pair_verify_1_signature = null;
  this.code_digest = null;
  this.authSecret = null;
  this.mode = options?.mode ?? 0;
  this.dnstxt = options?.txt ?? [];
  this.alacEncoding = options?.alacEncoding ?? true;
  this.needPassword = options?.needPassword ?? false;
  this.airplay2 = options?.airplay2 ?? false;
  this.needPin = options?.needPin ?? false;
  this.debug = options?.debug ?? false;
  this.privateKey = null;
  this.srp = new SRP(2048);
  this.I = '366B4165DD64AD3A';
  this.P = null;
  this.s = null;
  this.B = null;
  this.a = null;
  this.A = null;
  this.M1 = null;
  this.epk = null; 
  this.authTag = null;
  this._atv_salt = null;
  this._atv_pub_key = null;
  this._hap_genkey = null;
  this._hap_encrypteddata = null;
  this.pairingId = null;
  this.seed = null;
  this.credentials = null;
  this.verifier_hap_1 = null;
  this.encryptionKey = null;
  this.encryptedChannel = false;
  this.hostip = null;
}

util.inherits(Client, events.EventEmitter);

exports.Client = Client;

Client.prototype.startHandshake = function(udpServers, host, port) {
  var self = this;
  this.startTimeout();
  this.hostip = host;
  this.controlPort = udpServers.control.port;
  this.timingPort  = udpServers.timing.port;
  this.eventPort  = udpServers.event.port;


  this.socket = net.connect(port, host, async function() {
    self.clearTimeout();
   
    if (self.needPassword) {
      self.status = PAIR_PIN_START;
      self.sendNextRequest();
      self.startHeartBeat();
    } else {
      if (self.mode != 2) {
          if (this.debug) console.log("AUTH_SETUP","nah")
        self.status = OPTIONS;
        self.sendNextRequest();
        self.startHeartBeat();
      } else {
        self.status = AUTH_SETUP;
          if (this.debug) console.log("AUTH_SETUP","yah")
        self.sendNextRequest();
        self.startHeartBeat();
      }

      
    }
  });

  var blob = '';
  this.socket.on('data', function(data) {
    if (self.encryptedChannel){
      if (self.debug != false) console.log("incoming", data)
      data = self.credentials.decrypt(data)
      if (self.debug != false) console.log("incoming", data.toString())
    } else {
      if (self.debug != false) console.log("unc-incoming", data)
    }
    self.clearTimeout();

    /*
     * I wish I could use node's HTTP parser for this...
     * I assume that all responses have empty bodies.
     */
    var rawData = data
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
      if (this.debug) console.log(err.code);
    if(err.code === 'ECONNREFUSED'){
        if (this.debug) console.log('block');
      self.cleanup('connection_refused');}
    else
      self.cleanup('rtsp_socket', err.code);
  });

  this.socket.on('end', function() {
    if (self.debug) console.log('block2');
    self.cleanup('disconnected');
  });
};

Client.prototype.startTimeout = function() {
  var self = this;

  this.timeout = setTimeout(function() {
    if (self.debug) console.log('timeout');
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
  this.status = this.airplay2 ? PAIR_SETUP_1 : PAIR_PIN_SETUP_1;
  this.sendNextRequest();
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
  this.srp = null;
  this.P = null;
  this.s = null;
  this.B = null;
  this.a = null;
  this.A = null;
  this.M1 = null;
  this.epk = null; 
  this.authTag = null;
  this._hap_genkey = null;
  this._hap_encrypteddata = null;
  this.seed = null;
  this.credentials = null;
  // this.password = null;
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
  //console.log(response);
  return response;
}

function parseResponse2(blob,self) {

  var response = {}, lines = blob.split('\r\n');
  if (self.debug) console.log(lines);

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
  if (this.debug) console.log('res: ', response);
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
  var head = method + ' ' + uri + ' RTSP/1.0' + '\r\n' 
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

Client.prototype.sendNextRequest = async function(di) {
  var request = '', body = '';
  if (this.debug) console.log('REQUEST STS', this.status);
  switch(this.status) {
  case PAIR_PIN_START:
    this.I = '366B4165DD64AD3A';
    this.P = null;
    this.s = null;
    this.B = null;
    this.a = null;
    this.A = null;
    this.M1 = null;
    this.epk = null; 
    this.authTag = null;
    this._atv_salt = null;
    this._atv_pub_key = null;
    this._hap_encrypteddata = null;
    this.seed = null;
    this.pairingId = crypto.randomUUID();
    this.credentials = null;
    this.verifier_hap_1 = null;
    this.encryptionKey = null;

    request = ''
    
    if (this.needPin || this.airplay2){
    request += this.makeHead("POST","/pair-pin-start", "", true);
    if (this.airplay2){
      request += 'User-Agent: AirPlay/320.20\r\n'
      request += 'Connection: keep-alive\r\n'
      request += 'CSeq: ' + 0 + '\r\n' ;
    }
    
    request += 'Content-Length:' + 0 + '\r\n\r\n';
    this.socket.write(Buffer.from(request, 'utf-8'))} else {
      this.emit('need_password');
      this.status = this.airplay2 ? PAIR_SETUP_1: PAIR_PIN_SETUP_1;
    }
    request = ''
  break;  
  case PAIR_PIN_SETUP_1:
    request = ''
    request += this.makeHead("POST","/pair-setup-pin", "", true);
    request += 'Content-Type: application/x-apple-binary-plist\r\n'
    let u =  bplistCreator({ 
      user: '366B4165DD64AD3A',
      method: 'pin'
    });
    request += 'Content-Length:' + Buffer.byteLength(u) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),u]))
    request = ''
  break;   
  case PAIR_PIN_SETUP_2:
    request = ''
    request += this.makeHead("POST","/pair-setup-pin", "", true);
    request += 'Content-Type: application/x-apple-binary-plist\r\n'
    let u1 =  bplistCreator({ 
      pk: Buffer.from(this.A, 'hex'),
      proof: Buffer.from(this.M1, 'hex')
    });
    request += 'Content-Length:' + Buffer.byteLength(u1) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),u1]))
    request = ''
  break;      
  case PAIR_PIN_SETUP_3:
    request = ''
    request += this.makeHead("POST","/pair-setup-pin", "", true);
    request += 'Content-Type: application/x-apple-binary-plist\r\n'
    let u2 =  bplistCreator({ 
      epk: Buffer.from(this.epk, 'hex'),
      authTag: Buffer.from(this.authTag, 'hex')
    });
    request += 'Content-Length:' + Buffer.byteLength(u2) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),u2]))
    request = ''
  break;  
  case PAIR_VERIFY_1:
    request = ''
    request += this.makeHead("POST","/pair-verify", "", true);
    request += 'Content-Type: application/octet-stream\r\n'
    this.pair_verify_1_verifier = ATVAuthenticator.verifier(this.authSecret);
    if (this.debug) console.log(this.authSecret)
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
  case PAIR_SETUP_1:
    if (this.debug) console.log('loh')
    request = ''
    request += this.makeHead("POST","/pair-setup", "", true);
    request += 'User-Agent: AirPlay/320.20\r\n'
    request += 'CSeq: ' + this.nextCSeq() + '\r\n' ;
    request += 'Connection: keep-alive\r\n'
    request += 'X-Apple-HKP: 3\r\n'
    let ps1 = tlv.encode(
      tlv.Tag.PairingMethod, 0x00,
      tlv.Tag.Sequence, 0x01,
    );
    request += 'Content-Length: ' + 6 + '\r\n';
    request += 'Content-Type: application/octet-stream' + '\r\n\r\n'
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),ps1]))
    request = ''
  break; 
  case PAIR_SETUP_2:
    if (this.debug) console.log('loh2')
    request = ''
    request += this.makeHead("POST","/pair-setup", "", true);
    request += 'User-Agent: AirPlay/320.20\r\n'
    request += 'CSeq: ' + this.nextCSeq() + '\r\n' ;
    request += 'Connection: keep-alive\r\n'
    request += 'X-Apple-HKP: 3\r\n'
    request += 'Content-Type: application/octet-stream\r\n'
    let ps2 = tlv.encode(
      tlv.Tag.Sequence, 0x03,
      tlv.Tag.PublicKey, this.A,
      tlv.Tag.Proof, this.M1,
    )
    request += 'Content-Length: ' + Buffer.byteLength(ps2) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),ps2]))
    request = ''
  break; 
  case PAIR_SETUP_3:
    if (this.debug) console.log('loh3')
    request = ''
    request += this.makeHead("POST","/pair-setup", "", true);
    request += 'User-Agent: AirPlay/320.20\r\n'
    request += 'CSeq: ' + this.nextCSeq() + '\r\n' ;
    request += 'Connection: keep-alive\r\n'
    request += 'X-Apple-HKP: 3\r\n'
    request += 'Content-Type: application/octet-stream\r\n'
    this.K = this.srp.computeK()
    this.seed = crypto.randomBytes(32);
    // let keyPair = ed25519.MakeKeypair(this.seed);
    this.privateKey = ed25519_js.utils.randomPrivateKey();
    let publicKey = await ed25519_js.getPublicKey(this.privateKey);
    // let keyPair = nacl.sign.keyPair.fromSeed(this.seed)
    // let privateKey = keyPair.secretKey;
    // let publicKey = keyPair.publicKey;
    let deviceHash = enc.HKDF(
        "sha512",
        Buffer.from("Pair-Setup-Controller-Sign-Salt"),
        this.K,
        Buffer.from("Pair-Setup-Controller-Sign-Info"),
        32
    );
    let deviceInfo = Buffer.concat([deviceHash, Buffer.from(this.pairingId), publicKey]);
    let deviceSignature = await ed25519_js.sign(deviceInfo, this.privateKey);
    // let deviceSignature = nacl.sign(deviceInfo, privateKey)
    this.encryptionKey = enc.HKDF(
        "sha512",
        Buffer.from("Pair-Setup-Encrypt-Salt"),
        this.K,
        Buffer.from("Pair-Setup-Encrypt-Info"),
        32
    );
    let tlvData = tlv.encode(
        tlv.Tag.Username, Buffer.from(this.pairingId),
        tlv.Tag.PublicKey, publicKey,
        tlv.Tag.Signature, deviceSignature
      );
    let encryptedTLV = Buffer.concat(enc.encryptAndSeal(tlvData, null, Buffer.from('PS-Msg05'), this.encryptionKey));
      // console.log("DEBUG: Encrypted Data=" + encryptedTLV.toString('hex'));
    let outerTLV = tlv.encode(
        tlv.Tag.Sequence, 0x05,
        tlv.Tag.EncryptedData, encryptedTLV
    );
    request += 'Content-Length: ' + Buffer.byteLength(outerTLV) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),outerTLV]))
    request = ''
  break; 
  case PAIR_VERIFY_HAP_1:
    request = ''
    request += this.makeHead("POST","/pair-verify", "", true);
    request += 'User-Agent: AirPlay/320.20\r\n'
    request += 'CSeq: ' + this.nextCSeq() + '\r\n' ;
    request += 'Connection: keep-alive\r\n'
    request += 'X-Apple-HKP: 3\r\n'
    request += 'Content-Type: application/octet-stream\r\n'
   
    let hap1kp = curve25519_js.generateKeyPair(Buffer.alloc(32))
    this.verifyPrivate = Buffer.from(hap1kp.private)
    this.verifyPublic = Buffer.from(hap1kp.public)
    // this.verifyPrivate = Buffer.alloc(32);
    // curve25519.makeSecretKey(this.verifyPrivate);
    // this.verifyPublic = curve25519.derivePublicKey(this.verifyPrivate);
    let encodedData = tlv.encode(
      tlv.Tag.Sequence, 0x01,
      tlv.Tag.PublicKey, this.verifyPublic
    );
    request += 'Content-Length: ' + Buffer.byteLength(encodedData) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),encodedData]))
    request = ''
  break; 
  case PAIR_VERIFY_HAP_2:
    request = ''
    request += this.makeHead("POST","/pair-verify", "", true);
    request += 'User-Agent: AirPlay/320.20\r\n'
    request += 'CSeq: ' + this.nextCSeq() + '\r\n' ;
    request += 'Connection: keep-alive\r\n'
    request += 'X-Apple-HKP: 3\r\n'
    request += 'Content-Type: application/octet-stream\r\n'
    let identifier = tlv.decode(this.verifier_hap_1.pairingData)[tlv.Tag.Username];
    let signature  = tlv.decode(this.verifier_hap_1.pairingData)[tlv.Tag.Signature];
    let material = Buffer.concat([this.verifyPublic, Buffer.from(this.credentials.pairingId), this.verifier_hap_1.sessionPublicKey]);
    // let keyPair1 = ed25519.MakeKeypair(this.credentials.encryptionKey);
    // let signed = ed25519.Sign(material, keyPair1);
    // let keyPair1 = ed25519.MakeKeypair(this.credentials.encryptionKey);
    let signed = await ed25519_js.sign(material, this.privateKey);
    console.log("lengths", this.credentials.encryptionKey.length)
    // let keyPair1 = nacl.sign.keyPair.fromSeed(this.credentials.encryptionKey)
    // let signed = nacl.sign(material, keyPair1.secretKey);
    let plainTLV = tlv.encode(
      tlv.Tag.Username, Buffer.from(this.credentials.pairingId),
      tlv.Tag.Signature, signed
    );
    let encryptedTLV1 = Buffer.concat(enc.encryptAndSeal(plainTLV, null, Buffer.from('PV-Msg03'), this.verifier_hap_1.encryptionKey));
    let pv2 = tlv.encode(
      tlv.Tag.Sequence, 0x03,
      tlv.Tag.EncryptedData, encryptedTLV1
    );
    request += 'Content-Length: ' + Buffer.byteLength(pv2) + '\r\n\r\n';
    this.socket.write(Buffer.concat([Buffer.from(request, 'utf-8'),pv2]))
    request = ''
  break; 
  case AUTH_SETUP:
    request = ''
    request += this.makeHead("POST","/auth-setup", di);
    request += 'Content-Length:' + 33 + '\r\n\r\n';
    let finalbuffer = Buffer.concat([Buffer.from(request, 'utf-8'),
    Buffer.from([0x01, // unencrypted
            0x59,0x02,0xed,0xe9,0x0d,0x4e,0xf2,0xbd, // static Curve 25519 key
            0x4c,0xb6,0x8a,0x63,0x30,0x03,0x82,0x07,
            0xa9,0x4d,0xbd,0x50,0xd8,0xaa,0x46,0x5b,
            0x5d,0x8c,0x01,0x2a,0x0c,0x7e,0x1d,0x4e])
          ])
    if (this.airplay2){
      try {
        this.socket.write(this.credentials.encrypt(finalbuffer))
      } catch (e){

      }
    } else {
      this.socket.write(finalbuffer)
    }     
    
    request = ''
    // this.status = OPTIONS;
    // this.sendNextRequest()
  break;
  case OPTIONS:
    request += this.makeHead('OPTIONS', '*', di);
    if (this.airplay2){
      request += 'User-Agent: AirPlay/320.20\r\n'
      request += 'Connection: keep-alive\r\n'
    }
    request += 'Apple-Challenge: SdX9kFJVxgKVMFof/Znj4Q\r\n\r\n';
  break;  
  case OPTIONS2:
      
      request = ''
      request += this.makeHead('OPTIONS', '*', di);
      request += this.code_digest;
      this.socket.write(Buffer.from(request, 'utf-8'))
      if (this.debug) console.log("yas")
      request = ''
  break;
  case ANNOUNCE:
    if (this.announceId == null) {
    this.announceId = nu.randomInt(8);}

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
  case INFO:
    request += this.makeHead('GET', '/info',  di, true);
    request += 'User-Agent: AirPlay/320.20\r\n'
    request += 'Connection: keep-alive\r\n'
    request += 'CSeq: ' + this.nextCSeq() + '\r\n\r\n' ;
    let enct1x = this.credentials.encrypt(Buffer.concat([Buffer.from(request, 'utf-8')]));
    this.socket.write(enct1x)
    request = ''
    //console.log(request);  
  break;
  case SETUP_AP2_1:
    this.announceId = nu.randomInt(8);
    request += this.makeHeadWithURL('SETUP', di);
    request += 'Content-Type: application/x-apple-binary-plist\r\n'
    // request += 'CSeq: ' + this.nextCSeq() + '\r\n' ;
    let setap1 =  bplistCreator(
      {deviceID: '2C:61:F3:B6:64:C1',
      sessionUUID: '8EB266BA-B741-40C5-8213-4B7A38DF8773',
      timingPort: this.timingPort,
      timingProtocol: 'NTP'
      // ekey: config.rsa_aeskey_base64,
      // eiv: config.iv_base64
    }
    )
    ;
    request += 'Content-Length:' + Buffer.byteLength(setap1) + '\r\n\r\n';
    let s1ct = this.credentials.encrypt(Buffer.concat([Buffer.from(request, 'utf-8'),setap1]));
    this.socket.write(s1ct);
    request = ''
  break;
  case SETPEERS:
    request += this.makeHeadWithURL('SETPEERS', di);
    request += 'Content-Type: /peer-list-changed\r\n'
    let speers =  bplistCreator([
      this.socket.address().address, this.hostip
    ]);
    request += 'Content-Length: ' + Buffer.byteLength(speers) + '\r\n\r\n';
    let spct = this.credentials.encrypt(Buffer.concat([Buffer.from(request, 'utf-8'),speers]));
    this.socket.write(spct);
    request = ''      
  break;  
  case FLUSH:
    request += this.makeHeadWithURL('FLUSH', di);
    request += this.makeRtpInfo()+ '\r\n';
    let fct = this.credentials.encrypt(Buffer.concat([Buffer.from(request, 'utf-8')]));
    this.socket.write(fct);
    request = ''      
  break;  
  case SETUP_AP2_2:
    this.announceId = nu.randomInt(8);
    request += this.makeHeadWithURL('SETUP', di);
    request += 'Content-Type: application/x-apple-binary-plist\r\n'
    let setap2 =  bplistCreator(
      {streams: [{audioFormat: 262144, // PCM/44100/16/2
          audioMode: 'default',
          controlPort: 60242,
          ct: 2,
          isMedia: true,
          latencyMax: 88200,
          latencyMin: 11025,
          shk: Buffer.from(this.credentials.writeKey),
          spf: 352,
          sr: 44100,
          type: 0x60,
          supportsDynamicStreamID: false,
          streamConnectionID: this.announceId
          }]});
    request += 'Content-Length: ' + Buffer.byteLength(setap2) + '\r\n\r\n';
    let s2ct = this.credentials.encrypt(Buffer.concat([Buffer.from(request, 'utf-8'),setap2]));
    this.socket.write(s2ct);
    request = ''      
  break;  
  case RECORD:
    request += this.makeHeadWithURL('RECORD', di);
    request += 'Range: npt=0-\r\n' + this.makeRtpInfo()+ '\r\n';
    //console.log(request);
    if (this.airplay2 != null && this.credentials != null) {
    console.log('ssdas')
    let rct = this.credentials.encrypt(Buffer.concat([Buffer.from(request, 'utf-8')]));
    this.socket.write(rct);
    request = ""
    }
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
      if (this.debug) console.log('teardown');
    this.cleanup('stopped');
    // return here since the socket is closed
    return;

  default:
    return;
  }

  this.startTimeout();
  if (this.encryptedChannel && this.credentials) {
    this.socket.write(this.credentials.encrypt(Buffer.concat([Buffer.from(request, 'utf-8')])));
  } else 
  {this.socket.write(request);}
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
        if (this.debug) console.log('parseport');
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
  var response = parseResponse2(blob,this),
      headers = response.headers;
      if (this.debug) console.log('status',this.status);
  if (this.status != OPTIONS && this.mode == 0) {
    if(response.code === 401) {
      if(!this.password) {
          if (this.debug) console.log('nopass');
        if (this.status == OPTIONS2){
        this.emit('pair_failed'); 
        this.cleanup('no_password');}
        return;
    }

    if(this.passwordTried) {
        if (this.debug) console.log('badpass');
      this.emit('pair_failed'); 
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
      if (this.debug) console.log()
    this.sendNextRequest(di);
    return;
  }

  if(response.code === 453) {
      if (this.debug) console.log('busy');
    this.cleanup('busy');
    return;
  }

  if(response.code !== 200) {
    if (this.debug) console.log(response.status);
    if (this.status != SETVOLUME && this.status != SETPEERS) {
      if ([PAIR_VERIFY_1,
        PAIR_VERIFY_2,
        AUTH_SETUP,
        PAIR_PIN_START,
        PAIR_PIN_SETUP_1,
        PAIR_PIN_SETUP_2,
        PAIR_PIN_SETUP_3].includes(this.status)) {
        this.emit('pair_failed');
      }
      this.cleanup(response.status);
    return;
  }}
}
  else if (this.mode == 1){
        if(response.code === 401) {
          if(!this.password) {
              if (this.debug) console.log('nopass');
            this.emit('pair_failed'); 
            this.cleanup('no_password');
            return;
        }

        if(this.passwordTried) {
            if (this.debug) console.log('badpass');
          this.emit('pair_failed'); 
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
          if (this.debug) console.log(di)
        this.sendNextRequest(di);
        return;
      }

      if(response.code === 453) {
          if (this.debug) console.log('busy');
        this.cleanup('busy');
        return;
      }

      if(response.code !== 200) {
        if (this.debug) console.log(response.status);
        if (this.status != SETVOLUME && this.status != SETPEERS) {
          if ([PAIR_VERIFY_1,
            PAIR_VERIFY_2,
            AUTH_SETUP,
            PAIR_PIN_START,
            PAIR_PIN_SETUP_1,
            PAIR_PIN_SETUP_2,
            PAIR_PIN_SETUP_3].includes(this.status)) {
            this.emit('pair_failed');
          }
          this.cleanup(response.status);
          return;
      }}
  }
   

  // password was accepted (or not needed)
  this.passwordTried = false;

  switch(this.status) {
    case PAIR_PIN_START:
      this.emit('need_password');
      this.status = this.airplay2 ? PAIR_SETUP_1 : PAIR_PIN_SETUP_1;
      return;
    break;
    case PAIR_PIN_SETUP_1:
      this.srp = new LegacySRP(2048);
      this.P = this.password
      let bufa = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      const { pk, salt } = bplistParser.parseBuffer(bufa)[0];
                        
      this.s = salt.toString('hex');
      this.B = pk.toString('hex');

      // SRP: Generate random auth_secret, 'a'; if pairing is successful, it'll be utilized in 
      // subsequent session authentication(s).
      this.a = crypto.randomBytes(32).toString('hex');

      // SRP: Compute A and M1. 
      this.A   = this.srp.A(this.a);
      this.M1  = this.srp.M1(this.I, this.P, this.s, this.a, this.B);
      this.status = PAIR_PIN_SETUP_2
    break;  
    case PAIR_PIN_SETUP_2:
      const { epk, authTag } = ATVAuthenticator.confirm(this.a, this.srp.K(this.I, this.P, this.s, this.a, this.B));
                        
      this.epk = epk;
      this.authTag = authTag;
      this.status = PAIR_PIN_SETUP_3
   
    break; 
    case PAIR_PIN_SETUP_3:  
      this.status = PAIR_VERIFY_1
      this.authSecret = this.a
    break; 
    case PAIR_VERIFY_1:
      let buf1 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
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
        if (this.debug) console.log('verify2', Buffer.byteLength(this.pair_verify_1_signature))
      this.status = PAIR_VERIFY_2
    break;
    case PAIR_VERIFY_2:
      
      this.status = this.mode == 2 ? AUTH_SETUP : OPTIONS 
    break;
    case PAIR_SETUP_1:
      let buf2 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      let databuf1 = tlv.decode(buf2);
      if (this.debug) console.log(databuf1)
      if (databuf1[tlv.Tag.BackOff]) {
        let backOff = databuf1[tlv.Tag.BackOff];
        console.log(backOff)
        let seconds = Buffer.from(backOff).readInt16LE(0, backOff.byteLength);
        
        console.log("You've attempt to pair too recently. Try again in " + (seconds) + " seconds.");
        
      }
      if (databuf1[tlv.Tag.ErrorCode]) {
        let buffer = databuf1[tlv.Tag.ErrorCode];
        console.log("Device responded with error code " + Buffer.from(buffer).readIntLE(0, buffer.byteLength) + ". Try rebooting your Apple TV.");
      }
      if (databuf1[tlv.Tag.PublicKey]) {
        this._atv_pub_key = databuf1[tlv.Tag.PublicKey]
        this._atv_salt = databuf1[tlv.Tag.Salt]
      this._hap_genkey = crypto.randomBytes(32);
      if (this.password == null){
          this.password = 3939 // transient
      }
      this.srp = new SrpClient(SRP.params.hap,Buffer.from(this._atv_salt),Buffer.from("Pair-Setup"),Buffer.from(this.password.toString()),Buffer.from(this._hap_genkey),true)
      this.srp.setB(this._atv_pub_key)
      this.A = this.srp.computeA()
      this.M1 = this.srp.computeM1()
      this.status = PAIR_SETUP_2}
      else {
        this.emit('pair_failed');
        this.cleanup('pair_failed');
        return;
      }
    break;  
    case PAIR_SETUP_2:
      let buf3 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      let databuf2 = tlv.decode(buf3);
      this.deviceProof = databuf2[tlv.Tag.Proof];
      // console.log("DEBUG: Device Proof=" + this.deviceProof.toString('hex'));  
      this.srp.checkM2(this.deviceProof);
      this.status = PAIR_SETUP_3
    break; 
    case PAIR_SETUP_3:
      let buf4 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      let encryptedData = tlv.decode(buf4)[tlv.Tag.EncryptedData];
      let cipherText = encryptedData.slice(0, -16);
      let hmac = encryptedData.slice(-16);
      let decrpytedData = enc.verifyAndDecrypt(cipherText, hmac, null, Buffer.from('PS-Msg06'), this.encryptionKey);
      let tlvData = tlv.decode(decrpytedData); 
      this.credentials = new Credentials(
         "sdsds",
         tlvData[tlv.Tag.Username],
         this.pairingId,
         tlvData[tlv.Tag.PublicKey],
        this.seed
       );
       this.status = PAIR_VERIFY_HAP_1;
    break;
    case PAIR_VERIFY_HAP_1:
      let buf5 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      let decodedData = tlv.decode(buf5);
      let sessionPublicKey = decodedData[tlv.Tag.PublicKey];
      let encryptedData1 = decodedData[tlv.Tag.EncryptedData];
  
      if (sessionPublicKey.length != 32) {
        throw new Error(`sessionPublicKey must be 32 bytes (but was ${sessionPublicKey.length})`);
      }
  
      let cipherText1 = encryptedData1.slice(0, -16);
      let hmac1 = encryptedData1.slice(-16);
      // let sharedSecret = curve25519.deriveSharedSecret(this.verifyPrivate, sessionPublicKey);
      let sharedSecret = curve25519_js.sharedKey(this.verifyPrivate,sessionPublicKey)
      let encryptionKey = enc.HKDF(
        "sha512",
        Buffer.from("Pair-Verify-Encrypt-Salt"),
        sharedSecret,
        Buffer.from("Pair-Verify-Encrypt-Info"),
        32
      );
      let decryptedData = enc.verifyAndDecrypt(cipherText1, hmac1, null, Buffer.from('PV-Msg02'), encryptionKey);
      this.verifier_hap_1 = {
        sessionPublicKey: sessionPublicKey,
        sharedSecret: sharedSecret,
        encryptionKey: encryptionKey,
        pairingData: decryptedData
      }
      this.status = PAIR_VERIFY_HAP_2; 
      this.sharedSecret = sharedSecret;
    break;
    case PAIR_VERIFY_HAP_2:
      let buf6 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      this.credentials.readKey = enc.HKDF(
        "sha512",
        Buffer.from("Control-Salt"),
        this.verifier_hap_1.sharedSecret,
        Buffer.from("Control-Read-Encryption-Key"),
        32
      );
      this.credentials.writeKey = enc.HKDF(
        "sha512",
        Buffer.from("Control-Salt"),
        this.verifier_hap_1.sharedSecret,
        Buffer.from("Control-Write-Encryption-Key"),
        32
      );
      if (this.debug) {console.log('write',this.credentials.writeKey)}
      if (this.debug) {console.log('buf6', buf6)}
      this.encryptedChannel = true
      this.status = (this.mode == 2 ? AUTH_SETUP : SETUP_AP2_1)
    break;
    case SETUP_AP2_1:
      console.log('timing port parsing')
      let buf7 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      let sa1_bplist = bplistParser.parseBuffer(buf7)
      this.eventPort = sa1_bplist[0]['eventPort']
      this.timingPort = sa1_bplist[0]['timingPort']
      console.log('timing port ok', this.timingPort)
      this.status = SETPEERS 
    break;  
    case SETUP_AP2_2:
      let buf8 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      let sa2_bplist = bplistParser.parseBuffer(buf8)
      let rtspConfig = {
        audioLatency: 50,
        requireEncryption: false,
        server_port : sa2_bplist[0]["streams"][0]["dataPort"],
        control_port : sa2_bplist[0]["streams"][0]["controlPort"],
        timing_port : this.timingPort,
        event_port: this.eventPort,
        credentials : this.credentials
      }
      this.emit('config', rtspConfig);
      this.session = "OK"
      this.emit('pair_success');
      this.status = PLAYING;
    break; 
    case SETPEERS:
      this.status = SETUP_AP2_2;
    break; 
    case FLUSH:
      this.status = PLAYING
      this.session = "OK"
      this.emit('pair_success');
      // console.log(sa2_bplist[0]["streams"][0]["controlPort"], sa2_bplist[0]["streams"][0]["dataPort"] )
      this.emit('ready');
    break;  
    case INFO:
      let buf9 = Buffer.from(rawData).slice(rawData.length - parseInt(headers['Content-Length']),rawData.length)
      console.log('buf8', bplistParser.parseBuffer(buf9))
      this.status = SETUP_AP2_1
      return;
    break;  
    case AUTH_SETUP:
      this.status = this.airplay2 ? SETUP_AP2_1 : OPTIONS 
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
        
        this.status = this.session ? PLAYING: (this.airplay2 ? PAIR_PIN_START : ANNOUNCE);
        if (this.status == ANNOUNCE){this.emit('pair_success')};
      }

    break;
    case OPTIONS2:
        /*
         * Devices like Apple TV and Zeppelin Air do not support encryption.
         * Only way of checking that: they do not reply to Apple-Challenge
         */
        // if(headers['Apple-Response'])
        //   this.requireEncryption = true;
        this.status = this.session? PLAYING: (this.airplay2 ? SETUP_AP2_1 :ANNOUNCE);
        if (this.status == ANNOUNCE){this.emit('pair_success')};

  
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
    if (this.debug) console.log('plist', plist)
} 