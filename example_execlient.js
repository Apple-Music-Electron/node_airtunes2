var spawn = require('child_process').spawn
var airtunes = spawn("airtunes2.exe");
const fetch = require('electron-fetch').default
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
// ffmpeg.stdout.pipe(airtunes.stdin);



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
airtunes.stdout.pipe(process.stdout);
airtunes.stderr.pipe(process.stdout);
ws.on('error', console.error);

// ws.on('open', function open() {
//   ws.send(JSON.stringify({"type":"addDevices",
//        "host":"192.168.100.5",
//        "args":{"port":7000,
//        "volume":20, "airplay2": true ,
//       //  "password":"853228",
//        //txt: ["cn=0,1","da=true","et=0,4","ft=0x445F8A00,0x1C340","fv=p20.72.2-40060","md=0,1,2","am=Bookshelf","sf=0x4","tp=UDP","vn=65537","vs=366.0","pk=lol"],
//         //txt: ["acl=0","deviceid=","features=0x445F8A00,0x1C340","rsf=0x0","fv=p20.72.2-40060","flags=0x4","model=Bookshelf","manufacturer=Sonos","serialNumber=nol","protovers=1.1","srcvers=366.0","pi=nol","gid=nol","gcgl=0","pk=lolno"],
//        "txt":["cn=0,1,2,3","da=true","et=0,3,5","ft=0x4A7FCA00,0xBC354BD0","sf=0xa0404","md=0,1,2","am=AudioAccessory5,1","pk=lolno","tp=UDP","vn=65537","vs=670.6.2","ov=16.2","vv=2"],
//        //"txt":["cn=0,1,2,3","da=true","et=0,3,5","ft=0x4A7FCA00,0xBC354BD0","sf=0x80484","md=0,1,2","am=AudioAccessory5,1","pk=lol","tp=UDP","vn=65537","vs=670.6.2","ov=16.2","vv=2"],
//        "debug":true,
//        "forceAlac":false}}))     
// });

ws.on('open', function open() {
  ws.send(JSON.stringify({"type":"addDevices",
      //  "devicetype": "googlecast",
       "host":"192.168.100.3",
       "args":{"port": '7000',
       "volume":20, "airplay2": true ,      
      //  "password":"853228",
       //txt: ["cn=0,1","da=true","et=0,4","ft=0x445F8A00,0x1C340","fv=p20.72.2-40060","md=0,1,2","am=Bookshelf","sf=0x4","tp=UDP","vn=65537","vs=366.0","pk=lol"],
        //txt: ["acl=0","deviceid=","features=0x445F8A00,0x1C340","rsf=0x0","fv=p20.72.2-40060","flags=0x4","model=Bookshelf","manufacturer=Sonos","serialNumber=nol","protovers=1.1","srcvers=366.0","pi=nol","gid=nol","gcgl=0","pk=lolno"],
       //"txt":["cn=0,1,2,3","da=true","et=0,3,5","ft=0x4A7FCA00,0xBC354BD0","sf=0xa0404","md=0,1,2","am=AudioAccessory5,1","pk=lolno","tp=UDP","vn=65537","vs=670.6.2","ov=16.2","vv=2"],
       //"txt":["cn=0,1,2,3","da=true","et=0,3,5","ft=0x4A7FCA00,0xBC354BD0","sf=0x80484","md=0,1,2","am=AudioAccessory5,1","pk=lol","tp=UDP","vn=65537","vs=670.6.2","ov=16.2","vv=2"],
       "txt":["features=0x527FFEF7,0x8","pw=0","flags=0x4","model=AppleTV3,1","rmodel=AirReceiver3,1","srcvers=211.3","pk=1ea28066c003a475811347ba91adb785d13a3f34beb0f1b16a5c16da703ee8e2","deviceid=64:D2:3C:CC:89:CF"],
       "debug":true,
       "forceAlac":true}}))     
});


ffmpeg.stdout.on('data', function(data) {
  try{
  ws.send(JSON.stringify({"type":"sendAudio",
  "data": data.toString('base64')}))
  }catch(err){}
})


ws.on('message', function message(data) {
 // console.log('received: %s', data);
  data = JSON.parse(data)
  if (data.status == "ready"){
    setInterval(()=>{
      fetch("https://api.plaza.one/status")
      .then((res) => res.json()).then((radiostatus) => {
        ws.send(JSON.stringify(      
            {"type":"setTrackInfo",
            "devicekey": data.key,
            "artist": radiostatus.song.artist,
            "album": radiostatus.song.album,
            "name": radiostatus.song.title}
        ))
        fetch(radiostatus.song.artwork_src)
        .then((res) => res.buffer())
        .then((buffer) => {
          ws.send(JSON.stringify(      
            {"type":"setArtworkB64",
            "devicekey": data.key,
            "contentType" : "image/jpeg",
            "artworkURL": radiostatus.song.artwork_src,
            "artwork": buffer.toString('base64')}
          ))
        })
        .catch((err) => {
          console.log(err);
        });
      })
      .catch((err) => {
        console.log(err);
      });    
    },10000)
  }
});
}, 1000);
