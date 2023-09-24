const DACPServer = require ('./lib.js');
var { WebSocket, WebSocketServer } = require('ws');
var ab2str = require('arraybuffer-to-string')
let dacp = new DACPServer();
let devices = [];

const wss = new WebSocketServer({ port: 9854 });
wss.on('error', console.error);

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      
      let parsed_data = JSON.parse(data);
        if (parsed_data.type == "addDevices"){
            dacp.connect(devices[parsed_data.id], parsed_data.code)
        }
    });
});




dacp.start();
setInterval(() => {
    //console.log(dacp.getAvailableRemotes());
    devices = dacp.getAvailableRemotes();
}, 5000); 