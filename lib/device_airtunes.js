var dgram = require('dgram'),
    events = require('events'),
    util = require('util'),
    config = require('./config.js'),
    nu = require('./num_util.js'),
    RTSP = require('./rtsp.js'),
    UdpServers = require('./udp_servers.js');
    udpServers = new UdpServers();

var aes = require('aes-js');
var RTP_HEADER_SIZE = 12;

function AirTunesDevice(host, audioOut, options, mode = 0, txt = "") {
  events.EventEmitter.call(this);

  if(!host)
    throw new Error('host is mandatory');

  this.udpServers = udpServers;
  this.audioOut = audioOut;
  this.type = 'airtunes';
  this.host = host;
  this.port = options.port || 5000;
  this.key = this.host + ':' + this.port;
  this.mode = mode; // Homepods with or without passcode
  // if(options.password != null && legacy == true){
    // this.mode = 1; // Airport / Shairport legacy passcode mode
    // this.mode = 2 // MFi mode
  // }
  this.statusflags = [];
  this.alacEncoding = options?.alacEncoding ?? true
  this.txt = txt;
  console.log("yasc",this.txt)
  let a = this.txt.filter((u) => String(u).startsWith('et='))
  if((a[0]?? "").includes('4')){
    this.mode = 2;
  }
  let b = this.txt.filter((u) => String(u).startsWith('cn='))
  if((b[0]?? "").includes('0')){
    this.alacEncoding = false;
  }
  let c = this.txt.filter((u) => String(u).startsWith('sf='))
  this.statusflags = c[0] ? parseInt(c[0].substring(3)).toString(2).split('') : []
  if (this.statusflags != []){
    let PasswordRequired = (this.statusflags[this.statusflags.length - 1 - 7] == '1')
    let PinRequired = (this.statusflags[this.statusflags.length - 1 - 3] == '1')
    let OneTimePairingRequired = (this.statusflags[this.statusflags.length - 1 - 9] == '1')
  }

  console.log("mode-atv",this.mode)
  console.log("alacEncoding",this.alacEncoding)
  
  this.rtsp = new RTSP.Client(options.volume || 50, options.password || null, audioOut, 
    {
    mode: this.mode, 
    txt: this.txt, 
    alacEncoding: this.alacEncoding
  }
  );
  this.audioCallback = null;
  this.encoder = [];
}

util.inherits(AirTunesDevice, events.EventEmitter);

AirTunesDevice.prototype.start = function() {
  var self = this;
  this.audioSocket = dgram.createSocket('udp4');

  // Wait until timing and control ports are chosen. We need them in RTSP handshake.
  this.udpServers.once('ports', function(err) {
    if(err) {
      console.log(err.code);
      self.status = 'stopped';
      self.emit('status', 'stopped');
      self.emit('error', 'udp_ports', err.code);

      return;
    }

    self.doHandshake();
  });

  this.udpServers.bind(this.host);
};

AirTunesDevice.prototype.doHandshake = function() {
  var self = this;

  this.rtsp.on('config', function(setup) {
    self.audioLatency = setup.audioLatency;
    self.requireEncryption = setup.requireEncryption;
    self.serverPort = setup.server_port;
    self.controlPort = setup.control_port;
    self.timingPort = setup.timing_port;
  });

  this.rtsp.on('ready', function() {
    self.relayAudio();
  });

  this.rtsp.on('end', function(err) {
    console.log(err);
    self.cleanup();

    if(err !== 'stopped')
      self.emit(err);
  });

  this.rtsp.startHandshake(this.udpServers, this.host, this.port);
};

AirTunesDevice.prototype.relayAudio = function() {
  var self = this;
  this.status = 'ready';
  this.emit('status', 'ready');

  this.audioCallback = function(packet) {
    var airTunes = makeAirTunesPacket(packet, self.encoder, self.requireEncryption, self.alacEncoding);
    self.audioSocket.send(
      airTunes, 0, airTunes.length,
      self.serverPort, self.host
    );
  };

  this.audioOut.on('packet', this.audioCallback);
};

AirTunesDevice.prototype.onSyncNeeded = function(seq) {
  this.udpServers.sendControlSync(seq, this);
};

AirTunesDevice.prototype.cleanup = function() {
  this.audioSocket = null;
  this.status = 'stopped';
  this.emit('status', 'stopped');
  console.log('stop');
  if(this.audioCallback) {
    this.audioOut.removeListener('packet', this.audioCallback);
    this.audioCallback = null;
  }

  this.udpServers.close();
  this.removeAllListeners();
};

AirTunesDevice.prototype.reportStatus = function(){
   this.emit('status', this.status);
};

AirTunesDevice.prototype.stop = function(cb) {
  this.rtsp.once('end', function() {
    if(cb)
      cb();
  });

  this.rtsp.teardown();
};

AirTunesDevice.prototype.setVolume = function(volume, callback) {
  this.rtsp.setVolume(volume, callback);
};

AirTunesDevice.prototype.setTrackInfo = function(name, artist, album, callback) {
  this.rtsp.setTrackInfo(name, artist, album, callback);
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

function makeAirTunesPacket(packet, encoder, requireEncryption, alacEncoding = true) {
  // console.log("alacEncoding2",alacEncoding)
  var alac = alacEncoding ? pcmToALAC(encoder, packet.pcm) : pcmParse(encoder, packet.pcm);
  var airTunes = new Buffer(alac.length + RTP_HEADER_SIZE);
      header = makeRTPHeader(packet);

  if(requireEncryption)
    airTunes = encryptAES(alac, alac.length);

  header.copy(airTunes);
  alac.copy(airTunes, RTP_HEADER_SIZE);

  return airTunes;
}


function pcmToALAC(encoder, pcmData) {
  var alacData = new Buffer(config.packet_size + 8);
  // I only did the actual computational part, the rest that I didn't do should be realitively simple to do.

  let bsize = 352, frames = 352; // Set these to whatever they should be

  const p = new Uint8Array(1416); // p = *out;
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
  //alacData = new Buffer(p);

  //var alacSize = bindings.encodeALAC(encoder, pcmData, alacData, pcmData.length);
  // console.log(alacData)


  return alacData.slice(0, alacSize);
}

function pcmParse(encoder, pcmData) {
    let dst = new Uint8Array(352 * 4);
    let src = pcmData;
    let encoded = dst; // I hope this doesn't copy and instead makes a reference

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
    size *= 4;
    return Buffer.from(dst);
}

function encryptAES(alacData, alacSize) {
  const iv = Uint8Array.from(Buffer.from([0x78, 0xf4, 0x41, 0x2c, 0x8d, 0x17, 0x37, 0x90, 0x2b, 0x15, 0xa6, 0xb3, 0xee, 0x77, 0x0d, 0x67]));
  const aes_key = Uint8Array.from(Buffer.from([0x14, 0x49, 0x7d, 0xcc, 0x98, 0xe1, 0x37, 0xa8, 0x55, 0xc1, 0x45, 0x5a, 0x6b, 0xc0, 0xc9, 0x79]));
  var aesCbc = new aes.ModeOfOperation.cbc(aes_key, iv);
  // console.log(alacData.length)
  var encrypted = aesCbc.encrypt(Buffer.concat([alacData, Buffer.alloc(8)]));
  return encrypted.slice(0, alacSize);
 
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
