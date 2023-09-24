// Copyright 2010 Matthew Wood
//
// Licensed under the Apache License, Version 2.0

var characterEncoding = exports.characterEncoding = {
    utf8: 0,
    utf16: 1
  };
  
  var packVersion = exports.packVersion = function (version, buffer, index) {
    index = index || 0;
  
    packShort(version.major, buffer, index);
    packShort(version.minor, buffer, index + 2);
  
    return buffer;
  };
  
  var packDate = exports.packDate = function (n, buffer, index) {
    var date;
  
    if (typeof n == 'string') {
      date = new Date(n);
    } else {
      date = n;
    }
  
    return pack(Math.floor(date.getTime() / 1000), 4, buffer, index);
  };
  
  var packLong = exports.packLong = function (n, buffer, index) {
    return pack(n, 8, buffer, index);
  };
  
  exports.packInt = function (n, buffer, index) {
    return pack(n, 4, buffer, index);
  };
  
  var packShort = exports.packShort = function (n, buffer, index) {
    //buffer.writeUInt16LE(0xFFFF & n, index);
    return pack(n, 2, buffer, index);
  };
  
  exports.packByte = function (n, buffer, index) {
    return pack(n, 1, buffer, index);
    buffer.writeUInt8(n, index);
    return true;
  };
  
  var packString = exports.packString = function (string, buffer, index) {
    buffer = buffer || []; // shouldn't this fall back to a new buffer?
    index = index || 0;
    string = string || '';
  
    buffer.write(string, index);
    return buffer;
  };
  
  var unpackVersion = exports.unpackVersion = function (buffer, index) {
    index = index || 0;
  
    return {major: unpackShort(buffer, index),
      minor: unpackShort(buffer, index + 2)
    };
  };
  
  var unpackDate = exports.unpackDate = function(buffer, index) {
    var millis = unpack(buffer, index, 4) * 1000;
  
    return new Date(millis);
  };
  
  var unpackLong = exports.unpackLong = function (buffer, index) {
    return unpack(buffer, index, 8);
  };
  
  var unpackInt = exports.unpackInt = function (buffer, index) {
    return unpack(buffer, index, 4);
  };
  
  var unpackShort = exports.unpackShort = function (buffer, index) {
    return unpack(buffer, index, 2);
  };
  
  var unpackByte = exports.unpackByte = function (buffer, index) {
    return unpack(buffer, index, 1);
  };
  
  var unpackString = exports.unpackString = function (buffer, index, length, encoding) {
    var chars = [];
    if (encoding == characterEncoding.utf16) {
      _unpackUTF16String(chars, buffer, index, length);
    } else {
      _unpackUTF8String(chars, buffer, index, length);
    }
  
    return chars.join('');
  }
  
  function _unpackUTF16String(chars, buffer, index, length) {
    var hiByteOffset;
    var loByteOffset;
    var ptr = 0;
  
    if (buffer[index] == 0xFF && buffer[index+1] == 0xFE) {
      hiByteOffset = 1;
      loByteOffset = 0;
    } else {
      hiByteOffset = 0;
      loByteOffset = 1;
    }
  
    while(ptr < length) {
      var loByte = buffer[index + ptr + loByteOffset];
      var hiByte = buffer[index + ptr + hiByteOffset] << 8;
  
      chars.push(String.fromCharCode(loByte + hiByte));
  
      ptr += 2;
    }
  }
  
  function _unpackUTF8String(chars, buffer, index, length) {
    var ptr = 0;
    while (ptr < length) {
      var codePoint;
  
      var byte = buffer[index + ptr++];
      if (byte < 0x80) {
        codePoint = byte;
      } else {
        if (byte >= 240) {
          throw 'Codepoints > U+010000 not supported';
        } else {
          if (byte >= 224) {
            var hiByte = (byte & 15) << 12;
            var midByte = ((buffer[index + ptr++]) & 63) << 6;
            var loByte = (buffer[index + ptr++]) & 63;
  
            codePoint = hiByte + midByte + loByte;
          } else {
            if (byte >= 192) {
              var hiByte = (byte & 31) << 6;
              var loByte = (buffer[index + ptr++]) & 63;
  
              codePoint = hiByte + loByte;
            }
          }
        }
      }
  
      chars.push(String.fromCharCode(codePoint));
    }
  }
  
  function unpack(buffer, index, length) {
    index = index || 0;
    length = length || 0;
  
    var n = 0;
    var m = 1;
    for(var i = length - 1; i > -1; i--) {
      n += buffer[index + i] * m;
      m *= 256;
    }
  
    return n;
  }
  
  function pack(n, size, buffer, index) {
    buffer = buffer || [];
    index = index || 0;
  
    if (typeof n == 'string') {
      return packString(n.slice(0, size), buffer, index);
    }
  
    for (var i = 1; i <= size; i++) {
      buffer[index + size - i] = (n & 0xFF);
      n >>= 8;
    }
  
    return buffer;
  }