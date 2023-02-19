var AirTunes = require('../lib/'),
    lame = require('lame'),
    request = require('request')
    spawn = require('child_process').spawn,
    argv = require('optimist')
      .usage('Usage: $0 --host [host] --port [num] --file [path] --volume [num]')
      .default('port', 5002)
      .default('volume', 50)
      .default('file', 'https://data33.chiasenhac.com/downloads/1991/2/1990739-ac226c05/128/Head%20In%20The%20Clouds%20-%2088rising_%20Joji.mp3')
      .demand(['host'])
      .argv;

console.log('adding device: ' + argv.host + ':' + argv.port + ' ALL=%j', argv);
var airtunes = new AirTunes();
var device = airtunes.add(argv.host, argv);

// when the device is online, spawn ffmpeg to transcode the file
device.on('status', function(status) {
  console.log('status: ' + status);

  if(status !== 'ready')
    return;

  /*var ffmpeg = spawn(argv.ffmpeg, [
    '-i', argv.file,
    '-f', 's16le',        // PCM 16bits, little-endian
    '-ar', '44100',       // Sampling rate
    '-ac', 2,             // Stereo
    'pipe:1'              // Output on stdout
  ]); //*/

  /*var encoder = new lame.Decoder({   
    // input
    bitRate: 128,
    sampleRate: 44100,
    mode: lame.STEREO, // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO
    
    // output
    channels: 2,        // 2 channels (left and right)
    bitDepth: 16,       // 16-bit samples
    sampleRate: 44100,  // 44,100 Hz sample rate
  }); //*/



  request(argv.file)
    .pipe(new lame.Decoder)    
//    .on('format', console.log)
    .pipe(airtunes);

});

// monitor buffer events
airtunes.on('buffer', function(status) {
  console.log('buffer ' + status);

  // after the playback ends, give some time to AirTunes devices
  if(status === 'end') {
    console.log('playback ended, waiting for AirTunes devices');
    setTimeout(function() {
      airtunes.stopAll(function() {
        console.log('end');
        process.exit();
      });
    }, 2000);
  }
});

