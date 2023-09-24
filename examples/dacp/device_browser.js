const { Bonjour } = require('bonjour-service')
const mdns = require('mdns-js')

function DeviceDiscovery() {
  this.devices = [];
  this.service = new Bonjour();
  this.browser = null;
}

DeviceDiscovery.prototype.scan = function () {
  DeviceDiscovery.devices = [];
  this.browser = this.service.find({ type: 'touch-remote' });
  this.browser.on('up', (service) => {
        DeviceDiscovery.devices.push(service);
  });
  this.browser.on('down', (service) => {
        DeviceDiscovery.devices = DeviceDiscovery.devices.filter((item) => item.name != service.name);
  });
};

DeviceDiscovery.prototype.getDevices = function () {
    return DeviceDiscovery.devices;
};

DeviceDiscovery.prototype.broadcast = function (data) {
    var txt_record = {
        Ver:"131077",
        DvSv:'3265',
        DbId:'47975973649ECA7B',
        DvTy:'iTunes',
        OSsi:'0xD97F',
        txtvers:'1',
        CtlN:"Cider",
        iV:"196623"
    }

    // this.service.publish({ name: '47975973649ECA7B', type: 'touch-able', port: 3869, txt: txt_record })
    let server = mdns.createAdvertisement(mdns.tcp('touch-able'), 14243, { name: '47975973649ECA7B', txt: txt_record });
    server.start();
};


module.exports = DeviceDiscovery;
