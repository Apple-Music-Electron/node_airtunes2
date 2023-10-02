let daap = require("./dmap.js");
let daap2 = require("./daap.js");
let z =
  "636d67740000014b6d73747400000004000000c8636170730000000104636d766f000000040000003363617368000000010063616173000000040000000263617270000000010063616673000000010063617673000000010063617663000000010163616172000000040000000663616665000000010063617665000000010063616e700000001000002e64000000000000000000002ed863616e6e00000009537472616e6765727363616e610000000b4b656e796120477261636563616e6c00000012537472616e67657273202d2053696e676c6563616e670000000544616e6365617361690000000812c2cbcfd978d810636d6d6b000000040000000163617361000000040000000161656c73000000010061656c6200000001006173746d0000000400029fe063617363000000010163616b73000000010663616e7400000004000251bd63617374000000040002a3a4";

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


// let cc = require("./contentCodes.js");

// console.log(cc.getIdentifier("daap.baseplaylist"))