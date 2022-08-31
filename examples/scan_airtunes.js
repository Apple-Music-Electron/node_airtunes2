const mdns = require('mdns-js');

const browser = mdns.createBrowser(mdns.tcp('raop'));
browser.on('serviceUp', service => {
  console.log(
    `${service.name} ${service.host}:${service.port} ${service.addresses} `
  );
});
browser.start();

setTimeout(() => {browser.stop()},300);
