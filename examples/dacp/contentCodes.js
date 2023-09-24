// Copyright 2010 Matthew Wood
//
// Licensed under the Apache License, Version 2.0

var type = (exports.type = {
  byte: 1, // 1 byte   num
  signed_byte: 2,
  short: 3, // 2 byte   num
  signed_short: 4,
  int: 5, // 4 byte   num
  signed_int: 6,
  long: 7, // 8 byte   num
  signed_long: 8,
  string: 9, //   ?      string
  date: 10, // 4 byte   date
  version: 11, // 4 byte   version number
  list: 12, //   ?
  unknown: 13, // -- --- ---- --- --
  unknown_byte: 14, // 1 byte   num
  unknown_short: 16, // 2 byte   num
  unknown_int: 18, // 4 byte   num
  unknown_long: 20, // 8 byte   num
  unknown_string: 22, //   ?      string
  unknown_date: 23, // 4 byte   date
  unknown_version: 24, // 4 byte   version number
  unknown_list: 25, //   ?
});

exports.getAllTags = function () {
  return Object.keys(contentCodes);
};

exports.definition = function (tag) {
  var defn = contentCodes[tag];

  if (defn) {
    return defn;
  }

  throw new TypeError("Attempt to lookup unknown tag '" + tag + "'");
};

exports.lookUp = function (tag) {
  return contentCodes[tag];
};

var contentCodes = {};

// ------------------------------  DAAP ATTRIBUTES -----------------------------
contentCodes["abal"] = { type: type.list, name: "daap.browsealbumlistung" };
contentCodes["abar"] = { type: type.list, name: "daap.browseartistlisting" };
contentCodes["abcp"] = { type: type.list, name: "daap.browsecomposerlisting" };
contentCodes["abgn"] = { type: type.list, name: "daap.browsegenrelisting" };
contentCodes["abpl"] = { type: type.byte, name: "daap.baseplaylist" };
contentCodes["abro"] = { type: type.list, name: "daap.databasebrowse" };
contentCodes["adbs"] = { type: type.list, name: "daap.databasesongs" };

contentCodes["aply"] = { type: type.list, name: "daap.databaseplaylists" };
contentCodes["apro"] = { type: type.version, name: "daap.protocolversion" };
contentCodes["apso"] = { type: type.list, name: "daap.playlistsongs" };
contentCodes["arsv"] = { type: type.list, name: "daap.resolve" };
contentCodes["arif"] = { type: type.list, name: "daap.resolveinfo" };

// -- -- -- -- -- -- -- Song related stuff -- -- -- -- -- -- -- -- -- -- -- --
/*
  unknown_byte: 14,     // 1 byte   num
    unknown_short: 16,    // 2 byte   num
    unknown_int: 18,      // 4 byte   num
    unknown_long: 20,     // 8 byte   num
    unknown_string: 22,   //   ?      string
    unknown_date: 23,     // 4 byte   date
    unknown_version: 24,  // 4 byte   version number
    unknown_list: 25,     //   ?    
  */
contentCodes["asal"] = { type: type.string, name: "daap.songalbum" };
contentCodes["asar"] = { type: type.string, name: "daap.songartist" };
contentCodes["asbr"] = { type: type.short, name: "daap.songbitrate" };
contentCodes["asbt"] = { type: type.short, name: "daap.songsbeatsperminute" };
contentCodes["ascm"] = { type: type.string, name: "daap.songcomment" };
contentCodes["asco"] = { type: type.byte, name: "daap.songcompilation" };
contentCodes["ascp"] = { type: type.string, name: "daap.songcomposer" };
contentCodes["aseq"] = { type: type.string, name: "daap.songeqpreset" };
contentCodes["asfm"] = { type: type.string, name: "daap.songformat" };
contentCodes["asgn"] = { type: type.string, name: "daap.songgenre" };

contentCodes["asda"] = { type: type.date, name: "daap.songdataurl" };
contentCodes["asdc"] = { type: type.short, name: "daap.songdisccount" };
contentCodes["asdt"] = { type: type.string, name: "daap.songdescription" };
contentCodes["asdb"] = { type: type.byte, name: "daap.songdisabled" };
contentCodes["asdm"] = { type: type.date, name: "daap.songdatemodified" };
contentCodes["asda"] = { type: type.date, name: "daap.songdateadded" };
contentCodes["asdn"] = { type: type.short, name: "daap.songdiscnumber" };
contentCodes["asdk"] = { type: type.byte, name: "daap.songdatakind" };

contentCodes["asrv"] = { type: type.byte, name: "daap.songrelativevolume" };
contentCodes["asst"] = { type: type.int, name: "daap.songstarttime" };
contentCodes["assr"] = { type: type.int, name: "daap.songsamplerate" };
contentCodes["assz"] = { type: type.int, name: "daap.songsize" };
contentCodes["astm"] = { type: type.int, name: "daap.songtime" };
contentCodes["asur"] = { type: type.byte, name: "daap.songuserrating" };
contentCodes["asul"] = { type: type.string, name: "daap.songdataurl" };
contentCodes["assp"] = { type: type.int, name: "daap.songstoptime" };
contentCodes["astc"] = { type: type.short, name: "daap.songtrackcount" };
contentCodes["astn"] = { type: type.short, name: "daap.songtracknumber" };
contentCodes["asyr"] = { type: type.short, name: "daap.songyear" };

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

contentCodes["ated"] = { type: type.int, name: "daap.supportsextradata" };
contentCodes["avdb"] = { type: type.list, name: "daap.serverdatabases" };

// ---------------------------  EXTENDED ATTRIBUTES ---------------------------

contentCodes["aeNV"] = { type: type.int, name: "com.apple.itunes.norm-volume" };
contentCodes["aeSP"] = {
  type: type.byte,
  name: "com.apple.itunes.smart-playlist",
};
contentCodes["aeSV"] = {
  type: type.version,
  name: "com.apple.itunes.sharingversion",
};

// ------------------------------  DMAP ATTRIBUTES -----------------------------
/*
  unknown_byte: 14,     // 1 byte   num
    unknown_short: 16,    // 2 byte   num
    unknown_int: 18,      // 4 byte   num
    unknown_long: 20,     // 8 byte   num
    unknown_string: 22,   //   ?      string
    unknown_date: 23,     // 4 byte   date
    unknown_version: 24,  // 4 byte   version number
    unknown_list: 25,     //   ?    
  */
contentCodes["mbcl"] = { type: type.list, name: "dmap.bag" };
contentCodes["mccr"] = { type: type.list, name: "dmap.contentcodesresponse" };
contentCodes["mcna"] = { type: type.string, name: "dmap.contentcodesname" };
contentCodes["mcnm"] = { type: type.string, name: "dmap.contentcodesnumber" };
contentCodes["mcon"] = { type: type.list, name: "dmap.container" };
contentCodes["mctc"] = { type: type.int, name: "dmap.containercount" };
contentCodes["mcti"] = { type: type.int, name: "dmap.containeritemid" };
contentCodes["mcty"] = { type: type.short, name: "dmap.contentcodestype" };
contentCodes["mdcl"] = { type: type.list, name: "dmap.dictionary" };
contentCodes["miid"] = { type: type.int, name: "dmap.itemid" };
contentCodes["mikd"] = { type: type.byte, name: "dmap.itemkind" };
contentCodes["mimc"] = { type: type.int, name: "dmap.itemcount" };
contentCodes["minm"] = { type: type.string, name: "dmap.itemname" };

contentCodes["mlcl"] = { type: type.list, name: "dmap.listing" };
contentCodes["mlid"] = { type: type.int, name: "dmap.sessionid" };
contentCodes["mlit"] = { type: type.list, name: "dmap.listingitem" };
contentCodes["mlog"] = { type: type.list, name: "dmap.loginresponse" };
contentCodes["mper"] = { type: type.long, name: "dmap.persistentid" };
contentCodes["mpco"] = { type: type.int, name: "dmap.parentcontainerid" };
contentCodes["mpro"] = { type: type.version, name: "dmap.protocolversion" };
contentCodes["mrco"] = { type: type.int, name: "dmap.returnedcount" };

contentCodes["msal"] = { type: type.byte, name: "dmap.supportsuatologout" };
contentCodes["msau"] = { type: type.byte, name: "dmap.authenticationmethod" };
contentCodes["msbr"] = { type: type.byte, name: "dmap.supportsbrowse" };
contentCodes["msdc"] = { type: type.int, name: "dmap.databasescount" };
contentCodes["msex"] = { type: type.byte, name: "dmap.supportsextensions" };
contentCodes["msix"] = { type: type.byte, name: "dmap.supportsindex" };
contentCodes["mslr"] = { type: type.byte, name: "dmap.loginrequired" };

contentCodes["mspi"] = { type: type.byte, name: "dmap.supportspersistentids" };
contentCodes["msqy"] = { type: type.byte, name: "dmap.supportsquery" };
contentCodes["msrs"] = { type: type.byte, name: "dmap.supportsresolve" };
contentCodes["msrv"] = { type: type.list, name: "dmap.serverinforesponse" };
contentCodes["mstm"] = { type: type.int, name: "dmap.timeoutinterval" };
contentCodes["msts"] = { type: type.string, name: "dmap.statusstring" };
contentCodes["mstt"] = { type: type.int, name: "dmap.status" };

contentCodes["msup"] = { type: type.byte, name: "dmap.supportsupdate" };
contentCodes["msur"] = { type: type.int, name: "dmap.serverrevision" };
contentCodes["mtco"] = { type: type.int, name: "dmap.specifiedtotalcount" };
contentCodes["mudl"] = { type: type.list, name: "dmap.deletedidlisting" };
contentCodes["mupd"] = { type: type.list, name: "dmap.updateresponse" };
contentCodes["musr"] = { type: type.int, name: "dmap.serverrevision" };
contentCodes["muty"] = { type: type.byte, name: "dmap.updatetype" };

// ---------------------------  UNKNOWN BUT USED ATTRIBUTES ---------------------------
/*
  unknown_byte: 14,     // 1 byte   num
    unknown_short: 16,    // 2 byte   num
    unknown_int: 18,      // 4 byte   num
    unknown_long: 20,     // 8 byte   num
    unknown_string: 22,   //   ?      string
    unknown_date: 23,     // 4 byte   date
    unknown_version: 24,  // 4 byte   version number
    unknown_list: 25,     //   ?    
  */

// skip unknowns for now

//   contentCodes['aePS'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeSE'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeDV'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeDP'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeDR'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeND'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeK1'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeK2'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeXD'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeMX'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeCS'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
contentCodes["aeMQ"] = { type: type.byte, name: "aeMQ" };
contentCodes["aeFR"] = { type: type.byte, name: "com.apple.itunes.unknown" };
contentCodes["aeTr"] = { type: type.byte, name: "com.apple.itunes.unknown" };
contentCodes["aeSL"] = { type: type.byte, name: "com.apple.itunes.unknown" };
contentCodes["aeSR"] = { type: type.byte, name: "com.apple.itunes.unknown" };
contentCodes["aeFP"] = { type: type.byte, name: "com.apple.itunes.unknown" };
contentCodes["aeSX"] = { type: type.int, name: "com.apple.itunes.unknown" };
//   contentCodes['aeCs'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeMk'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aePC'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeHV'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeMK'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeSN'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeNN'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeEN'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeES'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeSU'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeGH'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeGD'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeGU'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeGR'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeGE'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeCR'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeSG'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
//   contentCodes['aeGs'] = {type: type.unknown, name: 'com.apple.itunes.unknown'};
   contentCodes['aePS'] = {type: type.int, name: 'com.apple.itunes.special-playlist'};

/*
  unknown_byte: 14,     // 1 byte   num
    unknown_short: 16,    // 2 byte   num
    unknown_int: 18,      // 4 byte   num
    unknown_long: 20,     // 8 byte   num
    unknown_string: 22,   //   ?      string
    unknown_date: 23,     // 4 byte   date
    unknown_version: 24,  // 4 byte   version number
    unknown_list: 25,     //   ?    
  */

//   contentCodes['agrp'] = {type: type.unknown, name: 'daap.unknown'};
contentCodes["asgr"] = {
  type: type.int,
  name: "com.apple.itunes.gapless-resy",
};
contentCodes["asse"] = { type: type.int, name: "daap.unknown" };
//   contentCodes['ascd'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['ascs'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asct'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['ascn'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['ascr'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asaa'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asgp'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['ased'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['ashp'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['assn'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['assa'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['assl'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['assu'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['assc'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asss'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asbk'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['aspu'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asai'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asls'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['aspc'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asri'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['aspl'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['askp'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asac'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['askd'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['ases'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asrs'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['aslr'] = {type: type.unknown, name: 'daap.unknown'};
//   contentCodes['asas'] = {type: type.unknown, name: 'daap.unknown'};

//   contentCodes['mdbk'] = {type: type.unknown, name: 'dmap.unknown'};
contentCodes["mscu"] = { type: type.int, name: "mscu" };
//   contentCodes['mdst'] = {type: type.unknown, name: 'dmap.unknown'};
//   contentCodes['meds'] = {type: type.unknown, name: 'dmap.unknown'};
contentCodes["msed"] = { type: type.byte, name: "dmap.supportsedit" };
contentCodes["msml"] = { type: type.byte, name: "dmap.speakermachinelist" };
contentCodes["msas"] = { type: type.byte, name: "dmap.authenticationschemes" };
contentCodes["mstc"] = { type: type.int, name: "dmap.utctime" };
contentCodes["msto"] = { type: type.int, name: "dmap.utcoffset" };

contentCodes["ppro"] = { type: type.version, name: "dpap.protocolversion" };

contentCodes["cmpg"] = { type: type.int, name: "dacp.pairingguid" };
contentCodes["cmnm"] = { type: type.string, name: "dacp.devicename" };
contentCodes["cmty"] = { type: type.string, name: "dacp.devicetype" };
contentCodes["cmpa"] = { type: type.list, name: "dacp.pairinganswer" };
contentCodes["caci"] = { type: type.list, name: "dacp.caci" };
contentCodes["cmik"] = { type: type.byte, name: "dmcp.cmik" };
contentCodes["cmsb"] = { type: type.int, name: "dmcp.cmsb" };
contentCodes["cmsc"] = { type: type.int, name: "dmcp.cmsc" };
contentCodes["cmst"] = { type: type.list, name: "dmcp.playstatus" };
contentCodes["cmsr"] = { type: type.int, name: "dmcp.serverrevision" };
contentCodes["cmpr"] = { type: type.version, name: "dmcp.protocolversion" };
contentCodes["capr"] = { type: type.version, name: "dacp.protocolversion" };
contentCodes["caps"] = { type: type.byte, name: "dacp.playerstate" };
contentCodes["cash"] = { type: type.byte, name: "dacp.shufflestate" };
contentCodes["cmsp"] = { type: type.byte, name: "dmcp.cmsp" };
contentCodes["cmsv"] = { type: type.byte, name: "dmcp.cmsv" };
contentCodes["cass"] = { type: type.byte, name: "dacp.cass" };
contentCodes["caov"] = { type: type.byte, name: "dacp.caov" };
contentCodes["casu"] = { type: type.byte, name: "dacp.su" };
contentCodes["ceSG"] = { type: type.byte, name: "dacp.sg" };
contentCodes["cmrl"] = { type: type.byte, name: "dmcp.loginrequired" };
contentCodes["ceSX"] = { type: type.byte, name: "dmcp.ceSX" };
contentCodes["mdbk"] = { type: type.int, name: "dmap.databasekind" };
contentCodes["aeCs"] = { type: type.int, name: "com.apple.itunes.artworkchecksum" };
contentCodes["aeIM"] = { type: type.long, name: "com.apple.itunes.artworkchecksum" };
contentCodes["aeMK"] = { type: type.int, name: "com.apple.itunes.mediakind" };
contentCodes["aeMk"] = { type: type.int, name: "com.apple.itunes.extended-media-kind" };
contentCodes["meds"] = { type: type.int, name: "dmap.editcommandssupported" };
contentCodes["carp"] = { type: type.byte, name: "dacp.repeatstate" };
contentCodes["cafs"] = { type: type.byte, name: "dacp.fullscreen" };
contentCodes["cavs"] = { type: type.byte, name: "dacp.visualiser" };
contentCodes["cavc"] = { type: type.byte, name: "dacp.volumecontrollable" };
contentCodes["caas"] = { type: type.int, name: "dacp.albumshuffle" };
contentCodes["caar"] = { type: type.int, name: "dacp.albumrepeat" };
contentCodes["cafe"] = { type: type.byte, name: "dacp.fullscreenenabled" };
contentCodes["cave"] = { type: type.byte, name: "dacp.dacpvisualizerenabled" };
contentCodes["ceQu"] = { type: type.byte, name: "ceQu" };
contentCodes["casp"] = { type: type.list, name: "dacp.speakers" };
contentCodes["msma"] = { type: type.int, name: "dacp.machineaddress" };
contentCodes["cmgt"] = { type: type.list, name: "dmcp.getpropertyresponse" };
contentCodes["cmvo"] = { type: type.int, name: "dmcp.volume" };
contentCodes["caia"] = { type: type.int, name: "dmcp.isactive" };


// {"code": "aeMK", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.mediakind"},
// {"code": "aeMX", "type": field_types.DMAP_STR, "name": "com.apple.itunes.movie-info-xml"},
// {"code": "aeMk", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.extended-media-kind"},
// {"code": "aeND", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.non-drm-user-id"},
// {"code": "aeNN", "type": field_types.DMAP_STR, "name": "com.apple.itunes.network-name"},
// "caov": DmapTag(read_uint, "unknown tag"),
// "capl": DmapTag(read_bytes, "unknown tag"),
// "casa": DmapTag(read_uint, "unknown tag"),
// "casc": DmapTag(read_uint, "unknown tag"),
// "cass": DmapTag(read_uint, "unknown tag"),
// "caar": DmapTag(read_uint, "dacp.albumrepeat"),
// "caas": DmapTag(read_uint, "dacp.albumshuffle"),
// "caci": DmapTag("container", "dacp.controlint"),
// "cafe": DmapTag(read_bool, "dacp.fullscreenenabled"),
// "cafs": DmapTag(read_uint, "dacp.fullscreen"),
// "cana": DmapTag(read_str, "daap.nowplayingartist"),
// "cang": DmapTag(read_str, "dacp.nowplayinggenre"),
// "canl": DmapTag(read_str, "daap.nowplayingalbum"),
// "cann": DmapTag(read_str, "daap.nowplayingtrack"),
// "canp": DmapTag(read_bytes, "daap.nowplayingid"),
// "cant": DmapTag(read_uint, "dacp.remainingtime"),
// "capr": DmapTag(read_uint, "dacp.protocolversion"),
// "caps": DmapTag(read_uint, "dacp.playstatus"),
// "carp": DmapTag(read_uint, "dacp.repeatstate"),
// "cash": DmapTag(read_uint, "dacp.shufflestate"),
// "cast": DmapTag(read_uint, "dacp.tracklength"),
// "casu": DmapTag(read_uint, "dacp.su"),
// "cavc": DmapTag(read_bool, "dacp.volumecontrollable"),
// "cave": DmapTag(read_bool, "dacp.dacpvisualizerenabled"),
// "cavs": DmapTag(read_uint, "dacp.visualizer"),
// "cmsp": DmapTag(read_uint, "unknown tag"),
// "cmsv": DmapTag(read_uint, "unknown tag"),
// "cmte": DmapTag(read_str, "unknown tag"),


// 'cmpg': {
//     'name': 'dacp.pairingguid',
//     'type': 'int'
//   },
//   'cmnm': {
//     'name': 'dacp.devicename',
//     'type': 'string'
//   },
//   'cmty': {
//     'name': 'dacp.devicetype',
//     'type': 'string'
//   },
//   "cmpa":  {
//     'name': 'dacp.pairinganswer',
//     'type': 'struct'
//   }
