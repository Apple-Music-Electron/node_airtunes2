const elliptic  = require('elliptic');
const crypto    = require('crypto');

const axlsign = require('axlsign');

const {
    hexString2ArrayBuffer,
    buf2hex
}               = require('./util');

// ...
// Note: All functions expect parameters to be hex strings.

function pair_setup_aes_key(K)
{
    return crypto.createHash('sha512')
        .update('Pair-Setup-AES-Key')
        .update(hexString2ArrayBuffer(K))
        .digest('hex')
        .substring(0, 32);
}

function pair_setup_aes_iv(K)
{
    let ab = crypto.createHash('sha512')
        .update('Pair-Setup-AES-IV')
        .update(hexString2ArrayBuffer(K))
        .digest()
        
    ab = ab.slice(0, 16);
    ab[ab.length - 1] += 0x01;

    return buf2hex(ab);
}

function pair_verify_aes_key(shared)
{
    return buf2hex(
        crypto.createHash('sha512')
            .update('Pair-Verify-AES-Key')
            .update(hexString2ArrayBuffer(shared))
            .digest()
            .slice(0, 16)
    );
}

function pair_verify_aes_iv(shared)
{
    return buf2hex(
        crypto.createHash('sha512')
            .update('Pair-Verify-AES-IV')
            .update(hexString2ArrayBuffer(shared))
            .digest()
            .slice(0, 16)
    );
}

// ...
// Public.

function a_pub(a)
{
    return elliptic.utils.toHex(new elliptic.eddsa('ed25519').keyFromSecret(a).getPublic());
}

function confirm(a, K)
{
    const key   = pair_setup_aes_key(K);
    const iv    = pair_setup_aes_iv(K); 

    const cipher = crypto.createCipheriv(
        'aes-128-gcm', 
        hexString2ArrayBuffer(key), 
        hexString2ArrayBuffer(iv)
    );

    let encrypted = cipher.update(hexString2ArrayBuffer(a_pub(a)), null, 'hex');
    encrypted += cipher.final('hex');
    
    return {
        epk: encrypted,
        authTag: buf2hex(cipher.getAuthTag())
    }
}

function verifier(a)
{
    const keyPair   = axlsign.generateKeyPair(crypto.randomBytes(32));
    const v_pri     = buf2hex(keyPair.private);
    const v_pub     = buf2hex(keyPair.public);
    
    const header    = Buffer.from([0x01, 0x00, 0x00, 0x00]);
    const a_pub_buf = Buffer.from(a_pub(a), 'hex');

    return {
        verifierBody: Buffer.concat(
            [header, keyPair.public, a_pub_buf],
            header.byteLength + keyPair.public.byteLength + a_pub_buf.byteLength
        ),
        v_pri,
        v_pub
    };
}

function shared(v_pri, atv_pub)
{
    return buf2hex(
        axlsign.sharedKey(
            hexString2ArrayBuffer(v_pri), 
            hexString2ArrayBuffer(atv_pub)
        )
    );
}

function signed(a, v_pub, atv_pub)
{
    const key = new elliptic.eddsa('ed25519').keyFromSecret(a);

    return key.sign(v_pub + atv_pub).toHex();
}

function signature(shared, atv_data, signed)
{
    const cipher = crypto.createCipheriv(
        'aes-128-ctr', 
        hexString2ArrayBuffer(pair_verify_aes_key(shared)), 
        hexString2ArrayBuffer(pair_verify_aes_iv(shared))
    );

    // discard the result of encrypting atv_data.
    cipher.update(hexString2ArrayBuffer(atv_data));
    
    let encrypted = cipher.update(Buffer.from(signed, 'hex'), null, 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

module.exports = {
    pair_setup_aes_key,
    pair_setup_aes_iv,
    pair_verify_aes_key,
    pair_verify_aes_iv,

    a_pub,
    confirm,
    verifier,
    shared,
    signed,
    signature
};