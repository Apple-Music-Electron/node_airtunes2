"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chacha = require("chacha-js");
const crypto = require("crypto");
// i'd really prefer for this to be a direct call to
// Sodium.crypto_aead_chacha20poly1305_decrypt()
// but unfortunately the way it constructs the message to
// calculate the HMAC is not compatible with homekit
// (long story short, it uses [ AAD, AAD.length, CipherText, CipherText.length ]
// whereas homekit expects [ AAD, CipherText, AAD.length, CipherText.length ]
function verifyAndDecrypt(cipherText, mac, AAD, nonce, key) {
    try {
    if (nonce.byteLength == 8) nonce =  Buffer.concat([Buffer.from([0x00,0x00,0x00,0x00]),nonce]);
    var decipher = chacha.createDecipher(key, nonce);
    if (AAD != null) decipher.setAAD(AAD);// must be called before data
    decipher.setAuthTag(mac);
    return decipher.update(cipherText)}
    catch (e){
    return null;}
}

function encryptAndSeal(plainText, AAD, nonce, key) {
    if (nonce.byteLength == 8) nonce =  Buffer.concat([Buffer.from([0x00,0x00,0x00,0x00]),nonce]);
    var cipher = chacha.createCipher(key, nonce);
    if (AAD != null) cipher.setAAD(AAD);// must be called before data
    let cipherText = cipher.update(plainText)
    cipher.final();
    let hmac = cipher.getAuthTag();
    return [cipherText, hmac];
}
// function getPadding(buffer, blockSize) {
//     return buffer.length % blockSize === 0
//         ? Buffer.alloc(0)
//         : Buffer.alloc(blockSize - (buffer.length % blockSize));
// }
function HKDF(hashAlg, salt, ikm, info, size) {
    // create the hash alg to see if it exists and get its length
    var hash = crypto.createHash(hashAlg);
    var hashLength = hash.digest().length;
    // now we compute the PRK
    var hmac = crypto.createHmac(hashAlg, salt);
    hmac.update(ikm);
    var prk = hmac.digest();
    var prev = Buffer.alloc(0);
    var output;
    var buffers = [];
    var num_blocks = Math.ceil(size / hashLength);
    info = Buffer.from(info);
    for (var i = 0; i < num_blocks; i++) {
        var hmac = crypto.createHmac(hashAlg, prk);
        var input = Buffer.concat([
            prev,
            info,
            Buffer.from(String.fromCharCode(i + 1))
        ]);
        hmac.update(input);
        prev = hmac.digest();
        buffers.push(prev);
    }
    output = Buffer.concat(buffers, size);
    return output.slice(0, size);
}
exports.default = {
    encryptAndSeal,
    verifyAndDecrypt,
    HKDF
};
