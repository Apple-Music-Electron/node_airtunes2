"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("./encryption");
const number_1 = require("./number");
const struct = require('python-struct');
const crypto = require('crypto');
class Credentials {
    constructor(uniqueIdentifier, identifier, pairingId, publicKey, encryptionKey) {
        this.uniqueIdentifier = uniqueIdentifier;
        this.identifier = identifier;
        this.pairingId = pairingId;
        this.publicKey = publicKey;
        this.encryptionKey = encryptionKey;
        this.encryptCount = 0;
        this.decryptCount = 0;
    }
    /**
    * Parse a credentials string into a Credentials object.
    * @param text  The credentials string.
    * @returns A credentials object.
    */
    static parse(text) {
        let parts = text.split(':');
        return new Credentials(parts[0], Buffer.from(parts[1], 'hex'), Buffer.from(parts[2], 'hex').toString(), Buffer.from(parts[3], 'hex'), Buffer.from(parts[4], 'hex'));
    }
    /**
    * Returns a string representation of a Credentials object.
    * @returns A string representation of a Credentials object.
    */
    toString() {
        return this.uniqueIdentifier
            + ":"
            + this.identifier.toString('hex')
            + ":"
            + Buffer.from(this.pairingId).toString('hex')
            + ":"
            + this.publicKey.toString('hex')
            + ":"
            + this.encryptionKey.toString('hex');
    }
    encrypt(message) {
        let offset = 0
        let total = message.byteLength
        let result = Buffer.concat([])
        while (offset < total) {
            let length = Math.min(total - offset, 1024)
            let s1length_bytes = struct.pack("H", length)
            // let cipher = crypto.createCipheriv('chacha20-poly1305', this.writeKey, Buffer.concat([Buffer.from([0x00,0x00,0x00,0x00]),struct.pack("Q", this.decryptCount)]), { authTagLength: 16 });
            // cipher.setAAD(s1length_bytes);
            // let s1ct = cipher.update(message);
            // cipher.final();
            // let s1tag = encryption_1.default.computePoly1305(s1ct,s1length_bytes,Buffer.concat([Buffer.from([0x00,0x00,0x00,0x00]),struct.pack("Q", this.decryptCount)]),this.writeKey)
            let [s1ct , s1tag] = encryption_1.default.encryptAndSeal(message.slice(offset,offset+length),s1length_bytes,Buffer.concat([Buffer.from([0x00,0x00,0x00,0x00]),struct.pack("Q", this.encryptCount)]),this.writeKey)
            
            let ciphertext = Buffer.concat([s1length_bytes,s1ct,s1tag])
            offset += length
            this.encryptCount += 1
            result = Buffer.concat([result,ciphertext]) 
        }
        return result;
    }
    decrypt(message) {
            let offset = 0
            let result = Buffer.concat([])
            while (offset < message.byteLength) {
                let lengthbytes = message.slice(offset, offset+ 2)
                let length = struct.unpack("H", lengthbytes)
                let messagea = message.slice(offset + 2, offset + 2 + length[0] + 16)
                let cipherText = messagea.slice(0, -16);
                let hmac = messagea.slice(-16);
                let decrypted = encryption_1.default.verifyAndDecrypt(cipherText,hmac,lengthbytes,Buffer.concat([Buffer.from([0x00,0x00,0x00,0x00]),struct.pack("Q", this.decryptCount)]),this.readKey)
                this.decryptCount += 1
                offset = offset + length[0] + 16 + 2
                result = Buffer.concat([result,decrypted])
            }    
        return result;
    }
    encryptAudio(message, aad, nonce) {
        return Buffer.concat([Buffer.concat(encryption_1.default.encryptAndSeal(message,aad,struct.pack("Q", nonce),this.writeKey)),Buffer.from(struct.pack("Q", nonce))])
    }    
}
exports.Credentials = Credentials;
