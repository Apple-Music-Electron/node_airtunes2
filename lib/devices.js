var events = require('events'),
    util = require('util'),
    async = require('async'),
    AirTunesDevice = require('./device_airtunes.js'),
    config = require('./config.js');

function Devices(audioOut) {
  events.EventEmitter.call(this);

  this.source = null;
  this.devices = {};
  this.hasAirTunes = false;
  this.audioOut = audioOut;
}

util.inherits(Devices, events.EventEmitter);

Devices.prototype.init = function() {
  var self = this;
  self.audioOut.on('need_sync', function(seq) {
    // relay to all devices
   
    self.forEach(function(dev) {
      try{ if(dev.onSyncNeeded && dev.controlPort)
        dev.onSyncNeeded(seq); } catch(e){}
    });
  });
};

Devices.prototype.forEach = function(it) {
  for(var i in this.devices) {
    if(!this.devices.hasOwnProperty(i))
      continue;

    it(this.devices[i], i);
  }
};

Devices.prototype.add = function(type, host, options) {
  var self = this;

  this.status = 'connecting';
  var dev = 
  // type === 'coreaudio' ?
  //   new CoreAudioDevice(this.hasAirTunes, this.audioOut, options) :
    new AirTunesDevice(host, this.audioOut, options, options?.mode ?? 0, options?.txt ?? []);

  var previousDev = this.devices[dev.key];

  if(previousDev) {
    // if device is already in the pool, just report its existing status.
    previousDev.reportStatus();

    return previousDev;
  }

  this.devices[dev.key] = dev;

  dev.on('status', function(status, arg) {
    if(status === 'error' || status === 'stopped') {
      delete self.devices[dev.key];
      self.checkAirTunesDevices();
    }

    if(this.hasAirTunes && status === 'playing') {
      self.emit('need_sync');
    }

    self.emit('status', dev.key, status, '');
  });

  dev.start();
  self.checkAirTunesDevices();

  return dev;
};

Devices.prototype.setVolume = function(key, volume, callback) {
  var dev = this.devices[key];

  if(!dev) {
    this.emit('status', key, 'error', 'not_found');

    return;
  }

  dev.setVolume(volume, callback);
};

Devices.prototype.setProgress = function(key, progress, duration, callback) {
  try {
  if (key === 'all') {
 
    for (device of Object.keys(this.devices)) {
      try {
      this.devices[device].setProgress(progress, duration, callback);
      } catch (e) {
        try {
          if (e.name === 'TypeError')
          delete this.devices[device];
        } catch (e) {}
        
        console.log(e)}
    };
  } else {
  var dev = this.devices[key];

  if(!dev) {
    this.emit('status', key, 'error', 'not_found');

    return;
  }

  dev.setProgress(progress, duration, callback);}
  } catch (e) {console.log(e)}
};

Devices.prototype.setTrackInfo = function(key, name, artist, album, callback) {
  try {
  if (key === 'all') {
    for (device of Object.keys(this.devices)) {
      try {
      this.devices[device].setTrackInfo(name, artist, album, callback);
      } catch (e) {
        try {
          if (e.name === 'TypeError')
          delete this.devices[device];
        } catch (e) {}
        console.log(e)}
    }
  } else {
  var dev = this.devices[key];

  if(!dev) {
    this.emit('status', key, 'error', 'not_found');

    return;
  } else {

  dev.setTrackInfo(name, artist, album, callback);}}
  } catch (e) {console.log(e)}
};

Devices.prototype.setArtwork = function(key, art, contentType, callback) {
  try {
  if (key === 'all') {
    for (device of Object.keys(this.devices)) {
      try {
      this.devices[device].setArtwork(art, contentType, callback);
      } catch (e) {
        try {
          if (e.name === 'TypeError')
          delete this.devices[device];
        } catch (e) {}
        console.log(e)}
    }
  } else {
  var dev = this.devices[key];

  if(!dev) {

    this.emit('status', key, 'error', 'not_found');

    return;
  }

  dev.setArtwork(art, contentType, callback);}
} catch (e) {console.log(e)}
};

Devices.prototype.setPasscode = function(key, passcode) {
  var dev = this.devices[key];

  if(!dev) {
    this.emit('status', key, 'error', 'not_found');

    return;
  }

  dev.setPasscode(passcode);
};

Devices.prototype.stop = function(key) {
  var dev = this.devices[key];
  if(!dev) {
    this.emit('status', key, 'error', 'not_found');

    return;
  }
  dev.stop();
  this.devices[key] = undefined;
}

Devices.prototype.stopAll = function(allCb) {
  // conver to array to make async happy
  var devices = [];
  for(var i in this.devices) {
    if(!this.devices.hasOwnProperty(i))
      continue;

    devices.push(this.devices[i]);
  }
  if(allCb != null){
  async.forEach(
    devices,
    function(dev, cb) {
      dev.stop(cb);
    },
    function() {
      this.devices = {};
      allCb();
    }
  );}
};

Devices.prototype.checkAirTunesDevices = function() {
  try{
  var newHasAirTunes = false;

  for(var key in this.devices) {
    if(!this.devices.hasOwnProperty(key))
      continue;

    var device = this.devices[key];

   // if(device.type === 'airtunes') {
      newHasAirTunes = true;
      break;
   // }
  }

  if(newHasAirTunes !== this.hasAirTunes) {
    this.emit('airtunes_devices', newHasAirTunes);

    this.forEach(function(dev) {
      if(dev.setHasAirTunes)
        dev.setHasAirTunes(newHasAirTunes);
    });
  }

  this.hasAirTunes = newHasAirTunes;
  }catch(e){console.log(e)}
};

module.exports = Devices;
