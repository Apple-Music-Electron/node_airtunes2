let daap = require("./dmap.js");
let z = ""

object = daap_decode(Buffer.from(z.toUpperCase(), 'hex'))

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
                console.log(value[item]);
                if (result[key] == undefined) {
                    result[key] = [];
                }
                result[key].push(convertToNestedDict([value[item]]));
            }
        } else {
          result[key] = convertToNestedDict(value);
        }
      } else if (typeof value === "object" && value !== null) {
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
        } else
          result.push([key, convertToNestedArray(value)]);
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
        label = '<binary>';
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


console.log(JSON.stringify(object));
console.log(JSON.stringify(daap.decode(Buffer.from(z.toUpperCase(), 'hex'))));
// console.log(JSON.stringify(convertToNestedArray(object)[0]));
// console.log(JSON.stringify(convertToKeyValuePairs(object)));
console.log(daap_encode(object));
console.log(JSON.stringify(daap_decode(daap_encode(object))));

// console.log(nestedDict);
// console.log(buffer);
// console.log(daap.decode(buffer));