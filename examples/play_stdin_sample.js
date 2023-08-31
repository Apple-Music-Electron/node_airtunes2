const {Worker} = require("worker_threads");
var ab2str = require('arraybuffer-to-string')
const mdns = require("mdns-js");
var AirTunes = require('../lib/');
var castDevices = [];

process.env.UV_THREADPOOL_SIZE = 6;

var airtunes = new AirTunes();

var browser_on = false;

process.stdin.on('data', function (data) {
  airtunes.write(data);
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

var func = `
     const {Worker, isMainThread, parentPort, workerData} = require('node:worker_threads');
     var { WebSocketServer } = require('ws');
     const wss = new WebSocketServer({ port: 8980 });
      wss.on('connection', function connection(ws) {
        ws.on('message', function message(data) {
          parentPort.postMessage({message: data});
        });
        parentPort.on("message", data => {
          ws.send(data);
        });  
      });`;
var worker = new Worker(func, {eval: true});    
worker.on("message", (result) => {
  parsed_data = JSON.parse(ab2str(result.message));
      if (parsed_data.type == "scanDevices") {
        // Sample data for scanning available devices:
        //'{"type":"scanDevices",
        // "timeout": 3000}
        castDevices = [];
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
        // "forceAlac":false}}'
        airtunes.add(parsed_data.host, parsed_data.args);
    } else if (parsed_data.type == "setVolume"){
        // Sample data for setting volume:
        // {"type":"setVolume",
        //  "devicekey": "192.168.3.4:7000",
        //  "volume":30}
        airtunes.setVolume(parsed_data.devicekey, parsed_data.volume,function(){});
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
        //  "artwork": "hex data"}
        airtunes.setArtwork(parsed_data.devicekey, Buffer.from(parsed_data.artwork,"hex"),parsed_data.contentType);
    } else if (parsed_data.type == "setTrackInfo"){
        // Sample data for setting track info:
        // {"type":"setTrackInfo",
        //  "devicekey": "192.168.3.4:7000",
        //  "artist": "John Doe",
        //  "album": "John Doe Album",
        //  "name": "John Doe Song"}
        airtunes.setTrackInfo(parsed_data.devicekey, parsed_data.name, parsed_data.artist, parsed_data.album, function(){});
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
    } else if (parsed_data.type == "stopAll"){
        // Sample data for stopping all:
        // {"type":"stopAll"}
        airtunes.stopAll();
    }
});

function getAvailableDevices() {
  if (!browser_on) {
    browser_on = true;
    const browser = mdns.createBrowser(mdns.tcp("raop"));
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

    const browser2 = mdns.createBrowser(mdns.tcp("airplay"));
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
  }
}

function ondeviceup(name, host, port, addresses, text, airplay2 = null) {
  // console.log(this.castDevices.findIndex((item) => {return (item.name == host.replace(".local","") && item.port == port )}))

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
      });
      // if (this.devices.indexOf(host_name) === -1) {
      //   this.devices.push(host_name);
      // }
      if (shown_name) {
        console.log("deviceFound", host_name, shown_name);
      }
    } else {
      console.log("deviceFound (added)", host_name, shown_name);
    }
  }
}

