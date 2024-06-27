var dgram = require('dgram'),
    events = require('events'),
    util = require('util'),
    config = require('./config.js'),
    nu = require('./num_util.js'),
    RTSP = require('./rtsp.js');
    var bindings = null;
const crypto = require('crypto');
var RTP_HEADER_SIZE = 12;
const fs = require('fs');
const process = require('process');
const UDPServers = require('./udp_servers.js');

function BufferWithNames(size) {
  // Very simple solution for this immediate need...
  // I call it BufferWithNames because the names are not unique keys.
  this.size = size;
  this.buffer = [];
}

BufferWithNames.prototype.add = function (name, item) {
  while (this.buffer.length > this.size) {
    this.buffer.shift();
  }
  this.buffer.push([name, item]);
};

BufferWithNames.prototype.getLatestNamed = function (name) {
  var buf = this.buffer;
  for (var i = buf.length - 1; i >= 0; i--) {
    if (buf[i][0] == name) {
      return buf[i][1];
    }
  }
};

function AirTunesDevice(host, audioOut, options, mode = 0, txt = "") {
  events.EventEmitter.call(this);

  if(!host)
    throw new Error('host is mandatory');

  this.bindings = null
  this.bindingsok = false
  this.audioPacketHistory = new BufferWithNames(100);
  try{
      if (!(process.platform == 'darwin')) { // MacOSX arm64 segfaults on airtunes.node
      this.bindings = require('../build/Release/airtunes');
      this.bindingsok = true}
  } catch (e) {}

  this.udpServers = new UDPServers();
  this.audioOut = audioOut;
  this.type = 'airtunes';
  this.options = options
  this.host = host;
  this.port = options?.port || 5000;
  this.key = this.host + ':' + this.port;
  this.mode = mode; // Homepods with or without passcode
  // if(options.password != null && legacy == true){
    // this.mode = 1; // Airport / Shairport legacy passcode mode
    // this.mode = 2 // MFi mode
  // }
  this.forceAlac = options.forceAlac ?? true
  // this.skipAutoVolume = options.skipAutoVolume ?? false
  this.statusflags = [];
  this.alacEncoding = options?.alacEncoding ?? true
  this.airplay2 = options?.airplay2 ?? false
  this.txt = txt;
  this.borkedshp = false;
  console.log("yasc",this.txt)
  console.log('port', this.port)
  let a = this.txt.filter((u) => String(u).startsWith('et='))
  if((a[0]?? "").includes('4')){
    this.mode = 2;
  }
  let b = this.txt.filter((u) => String(u).startsWith('cn='))
  if (!this.forceAlac){
  if((b[0]?? "").includes('0')){
    this.alacEncoding = false;
  }}
  let c = this.txt.filter((u) => String(u).startsWith('sf='))
  this.statusflags = c[0] ? parseInt(c[0].substring(3)).toString(2).split('') : []
  if (c.length == 0) {
      c = this.txt.filter((u) => String(u).startsWith('flags='))
      this.statusflags = c[0] ? parseInt(c[0].substring(6)).toString(2).split('') : []
  }
  this.needPassword = false;
  this.needPin = false;
  this.transient = false;
  let d = ""
  d = this.txt.filter((u) => String(u).startsWith('features='))
  if(d.length == 0) d = this.txt.filter((u) => String(u).startsWith('ft='))
  let features_set = d.length > 0 ? d[0].substring(d[0].indexOf("=")+1).split(',') : []
  this.features = [... features_set.length > 0 ? parseInt(features_set[0]).toString(2).split('') : [], ... features_set.length > 1 ? parseInt(features_set[1]).toString(2).split('') : []]
  if (this.features.length > 0){
    this.transient = (this.features[this.features.length - 1 - 48] == '1')
  }

  if (this.statusflags != []){
    let PasswordRequired = (this.statusflags[this.statusflags.length - 1 - 7] == '1')
    let PinRequired = (this.statusflags[this.statusflags.length - 1 - 3] == '1')
    let OneTimePairingRequired = (this.statusflags[this.statusflags.length - 1 - 9] == '1')
    console.log('needPss', PasswordRequired, PinRequired, OneTimePairingRequired)
    this.needPassword = PasswordRequired;
    this.needPin = (PinRequired || OneTimePairingRequired)
    this.transient = (!(PasswordRequired || PinRequired || OneTimePairingRequired)) ?? true
    console.log('needPss', this.needPassword)
  }
  console.log('transient', this.transient)
  // detect old shairports with broken text
  let oldver1 = this.txt.filter((u) => String(u).startsWith('sm='))
  let oldver2 = this.txt.filter((u) => String(u).startsWith('sv='))
  if ((b[0]?? "") == 'cn=0,1' && (a[0]?? "") == 'et=0,1' && (oldver1[0]?? "") == 'sm=false' && (oldver2[0]?? "") == 'sv=false' && this.statusflags.length == 0){
    console.log('borked shairport found')
    this.alacEncoding = true
    this.borkedshp = true;
  }
  let k = this.txt.filter((u) => String(u).startsWith('am='))
  if ((k[0] ?? "").includes("AppleTV3,1") || (k[0] ?? "").includes("AirReceiver3,1") || (k[0] ?? "").includes("AirRecever3,1") || (k[0] ?? "").includes('Shairport')){
    this.alacEncoding = true
    this.airplay2 = false
  }
  k = this.txt.filter((u) => String(u).startsWith('rmodel='))
  if ((k[0] ?? "").includes("AppleTV3,1") || (k[0] ?? "").includes("AirReceiver3,1") || (k[0] ?? "").includes("AirRecever3,1") || (k[0] ?? "").includes('Shairport')){
    this.alacEncoding = true
    this.airplay2 = false
  }
  let manufacturer = this.txt.filter((u) => String(u).startsWith('manufacturer='))
  if ((manufacturer[0] ?? "").includes('Sonos')){
    this.mode = 2;
    this.needPin = true
  }
  console.log("needPin",this.needPin)
  console.log("mode-atv",this.mode)
  console.log("alacEncoding",this.alacEncoding)
  try{
  this.rtsp = new RTSP.Client(options.volume || 50, options.password || null, audioOut,
    {
    mode: this.mode,
    txt: this.txt,
    alacEncoding: this.alacEncoding,
    needPassword: this.needPassword,
    airplay2: this.airplay2,
    needPin: this.needPin,
    debug: options.debug,
    transient: this.transient,
    borkedshp: this.borkedshp,
  });} catch(e){
  console.log("rtsp error",e)}
  this.audioCallback = null;
  this.encoder = [];
  this.credentials = null;

  // this.func = `
  // const {Worker, isMainThread, parentPort, workerData} = require('node:worker_threads');
  // var { WebSocketServer } = require('ws');
  // const wss = new WebSocketServer({ port: 8980 });
  //  wss.on('connection', function connection(ws) {
  //    ws.on('message', function message(data) {
  //      parentPort.postMessage({message: data});
  //    });
  //    parentPort.on("message", data => {
  //      console.log("ass");
  //      ws.send(data);
  //    });
  //  });`;
  // this.worker = new Worker(func, {eval: true});
}

util.inherits(AirTunesDevice, events.EventEmitter);

AirTunesDevice.prototype.start = function() {
  var self = this;
  this.audioSocket = dgram.createSocket('udp4');

  // Wait until timing and control ports are chosen. We need them in RTSP handshake.
  this.udpServers.on('ports', function(err) {
    if(err) {
      console.log(err.code);
      self.status = 'stopped';
      self.emit('status', 'stopped');
      console.log('port issues');
      self.emit('error', 'udp_ports', err.code);

      return;
    }
    self.doHandshake();
  });

  this.udpServers.bind(this.host);
};

AirTunesDevice.prototype.doHandshake = function() {
  var self = this;
  try{
  if (this.rtsp == null){
    try{
      this.rtsp = new RTSP.Client(this.options.volume || 30, this.options.password || null, this.audioOut,
        {
        mode: this.mode,
        txt: this.txt,
        alacEncoding: this.alacEncoding,
        needPassword: this.needPassword,
        airplay2: this.airplay2,
        needPin: this.needPin,
        debug: true,
        transient: this.transient,
        borkedshp: this.borkedshp,
      });} catch(e){
      console.log(e)}
  }
  this.rtsp.on('config', function(setup) {
    self.audioLatency = setup.audioLatency;
    self.requireEncryption = setup.requireEncryption;
    self.serverPort = setup.server_port;
    self.controlPort = setup.control_port;
    self.timingPort = setup.timing_port;
    self.credentials = setup.credentials ;
  });

  this.rtsp.on('ready', function() {
    self.relayAudio();
  });

  this.rtsp.on('need_password', function() {
    self.emit('status','need_password');
  });

  this.rtsp.on('pair_failed', function() {
    self.emit('status','pair_failed');
  });

  this.rtsp.on('pair_success', function() {
    self.emit('status','pair_success');
  });

  this.rtsp.on('end', function(err) {
    console.log(err);
    self.cleanup();

    if(err !== 'stopped')
      self.emit(err);
  });
  } catch(e){
    console.log(e)
  }
  // console.log(this.udpServers, this.host,this.port)
  this.rtsp.startHandshake(this.udpServers, this.host, this.port);
};

AirTunesDevice.prototype.relayAudio = function() {
  var self = this;
  this.status = 'ready';
  this.emit('status', 'ready');


  this.audioCallback = function(packet) {
    var airTunes = makeAirTunesPacket(packet, self.encoder, self.requireEncryption, self.alacEncoding, self.credentials, self.bindings, self.bindingsok);
    // if (self.credentials) {
    //   airTunes = self.credentials.encrypt(airTunes)
    // }
    if(self.audioSocket == null){
      self.audioSocket = dgram.createSocket('udp4');
    }
    self.audioSocket.send(
      airTunes, 0, airTunes.length,
      self.serverPort, self.host
    );
  };
//   this.sendAirTunesPacket = function(airTunes) {
//     try{
//     if(self.audioSocket == null){
//       self.audioSocket = dgram.createSocket('udp4');
//     }
//     self.audioSocket.send(
//       airTunes, 0, airTunes.length,
//       self.serverPort, self.host
//     );} catch(e){

//       console.log('send error',e)
//     }
//   };

//   this.audioCallback = function(packet) {
//     var airTunes = makeAirTunesPacket(packet, self.encoder, self.requireEncryption, self.alacEncoding, self.credentials, self.bindings, self.bindingsok);
//     try{
//     self.sendAirTunesPacket(airTunes);
//     self.audioPacketHistory.add(packet.seq, airTunes); // If we need to resend it
//     } catch(e){}
//   };

//   this.udpServers.on('resendRequested', function (missedSeq, count) {
//     try{
//     for (var i = 0; i < count; i++) {
//     airTunes = self.audioPacketHistory.getLatestNamed(missedSeq + i);
//     if (airTunes != null)
//     self.sendAirTunesPacket(airTunes);}}
//     catch (_){}
//   });

  this.audioOut.on('packet', this.audioCallback);
};

AirTunesDevice.prototype.onSyncNeeded = function(seq) {
  this.udpServers.sendControlSync(seq, this);
  //if ( this.airplay2)this.rtsp.sendControlSync(seq, this, this.rtsp);
};

AirTunesDevice.prototype.cleanup = function() {
  this.audioSocket = null;
  this.audioPacketHistory = null;
  this.status = 'stopped';
  this.emit('status', 'stopped');
  console.log('stop');
  if(this.audioCallback) {
    this.audioOut.removeListener('packet', this.audioCallback);
    this.audioCallback = null;
  }

  this.udpServers.close();
  this.removeAllListeners();
  this.rtsp = null;
};

AirTunesDevice.prototype.reportStatus = function(){
   this.emit('status', this.status);
};

AirTunesDevice.prototype.stop = function(cb) {
  try{
    this.rtsp.once('end', function() {
      if(cb)
        cb();
    });
    console.log('ted');
    this.rtsp.teardown();
  } catch(_){}
};

AirTunesDevice.prototype.setVolume = function(volume, callback) {
  this.rtsp.setVolume(volume, callback);
};

AirTunesDevice.prototype.setTrackInfo = function(name, artist, album, callback) {
  this.rtsp.setTrackInfo(name, artist, album, callback);
};

AirTunesDevice.prototype.setProgress = function(progress, duration, callback) {
  this.rtsp.setProgress(progress, duration, callback);
};

AirTunesDevice.prototype.setArtwork = function(art, contentType, callback) {
  this.rtsp.setArtwork(art, contentType, callback);
};

AirTunesDevice.prototype.setPasscode = function(password) {
  this.rtsp.setPasscode(password);
};

AirTunesDevice.prototype.requireEncryption = function() {
  return this.requireEncryption;
};

module.exports = AirTunesDevice;


function makeAirTunesPacket(packet, encoder, requireEncryption, alacEncoding = true, credentials = null, bindings, bindingsok) {
  // console.log("alacEncoding2",alacEncoding)
  var alac = (alacEncoding || credentials) ? pcmToALAC(encoder, packet.pcm, bindings, bindingsok) : pcmParse(encoder, packet.pcm);
  var airTunes = new Buffer(alac.length + RTP_HEADER_SIZE);

      header = makeRTPHeader(packet);
  if(requireEncryption) {
    if (bindingsok) {
    if (bindings == null) {bindings = require('../build/Release/airtunes');}
    bindings.encryptAES(alac, alac.length); } else {
    alac = encryptAES(alac,alac.length);
    }
  }
  if (credentials) {
    let pcm = credentials.encryptAudio(alac,header.slice(4,12),packet.seq)
    let airplay = new Buffer(RTP_HEADER_SIZE + pcm.length);
    header.copy(airplay);
    pcm.copy(airplay, RTP_HEADER_SIZE);
    return airplay;
    // console.log(alac.length)
  }  else {
  header.copy(airTunes);
  alac.copy(airTunes, RTP_HEADER_SIZE);
  return airTunes;}
}


function pcmToALAC(encoder, pcmData, bindings, bindingsok) {
  var alacData = new Buffer(config.packet_size + 8);
  if (bindingsok == true) {
    var alacSize = bindings.encodeALAC(encoder, pcmData, alacData, pcmData.length);
    return alacData.slice(0, alacSize);
  } else {
      // I only did the actual computational part, the rest that I didn't do should be realitively simple to do.
          let bsize = 352, frames = 352; // Set these to whatever they should be
    const p = new Uint8Array((352 * 2 * 2) + 8); // p = *out;
    const input = new Uint32Array(pcmData.length / 4);
    let j = 0;
    for (let i = 0; i < pcmData.length; i+=4) {
      let res = pcmData[i];
      res |= pcmData[i + 1] << 8;
      res |= pcmData[i + 2] << 16;
      res |= pcmData[i + 3] << 24;
      input[j++] = res;
    } // uint32_t *in = (uint32_t*) sample;

    let pindex = 0, iindex = 0;

    p[pindex++] = 1 << 5; // 0b100000
    p[pindex++] = 0;
    // 0b1001x, where x = Most Significant Bit of bsize, or basically just { set x if (bsize > 0x80000000) }
    p[pindex++] = (1 << 4) | (1 << 1) | ((bsize & 0x80000000) >>> 31);
    // bXX--bYY = bits XX to YY of bsize
    // So we basically just splitting bsize into the individual byte values and storing them in p
    // We've also shifted everything to the left by one (hence why we need the bit from bsize above)
    p[pindex++] = ((bsize & 0x7f800000) << 1) >>> 24;    // b30--b23
    p[pindex++] = ((bsize & 0x007f8000) << 1) >>> 16;    // b22--b15
    p[pindex++] = ((bsize & 0x00007f80) << 1) >>> 8;    // b14--b7
    p[pindex] =  ((bsize & 0x0000007f) << 1);           // b6--b0
    // And this is why we shifted the bits to the left.
    p[pindex++] |= (input[iindex] & 0x00008000) >>> 15;   // b7 from in[iindex]

    let count = frames - 1;

    while (count--) {
      let i = input[iindex++]; // Just to make it a bit easier to read

      // This is weird lmao. Everything that we're adding has been shifted left by one.
      // And here, we're soring the lower 16 bits then the higher 16 bits.
      p[pindex++] = ((i & 0x00007f80) >>> 7); // b14--b7
      p[pindex++] = ((i & 0x0000007f) << 1) | ((i & 0x80000000) >>> 31); // b6--b0, b31
      p[pindex++] = ((i & 0x7f800000) >>> 23); // b30--b23
      p[pindex++] = ((i & 0x007f0000) >>> 15) | ((input[iindex] & 0x00008000) >> 15);// b16--b15, b7 from in[pindex]
    }

    // Last Sample
    let i = input[iindex];
    p[pindex++] = ((i & 0x00007f80) >>> 7); // b14--b7
    p[pindex++] = ((i & 0x0000007f) << 1) | ((i & 0x80000000) >>> 31); // b6--b0, b31
    p[pindex++] = ((i & 0x7f800000) >>> 23); // b30--b23
    p[pindex++] = ((i & 0x007f0000) >>> 15); // b16--b15, 0 as last bit because we have no more data after this

    // When we've read all we can from in, we need to fill the remaining space in p with 0's
    count = (bsize - frames) * 4;
    while (count--) p[pindex++] = 0;

    // Frame Footer ??
    p[pindex - 1] |= 1;
    p[pindex++] = (7 >>> 1) << 6;

    // const size = pindex;

    const alacSize = pindex; // Should be right
    alacData = Buffer.from(p.buffer)
    return alacData.slice(0, alacSize);
  }
  //alacData = new Buffer(p);

  //var alacSize = bindings.encodeALAC(encoder, pcmData, alacData, pcmData.length);
  // console.log(alacData)




}

function pcmParse(encoder, pcmData) {
    let dst = new Uint8Array(352 * 4);
    let src = pcmData;

    let a = b = 0;
    let size;
    for (size = 0; size < 352; size++) {
      dst[a++] = src[b + 1];
      dst[a++] = src[b++];
      b++;

      dst[a++] = src[b + 1];
      dst[a++] = src[b++];
      b++;
    }
    return Buffer.from(dst);
}

function encryptAES(alacData, alacSize) {
  let result = new Buffer.concat([])
  const isv = Buffer.from([0x78, 0xf4, 0x41, 0x2c, 0x8d, 0x17, 0x37, 0x90, 0x2b, 0x15, 0xa6, 0xb3, 0xee, 0x77, 0x0d, 0x67]);
  const aes_key = Buffer.from([0x14, 0x49, 0x7d, 0xcc, 0x98, 0xe1, 0x37, 0xa8, 0x55, 0xc1, 0x45, 0x5a, 0x6b, 0xc0, 0xc9, 0x79]);
  let remainder = alacData.length % 16
  let end_of_encoded_data = alacData.length - remainder;
  let cipher = crypto.createCipheriv('aes-128-cbc', aes_key, isv);
	cipher.setAutoPadding(false);

	for (i = 0, l = end_of_encoded_data - 16; i <= l; i += 16) {
      let chunk = cipher.update(alacData.slice(i,i+16))
      result = Buffer.concat([result,chunk])
	}
  return Buffer.concat([result, alacData.slice(end_of_encoded_data)]);
}



function makeRTPHeader(packet) {
  var header = new Buffer(RTP_HEADER_SIZE);

  if(packet.seq === 0)
    header.writeUInt16BE(0x80e0, 0);
  else
    header.writeUInt16BE(0x8060, 0);

  header.writeUInt16BE(nu.low16(packet.seq), 2);

  header.writeUInt32BE(packet.timestamp, 4);
  header.writeUInt32BE(config.device_magic, 8);

  return header;
}
