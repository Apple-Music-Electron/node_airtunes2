// Copyright 2010 Matthew Wood
//
// Licensed under the Apache License, Version 2.0

var contentCodes = exports.contentCodes = require('./contentCodes');
var binary = require('./binary');

var encode = exports.encode = function (item, buffer, index) {
  buffer = buffer || [];
  index = index || 0;

  binary.packString(tag(item), buffer, index);
  binary.packInt(encodedValueLength(item), buffer, index + 4);
  packer(tag(item))(value(item), buffer, index + 8);

  return buffer;
};

var decode = exports.decode = function (buffer, index) {
  index = index || 0;

  var decodedTag = binary.unpackString(buffer, index, 4);
  
  return [
    decodedTag,
    unpacker(decodedTag)(buffer, index + 8, binary.unpackInt(buffer, index+4))
  ];
};

var tag = exports.tag = function (item) {
  return item[0];
}

function value(item) {
  return item[1];
}

function encodedLength(item) {
  return 8 + encodedValueLength(item);
}
exports.encodedLength = encodedLength;

function encodedValueLength(item) {
  switch (contentCodes.definition(tag(item)).type) {
    case contentCodes.type.long:
      return 8;
    case contentCodes.type.int:
      return 4;
    case contentCodes.type.short:
      return 2;
    case contentCodes.type.byte:
      return 1;
    case contentCodes.type.version:
      return 4;
    case contentCodes.type.date:
      return 4;
    case contentCodes.type.string:
      return Buffer.byteLength(value(item));
    case contentCodes.type.data:
        return Buffer.from(value(item), 'hex').byteLength;
    case contentCodes.type.list:
      return value(item).reduce(function(memo, child) {
        return memo + encodedLength(child);
      }, 0);
  }

  throw new TypeError('cannot calculate encoded value length for tag ' + tag(item));
}
//exports.encodedValueLength = encodedValueLength;

function packer(itemTag) {
  switch (contentCodes.definition(itemTag).type) {
    case contentCodes.type.long:
      return binary.packLong;
    case contentCodes.type.int:
      return binary.packInt;
    case contentCodes.type.short:
      return binary.packShort;
    case contentCodes.type.byte:
      return binary.packByte;
    case contentCodes.type.version:
      return binary.packVersion;
    case contentCodes.type.date:
      return binary.packDate;
    case contentCodes.type.string:
      return binary.packString;
    case contentCodes.type.data:
      return binary.packData;
    case contentCodes.type.list:
      return function(list, buffer, index) {
        var ptr = index;
        list.forEach(function(child) {        
          encode(child, buffer, ptr);
          ptr += encodedLength(child);
        });
      
        return buffer;
      };
  }

  throw new TypeError("Not sure how to pack '" + tag + "'");
}

function unpacker(itemTag) {
  switch (contentCodes.definition(itemTag).type) {
    case contentCodes.type.long:
      return binary.unpackLong;
    case contentCodes.type.int:
      return binary.unpackInt;
    case contentCodes.type.short:
      return binary.unpackShort;
    case contentCodes.type.byte:
      return binary.unpackByte;
    case contentCodes.type.version:
      return binary.unpackVersion;
    case contentCodes.type.date:
      return binary.unpackDate;
    case contentCodes.type.string:
      return binary.unpackString;
    case contentCodes.type.data:
      return binary.unpackData;
    case contentCodes.type.list:
      return function (buffer, index, length) {
        var children = new Array();

        var ptr = 0;
        while (ptr < length) {
          var childLength = binary.unpackInt(buffer, index + ptr + 4);  

          children.push(decode(buffer, index + ptr));
  
          ptr += 8 + childLength;
        }

        return children;
      };
  }

  throw new TypeError("Not sure how to unpack '" + tag + "'");
}

function unpackVersion(buffer, index) {
  return {major: unpack_short(buffer, index),
    minor: unpack_short(buffer, index + 2)
  };
}