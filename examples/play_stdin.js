var AirTunes = require('../lib/'),
    argv = require('optimist')
    .usage('Usage: $0 --host [host] --port [num] --volume [num] --password [string] --mode [mode] --airplay2 [1/0] --debug [mode] --ft [featuresHexes] --sf [statusFlags] --et [encryptionTypes] --cn [audioCodecs]')
    .default('port', 5002)
    .default('volume', 30)
    .default('ft',"0x7F8AD0,0x38BCF46")
    .default('sf',"0x98404")
    .default('cn',"0,1,2,3")
    .default('et',"0,3,5")
    .default('airplay2',"0")
    .default('forceAlac', false)
    .demand(['host'])
    .argv;
argv.txt = [
      `cn=${argv.cn}`,
      'da=true',
      `et=${argv.et}`,
      `ft=${argv.ft}`,
      `sf=${argv.sf}`,
      'md=0,1,2',
      'am=AudioAccessory5,1',
      'pk=lolno',
      'tp=UDP',
      'vn=65537',
      'vs=610.20.41',
      'ov=15.4.1',
      'vv=2'
];
console.log('pipe PCM data to play over AirTunes');
console.log('example: type sample.pcm | node play_stdin.js --host <AirTunes host>\n (yes doesnt work on windows powershell cus Microsoft is stupid, use cmd)');

// Only works on OSX
// airtunes.addCoreAudio();

console.log('adding device: ' + argv.host + ':' + argv.port);
var airtunes = new AirTunes();
var device = airtunes.add(argv.host, argv);


// when the device is online, spawn ffmpeg to transcode the file
device.on('status', function(status) {
  console.log('status: ' + status);

  if(status === 'need_password'){
    device.setPasscode(argv.password);
  }

  if(status !== 'ready')
    return;

  if(status == 'ready') {
  }


  // pipe data to AirTunes
  process.stdin.pipe(airtunes);
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

// device.on('status', function(status) {
//   process.stdin.on('data', function () {
//     process.stdin.pipe(airtunes);
//     process.stdin.resume();
//   });

// });

// device.on('error', function(err) {
//   console.log('device error: ' + err);
//   process.exit(1);
// });

// setTimeout(function () {
//   console.log('stopping');
//   airtunes.stopAll(function () {
//     console.log('all stopped');
//   });
// }, 1000);

// // monitor buffer events
// airtunes.on('buffer', function(status) {
//   console.log('buffer ' + status);

//   // after the playback ends, give AirTunes some time to finish
//   if(status === 'end') {
//     console.log('playback ended, waiting for AirTunes devices');
//     setTimeout(function() {
//       airtunes.stopAll(function() {
//         console.log('end');
//         process.exit();
//       });
//     }, 2000);
//   }
// });
