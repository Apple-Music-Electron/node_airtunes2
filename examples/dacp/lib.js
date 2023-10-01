const os = require("os");
var events = require("events");
const util = require("util");
const DeviceDiscovery = require("./device_browser");
const fetch = require("electron-fetch").default;
const crypto = require("crypto");
var daap = require("./dmap.js");
var CiderRPCCrawler = require("./ciderrpccrawler.js");
const express = require("express");

function DACPServer() {
  this.availableRemotes = [];
  this.connectedRemotes = [];
  this.browser = new DeviceDiscovery();
  this.rpc = new CiderRPCCrawler();
}
util.inherits(DACPServer, events.EventEmitter);

DACPServer.prototype.start = function () {
  this.browser.scan();
  this.startHTTPServer();
  this.browser.broadcast();
  this.rpc.start();
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
    fake_data = Buffer.from(
      "6d737276000001656d73747400000004000000c86d70726f000000040002000d6d696e6d0000000543696465726170726f000000040003000d61655356000000040003000f61746564000000020007617367720000000200036173736500000008000000000008000061654d5100000001016d73637500000008000000000000003f6165465200000001646165547200000001016165534c00000001016165535200000001017070726f00000004000200016d73656400000001016d736d6c000000206d736d610000000800005fbd055ed5e06d736d610000000800001571da7d1a006d736c7200000001016d73746d00000004000007086d73616c00000001016d73617300000001036d73757000000001016d73706900000001016d73657800000001016d73627200000001016d73717900000001016d73697800000001016d73727300000001016d73646300000004000000026d737463000000046519122b6d73746f0000000400006270",
      "hex"
    );
    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });

    res.send(fake_data);
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
    //console.log("[DACP] accept update");
    //http://daap.sourceforge.net/docs/server-info.html
    const rev_number = req.query["revision-number"];
    if (rev_number == 4) {
      console.log("huh");
      return;
    }
    var data = daap_encode({
      mupd: {
        mstt: 200,
        musr: 4,
      },
    });

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
        mstt: 200,
        muty: 0,
        mtco: 2,
        mrco: 2,
        mlcl: {
          mlit: {
            miid: 1,
            mper: 640516736,
            mdbk: 1,
            aeCs: 3,
            aeIM: 1236455424,
            minm: "Cider Library",
            mimc: 2320,
            mctc: 46,
            aeMk: 1,
            meds: 3,
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

  app.get("/databases/1/containers", (req, res) => {
    console.log("[DACP] send databases");
    //http://daap.sourceforge.net/docs/server-info.html
    var data = daap_encode({
      aply: {
        mstt: 200,
        muty: 0,
        mrco: 1,
        mtco: 1,
        mlcl: [
          {
            mlit: {
              miid: 6969,
              mper: 1343299584,
              minm: "Cider Library",
              abpl: 1,
              mpco: 0,
              meds: 0,
              mimc: 768,
            },
          },
          {
            mlit: {
              meds: 103,
              miid: 6969,
              minm: "Cider Playlist",
              mpco: 0,
              mper: 640516736,
            },
          },
        ],
      },
    });

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
        mstt: 200,
        mdcl: {
          minm: "Computer",
          msma: 0,
          caia: 1,
          cads: 1,
          cmvo: 51,
          cavd: 1,
          caiv: 1,
        },
      },
    });
    // var data = Buffer.from(
    //   "63617370000000ba6d73747400000004000000c86d64636c00000056636d766f00000004000000646361647300000004000000016d696e6d0000000b4d7920436f6d70757465726361696100000001016361766400000001016361697600000001016d736d610000000800000000000000006d64636c000000486d696e6d00000007426564726f6f6d6361647300000004000000016d736d6100000008000038420b9276c06361636400000009426f6f6b7368656c66636d766f0000000400000019",
    //   "hex"
    // );
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
      cmgt: { mstt: 200, cmvo: 51 },
    });

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });
    res.send(data);
  });

  app.get("/ctrl-int/1/playpause", (req, res) => {
    this.rpc.playPause();
    res.set({
      Date: new Date().toString(),
      "DAAP-Server": "daap.js/0.0",
    });
    res.status(204).send()
  });

  app.get("/ctrl-int/1/nextitem", (req, res) => {
    this.rpc.next();
    res.set({
      Date: new Date().toString(),
      "DAAP-Server": "daap.js/0.0",
    });
    res.status(204).send()
  });

  app.get("/ctrl-int/1/previtem", (req, res) => {
    this.rpc.previous();
    res.set({
      Date: new Date().toString(),
      "DAAP-Server": "daap.js/0.0",
    });
    res.status(204).send()
  });

  app.get('/ctrl-int/1/nowplayingartwork', async (req, res) => { 

    if (this.rpc.nowplayingItem?.artwork?.url)
    {
      res.set({
        Date: new Date().toString(),
        "Content-Type": "image/png",
        "DAAP-Server": "daap.js/0.0",
      });
      fetch(this.rpc.nowplayingItem?.artwork?.url.replace('{w}', 768).replace('{h}', 768))
      .then((res) => res.buffer())
      .then((buffer) => {
        res.send(buffer)
      })
      .catch((err) => {
        res.status(204).send()
      });
    } else {
      res.status(204).send()
    }
  });


  app.get("/ctrl-int/1/playstatusupdate", async (req, res) => {
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

    // get revision-number
    const rev_number = req.query["revision-number"];
    if (rev_number == 10) {
      return;
    }
    let data = Buffer.alloc(0);

    data = daap_encode2([
      "cmst",
      [
        ["mstt", 200],
        ["cmsr", 10],
        ["caps", 2],
        ["cash", 0],
        ["carp", 0],
        ["cafs", 0],
        ["cavs", 0],
        ["cavc", 1],
        ["caas", 2],
        ["caar", 6],
        ["cafe", 0],
        ["cave", 0],
        ["casu", 0],
        ["ceQu", 0],
      ],
    ]);

    // try {
      if (this.rpc.nowplayingItem != null) {
        data = daap_encode2([
          "cmst",
          [
            ["mstt", 200],
            ["cmsr", 60],
            ["caps", this.rpc.nowplayingItem.status == "playing" ? 4 : 3],
            ["cash", 0],
            ["carp", 0],
            ["cafs", 0],
            ["cavs", 0],
            ["cavc", 1],
            ["caas", 2],
            ["caar", 6],
            ["cafe", 0],
            ["cave", 0],
            ["canp", "0000004800000000000000000000115b"],
            ["cann", this.rpc.nowplayingItem?.name ?? ""],
            ["cana", this.rpc.nowplayingItem?.artistName ?? ""],
            ["canl", this.rpc.nowplayingItem?.albumName ?? ""],
            ["cang", this.rpc.nowplayingItem?.genreNames[0] ?? "Pop"],
            ["asai", "9110987889284f7d"],
            ["cmmk", 1],
            ["aeGs", 1],
            ["ceGS", 1],
            ["casa", 3],
            ["aels", 0],
            ["aelb", 0],
            ["astm", this.rpc.nowplayingItem.durationInMillis ?? 0],
            ["casc", 1],
            ["caks", 6],
            ["cant", Math.round((this.rpc.nowplayingItem.durationInMillis ?? 0) - (this.rpc.nowplayingItem.remainingTime ?? 0))],
            ["cast",this.rpc.nowplayingItem.durationInMillis ?? 0],
            ["casu", 1],
            ["ceQu", 0],
          ],
        ]);
      }
    // } catch (_) {}

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });
    res.send(data);
  });

  app.get("/databases/1/groups", (req, res) => {
    //GET /databases/1/groups?meta=dmap.itemname,dmap.itemid,dmap.persistentid,daap.songartist,daap.songyear,daap.songtracknumber,com.apple.itunes.cloud-id,daap.songartistid,daap.songalbumid,dmap.persistentid,daap.songtime,daap.songdatereleased,daap.songgenre,dmap.downloadstatus&type=music&group-type=albums&sort=album&include-sort-headers=0&query=('daap.songalbum:*Joji*'+'daap.songalbum!:'+('com.apple.itunes.extended-media-kind:1','com.apple.itunes.extended-media-kind:32'))&session-id=951632340
    // get query
    const query = req.query.query;
    const meta = req.query.meta;
    // query example : ('daap.songalbum:*Love*' 'daap.songalbum:*me*' 'daap.songalbum:*like*' 'com.apple.itunes.extended-media-kind:8' 'daap.songalbum:*you*' 'daap.songalbum:*do*')
    // get queried words (daap.songalbum) into 1 string

    let queryWords = "";
    try {
      queryWords = query
        .match(/daap\.songalbum:\*([^\*]*)\*/g)
        .map((item) =>
          item.replace(/daap\.songalbum:\*/g, "").replace(/\*/g, "")
        )
        .join(" ");
    } catch (_) {}

    // get media kind as
    const mediaKinds = query
      .match(/com\.apple\.itunes\.extended-media-kind:([0-9]*)/g)
      .map((item) =>
        item.replace(/com\.apple\.itunes\.extended-media-kind:/g, "")
      );

    var data = daap_encode({
      agal: {
        mstt: 200,
        muty: 0,
        mtco: 1,
        mrco: 1,
        mlcl: {
          mlit: {
            aeAK: "\u0000\u0000\u0000\u0002",
            miid: 562,
            mper: 10996525310630935000,
            minm: "Besidju (feat. Joji) - Single",
            asar: "Shamana",
            asyr: 2016,
            asgn: "Hip-Hop/Rap",
            astm: 107467,
            asdr: Date("2016-05-05T12:00:00.000Z"),
            asai: "a0d34e8b82616ae8",
            mgds: 3,
            mimc: 1,
          },
        },
      },
    });

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });

    if (mediaKinds.includes("1")) {
      res.send(data);
    } else {
      res.send(
        daap_encode({
          agal: {
            mstt: 200,
            muty: 0,
            mtco: 0,
            mrco: 0,
          },
        })
      );
    }
  });

  // GET /databases/1/items/4345/extra_data/artwork?mw=48&mh=48&session-id=951632340 HTTP/1.1

  app.get("/databases/1/:type/:itemid/extra_data/artwork", (req, res) => {
    const query = req.query.itemid;
    fake_image = "";

    res.set({
      Date: new Date().toString(),
      "Content-Type": "image/jpeg",
      "DAAP-Server": "daap.js/0.0",
    });
    res.send(Buffer.from(fake_image, "base64"));
  });

  app.get("/databases/1/containers/:containerid/items", (req, res) => {
    //GET /databases/1/groups?meta=dmap.itemname,dmap.itemid,dmap.persistentid,daap.songartist,daap.songyear,daap.songtracknumber,com.apple.itunes.cloud-id,daap.songartistid,daap.songalbumid,dmap.persistentid,daap.songtime,daap.songdatereleased,daap.songgenre,dmap.downloadstatus&type=music&group-type=albums&sort=album&include-sort-headers=0&query=('daap.songalbum:*Joji*'+'daap.songalbum!:'+('com.apple.itunes.extended-media-kind:1','com.apple.itunes.extended-media-kind:32'))&session-id=951632340
    // get query
    const query = req.query.query;
    const meta = req.query.meta;
    const containerid = req.params.containerid;
    // console.log(query);
    // console.log(meta);
    // console.log(containerid);

    // query example : ('dmap.itemname:*Joji*' ('com.apple.itunes.extended-media-kind:1','com.apple.itunes.extended-media-kind:32'))
    // get queried words (daap.songalbum) into 1 string
    // ('dmap.itemname:*L*' 'com.apple.itunes.extended-media-kind:2')

    // get media kind as
    let mediaKinds = [];
    try {
      mediaKinds = query
        .match(/com\.apple\.itunes\.extended-media-kind:([0-9]*)/g)
        .map((item) =>
          item.replace(/com\.apple\.itunes\.extended-media-kind:/g, "")
        );
    } catch (_) {}

    res.set({
      Date: new Date().toString(),
      "Content-Type": "application/x-dmap-tagged",
      "DAAP-Server": "daap.js/0.0",
    });

    if (mediaKinds.includes("1") & (containerid == 6969)) {
      let data = daap_encode({
        apso: {
          mstt: 200,
          muty: 0,
          mtco: 2,
          mrco: 2,
          mlcl: [
            {
              mlit: {
                mikd: 2,
                asal: "",
                asar: "",
                astm: 6306,
                astn: 0,
                asyr: 0,
                miid: 4345,
                minm: "Cider Audio Track #1",
                asdb: 0,
                mcti: 7948,
                aeHV: 6386529,
                asaa: "",
                aeMk: 1,
                mdst: 56714563,
                aeCd: 0,
              },
            },
            {
              mlit: {
                mikd: 2,
                asal: "",
                asar: "",
                astm: 202135,
                astn: 0,
                asyr: 0,
                miid: 4201,
                minm: "Cider Audio Track #2",
                asdb: 0,
                mcti: 7876,
                aeHV: 6386529,
                asaa: "",
                aeMk: 1,
                mdst: 56714563,
                aeCd: 0,
              },
            },
          ],
          mshl: {
            mlit: {
              mshc: 5270899,
              mshi: 0,
              mshn: 2,
            },
          },
        },
      });
      res.send(data);
    } else {
      res.send(
        daap_encode({
          apso: {
            mstt: 200,
            muty: 0,
            mtco: 0,
            mrco: 0,
          },
        })
      );
    }
  });

  // GET /databases/1/browse/artists?include-sort-headers=1&filter='daap.songartist:*Joji*'+'daap.songartist!:'+('com.apple.itunes.extended-media-kind:1','com.apple.itunes.extended-media-kind:32')&session-id=951632340

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
      } else result.push([key, convertToNestedArray(value)]);
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
    label = "<binary>";
    buffer = item;
  } else {
    label = daap.tag(item);
    buffer = new Buffer(daap.encodedLength(item));
    daap.encode(item, buffer);
  }
  return buffer;
}

function daap_encode2(item) {
  if (item.constructor == Buffer) {
    label = "<binary>";
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
