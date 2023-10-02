const fetch = require("electron-fetch").default;
const util = require("util");
var events = require("events");
function CiderRPCCrawler() {
    this.active = false;
    this.nowplayingItem = [];
    this.volume = 0;
}

util.inherits(CiderRPCCrawler, events.EventEmitter);

CiderRPCCrawler.prototype.start = function () {
    setInterval(async () => {
        try {
            let ciderRPCReq1 = await fetch(
                "http://localhost:10769/currentPlayingSong"
            );
            let rpcJSON = await ciderRPCReq1.json();
            if (rpcJSON?.info != null) {
                this.nowplayingItem = rpcJSON?.info
            } else {
                this.nowplayingItem = null
            }
            this.emit("nowplayingItem", this.nowplayingItem)
        } catch (_){}
        this.getvol();
    }  , 500)

}

CiderRPCCrawler.prototype.playPause = async function () {
    try {
        let ciderRPCReq1 = await fetch(
            "http://localhost:10769/playPause"
        );
        let rpcJSON = await ciderRPCReq1.json();
        if (rpcJSON?.info != null) {
            this.nowplayingItem = rpcJSON?.info
        } 
    } catch (_){}
}

CiderRPCCrawler.prototype.pause = async function () {
    try {
        let ciderRPCReq1 = await fetch(
            "http://localhost:10769/pause"
        );
        let rpcJSON = await ciderRPCReq1.json();
        if (rpcJSON?.info != null) {
            this.nowplayingItem = rpcJSON?.info
        } 
    } catch (_){}
}

CiderRPCCrawler.prototype.next = async function () {
    try {
        let ciderRPCReq1 = await fetch(
            "http://localhost:10769/next"
        );
    } catch (_){}
}

CiderRPCCrawler.prototype.previous = async function () {
    try {
        let ciderRPCReq1 = await fetch(
            "http://localhost:10769/previous"
        );
    } catch (_){}
}

CiderRPCCrawler.prototype.setvol = async function (vol) {
    let volu = vol > 1 ? vol / 100 : vol
    try {
        let ciderRPCReq1 = await fetch(
            "http://localhost:10769/audio/" + volu
        );
    } catch (_){}
}

CiderRPCCrawler.prototype.getvol = async function () {
    try {
        let ciderRPCReq1 = await fetch(
            "http://localhost:10769/audio"
        );
        let vol = await ciderRPCReq1.text();
        this.volume = Math.round(parseFloat(vol) * 100)
        this.emit("volume", this.volume)
        return this.volume;
    } catch (_){
        return null;
    }
}


module.exports = CiderRPCCrawler;