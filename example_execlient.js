var spawn = require('child_process').spawn
var airtunes = spawn("airtunes2.exe");
var { WebSocket } = require('ws');
var ffmpeg = spawn('C:\\ffmpeg\\bin\\ffmpeg.exe', [
    '-i', 'http://radio.plaza.one/mp3_low',
    '-acodec', 'pcm_s16le',
    '-f', 's16le',        // PCM 16bits, little-endian
    '-ar', '44100',       // Sampling rate
    '-ac', 2,             // Stereo
    'pipe:1'              // Output on stdout
]);

  // pipe data to AirTunes
ffmpeg.stdout.pipe(airtunes.stdin);

  // detect if ffmpeg was not spawned correctly
ffmpeg.stderr.setEncoding('utf8');
ffmpeg.stderr.on('data', function(data) {
    if(/^execvp\(\)/.test(data)) {
      console.log('failed to start ' + argv.ffmpeg);
      process.exit(1);
    }
});
setTimeout(()=>{
const ws = new WebSocket('ws://localhost:8980');

ws.on('error', console.error);

ws.on('open', function open() {
  ws.send(JSON.stringify({"type":"addDevices",
       "host":"192.168.100.12",
       "args":{"port":7000,
       "volume":20,airplay2: true,
       "txt":["tp=UDP","sm=false","sv=false","ek=1","et=0,1","md=0,1,2","cn=0,1","ch=2","ss=16","sr=44100","pw=false","vn=3","txtvers=1"],
       "debug":true,
      "forceAlac":false}}))
});


ws.on('message', function message(data) {
  console.log('received: %s', data);
});
}, 1000);
