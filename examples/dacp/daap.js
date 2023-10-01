/*
 *  DAAP response
 */

'use strict'

var util = require('util')

var _ = require('underscore')

var log


var tag2info = {
    miid: { desc: 'dmap.itemid',                          type: 5, field: 'id'     },
    minm: { desc: 'dmap.itemname',                        type: 9, field: 'title'  },
    mikd: { desc: 'dmap.itemkind',                        type: 1, field: 'kind'   },
    mper: { desc: 'dmap.persistentid',                    type: 7, field: 'id'     },
    mcon: { desc: 'dmap.container',                       type: 12 },
    mcti: { desc: 'dmap.containeritemid',                 type: 5, field: 'id'     },
    mpco: { desc: 'dmap.parentcontainerid',               type: 5  },
    mstt: { desc: 'dmap.status',                          type: 5  },
    msts: { desc: 'dmap.statusstring',                    type: 9  },
    mimc: { desc: 'dmap.itemcount',                       type: 5  },
    mctc: { desc: 'dmap.containercount',                  type: 5  },
    mrco: { desc: 'dmap.returnedcount',                   type: 5  },
    mtco: { desc: 'dmap.specifiedtotalcount',             type: 5  },
    mlcl: { desc: 'dmap.listing',                         type: 12 },
    mlit: { desc: 'dmap.listingitem',                     type: 12 },
    mbcl: { desc: 'dmap.bag',                             type: 12 },
    mdcl: { desc: 'dmap.dictionary',                      type: 12 },
    msrv: { desc: 'dmap.serverinforesponse',              type: 12 },
    msau: { desc: 'dmap.authenticationmethod',            type: 1  },
    msas: { desc: 'dmap.authenticationschemes',           type: 5  },
    mslr: { desc: 'dmap.loginrequired',                   type: 1  },
    mpro: { desc: 'dmap.protocolversion',                 type: 11 },
    msal: { desc: 'dmap.supportsautologout',              type: 1  },
    msup: { desc: 'dmap.supportsupdate',                  type: 1  },
    mspi: { desc: 'dmap.supportspersistentids',           type: 1  },
    msex: { desc: 'dmap.supportsextensions',              type: 1  },
    msbr: { desc: 'dmap.supportsbrowse',                  type: 1  },
    msqy: { desc: 'dmap.supportsquery',                   type: 1  },
    msix: { desc: 'dmap.supportsindex',                   type: 1  },
    msrs: { desc: 'dmap.supportsresolve',                 type: 1  },
    mstm: { desc: 'dmap.timeoutinterval',                 type: 5  },
    msdc: { desc: 'dmap.databasescount',                  type: 5  },
    mstc: { desc: 'dmap.utctime',                         type: 5  },
    msto: { desc: 'dmap.utcoffset',                       type: 5  },
    mlog: { desc: 'dmap.loginresponse',                   type: 12 },
    mlid: { desc: 'dmap.sessionid',                       type: 5  },
    mupd: { desc: 'dmap.updateresponse',                  type: 12 },
    musr: { desc: 'dmap.serverrevision',                  type: 5  },
    muty: { desc: 'dmap.updatetype',                      type: 1  },
    mudl: { desc: 'dmap.deletedid',                       type: 12 },
    mccr: { desc: 'dmap.contentcodesresponse',            type: 12 },
    mcnm: { desc: 'dmap.contentcodesnumber',              type: 5  },
    mcna: { desc: 'dmap.contentcodesname',                type: 9  },
    mcty: { desc: 'dmap.contentcodestype',                type: 3  },
    meds: { desc: 'dmap.editcommandssupported',           type: 5  },
    ated: { desc: 'daap.supportsextradata',               type: 3  },
    apro: { desc: 'daap.protocolversion',                 type: 11 },
    avdb: { desc: 'daap.serverdatabases',                 type: 12 },
    abro: { desc: 'daap.databasebrowse',                  type: 12 },
    adbs: { desc: 'daap.databasesongs',                   type: 12 },
    aply: { desc: 'daap.databaseplaylists',               type: 12 },
    apso: { desc: 'daap.playlistsongs',                   type: 12 },
    arsv: { desc: 'daap.resolve',                         type: 12 },
    arif: { desc: 'daap.resolveinfo',                     type: 12 },
    abal: { desc: 'daap.browsealbumlisting',              type: 12 },
    abar: { desc: 'daap.browseartistlisting',             type: 12 },
    abcp: { desc: 'daap.browsecomposerlisting',           type: 12 },
    abgn: { desc: 'daap.browsegenrelisting',              type: 12 },
    aePP: { desc: 'com.apple.itunes.is-podcast-playlist', type: 1  },
    asal: { desc: 'daap.songalbum',                       type: 9, field: 'album'  },
    asar: { desc: 'daap.songartist',                      type: 9, field: 'artist' },
    asbr: { desc: 'daap.songbitrate',                     type: 3  },
    ascm: { desc: 'daap.songcomment',                     type: 9  },
    asco: { desc: 'daap.songcompilation',                 type: 1  },
    ascp: { desc: 'daap.songcomposer',                    type: 9  },
    asda: { desc: 'daap.songdateadded',                   type: 10 },
    asdm: { desc: 'daap.songdatemodified',                type: 10 },
    asdc: { desc: 'daap.songdisccount',                   type: 3  },
    asdn: { desc: 'daap.songdiscnumber',                  type: 3  },
    aseq: { desc: 'daap.songeqpreset',                    type: 9  },
    asgn: { desc: 'daap.songgenre',                       type: 9, field: 'genre'  },
    asdt: { desc: 'daap.songdescription',                 type: 9  },
    asrv: { desc: 'daap.songrelativevolume',              type: 2  },
    assr: { desc: 'daap.songsamplerate',                  type: 5  },
    assz: { desc: 'daap.songsize',                        type: 5  },
    asst: { desc: 'daap.songstarttime',                   type: 5  },
    assp: { desc: 'daap.songstoptime',                    type: 5  },
    astm: { desc: 'daap.songtime',                        type: 5, field: 'time'   },
    astc: { desc: 'daap.songtrackcount',                  type: 3  },
    astn: { desc: 'daap.songtracknumber',                 type: 3, field: 'track'  },
    asur: { desc: 'daap.songuserrating',                  type: 1  },
    asyr: { desc: 'daap.songyear',                        type: 3, field: 'year'   },
    asfm: { desc: 'daap.songformat',                      type: 9, field: 'format' },
    asdb: { desc: 'daap.songdisabled',                    type: 1  },
    asdk: { desc: 'daap.songdatakind',                    type: 1  },
    asul: { desc: 'daap.songdataurl',                     type: 9  },
    asbt: { desc: 'daap.songbeatsperminute',              type: 3  },
    abpl: { desc: 'daap.baseplaylist',                    type: 1  },
    agrp: { desc: 'daap.songgrouping',                    type: 9  },
    ascd: { desc: 'daap.songcodectype',                   type: 5  },
    ascs: { desc: 'daap.songcodecsubtype',                type: 5  },
    apsm: { desc: 'daap.playlistshufflemode',             type: 1  },
    aprm: { desc: 'daap.playlistrepeatmode',              type: 1  },
    asct: { desc: 'daap.songcategory',                    type: 9  },
    ascn: { desc: 'daap.songcontentdescription',          type: 9  },
    aslc: { desc: 'daap.songlongcontentdescription',      type: 9  },
    asky: { desc: 'daap.songkeywords',                    type: 9  },
    ascr: { desc: 'daap.songcontentrating',               type: 1  },
    asgp: { desc: 'daap.songgapless',                     type: 1  },
    asdr: { desc: 'daap.songdatereleased',                type: 10 },
    asdp: { desc: 'daap.songdatepurchased',               type: 10 },
    ashp: { desc: 'daap.songhasbeenplayed',               type: 1  },
    assn: { desc: 'daap.sortname',                        type: 9  },
    assa: { desc: 'daap.sortartist',                      type: 9  },
    asse: { desc: 'daap.sortartist',                      type: 9  },
    assl: { desc: 'daap.sortalbumartist',                 type: 9  },
    assu: { desc: 'daap.sortalbum',                       type: 9  },
    assc: { desc: 'daap.sortcomposer',                    type: 9  },
    asss: { desc: 'daap.sortseriesname',                  type: 9  },
    asbk: { desc: 'daap.bookmarkable',                    type: 1  },
    asbo: { desc: 'daap.songbookmark',                    type: 5  },
    aspu: { desc: 'daap.songpodcasturl',                  type: 9  },
    asai: { desc: 'daap.songalbumid',                     type: 7  },
    asls: { desc: 'daap.songlongsize',                    type: 7  },
    asaa: { desc: 'daap.songalbumartist',                 type: 9  },
    aeSP: { desc: 'com.apple.itunes.smart-playlist',      type: 1  },
    caci: { desc: 'daap.controlint',                      type: 12 },
    cmik: { desc: 'dmcp.ik' ,                             type: 1  },
    cmsp: { desc: 'dmcp.sp',                              type: 1  },
    cmsv: { desc: 'dmcp.sv',                              type: 1  },
    cass: { desc: 'dacp.ss',                              type: 1  },
    casu: { desc: 'dacp.su',                              type: 1  },
    ceSG: { desc: 'dacp.sg',                              type: 1  },
    aeSV: { desc: 'com.apple.itunes.music-sharing-version',type : 11 },
    asgr: { desc: 'daap.supportsgroups',                  type: 3  } ,
    asse: { desc: '',                                     type: 7  },
    aeMQ: { desc: '',                                     type: 1  },
    aeFR: { desc: '',                                     type: 1  },
    aeTr: { desc: '',                                     type: 1  },
    aeSL: { desc: '',                                     type: 1  },
    aeFP: { desc: '',                                     type: 1  },
    aeSR: { desc: '',                                     type: 1  },
    ceVO: { desc: 'com.apple.itunes..voting-enabled',     type: 1  }, 
    msed: { desc: 'dmap.supportsedit',                    type: 1  },     
    msml: { desc: 'dmap.msml',                            type: 12  },
    msma: { desc:  'dmap.speakermachineaddress',          type: 7 },
    caov: { desc: '',                                     type: 1  },
    cmrl: { desc: '',                                     type: 1  },
    cmpr: { desc: '',                                     type: 5  },
    capr: { desc: '',                                     type: 5  },
    cmst: { desc: 'dmcp.musicstatus',                     type: 12  },
    cmst: { desc: 'dmcp.musicstatus',                     type: 12  },
    cmsr: { desc: 'dmcp.statusrevision',                  type: 5  },
    caps: { desc: 'dmcp.playingstatus',                   type: 1   },
    cash: { desc: 'dmcp.shuffle',                         type: 1   },
    carp: { desc: 'dmcp.repeatstatus' ,                   type: 1   },
    cavc: { desc: 'dmcp.volumecontrol',                   type: 1   },
    cafs: { desc: 'dmcp.repeatstatus' ,                   type: 1   },
    cavs: { desc: 'dmcp.volumecontrol',                   type: 1   },
    caas: { desc: '    ' ,                   type: 5  },
    caar: { desc: ' ',                   type: 5   },
    casp: { desc: ' ',                   type: 12   },
    cmgt: { desc: ' ',                   type: 12   },
    caia: { desc: ' ',                   type: 1  },
    cmvo: { desc: ' ',                   type: 5  },
    cave: { desc: ' ',                   type: 1  },
    cafe: { desc: ' ',                   type: 1  },
    ceQu: { desc: ' ',                   type: 1  },
}, desc2tag = {} 

var max = {
    byte1: Math.pow(2, 8)-1,
    byte2: Math.pow(2, 16)-1,
    byte4: Math.pow(2, 32)-1
}
var verTmpl = /([0-9]+)\.([0-9]+)(?:\.([0-9]+))?/
var conf


function init(_conf) {
    conf = defaults(_conf, {
        debug: false
    })

    log = logger.create({
        prefix: 'daap',
        level:  (conf.debug)? 'info': 'error'
    })

    for (var key in tag2info) desc2tag[tag2info[key].desc] = key
}


function number2(n) {
    var buf = new Buffer(2)
    n = Math.min(max.byte2, Math.max(0, n))
    buf.writeUInt16BE(n, 0)

    return buf
}


function number4(n) {
    var buf = new Buffer(4)
    n = Math.min(max.byte4, Math.max(0, n))
    buf.writeUInt32BE(n, 0)

    return buf
}


function size(n) {
    return number4(n)
}


function number8(n) {
    var buf = new Buffer(8)
    n = Math.min(max.byte4, Math.max(0, n))
    buf.writeUInt32BE(0, 0)
    buf.writeUInt32BE(n, 4)

    return buf
}


function byte(n) {
    var buf = new Buffer(1)
    n = +n
    n = Math.min(max.byte1, Math.max(0, n))
    buf.writeUInt8(n, 0)
    
    return buf
}


function date(d) {
    var buf = new Buffer(4)
    buf.writeUInt32BE(d.valueOf() / 1000, 0)

    return buf
}


function version(v) {
    var version = verTmpl.exec(v)
    var buf = new Buffer(4)

    version[1] = Math.min(max.byte2, Math.max(0, +version[1]))
    version[2] = Math.min(max.byte1, Math.max(0, +version[2]))
    version[3] = Math.min(max.byte1, Math.max(0, +version[3]))

    buf.writeUInt16BE(version[1], 0)
    buf.writeUInt8(version[2], 2)
    buf.writeUInt8(+version[3] || 0, 3)

    return buf
}


function chktype(key, val, type) {
    switch(type) {
        case 'byte':
            if (typeof val !== 'number' && typeof val !== 'boolean') {
                throw new Error('val('+val+') has invalid type('+(typeof val)+') for '+key+
                                '; should be '+type)
            }
            break
        case 'number':
        case 'string':
        case 'object':
            if (typeof val !== type) {
                throw new Error('val('+val+') has invalid type('+(typeof val)+') for '+key+
                                '; should be '+type)
            }
            break
        case 'date':
            if (val instanceof Date) {
                throw new Error('val('+val+') has invalid type('+(typeof val)+') for '+key+
                                '; should be '+type)
            }
            break
        case 'version':
            if (typeof val !== 'string' || !verTmpl.test(val)) {
                throw new Error('val('+val+') has invalid type('+(typeof val)+') for '+key+
                                '; should be '+type)
            }
            break
    }
}


function buffer(obj) {
    var key = Object.keys(obj)[0]
    var buf = new Buffer(key, 'utf-8')
    var val = obj[key]
    var top, nested

    if (!tag2info[key]) throw new Error('unknown key: '+key)
    console.log(tag2info[key])
    switch(tag2info[key].type) {
        case 1:    // char
            chktype(key, val, 'byte')
            buf = Buffer.concat([ buf, size(1), byte(val) ], buf.length+4+1)
            break
        case 3:    // 2-byte integer
            chktype(key, val, 'number')
            buf = Buffer.concat([ buf, size(2), number2(val) ], buf.length+4+2)
            break
        case 5:    // 4-byte integer
            chktype(key, val, 'number')
            buf = Buffer.concat([ buf, size(4), number4(val) ], buf.length+4+4)
            break
        case 7:    // 8-byte integer
            chktype(key, val, 'number')
            buf = Buffer.concat([ buf, size(8), number8(val) ], buf.length+4+8)
            break
        case 9:    // string
            chktype(key, val, 'string')
            val = new Buffer(val, 'utf-8')
            buf = Buffer.concat([ buf, size(val.length), val ], buf.length+4+val.length)
            break
        case 10:    // date (4-byte integer with seconds since 1970)
            chktype(key, val, 'date')
            buf = buffer.concat([ buf, size(4), date(val) ], buf.length+4+4)
            break
        case 11:    // version (2-bytes major version, minor version, patch level)
            chktype(key, val, 'version')
            buf = Buffer.concat([ buf, size(4), version(val) ], buf.length+4+4)
            break
        case 12:    // container
            chktype(key, val, 'object')
            if (!_.isArray(val)) {
                top = []
                for (var key in val) {
                    nested = {}
                    nested[key] = val[key]
                    top.push(nested)
                }
                val = top
            }
            top = new Buffer(0)
            for (var i = 0; i < val.length; i++) {
                nested = buffer(val[i])
                top = Buffer.concat([ top, nested ], top.length+nested.length)
            }
            buf = Buffer.concat([ buf, size(top.length), top ], buf.length+4+top.length)
            break
        default:
            throw new Error('unknown type: '+tag2info[key].type)
            break
    }

    return buf
}


function build(obj) {

    try {
        return buffer(obj)
    } catch(e) {
        log.error(e)
        return undefined
    }
}


function item(container, songs, query, update) {
    var obj = {}, mlit, key, mlcl
    var top = (container)? 'apso': 'adbs'

    obj[top] = [
        { mstt: 200 },
        { muty: !!update },
        { mtco: songs.length },
        { mrco: songs.length }
    ]

    mlcl = []
    for (var i = 0; i < songs.length; i++) {
        mlit = {}
        for (var j = 0; j < query.length; j++) {
            key = desc2tag[query[j]]
            if (tag2info[key] && tag2info[key].field) mlit[key] = songs[i][tag2info[key].field]
        }

        mlcl.push({
            mlit: mlit
        })
    }

    obj[top].push({ mlcl: mlcl })

    return obj
}


module.exports = {
    init: init,
    build: build,
    song: {
        item: function (songs, query, update) { return item(false, songs, query, update) }
    },
    container: {
        item: function (songs, query, update) { return item(true, songs, query, update) }
    }
}

// end of daap.js