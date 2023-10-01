const fetch = require("electron-fetch").default;

function CiderRPCCrawler() {
    this.active = false;
    this.nowplayingItem = [];
}

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
    } catch (_){}}  , 500)

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
    vol = vol > 100 ? vol / 100 : vol
    try {
        let ciderRPCReq1 = await fetch(
            "http://localhost:10769/audio" + vol
        );
    } catch (_){}
}


module.exports = CiderRPCCrawler;