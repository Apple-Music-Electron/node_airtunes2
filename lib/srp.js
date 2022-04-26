const bigInt    = require('big-integer');
const sha1      = require('js-sha1');
const memoize   = require('lodash/memoize');

const { 
    hexString2ArrayBuffer
 }              = require('./util'); 

// ...

const groups = {
    1024: {
        N: new bigInt(
            'EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C' +
            '9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE4' +
            '8E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B29' +
            '7BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9A' +
            'FD5138FE8376435B9FC61D2FC0EB06E3', 16),

        g: new bigInt(2)
    },

    2048: {
        N: new bigInt(
            'AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC319294' +              
            '3DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310D' +
            'CD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FB' +
            'D5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF74' +
            '7359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A' +
            '436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D' +
            '5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E73' +
            '03CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB6' +
            '94B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F' +
            '9E4AFF73', 16),

        g: new bigInt(2)
    }
};

// ...

class SRP
{
    constructor(group)
    {
        this.group = group;

        this.N = groups[group].N;
        this.g = groups[group].g;

        this.A = memoize(this.A);
        this.K = memoize(this.K);
    }

    // ...
    // Private.

    u(A, B)
    {
        const A_buf = hexString2ArrayBuffer(A);
        const B_buf = hexString2ArrayBuffer(B);
    
        const result = new Uint8Array(A_buf.byteLength + B_buf.byteLength);
        result.set(A_buf);
        result.set(B_buf, A_buf.byteLength);
    
        return sha1(result);
    }

    k()
    {
        const padded_g = '0'.repeat((this.group / 4) - 1) + this.g.toString(16);
        
        const N_buf = hexString2ArrayBuffer(this.N.toString(16));
        const g_buf = hexString2ArrayBuffer(padded_g);

        const result = new Uint8Array(N_buf.byteLength + g_buf.byteLength);
        result.set(N_buf);
        result.set(g_buf, N_buf.byteLength);
    
        return sha1(result);
    }

    x(I, P, s) 
    {
        const s_buf     = hexString2ArrayBuffer(s.toLowerCase()); 
        const I_P_buf   = hexString2ArrayBuffer(sha1(I + ':' + P));
    
        const result = new Uint8Array(s_buf.byteLength + I_P_buf.byteLength);
        result.set(s_buf);
        result.set(I_P_buf, s_buf.byteLength);
    
        return sha1(result);
    };

    S(B, k, x, a, u)
    {
        B = new bigInt(B, 16);
        k = new bigInt(k, 16);
        x = new bigInt(x, 16);
        a = new bigInt(a, 16);
        u = new bigInt(u, 16);

        return B.add(this.N.multiply(k)).subtract(this.g.modPow(x, this.N).multiply(k)).mod(this.N)
            .modPow(a.add(u.multiply(x)), this.N)
            .toString(16);
    }

    // ...
    // Public.

    A(a)
    {
        return this.g.modPow(new bigInt(a, 16), this.N).toString(16);
    }

    K(I, P, s, a, B)
    {
        const k = this.k();
        const x = this.x(I, P, s);
        const u = this.u(this.A(a), B);
        const S = this.S(B, k, x, a, u);

        // ...

        const S_buf = hexString2ArrayBuffer(S);

        let hash1 = new Uint8Array(S_buf.byteLength + 4);
        hash1.set(S_buf);
        hash1.set([0x00, 0x00, 0x00, 0x00], S_buf.byteLength);

        let hash2 = new Uint8Array(S_buf.byteLength + 4);
        hash2.set(S_buf);
        hash2.set([0x00, 0x00, 0x00, 0x01], S_buf.byteLength);

        return sha1(hash1) + sha1(hash2);
    }

    M1(I, P, s, a, B)
    {
        // M1 = H( H(N) ^ H(g) | H(I) | s | PAD(A) | PAD(B) | K )
        const A = this.A(a);
        const K = this.K(I, P, s, a, B);
        
        const hN = new Uint8Array(sha1.arrayBuffer(hexString2ArrayBuffer(this.N.toString(16))));
        const hg = new Uint8Array(sha1.arrayBuffer([this.g.toString(16)]));

        const hN_hg = new Uint8Array(20);
        for (let i = 0; i < 20; i++)
        {
            hN_hg[i] = hN[i] ^ hg[i];
        }

        const hI = sha1.arrayBuffer(I);

        // ...

        return sha1.create()
            .update(hN_hg)
            .update(hI)
            .update(hexString2ArrayBuffer(s))
            .update(hexString2ArrayBuffer(A))
            .update(hexString2ArrayBuffer(B))
            .update(hexString2ArrayBuffer(K))
            .hex();
    }
}

// ...

module.exports = SRP;