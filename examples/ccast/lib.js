const os = require("os");
var events = require("events");
const util = require("util");
const { resolve } = require("path");
const CiderReceiver = require("./castreceiver");
const DefaultMediaReceiver = require("castv2-client").DefaultMediaReceiver;

function Chromecast() {
  this.castDevices = [];
  this.scanCount = 0;
  this.activeConnections = {};
  this.connectedHosts = {};
  this.ciderPort = 0;
  this.audioClient = require("castv2-client").Client;
  this.metadata = {
    name: "",
    artistName: "",
    albumName: "",
    albumart: "",
  };
  
}
util.inherits(Chromecast, events.EventEmitter);

Chromecast.prototype.loadMedia = function (
  client,
  song,
  artist,
  album,
  albumart
) {
  // const u = 'http://' + this.getIp() + ':' + server.address().port + '/';
  //  const DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;
  client.launch(CiderReceiver, (err, player) => {
    if (err) {
      console.log(err);
      return;
    }
    let media = {
      // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
      contentId: "http://" + this.getIp() + ":" + this.ciderPort + "/listen",
      contentType: "audio/mpeg",
      streamType: "LIVE", // or LIVE

      // Title and cover displayed while buffering
      metadata: {
        type: 0,
        metadataType: 3,
        title: song ?? "",
        albumName: album ?? "",
        artist: artist ?? "",
        images: [{ url: albumart ?? "" }],
      },
    };

    player.on("status", (status) => {
      console.log("status broadcast playerState=%s", status);
      if (status && status.playerState && client.ready == false) {
        this.emit("device", client.host, "pair_success", status.playerState ?? "");
        this.emit("device", client.host, "ready", status.playerState);
        client.ready = true;
      } else {
        this.emit("device", client.host, status.playerState ?? "info", status.playerState ?? "");
      }
    });

    console.log('app "%s" launched, loading media %s ...', player, media);

    player.load(
      media,
      {
        autoplay: true,
      },
      (err, status) => {
        console.log("media loaded playerState=%s", status);
      }
    );

    client.getStatus((x, status) => {
      if (status && status.volume) {
        client.volume = status.volume.level;
        client.muted = status.volume.muted;
        client.stepInterval = status.volume.stepInterval;
      }
    });

    client.session = player;

    // send websocket ip

    //   player.sendIp("ws://" + this.getIp() + ":8090");
    //   electron.ipcMain.on("stopGCast", (_event) => {
    //     player.kill();
    //   });
    //   electron.app.on("before-quit", (_event) => {
    //     player.kill();
    //   });
  });
};

Chromecast.prototype.getIp = function () {
  let ip = "";
  let ip2 = [];
  let alias = 0;
  const ifaces = os.networkInterfaces();
  for (let dev in ifaces) {
    ifaces[dev].forEach((details) => {
      if (details.family === "IPv4" && !details.internal) {
        if (
          !/(loopback|vmware|internal|hamachi|vboxnet|virtualbox)/gi.test(
            dev + (alias ? ":" + alias : "")
          )
        ) {
          if (
            details.address.substring(0, 8) === "192.168." ||
            details.address.substring(0, 7) === "172.16." ||
            details.address.substring(0, 3) === "10."
          ) {
            if (
              !ip.startsWith("192.168.") ||
              (ip2.startsWith("192.168.") &&
                !ip.startsWith("192.168.") &&
                ip2.startsWith("172.16.") &&
                !ip.startsWith("192.168.") &&
                !ip.startsWith("172.16.")) ||
              (ip2.startsWith("10.") &&
                !ip.startsWith("192.168.") &&
                !ip.startsWith("172.16.") &&
                !ip.startsWith("10."))
            ) {
              ip = details.address;
            }
            ++alias;
          }
        }
      }
    });
  }
  return ip;
};

Chromecast.prototype.setAudioPort = function (port) {
  this.ciderPort = port;
};

Chromecast.prototype.stream = function (device, song, artist, album, albumart) {
  let castMode = "googlecast";
  let UPNPDesc = "";
  castMode = device.type ?? "";
  UPNPDesc = device.location ?? "";

  let client;
  if (castMode === "googlecast") {
    let client = new this.audioClient();
    client.stop;
    client.volume = 100;
    client.stepInterval = 0.5;
    client.muted = false;
    client.host = device.host;
    client.ready = false;

    client.connect(device.host, () => {
      // console.log('connected, launching app ...', 'http://' + this.getIp() + ':' + server.address().port + '/');
      if (!this.connectedHosts[device.host]) {
        this.connectedHosts[device.host] = client;
        this.activeConnections[device.host] = client;
      }
      this.loadMedia(client, song, artist, album, albumart);
    });

    client.on("close", () => {
      console.info("Client Closed");
      // for (let i = this.activeConnections.length - 1; i >= 0; i--) {
      //   if (this.activeConnections[i] === client) {
      //     this.activeConnections.splice(i, 1);
      //     return;
      //   }
      // }
      this.emit("device", client.host, "stopped",  "");
      if (this.activeConnections[device.host]) {
        try {
          this.activeConnections[device.host].session.kill();
        } catch (e) {}
        delete this.activeConnections[device.host];
      }
    });

    client.on("error", (err) => {
      console.log("Error: %s", err.message);
      client.close();
      delete this.connectedHosts[device.host];
    });
  } else {
    // upnp devices
    //   try {
    //     let client = new MediaRendererClient(UPNPDesc);
    //     const options = {
    //       autoplay: true,
    //       contentType: "audio/x-wav",
    //       dlnaFeatures: "DLNA.ORG_PN=-;DLNA.ORG_OP=01;DLNA.ORG_FLAGS=01700000000000000000000000000000",
    //       metadata: {
    //         title: "Cider",
    //         creator: "Streaming ...",
    //         type: "audio", // can be 'video', 'audio' or 'image'
    //         //  url: 'http://' + getIp() + ':' + server.address().port + '/',
    //         //  protocolInfo: 'DLNA.ORG_PN=MP3;DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000;
    //       },
    //     };
    //     client.load("http://" + this.getIp() + ":" + this.ciderPort + "/audio.wav", options, function (err, _result) {
    //       if (err) throw err;
    //       console.log("playing ...");
    //     });
    //     if (!this.connectedHosts[device.host]) {
    //       this.connectedHosts[device.host] = client;
    //       this.activeConnections.push(client);
    //     }
    //   } catch (e) {}
  }
};

Chromecast.prototype.setAudioPort = function (port) {
  this.ciderPort = port;
};

Chromecast.prototype.stop = function (host) {
  if (this.activeConnections[host]) {
    console.log(this.activeConnections[host].session);
    this.activeConnections[host].session.kill();
    delete this.activeConnections[host];
  }
  if (this.connectedHosts[host]) {
    delete this.connectedHosts[host];
  }
};

Chromecast.prototype.setVolume = function (host, volume) {
  if (this.activeConnections[host]) {
    this.activeConnections[host].session.setVolume(volume);
  }
  // if (this.connectedHosts[host]) {
  //   this.connectedHosts[host].volume = volume;
  // }
};

Chromecast.prototype.setTrackInfo = function (
  host,
  song,
  artist,
  album,
  artworkURL = null
) {

  if (this.metadata.name == song && this.metadata.artistName == artist && this.metadata.albumName == album && (this.metadata.albumart == artworkURL || artworkURL == null)) {
    
  } else {

  this.metadata = {
    name: song ?? "",
    artistName: artist ?? "",
    albumName: album ?? "",
    albumart: artworkURL ?? "",
  };
  console.log('setTrackInfoInt', this.metadata);
  if (host == "all") {
    for (const [key, value] of Object.entries(this.activeConnections)) {
      value.session.setMetadata(
        song,
        artist,
        album,
        artworkURL
      );
    }
  } else {
    if (this.activeConnections[host]) {
      this.activeConnections[host].session.setMetadata(
        song,
        artist,
        album,
        artworkURL
      );
    }
  }
  }
};

Chromecast.prototype.setArtwork = function (host, artworkURL) {
  if (artworkURL != this.metadata.albumart) {
    console.log('setArtworkInt', this.metadata);
    this.metadata.albumart = artworkURL;
    if (host == "all") {
      for (const [key, value] of Object.entries(this.activeConnections)) {
        value.session.setMetadata(
          '',' ','',''
        );
        value.session.setMetadata(
          this.metadata.name,
          this.metadata.artistName,
          this.metadata.albumName,
          this.metadata.albumart
        );
      }
    } else {
      
    if (this.activeConnections[host]) {
      this.activeConnections[host].session.setMetadata(
        '',' ','',''
      );
      this.activeConnections[host].session.setMetadata(
        this.metadata.name,
        this.metadata.artistName,
        this.metadata.albumName,
        this.metadata.albumart
      );
    }}
  }
};

Chromecast.prototype.stopAll = function () {
  for (const [key, value] of Object.entries(this.activeConnections)) {
    value.session.kill();
  }

  this.activeConnections = {};
  this.connectedHosts = {};
};

module.exports = Chromecast;
