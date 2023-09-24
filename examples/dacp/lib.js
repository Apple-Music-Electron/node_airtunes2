const os = require("os");
var events = require("events");
const util = require("util");
const DeviceDiscovery = require("./device_browser");
const fetch = require("electron-fetch").default;
const crypto = require("crypto");
var daap = require("./dmap.js");
const express = require("express");

function DACPServer() {
  this.availableRemotes = [];
  this.connectedRemotes = [];
  this.browser = new DeviceDiscovery();
}
util.inherits(DACPServer, events.EventEmitter);

DACPServer.prototype.start = function () {
  this.browser.scan();
  this.startHTTPServer();
  this.browser.broadcast();
};

DACPServer.prototype.stop = function () {};

DACPServer.prototype.getAvailableRemotes = function () {
  this.availableRemotes = this.browser.getDevices();
  return this.availableRemotes;
};

DACPServer.prototype.connect = async function (device, passcode) {
  // let ipv4 addresses from device.addresses

  function detectIPv4(addresses) {
    const ipv4Pattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
    const ipv4Addresses = [];

    for (let i = 0; i < addresses.length; i++) {
      const match = addresses[i].match(ipv4Pattern);
      if (match) {
        ipv4Addresses.push(match[0]);
      }
    }

    return ipv4Addresses;
  }

  let host = detectIPv4(device.addresses)[0];
  let port = device.port;
  console.log(device);
  console.log(port);
  if (device.txt.Pair) {
    merged = device.txt.Pair;
    for (var ctr = 0; ctr < passcode.length; ctr++)
      merged += passcode[ctr] + "\x00";

    pairing2 = crypto.createHash("md5").update(merged).digest("hex");

    let res = await fetch(
      `http://${host}:${port.toString()}/pair?pairingcode=${pairing2.toUpperCase()}&servicename=47975973649ECA7B`
    );
    let data = await res.buffer();
    console.log(data.toString());
    var data_val = daap_decode(data);
    console.log(data_val);

    if (data_val.cmpa?.cmpg) {
      console.log("Pairing successful");
      this.connectedRemotes.push({
        device: device,
        pairing: data_val.cmpa?.cmpg,
        host: host,
        port: port,
      });
    }
  }
};

DACPServer.prototype.startHTTPServer = function () {
  // express server
  const app = express();
  const port = 14243;

  app.get("/server-info", (req, res) => {
    console.log("[DACP] sent server info");
    console.log(Math.round(new Date().getTime() / 1000));
    var data = daap_encode({
      msrv: {
        mstt: 200,
        mpro: { major: 0, minor: 0 },
        minm: "Cider",
        apro: { major: 0, minor: 0 },
        aeSV: { major: 0, minor: 0 },
        ated: 483699,
        asgr: 221555,
        asse: 0,
        aeMQ: 1,
        mscu: 0,
        aeFR: 100,
        aeTr: 1,
        aeSL: 1,
        aeSR: 1,
        //   aeFP: 1,
        aeSX: 0,
        ppro: { major: 0, minor: 0 },
        msed: 1,
        msml: 109,
        mslr: 0,
        mstm: 1800,
        msal: 1,
        msas: 3,
        msup: 1,
        mspi: 1,
        msex: 1,
        msbr: 1,
        msqy: 1,
        msix: 1,
        msrs: 1,
        msdc: 2,
        mstc: 1695537174,
        msto: 25200,
      },
    });
    console.log(data);
    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });

    res.send(data);
  });

  app.get("/login", (req, res) => {
    console.log("[DACP] accept login");
    //http://daap.sourceforge.net/docs/server-info.html
    var data = daap_encode({
      mlog: { mstt: 200, mlid: 951632340 },
    });

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });
    res.send(data);
  });

  app.get("/ctrl-int", (req, res) => {
    console.log("[DACP] ctrlintresponse");
    //http://daap.sourceforge.net/docs/server-info.html
    var data = daap_encode({
      caci: {
        mstt: 200,
        muty: 0,
        mtco: 1,
        mrco: 1,
        mlcl: {
          mlit: {
            miid: 1,
            cmik: 1,
            cmpr: {
              major: 2,
              minor: 2,
            },
            capr: {
              major: 2,
              minor: 5,
            },
            cmsp: 1,
            aeFR: 100,
            cmsv: 1,
            cass: 1,
            caov: 1,
            casu: 1,
            ceSG: 1,
            cmrl: 1,
            ceSX: 0,
          },
        },
      },
    });

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });

    res.send(data);
  });

  app.get("/update", (req, res) => {
    console.log("[DACP] accept update");
    //http://daap.sourceforge.net/docs/server-info.html
    var data = daap_encode({ 
            mupd: {
             mstt: 200, 
             musr: 4 
            } 
        }
        );

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });
    res.send(data);
  });

  app.get("/databases", (req, res) => {
    console.log("[DACP] send databases");
    //http://daap.sourceforge.net/docs/server-info.html
    var data = daap_encode({
            avdb: {
                mstt:200,
                muty:0,
                mtco:2,
                mrco:2,
                mlcl:{
                    mlit:{
                        miid:1,
                        mper:640516736,
                        mdbk:1,
                        aeCs:3,
                        aeIM:1236455424,
                        minm:"Cider Library",
                        mimc:2320,
                        mctc:46,
                        aeMk:1,
                        meds:3
                    }}
            }}

        );

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });
    res.send(data);
  });

  app.get("/databases/1/containers", (req, res) => {
    console.log("[DACP] send databases");
    //http://daap.sourceforge.net/docs/server-info.html
    var data = daap_encode({
            aply: {
                mstt:200,
                muty:0,
                mrco:1,
                mtco:1,
                mlcl:{
                    mlit:{
                        meds:103,
                        miid:6969,
                        minm:"Cider Playlist",
                        mpco:0,
                        mper:640516736,
                    }}
            }}

        );

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });
    res.send(data);
  });


    app.get("/ctrl-int/1/getspeakers", (req, res) => {
     // console.log("[DACP] getspeaker");
      //http://daap.sourceforge.net/docs/server-info.html
      var data = daap_encode({
        casp: {
           mstt: 200 ,
           mdcl: {
               minm: "Computer",
               msma: 0 ,
               caia: true ,
               cmvo: 100 ,
            }
        }   
      });

      res.set({
        Date: new Date().toString(),
        "Content-Type": "application/x-dmap-tagged",
        "DAAP-Server": "daap.js/0.0",
      });
      res.send(data);
    });

    app.get("/ctrl-int/1/getproperty", (req, res) => {
      // console.log("[DACP] property");

      var data = daap_encode({
        cmgt: { mstt: 200 ,  cmvo: 100 },
      });

      res.set({
        Date: new Date().toString(),
        "Content-Type": "application/x-dmap-tagged",
        "DAAP-Server": "daap.js/0.0",
      });
      res.send(data);
    });

    app.get("/ctrl-int/1/playstatusupdate", (req, res) => {
     // console.log("[DACP] playstatusupdate");
      //http://daap.sourceforge.net/docs/server-info.html
      /// cmst --+
      ///     mstt 4 000000c8 == 200
      ///     cmsr 4 00000006 == 6 # revision-number
      ///     caps 1 04 == 4 # play status: 4=playing, 3=paused, 2=stopped
      ///     cash 1 01 == 1 # shuffle status: 0=off, 1=on
      ///     carp 1 00 == 0 # repeat status: 0=none, 1=single, 2=all
      ///     cavc 1 01 == 1 # volume controllable: 0=false, 1=true
      ///     caas 4 00000002 == 2 # available shuffle states, only seen '2'
      ///     caar 4 00000006 == 6 # available repeat states, only seen '6'
      ///     canp 16 00000026000052200000530200000f68 #4 ids: dbid, plid, playlistItem, itemid
      ///     cann 13 Secret Crowds # track
      ///     cana 17 Angels & Airwaves # artist
      ///     canl 8 I-Empire # album
      ///     cang 0 # genre
      ///     asai 8 a0d34e8b82616ae8 == 11588692627249261288 # album-id
      ///     cmmk 4 00000001 == 1 # MediaKind (1 = song)
      ///     cant 4 0003a15f == 237919 # remaining track time in ms
      ///     cast 4 0004a287 == 303751 # total track length in ms
      ///     cavs 1 01 == 1 # visualizer controllable: 0=false, 1=true
      ///     cafs 1 01 == 1 # fullscreen controllable: 0=false, 1=true
      ///     ceGS 1 01 == 1 # genius selectable: 0=false, 1=true
      var data = daap_encode({
        cmst: {
           mstt: 200 ,
           cmsr: 6 ,
           caps: 2 ,
           cash: 0 ,
           carp: 0 ,
           cafs: 0 ,
           cavs: 0 ,
           cavc: 1 ,
           caas: 2 ,
           caar: 6 ,
           cafe: 0 ,
           cave: 0 ,
           casu: 0 ,
           ceQu: 0 ,
        }
      });

      res.set({
        Date: new Date().toString(),
        "Content-Type": "application/x-dmap-tagged",
        "DAAP-Server": "daap.js/0.0",
      });
      res.send(data);
    });




  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

function checkIfArrayIsUnique(myArray) {
    return myArray.length === new Set(myArray).size;
}

function convertToNestedDict(arr) {
    const result = {};
  
    for (let i = 0; i < arr.length; i++) {
      const key = arr[i][0];
      let value = arr[i][1];

      if (Array.isArray(value)) {
        if (!checkIfArrayIsUnique(value.map((item) => item[0]))) {
            for (item in value) {
                console.log(value[item]);
                if (result[key] == undefined) {
                    result[key] = [];
                }
                result[key].push(convertToNestedDict([value[item]]));
            }
        } else {
          result[key] = convertToNestedDict(value);
        }
      } else if (typeof value === "object" && value !== null) {
        result[key] = convertToNestedDict(Object.entries(value)); // Recursively convert nested objects
      } else {
        result[key] = value;
      }
    }
  
    return result;
  }

  function convertToNestedArray(obj) {
    const result = [];
  
    for (const key in obj) {
      const value = obj[key];
  
      if (Array.isArray(value)) {
        if (!checkIfArrayIsUnique(value.map((value) => value[0]))) {
            let children = [];
            for (item in value) {
                children.push(convertToNestedArray(value[item])[0]);
            }
            result.push([key, children]);
        } else
          result.push([key, convertToNestedArray(value)]);
      } else if (typeof value === "object" && value !== null) {
        result.push([key, convertToNestedArray(value)]);
      } else {
        result.push([key, value]);
      }
    }
  
    return result;
  }

function daap_encode(obj) {
    let item = convertToNestedArray(obj)[0];
    if (item.constructor == Buffer) {
        label = '<binary>';
        buffer = item;
      } else {
        label = daap.tag(item);
        buffer = new Buffer(daap.encodedLength(item));
        daap.encode(item, buffer);
    }
    return buffer;
}

function daap_decode(buffer) {
    object = daap.decode(buffer);
    const nestedDict = convertToNestedDict([object]);
    return nestedDict;
}

module.exports = DACPServer;
