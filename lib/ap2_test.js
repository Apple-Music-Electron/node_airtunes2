const number = require('./homekit/number').default;
const varint = require('varint');
let u = number.UInt16toBufferBE(287);
console.log(Buffer.concat([u.slice(1), u.slice(0,1)]));
