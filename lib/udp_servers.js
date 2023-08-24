var dgram = require('dgram'),
    events = require('events'),
    util = require('util'),
    config = require('./config.js'),
    nu = require('./num_util.js'),
    async = require('async'),
    ntp = require('./ntp.js');

var UNBOUND = 0,
    BINDING = 1,
    BOUND = 2;

function UDPServers() {
  events.EventEmitter.call(this);

  this.status = UNBOUND;

  this.control = {
    socket: null,
    port: null,
    name: 'control'
  };

  this.timing = {
    socket: null,
    port: null,
    name: 'timing'
  };

  this.hosts = [];
}

util.inherits(UDPServers, events.EventEmitter);

UDPServers.prototype.bind = function(host) {
  var self = this;

  this.hosts.push(host);

  switch(this.status) {
  case BOUND:
    process.nextTick(function() {
      self.emit('ports', null, this.control, this.timing);
    });
    return;

  case BINDING:
    return;
  }

  var self = this;
  this.status = BINDING;

  // Timing socket
  this.timing.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

  this.timing.socket.on('message', function(msg, rinfo) {
	// only listen and respond on own hosts
	if (self.hosts.indexOf(rinfo.address) < 0) return;

    var ts1 = msg.readUInt32BE(24);
    var ts2 = msg.readUInt32BE(28);

    var reply = new Buffer(32);
    reply.writeUInt16BE(0x80d3, 0);
    reply.writeUInt16BE(0x0007, 2);
    reply.writeUInt32BE(0x00000000, 4);

    reply.writeUInt32BE(ts1, 8);
    reply.writeUInt32BE(ts2, 12);

    var ntpTime = ntp.timestamp();

    ntpTime.copy(reply, 16);
    ntpTime.copy(reply, 24);

    self.timing.socket.send(
      reply, 0, reply.length,
      rinfo.port, rinfo.address
    );
  });

  // Control socket
  this.control.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

  this.control.socket.on('message', function(msg, rinfo) {

	// only listen for own hosts
	if (self.hosts.indexOf(rinfo.address) < 0) return;

    var resendRequested = msg.readUInt8(1) == (0x80|0x55);
    //var serverSeq = msg.readUInt16BE(2);
    if (resendRequested) {
      var missedSeq = msg.readUInt16BE(4);
      var count = msg.readUInt16BE(6);
      self.emit('resendRequested', missedSeq, count)
    }
  });

  // // Event socket
  // this.event.socket = dgram.createSocket('udp4');

  // this.event.socket.on('message', function(msg, rinfo) {

  // // only listen and respond on own hosts
  // if (self.hosts.indexOf(rinfo.address) < 0) return;
  // });

  // Find open ports
  if (!(process.platform == 'darwin')) {
  var current_port = config.udp_default_port;


            self.control.socket.bind(function (err) {
              if (err) {
                return cb(err)
              }
          
              self.control.port = self.control.socket.address().port;
            })
            self.timing.socket.bind(function (err) {
              if (err) {
                return cb(err)
              }
          
              self.timing.port = self.timing.socket.address().port;
            })
            let myInterval = setInterval(small, 100);
            function small (){
              if (self.timing.port != null && self.control.port != null) {
                clearInterval(myInterval);
                self.status = BOUND;
                self.emit('ports', null, self.control, self.timing);
              }
            }
          } else {
            var to_bind = [this.control, this.timing];
            var current_port = config.udp_default_port;
  async.whilst(
      function(cb) { cb(null, to_bind.length > 0); },
      function(cb) {
      var nextPort = to_bind[0];
      nextPort.socket.once('error', function(e) {
        if(e.code === 'EADDRINUSE') {
          // try next port
          current_port++;
          cb();
        } else
          // otherwise, report the error and cancel everything
          cb(e);
      });

      nextPort.socket.once('listening', function() {
        // socket successfully bound
        to_bind.shift();
        nextPort.port = current_port;
        current_port++;
        cb();
      });

      nextPort.socket.bind(current_port);
    },
    function(err) {
      if(err) {
        self.close();
        self.emit('ports', err);
      } else {
        self.status = BOUND;
        self.emit('ports', null, self.control, self.timing);
      }
    }
  );
}
}



UDPServers.prototype.close = function() {
// 
  try{
  this.status = UNBOUND;

  this.timing.socket.close();
  this.timing.socket = null;

  this.control.socket.close();
  this.control.socket = null;} catch(e){}

  // this.event.socket.close();
  // this.event.socket = null;
}

UDPServers.prototype.sendControlSync = function(seq, dev) {
  if(this.status !== BOUND)
    return;

  var packet = new Buffer(20);

  packet.writeUInt16BE(0x80d4, 0);
  packet.writeUInt16BE(0x0007, 2);
  packet.writeUInt32BE(nu.low32(seq*config.frames_per_packet), 4);

  var ntpTime = ntp.timestamp();
  ntpTime.copy(packet, 8);

  packet.writeUInt32BE(
    nu.low32(seq*config.frames_per_packet +
    config.sampling_rate*2), 16
  );
  this.control.socket.send(packet, 0, packet.length, dev.controlPort, dev.host);
}

module.exports = UDPServers;
