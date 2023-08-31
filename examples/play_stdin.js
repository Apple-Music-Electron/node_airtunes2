const {Worker} = require("worker_threads");
var ab2str = require('arraybuffer-to-string')
const fetch2 = require('electron-fetch').default
const mdns = require("mdns-js");
const os = require("os");
var AirTunes = require('../lib/');
var castDevices = [];
const { join } = require('path');
const { Stream } = require('stream');
var NicerCast = require('nicercast');
var audioStream = new Stream.PassThrough();
const getPortSync = require('get-port-sync');
const Chromecast = require('./ccast/lib.js');

// console.log(await getPort());
process.env.UV_THREADPOOL_SIZE = 6;

var airtunes = new AirTunes();
var chromecast = new Chromecast();
var browser_on = false;

var browser = null;
var browser2 = null;
var browser3 = null;

process.stdin.on('data',  (data) => {
  airtunes.write(data);
  audioStream.write(data);
});

// monitor buffer events
// airtunes.on('buffer', function(status) {
//   console.log('buffer ' + status);

//   // after the playback ends, give some time to AirTunes devices
//   // if(status === 'end') {
//   //   console.log('playback ended, waiting for AirTunes devices');
//   //   setTimeout(function() {
//   //     airtunes.stopAll(function() {
//   //       console.log('end');
//   //       process.exit();
//   //     });
//   //   }, 2000);
//   // }
// });

var HttpAudioPort = getPortSync();
console.log("HttpAudioPort", HttpAudioPort);
var server = new NicerCast(audioStream, {});
server.start(HttpAudioPort);
chromecast.setAudioPort(HttpAudioPort);

// monitor buffer events
airtunes.on('buffer', function(status) {
  console.log('buffer ' + status);
  let status_json =  {
    type : "bufferStatus",
    status: status ?? "",
  }
  if(worker != null){
    worker.postMessage(JSON.stringify(status_json));
  }

});

airtunes.on('device', function(key, status, desc) {
  let status_json =  {
    type : "deviceStatus",
    key : key ?? "",
    status: status ?? "",
    desc: desc ?? ""
  }
  if(worker != null){
    worker.postMessage(JSON.stringify(status_json));
  }
  console.log("deviceStatus", key, status, desc);
})

chromecast.on('device', function(key, status, desc) {
  let status_json =  {
    type : "deviceStatus",
    key : key ?? "",
    status: status ?? "",
    desc: desc ?? ""
  }
  if(worker != null){
    worker.postMessage(JSON.stringify(status_json));
  }
  console.log("deviceStatus", key, status, desc);
});

const worker = new Worker(join(__dirname, "play_stdin_worker.js"));  
worker.on("message", (result) => {
  parsed_data = JSON.parse(ab2str(result.message));
      if (parsed_data.type == "scanDevices") {
        // Sample data for scanning available devices:
        //'{"type":"scanDevices",
        // "timeout": 3000}
        castDevices = [];
        try{
          browser.stop();
          browser2.stop();
          browser3.stop();
        } catch (e) {}
        getAvailableDevices();
        setTimeout(() => { worker.postMessage(JSON.stringify({
          type : "airplayDevices", devices: castDevices}));}, parsed_data.timeout ?? 1000);
      } else if (parsed_data.type == "addDevices") {
        // Sample data for adding devices:
        //'{"type":"addDevices",
        // "host":"192.168.3.4",
        // "args":{"port":7000,
        // "volume":50,
        // "password":3000,
        // "txt":["tp=UDP","sm=false","sv=false","ek=1","et=0,1","md=0,1,2","cn=0,1","ch=2","ss=16","sr=44100","pw=false","vn=3","txtvers=1"],
        // "airplay2":1,
        // "debug":true,
        // "forceAlac":false,  
        // "devicetype": "airplay"}}}}'
        if ((parsed_data.devicetype ?? "")  == "googlecast") {
          chromecast.stream({type : "googlecast" , host : parsed_data.host }, 'Cider 2', 'Streaming...', '', '');
        } else {
          airtunes.add(parsed_data.host, parsed_data.args);
        }

    } else if (parsed_data.type == "setVolume"){
        // Sample data for setting volume:
        // {"type":"setVolume",
        //  "devicekey": "192.168.3.4:7000",
        //  "volume":30}
        airtunes.setVolume(parsed_data.devicekey, parsed_data.volume,function(){});
        chromecast.setVolume(parsed_data.devicekey, parsed_data.volume);
    } else if (parsed_data.type == "setProgress"){
        // Sample data for setting progress:
        // {"type":"setProgress",
        //  "devicekey": "192.168.3.4:7000",
        //  "progress": 0,
        //  "duration": 0}
        airtunes.setProgress(parsed_data.devicekey, parsed_data.progress, parsed_data.duration,function(){});
    } else if (parsed_data.type == "setArtwork"){
        // Sample data for setting artwork:
        // {"type":"setArtwork",
        //  "devicekey": "192.168.3.4:7000",
        //  "contentType" : "image/png",
        //  "artworkURL": "url",
        //  "artwork": "hex data"}
        airtunes.setArtwork(parsed_data.devicekey, Buffer.from(parsed_data.artwork,"hex"),parsed_data.contentType);
        chromecast.setArtwork(parsed_data.devicekey,parsed_data.artworkURL ?? '');
    } else if (parsed_data.type == "setArtworkB64"){
        // Sample data for setting artwork:
        // {"type":"setArtworkB64",
        //  "devicekey": "192.168.3.4:7000",
        //  "contentType" : "image/png",
        //  "artworkURL": "url",
        //  "artwork": "url"}
        chromecast.setArtwork(parsed_data.devicekey,parsed_data.artworkURL ?? '');
        airtunes.setArtwork(parsed_data.devicekey,Buffer.from(parsed_data.artwork ?? '','base64'),parsed_data.contentType ?? '');
    } else if (parsed_data.type == "setTrackInfoGC"){
        // Sample data for setting track info:
        // {"type":"setTrackInfoGC",
        //  "devicekey": "192.168.3.4:7000",
        //  "artist": "John Doe",
        //  "album": "John Doe Album",
        //  "name": "John Doe Song"}
        chromecast.setTrackInfo(parsed_data.devicekey, parsed_data.name, parsed_data.artist, parsed_data.album, parsed_data.artworkURL ?? '');
    } else if (parsed_data.type == "setTrackInfo"){
        // Sample data for setting track info:
        // {"type":"setTrackInfo",
        //  "devicekey": "192.168.3.4:7000",
        //  "artist": "John Doe",
        //  "album": "John Doe Album",
        //  "name": "John Doe Song"}
        airtunes.setTrackInfo(parsed_data.devicekey, parsed_data.name, parsed_data.artist, parsed_data.album, function(){});
        chromecast.setTrackInfo(parsed_data.devicekey, parsed_data.name, parsed_data.artist, parsed_data.album, parsed_data.artworkURL ?? '');
    } else if (parsed_data.type == "setPasscode"){
        // Sample data for setting passcode:
        // {"type":"setPasscode",
        //  "devicekey": "192.168.3.4:7000",
        //  "passcode": "1234"}
        airtunes.setPasscode(parsed_data.devicekey, parsed_data.passcode);
    } else if (parsed_data.type == "stop"){
        // Sample data for stopping:
        // {"type":"stop",
        //  "devicekey": "192.168.3.4:7000"}
        airtunes.stop(parsed_data.devicekey);
        chromecast.stop(parsed_data.devicekey);
    } else if (parsed_data.type == "stopAll"){
        // Sample data for stopping all:
        // {"type":"stopAll"}
        airtunes.stopAll(null);
        chromecast.stopAll();
    } else if (parsed_data.type == "sendAudio"){
        // Sample data for playing:
        // {"type":"sendAudio",
        //  "data": "hex data"}
        airtunes.write(Buffer.from(parsed_data.data,"base64"));
        audioStream.write(Buffer.from(parsed_data.data,"base64"));
    } else if (parsed_data.type == "httpAudioIP") {
        let status_json =  {
          type : "httpAudioIP",
          desc: getIp() + ":" + HttpAudioPort
        }
        if(worker != null){
          worker.postMessage(JSON.stringify(status_json));
        }
    }
});

function getAvailableDevices() {
  browser = mdns.createBrowser(mdns.tcp("raop"));
  browser.on("ready", browser.discover);

  browser.on("update", (service) => {
    if (service.addresses && service.fullname && service.fullname.includes("_raop._tcp")) {
      // console.log(service.txt)
      console.log(
                `${service.name} ${service.host}:${service.port} ${service.addresses} ${service.fullname}`
      )
      let itemname = service.fullname.substring(service.fullname.indexOf("@") + 1, service.fullname.indexOf("._raop._tcp"));
      ondeviceup(itemname, service.host, service.port, service.addresses, service.txt);
    }
  });

  browser2 = mdns.createBrowser(mdns.tcp("airplay"));
  browser2.on("ready", browser2.discover);

  browser2.on("update", (service) => {
    if (service.addresses && service.fullname && service.fullname.includes("_airplay._tcp")) {
      // console.log(service.txt)
      console.log(
        `${service.name} ${service.host}:${service.port} ${service.addresses} ${service.fullname}`
      )
      let itemname = service.fullname.substring(service.fullname.indexOf("@") + 1, service.fullname.indexOf("._airplay._tcp"));
      ondeviceup(itemname, service.host, service.port, service.addresses, service.txt, true);
    }
  });

  browser3 = mdns.createBrowser(mdns.tcp("googlecast"));
  browser3.on("ready", browser3.discover);

  browser3.on("update", (service) => {
    if (service.addresses && service.fullname && service.fullname.includes("_googlecast._tcp")) {
      let a = service.txt.filter((u) => String(u).startsWith("fn="));
      let name = (a[0] ?? "").substring(3) != "" ? (a[0] ?? "").substring(3) : service.fullname.substring(0, service.fullname.indexOf("._googlecast"));
      ondeviceup(name + " (" + (service.type[0]?.description ?? "") + ")", service.addresses[0], '', service.addresses, null, null , "googlecast");
    }
  });

}

function ondeviceup(name, host, port, addresses, text, airplay2 = null, devicetype = "airplay") {
  // console.log(castDevices.findIndex((item) => {return (item.name == host.replace(".local","") && item.port == port )}))
  if (devicetype == "airplay") {
    let d = "";
    let audiook = true;
    try {
      d = text.filter((u) => String(u).startsWith("features="));
      if (d.length == 0) d = text.filter((u) => String(u).startsWith("ft="));
      let features_set = d.length > 0 ? d[0].substring(d[0].indexOf("=") + 1).split(",") : [];
      let features = [...(features_set.length > 0 ? parseInt(features_set[0]).toString(2).split("") : []), ...(features_set.length > 1 ? parseInt(features_set[1]).toString(2).split("") : [])];
      if (features.length > 0) {
        audiook = features[features.length - 1 - 9] == "1";
      }
    } catch (_) {}
    if (audiook) {
      let shown_name = name;
      try {
        let model = text.filter((u) => String(u).startsWith("model="));
        let manufacturer = text.filter((u) => String(u).startsWith("manufacturer="));
        let name1 = text.filter((u) => String(u).startsWith("name="));
        if (name1.length > 0) {
          shown_name = name1[0].split("=")[1];
        } else if (manufacturer.length > 0) {
          shown_name = (manufacturer.length > 0 ? manufacturer[0].substring(13) : "") + " " + (model.length > 0 ? model[0].substring(6) : "");
          shown_name = shown_name.trim().length > 1 ? shown_name : (host ?? "Unknown").replace(".local", "");
        }
      } catch (e) {}
      let host_name = addresses != null && typeof addresses == "object" && addresses.length > 0 ? addresses[0] : typeof addresses == "string" ? addresses : "";

      let needPassword = false;
      let needPin = false;
      let transient = false;
      let c = text.filter((u) => String(u).startsWith('sf='))
      let statusflags = c[0] ? parseInt(c[0].substring(3)).toString(2).split('') : []
      if (c.length == 0) {
          c = text.filter((u) => String(u).startsWith('flags='))
          statusflags = c[0] ? parseInt(c[0].substring(6)).toString(2).split('') : []
      }
      if (statusflags != []){
        let PasswordRequired = (statusflags[statusflags.length - 1 - 7] == '1')
        let PinRequired = (statusflags[statusflags.length - 1 - 3] == '1')
        let OneTimePairingRequired = (statusflags[statusflags.length - 1 - 9] == '1')
        needPassword = PasswordRequired;
        needPin = (PinRequired || OneTimePairingRequired)
        transient = (!(PasswordRequired || PinRequired || OneTimePairingRequired)) ?? true
      }
      let pw = text.filter((u) => String(u).startsWith('pw='))
      if(pw.length > 0){
        needPassword = pw[0].substring(3) === 'true'
      }

    if (
      castDevices.findIndex((item) => {
        return item != null && item.name == shown_name && item.host == host_name && item.host != "Unknown";
      }) == -1
    ) {
      castDevices.push({
        name: shown_name,
        host: host_name,
        port: port,
        addresses: addresses,
        txt: text,
        airplay2: airplay2,
        needPassword: needPassword,
        devicetype: devicetype,
      });
      // if (devices.indexOf(host_name) === -1) {
      //   devices.push(host_name);
      // }
      if (shown_name) {
        console.log("deviceFound", host_name, shown_name);
      }
    } else {
      console.log("deviceFound (added)", host_name, shown_name);
    }
  }} else if (devicetype == "googlecast") {
    if (
      castDevices.findIndex((item) => {
        return item != null && item.name == name && item.host == host && item.host != "Unknown";
      }) == -1
    ) {
      castDevices.push({
        name: name,
        host: host,
        port: port,
        addresses: addresses,
        txt: text,
        airplay2: airplay2,
        needPassword: null,
        devicetype: devicetype
      });
      // if (devices.indexOf(host_name) === -1) {
      //   devices.push(host_name);
      // }
      if (name) {
        console.log("gCast deviceFound", name, host);
      }
    } else {
      console.log("gCast deviceFound (added)", name, name);
    }
  }
}

function getIp() {
  let ip = "";
  let ip2 = [];
  let alias = 0;
  const ifaces= os.networkInterfaces();
  for (let dev in ifaces) {
    ifaces[dev].forEach((details) => {
      if (details.family === "IPv4" && !details.internal) {
        if (!/(loopback|vmware|internal|hamachi|vboxnet|virtualbox)/gi.test(dev + (alias ? ":" + alias : ""))) {
          if (details.address.substring(0, 8) === "192.168." || details.address.substring(0, 7) === "172.16." || details.address.substring(0, 3) === "10.") {
            if (!ip.startsWith("192.168.") || (ip2.startsWith("192.168.") && !ip.startsWith("192.168.") && ip2.startsWith("172.16.") && !ip.startsWith("192.168.") && !ip.startsWith("172.16.")) || (ip2.startsWith("10.") && !ip.startsWith("192.168.") && !ip.startsWith("172.16.") && !ip.startsWith("10."))) {
              ip = details.address;
            }
            ++alias;
          }
        }
      }
    });
  }
  return ip;
}

