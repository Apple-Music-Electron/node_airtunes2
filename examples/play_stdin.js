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
process.env.UV_THREADPOOL_SIZE = 6;
console.log('adding device: ' + argv.host + ':' + argv.port);
var airtunes = new AirTunes();
var device = airtunes.add(argv.host, argv);
var wsConnection = null;
var { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8980 });
wss.on('connection', function connection(ws) {
  wsConnection = ws;
  ws.on('message', function message(data) {
    console.log('received: %s', data);
    parsed_data = JSON.parse(data);
    if (parsed_data.type == "addDevices") {
      // Sample data for adding devices:
      //'{"type":"addDevices",
      // "host":"192.168.3.4",
      // "args":{"port":7000,
      // "volume":50,
      // "password":3000,
      // "txt":["tp=UDP","sm=false","sv=false","ek=1","et=0,1","md=0,1,2","cn=0,1","ch=2","ss=16","sr=44100","pw=false","vn=3","txtvers=1"],
      // "airplay2":1,
      // "debug":true,
      // "forceAlac":false}}'
      airtunes.add(parsed_data.host, parsed_data.args);
    } else if (parsed_data.type == "setVolume"){
        // Sample data for setting volume:
        // {"type":"setVolume",
        //  "devicekey": "192.168.3.4:7000",
        //  "volume":30}
        airtunes.setVolume(parsed_data.devicekey, parsed_data.volume,null);
    } else if (parse.type == "setProgress"){
        // Sample data for setting progress:
        // {"type":"setProgress",
        //  "devicekey": "192.168.3.4:7000",
        //  "progress": 0,
        //  "duration": 0}
        airtunes.setProgress(parsed_data.devicekey, parsed_data.progress, parsed_data.duration,null);
    } else if (parse.type == "setArtwork"){
        // Sample data for setting artwork:
        // {"type":"setArtwork",
        //  "devicekey": "192.168.3.4:7000",
        //  "contentType" : "image/png";
        //  "artwork": "hex data"}
        airtunes.setArtwork(parsed_data.devicekey, Buffer.from(parsed_data.artwork,"hex"),null);
    } else if (parse.type == "setTrackInfo"){
        // Sample data for setting track info:
        // {"type":"setTrackInfo",
        //  "devicekey": "192.168.3.4:7000",
        //  "artist": "John Doe",
        //  "album": "John Doe Album",
        //  "name": "John Doe Song"}
        airtunes.setTrackInfo(parsed_data.devicekey, parsed_data.name, parsed_data.artist, parsed_data.album, parsed_data.name,null);
    } else if (parse.type == "setPasscode"){
        // Sample data for setting passcode:
        // {"type":"setPasscode",
        //  "devicekey": "192.168.3.4:7000",
        //  "passcode": "1234"}
        airtunes.setPasscode(parsed_data.devicekey, parsed_data.passcode);
    } else if (parse.type == "stop"){
        // Sample data for stopping:
        // {"type":"stop",
        //  "devicekey": "192.168.3.4:7000"}
        airtunes.stop(parsed_data.devicekey);
    } else if (parse.type == "stopAll"){
        // Sample data for stopping all:
        // {"type":"stopAll"}
        airtunes.stopAll();
    }
  });
});    

airtunes.on('device', function(key, status, desc) {
  let status_json =  {
    type : "deviceStatus",
    key : key,
    status: status,
    desc: desc
  }
  if(wsConnection != null){
   
  wsConnection.send(JSON.stringify(status_json));
  }
  console.log("deviceStatus", key, status, desc);
  process.stdout.write(JSON.stringify(status_json))
})

// when the device is online, spawn ffmpeg to transcode the file
device.on('status', function(status) {
  console.log('status: ' + status);

  // if(status === 'need_password'){
  //   device.setPasscode(argv.password);
  // }

  if(status !== 'ready')
    return;

  if(status == 'ready') {
  }

  process.stdin.on('data', function (data) {
    let commandbytes = Buffer.from([0x61, 0x74, 0x63, 0x6f, 0x6d, 0x6d, 0x61, 0x6e, 0x63, 0x3d, 0x70, 0x6c, 0x61, 0x79, 0x0a]);
    //check if data starts with commandbytes
    if (data.slice(0,15).equals(commandbytes)){
      console.log("commandbytes found");
      let command = data.slice(15).toString();
      console.log(command);
      parsed_data = JSON.parse(command);
      if (parsed_data.type == "addDevices") {
        // Sample data for adding devices:
        //'{"type":"addDevices",
        // "host":"192.168.3.4",
        // "args":{"port":7000,
        // "volume":50,
        // "password":3000,
        // "txt":["tp=UDP","sm=false","sv=false","ek=1","et=0,1","md=0,1,2","cn=0,1","ch=2","ss=16","sr=44100","pw=false","vn=3","txtvers=1"],
        // "airplay2":1,
        // "debug":true,
        // "forceAlac":false}}'
        airtunes.add(parsed_data.host, parsed_data.args);
      } else if (parsed_data.type == "setVolume"){
          // Sample data for setting volume:
          // {"type":"setVolume",
          //  "devicekey": "192.168.3.4:7000",
          //  "volume":30}
          airtunes.setVolume(parsed_data.devicekey, parsed_data.volume,null);
      } else if (parse.type == "setProgress"){
          // Sample data for setting progress:
          // {"type":"setProgress",
          //  "devicekey": "192.168.3.4:7000",
          //  "progress": 0,
          //  "duration": 0}
          airtunes.setProgress(parsed_data.devicekey, parsed_data.progress, parsed_data.duration,null);
      } else if (parse.type == "setArtwork"){
          // Sample data for setting artwork:
          // {"type":"setArtwork",
          //  "devicekey": "192.168.3.4:7000",
          //  "contentType" : "image/png";
          //  "artwork": "hex data"}
          airtunes.setArtwork(parsed_data.devicekey, Buffer.from(parsed_data.artwork,"hex"),null);
      } else if (parse.type == "setTrackInfo"){
          // Sample data for setting track info:
          // {"type":"setTrackInfo",
          //  "devicekey": "192.168.3.4:7000",
          //  "artist": "John Doe",
          //  "album": "John Doe Album",
          //  "name": "John Doe Song"}
          airtunes.setTrackInfo(parsed_data.devicekey, parsed_data.name, parsed_data.artist, parsed_data.album, parsed_data.name,null);
      } else if (parse.type == "setPasscode"){
          // Sample data for setting passcode:
          // {"type":"setPasscode",
          //  "devicekey": "192.168.3.4:7000",
          //  "passcode": "1234"}
          airtunes.setPasscode(parsed_data.devicekey, parsed_data.passcode);
      } else if (parse.type == "stop"){
          // Sample data for stopping:
          // {"type":"stop",
          //  "devicekey": "192.168.3.4:7000"}
          airtunes.stop(parsed_data.devicekey);
      } else if (parse.type == "stopAll"){
          // Sample data for stopping all:
          // {"type":"stopAll"}
          airtunes.stopAll();
      }
    } else {airtunes.write(data);}
    
    // process.stdin.pipe(airtunes);
    // process.stdin.resume();
  });
  // pipe data to AirTunes
  //process.stdin.pipe(airtunes);
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
