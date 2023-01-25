var Stream = require('stream'),
    util = require('util'),
    Devices = require('./devices.js'),
    config = require('./config.js'),
    CircularBuffer = require('./circular_buffer.js'),
    AudioOut = require('./audio_out.js');
// const mdns = require("mdns-js");
// var net = require('net');
function AirTunes() {
  var self = this;

  Stream.call(this);

  var audioOut = new AudioOut();
  this.devices = new Devices(audioOut);

  this.devices.init();
  this.devices.on('status', function(key, status, desc) {
    self.emit('device', key, status, desc);
  });

  this.circularBuffer = new CircularBuffer(config.packets_in_buffer, config.packet_size);

  this.circularBuffer.on('status', function(status) {
    self.emit('buffer', status);
  });

  audioOut.init(this.devices, this.circularBuffer);

  this.circularBuffer.on('drain', function() {
    self.emit('drain');
  });

  this.circularBuffer.on('error', function(err) {
    self.emit('error', err);
  });

  this.writable = true;

  // let x = mdns.tcp("dacp");
  // let txt_record = {
  //     Ver: "131075",
  //     DbId: "63B5E5C0C201542E",
  //     txtvers: "1",
  //     OSsi: "0x1F5"
  //   };

  // this.remoteBroadcast= mdns.createAdvertisement(x, 5648, {
  //     name: "iTunes_Ctrl_04F8191D99BEC6E9",
  //     txt: txt_record,
  // });
  // this.remoteBroadcast.start();

  // this.remoteserver = net.createServer(function(sock) {
  //   // We have a connection - a socket object is assigned to the connection automatically
  //   // Add a 'data' event handler to this instance of socket
  //   sock.on('data', function(data) {
  //     console.log('DATA FROM' + sock.remoteAddress + ': ' + data);
  //     // Write the data back to the socket, the client will receive it as data from the server
  //     sock.write("HTTP/1.1 204 No Content" + "\r\n" +
  //     "DAAP-Server: iTunes/10.6 (Mac OS X)" + "\r\n" +
  //     "Content-Type: application/x-dmap-tagged" + "\r\n" +
  //     "Content-Length: 0\r\n\r\n"
  //     );
  //   });
    
  //   // Add a 'close' event handler to this instance of socket
  //  sock.on('close', function(data) {
  //    console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
  //  });
  
  // }).listen(5648);
}

util.inherits(AirTunes, Stream);

AirTunes.prototype.add = function(host, options, mode = 0, txt = "") {
  return this.devices.add('airtunes', host, options, mode, txt);
};

AirTunes.prototype.addCoreAudio = function(options) {
  return this.devices.add('coreaudio', null, options);
};

AirTunes.prototype.stopAll = function(cb) {
  this.devices.stopAll(cb);
};

AirTunes.prototype.stop = function(deviceKey) {
  this.devices.stop(deviceKey);
};

AirTunes.prototype.setVolume = function(deviceKey, volume, callback) {
  this.devices.setVolume(deviceKey, volume, callback);
};

AirTunes.prototype.setProgress = function(deviceKey, progress, duration, callback) {
  this.devices.setProgress(deviceKey, progress, duration, callback);
};

AirTunes.prototype.setTrackInfo = function(deviceKey, name, artist, album, callback) {
  this.devices.setTrackInfo(deviceKey, name, artist, album, callback);
};

AirTunes.prototype.reset = function() {
	this.circularBuffer.reset();
};

AirTunes.prototype.setArtwork = function(deviceKey, art, contentType, callback) {
  this.devices.setArtwork(deviceKey, art, contentType, callback);
};

AirTunes.prototype.write = function(data) {
  return this.circularBuffer.write(data);
};

AirTunes.prototype.setPasscode = function(deviceKey,passcode) {
  this.devices.setPasscode(deviceKey,passcode);
};

AirTunes.prototype.end = function() {
  this.circularBuffer.end();
  // this.remoteBroadcast.stop();
  // this.remoteserver.close();
};


module.exports = AirTunes;
