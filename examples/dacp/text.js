let daap = require("./dmap.js");
let daap2 = require("./daap.js");
let z =
  "636d73740000015a6d73747400000004000000c8636d7372000000040000003c63617073000000010463617368000000010063617270000000010063616673000000010063617673000000010063617663000000010163616173000000040000000263616172000000040000000663616665000000010063617665000000010063616e70000000100000004800000000000000000000115b63616e6e0000000c49204472696e6b2057696e6563616e61000000054164656c6563616e6c00000002333063616e6700000003506f7061736169000000089110987889284f7d636d6d6b000000040000000161654773000000010163654753000000010163617361000000040000000361656c73000000010061656c6200000001006173746d000000040005bd6963617363000000010163616b73000000010663616e74000000040004cf1b63617374000000040005bd69636173750000000101636551750000000100";

object = daap_decode(Buffer.from(z.toUpperCase(), "hex"));

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
    } else if (
      typeof value === "object" &&
      !(value instanceof Date) &&
      value !== null
    ) {
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

function daap_encode2(obj) {
  let item = obj;
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

// console.log(JSON.stringify(object));
// console.log(JSON.stringify(daap.decode(Buffer.from(z.toUpperCase(), 'hex'))));
// console.log(JSON.stringify(convertToNestedArray(object)[0]));
// console.log(JSON.stringify(convertToKeyValuePairs(object)));
console.log(z);
console.log(JSON.stringify(daap.decode(Buffer.from(z.toUpperCase(), "hex"))));
console.log(
  daap_encode2(daap.decode(Buffer.from(z.toUpperCase(), "hex"))).toString("hex")
);

daap2.build({
  msrv: [
    [mstt, 200],
    [mpro, { major: 2, minor: 13 }],
    [minm, Cider],
    [apro, { major: 3, minor: 13 }],
    [aeSV, { major: 3, minor: 15 }],
    [ated, 483699],
    [asgr, 221555],
    [asse, 0],
    [aeMQ, 1],
    [mscu, 0],
    [aeFR, 1684104532],
    [aeTr, 1],
    [aeSL, 1],
    [aeSR, 1],
    [ppro, { major: 2, minor: 1 }],
    [msed, 1],
    [msml, 109],
    [mslr, 1],
    [mstm, 1800],
    [msal, 1],
    [msas, 3],
    [msup, 1],
    [mspi, 1],
    [msex, 1],
    [msbr, 1],
    [msqy, 1],
    [msix, 1],
    [msrs, 1],
    [msdc, 2],
    [mstc, Math.round((new Date()).getTime() / 1000)],
    [msto, 25200],
  ],
});
// console.log(JSON.stringify(daap_decode(daap_encode(object))));

// console.log(nestedDict);
// console.log(buffer);
// console.log(daap.decode(buffer));
