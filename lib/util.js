const hexString2ArrayBuffer 
    = hexString => new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));

const buf2hex 
    = buffer => Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');

// ...

module.exports = {
    hexString2ArrayBuffer,
    buf2hex
};