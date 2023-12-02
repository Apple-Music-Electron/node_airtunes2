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
  data: 26, //   ?
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

exports.getIdentifier = function(param) {
  for (const key in contentCodes) {
    if (contentCodes[key].name === param) {
      return key;
    }
  }

  // Return a default value or handle the case when the parameter doesn't match
  return null;
}

var contentCodes = {};

// ------------------------------  DAAP ATTRIBUTES -----------------------------
contentCodes["abal"] = { type: type.list, name: "daap.browsealbumlisting" };
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
contentCodes["agal"] = { type: type.list, name: "daap.albumgrouping" };
contentCodes["aeAK"] = { type: type.string, name: "unknown.aeAK" };
contentCodes["mgds"] = { type: type.byte, name: "unknown.mgds" };

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
contentCodes["aeFR"] = { type: type.int, name: "com.apple.itunes.unknown" };
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
contentCodes["asgr"] = { type: type.int, name: "daap.supportsgroups" };
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
// contentCodes["mstc"] = { type: type.int, name: "dmap.utctime" };
// contentCodes["msto"] = { type: type.int, name: "dmap.utcoffset" };

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
//contentCodes["ceSX"] = { type: type.byte, name: "dmcp.ceSX" };
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
contentCodes["msma"] = { type: type.long, name: "dacp.machineaddress" };
contentCodes["cmgt"] = { type: type.list, name: "dmcp.getpropertyresponse" };
contentCodes["cmvo"] = { type: type.int, name: "dmcp.volume" };
contentCodes["caia"] = { type: type.byte, name: "dmcp.isactive" };


// contentCodes["abal"] = { type: type.list, name: "daap.browsealbumlisting" };
// contentCodes["abar"] = { type: type.list, name: "daap.browseartistlisting" };
// contentCodes["abcp"] = { type: type.list, name: "daap.browsecomposerlisting" };
// contentCodes["abgn"] = { type: type.list, name: "daap.browsegenrelisting" };
// contentCodes["abpl"] = { type: type.int, name: "daap.baseplaylist" };
// contentCodes["abro"] = { type: type.list, name: "daap.databasebrowse" };
// contentCodes["adbs"] = { type: type.list, name: "daap.databasesongs" };
// contentCodes["aeAD"] = { type: type.list, name: "com.apple.itunes.adam-ids-array" };
// contentCodes["aeAI"] = { type: type.int, name: "com.apple.itunes.itms-artistid" };
// contentCodes["aeAK"] = { type: type.string, name: "unknown.aeAK" };
// contentCodes["aeCD"] = { type: type.data, name: "com.apple.itunes.flat-chapter-data" };
contentCodes["aeCd"] = { type: type.int, name: "com.apple.itunes.cloud-id" };
// contentCodes["aeCF"] = { type: type.int, name: "com.apple.itunes.cloud-flavor-id" };
// contentCodes["aeCI"] = { type: type.int, name: "com.apple.itunes.itms-composerid" };
// contentCodes["aeCK"] = { type: type.int, name: "com.apple.itunes.cloud-library-kind" };
// contentCodes["aeCM"] = { type: type.int, name: "com.apple.itunes.cloud-match-type" };
// contentCodes["aecp"] = { type: type.string, name: "com.apple.itunes.collection-description" };
// contentCodes["aeCR"] = { type: type.string, name: "com.apple.itunes.content-rating" };
// contentCodes["aeCs"] = { type: type.int, name: "com.apple.itunes.artworkchecksum" };
// contentCodes["aeCS"] = { type: type.int, name: "com.apple.itunes.artworkchecksum" };
// contentCodes["aeCU"] = { type: type.int, name: "com.apple.itunes.cloud-user-id" };
// contentCodes["aeDL"] = { type: type.int, name: "com.apple.itunes.drm-downloader-user-id" };
// contentCodes["aeDP"] = { type: type.int, name: "com.apple.itunes.drm-platform-id" };
// contentCodes["aeDR"] = { type: type.int, name: "com.apple.itunes.drm-user-id" };
// contentCodes["aeDV"] = { type: type.int, name: "com.apple.itunes.drm-versions" };
// contentCodes["aeEN"] = { type: type.string, name: "com.apple.itunes.episode-num-str" };
// contentCodes["aeES"] = { type: type.int, name: "com.apple.itunes.episode-sort" };
// contentCodes["aeFA"] = { type: type.int, name: "com.apple.itunes.drm-family-id" };
// contentCodes["aeFP"] = { type: type.int, name: "com.apple.itunes.unknown-FP" };
// contentCodes["aeFR"] = { type: type.int, name: "com.apple.itunes.unknown-FR" };
// contentCodes["aeGD"] = { type: type.int, name: "com.apple.itunes.gapless-enc-dr" };
// contentCodes["aeGE"] = { type: type.int, name: "com.apple.itunes.gapless-enc-del" };
// contentCodes["aeGH"] = { type: type.int, name: "com.apple.itunes.gapless-heur" };
// contentCodes["aeGI"] = { type: type.int, name: "com.apple.itunes.itms-genreid" };
// contentCodes["aeGR"] = { type: type.int, name: "com.apple.itunes.gapless-resy" };
contentCodes["aeGs"] = { type: type.byte, name: "com.apple.itunes.can-be-genius-seed" };
// contentCodes["aeGU"] = { type: type.int, name: "com.apple.itunes.gapless-dur" };
contentCodes["aeHC"] = { type: type.int, name: "com.apple.itunes.has-chapter-data" };
// contentCodes["aeHD"] = { type: type.int, name: "com.apple.itunes.is-hd-video" };
contentCodes["aeHV"] = { type: type.int, name: "com.apple.itunes.has-video" };
// contentCodes["aeIM"] = { type: type.int, name: "com.apple.itunes.unknown-IM" };
// contentCodes["aeK1"] = { type: type.int, name: "com.apple.itunes.drm-key1-id" };
// contentCodes["aeK2"] = { type: type.int, name: "com.apple.itunes.drm-key2-id" };
contentCodes["aels"] = { type: type.byte, name: "com.apple.itunes.liked-state" };
contentCodes["aelb"] = { type: type.byte, name: "com.apple.itunes.lb?" };
// contentCodes["aeMC"] = { type: type.int, name: "com.apple.itunes.playlist-contains-media-type-count" };
// contentCodes["aemi"] = { type: type.list, name: "com.apple.itunes.media-kind-listing-item" };
// contentCodes["aeMk"] = { type: type.int, name: "com.apple.itunes.extended-media-kind" };
// contentCodes["aeMK"] = { type: type.int, name: "com.apple.itunes.mediakind" };
// contentCodes["aeml"] = { type: type.list, name: "com.apple.itunes.media-kind-listing" };
// contentCodes["aeMQ"] = { type: type.int, name: "com.apple.itunes.unknown-MQ" };
// contentCodes["aeMX"] = { type: type.string, name: "com.apple.itunes.movie-info-xml" };
// contentCodes["aeND"] = { type: type.int, name: "com.apple.itunes.non-drm-user-id" };
// contentCodes["aeNN"] = { type: type.string, name: "com.apple.itunes.network-name" };
// contentCodes["aeNV"] = { type: type.int, name: "com.apple.itunes.norm-volume" };
// contentCodes["aePC"] = { type: type.int, name: "com.apple.itunes.is-podcast" };
// contentCodes["aePI"] = { type: type.int, name: "com.apple.itunes.itms-playlistid" };
// contentCodes["aePP"] = { type: type.int, name: "com.apple.itunes.is-podcast-playlist" };
// contentCodes["aePS"] = { type: type.int, name: "com.apple.itunes.special-playlist" };
// contentCodes["aeRD"] = { type: type.int, name: "com.apple.itunes.rental-duration" };
// contentCodes["aeRf"] = { type: type.int, name: "com.apple.itunes.is-featured" };
// contentCodes["aeRM"] = { type: type.int, name: "com.apple.itunes.unknown-RM" };
// contentCodes["aeRP"] = { type: type.int, name: "com.apple.itunes.rental-pb-start" };
// contentCodes["aeRS"] = { type: type.int, name: "com.apple.itunes.rental-start" };
// contentCodes["aeRU"] = { type: type.int, name: "com.apple.itunes.rental-pb-duration" };
// contentCodes["aeSE"] = { type: type.int, name: "com.apple.itunes.store-pers-id" };
// contentCodes["aeSF"] = { type: type.int, name: "com.apple.itunes.itms-storefrontid" };
// contentCodes["aeSG"] = { type: type.int, name: "com.apple.itunes.saved-genius" };
contentCodes["aeSI"] = { type: type.int, name: "com.apple.itunes.itms-songid" };
// contentCodes["aeSL"] = { type: type.int, name: "com.apple.itunes.unknown-SL" };
// contentCodes["aeSN"] = { type: type.string, name: "com.apple.itunes.series-name" };
// contentCodes["aeSP"] = { type: type.int, name: "com.apple.itunes.smart-playlist" };
// contentCodes["aeSR"] = { type: type.int, name: "com.apple.itunes.unknown-SR" };
// contentCodes["aeSU"] = { type: type.int, name: "com.apple.itunes.season-num" };
// contentCodes["aeSV"] = { type: type.version, name: "com.apple.itunes.music-sharing-version" };
// contentCodes["aeSX"] = { type: type.int, name: "com.apple.itunes.unknown-SX" };
// contentCodes["aeTr"] = { type: type.int, name: "com.apple.itunes.unknown-Tr" };
// contentCodes["aeXD"] = { type: type.string, name: "com.apple.itunes.xid" };
// contentCodes["agac"] = { type: type.int, name: "daap.groupalbumcount" };
// contentCodes["agal"] = { type: type.list, name: "com.apple.itunes.unknown-al" };
contentCodes["agar"] = { type: type.list, name: "unknown.agar" };
// contentCodes["agma"] = { type: type.int, name: "daap.groupmatchedqueryalbumcount" };
// contentCodes["agmi"] = { type: type.int, name: "daap.groupmatchedqueryitemcount" };
// contentCodes["agrp"] = { type: type.string, name: "daap.songgrouping" };
// contentCodes["ajal"] = { type: type.int, name: "com.apple.itunes.store.album-liked-state" };
// contentCodes["ajca"] = { type: type.int, name: "com.apple.itunes.store.show-composer-as-artist" };
// contentCodes["ajcA"] = { type: type.int, name: "com.apple.itunes.store.show-composer-as-artist" };
// contentCodes["aply"] = { type: type.list, name: "daap.databaseplaylists" };
contentCodes["aprm"] = { type: type.int, name: "daap.playlistrepeatmode" };
contentCodes["apro"] = { type: type.version, name: "daap.protocolversion" };
contentCodes["apsm"] = { type: type.int, name: "daap.playlistshufflemode" };
// contentCodes["apso"] = { type: type.list, name: "daap.playlistsongs" };
// contentCodes["arif"] = { type: type.list, name: "daap.resolveinfo" };
// contentCodes["arsv"] = { type: type.list, name: "daap.resolve" };
contentCodes["asaa"] = { type: type.string, name: "daap.songalbumartist" };
contentCodes["asac"] = { type: type.int, name: "daap.songartworkcount" };
contentCodes["asai"] = { type: type.data, name: "daap.songalbumid" };
// contentCodes["asal"] = { type: type.string, name: "daap.songalbum" };
// contentCodes["asar"] = { type: type.string, name: "daap.songartist" };
// contentCodes["asas"] = { type: type.int, name: "daap.songalbumuserratingstatus" };
// contentCodes["asbk"] = { type: type.int, name: "daap.bookmarkable" };
// contentCodes["asbo"] = { type: type.int, name: "daap.songbookmark" };
// contentCodes["asbr"] = { type: type.int, name: "daap.songbitrate" };
// contentCodes["asbt"] = { type: type.int, name: "daap.songbeatsperminute" };
// contentCodes["ascd"] = { type: type.int, name: "daap.songcodectype" };
// contentCodes["ascm"] = { type: type.string, name: "daap.songcomment" };
// contentCodes["ascn"] = { type: type.string, name: "daap.songcontentdescription" };
// contentCodes["asco"] = { type: type.int, name: "daap.songcompilation" };
// contentCodes["ascp"] = { type: type.string, name: "daap.songcomposer" };
// contentCodes["ascr"] = { type: type.int, name: "daap.songcontentrating" };
// contentCodes["ascs"] = { type: type.int, name: "daap.songcodecsubtype" };
// contentCodes["asct"] = { type: type.string, name: "daap.songcategory" };
// contentCodes["asda"] = { type: type.date, name: "daap.songdateadded" };
// contentCodes["asdb"] = { type: type.int, name: "daap.songdisabled" };
// contentCodes["asdc"] = { type: type.int, name: "daap.songdisccount" };
// contentCodes["asdk"] = { type: type.int, name: "daap.songdatakind" };
// contentCodes["asdm"] = { type: type.date, name: "daap.songdatemodified" };
// contentCodes["asdn"] = { type: type.int, name: "daap.songdiscnumber" };
// contentCodes["asdp"] = { type: type.date, name: "daap.songdatepurchased" };
 contentCodes["asdr"] = { type: type.date, name: "daap.songdatereleased" };
// contentCodes["asdt"] = { type: type.string, name: "daap.songdescription" };
// contentCodes["ased"] = { type: type.int, name: "daap.songextradata" };
// contentCodes["aseq"] = { type: type.string, name: "daap.songeqpreset" };
// contentCodes["ases"] = { type: type.int, name: "daap.songexcludefromshuffle" };
// contentCodes["asfm"] = { type: type.string, name: "daap.songformat" };
// contentCodes["asgn"] = { type: type.string, name: "daap.songgenre" };
// contentCodes["asgp"] = { type: type.int, name: "daap.songgapless" };
// contentCodes["asgr"] = { type: type.int, name: "daap.supportsgroups" };
// contentCodes["ashp"] = { type: type.int, name: "daap.songhasbeenplayed" };
// contentCodes["askd"] = { type: type.date, name: "daap.songlastskipdate" };
// contentCodes["askp"] = { type: type.int, name: "daap.songuserskipcount" };
// contentCodes["asky"] = { type: type.string, name: "daap.songkeywords" };
// contentCodes["aslc"] = { type: type.string, name: "daap.songlongcontentdescription" };
// contentCodes["aslr"] = { type: type.int, name: "daap.songalbumuserrating" };
// contentCodes["asls"] = { type: type.int, name: "daap.songlongsize" };
// contentCodes["aspc"] = { type: type.int, name: "daap.songuserplaycount" };
// contentCodes["aspl"] = { type: type.date, name: "daap.songdateplayed" };
// contentCodes["aspu"] = { type: type.string, name: "daap.songpodcasturl" };
// contentCodes["asri"] = { type: type.int, name: "daap.songartistid" };
// contentCodes["asrs"] = { type: type.int, name: "daap.songuserratingstatus" };
// contentCodes["asrv"] = { type: type.signed_int, name: "daap.songrelativevolume" };
// contentCodes["assa"] = { type: type.string, name: "daap.sortartist" };
// contentCodes["assc"] = { type: type.string, name: "daap.sortcomposer" };
// contentCodes["asse"] = { type: type.int, name: "com.apple.itunes.unknown-se" };
// contentCodes["assl"] = { type: type.string, name: "daap.sortalbumartist" };
// contentCodes["assn"] = { type: type.string, name: "daap.sortname" };
// contentCodes["assp"] = { type: type.int, name: "daap.songstoptime" };
// contentCodes["assr"] = { type: type.int, name: "daap.songsamplerate" };
// contentCodes["asss"] = { type: type.string, name: "daap.sortseriesname" };
// contentCodes["asst"] = { type: type.int, name: "daap.songstarttime" };
// contentCodes["assu"] = { type: type.string, name: "daap.sortalbum" };
// contentCodes["assz"] = { type: type.int, name: "daap.songsize" };
// contentCodes["astc"] = { type: type.int, name: "daap.songtrackcount" };
// contentCodes["astm"] = { type: type.int, name: "daap.songtime" };
// contentCodes["astn"] = { type: type.int, name: "daap.songtracknumber" };
// contentCodes["asul"] = { type: type.string, name: "daap.songdataurl" };
// contentCodes["asur"] = { type: type.int, name: "daap.songuserrating" };
// contentCodes["asvc"] = { type: type.int, name: "daap.songprimaryvideocodec" };
// contentCodes["asyr"] = { type: type.int, name: "daap.songyear" };
// contentCodes["ated"] = { type: type.int, name: "daap.supportsextradata" };
// contentCodes["avdb"] = { type: type.list, name: "daap.serverdatabases" };
contentCodes["caar"] = { type: type.int, name: "dacp.availablerepeatstates" };
contentCodes["caas"] = { type: type.int, name: "dacp.availableshufflestates" };
// contentCodes["caci"] = { type: type.list, name: "dacp.controlint" };
contentCodes["cads"] = { type: type.int, name: "unknown-ds.cads" };
contentCodes["cacd"] = { type: type.string, name: "unknown-ds.cacd" };
// contentCodes["cafe"] = { type: type.int, name: "dacp.fullscreenenabled" };
// contentCodes["cafs"] = { type: type.int, name: "dacp.fullscreen" };
// contentCodes["caia"] = { type: type.int, name: "dacp.isactive" };
// contentCodes["caip"] = { type: type.int, name: "com.apple.itunes.unknown-ip" };
contentCodes["caiv"] = { type: type.byte, name: "com.apple.itunes.unknown-iv" };
contentCodes["caks"] = { type: type.byte, name: "unknown.ss.caks" };
contentCodes["cana"] = { type: type.string, name: "dacp.nowplayingartist" };
contentCodes["cang"] = { type: type.string, name: "dacp.nowplayinggenre" };
contentCodes["canl"] = { type: type.string, name: "dacp.nowplayingalbum" };
contentCodes["cann"] = { type: type.string, name: "dacp.nowplayingname" };
contentCodes["canp"] = { type: type.data, name: "dacp.nowplayingids" };
contentCodes["cant"] = { type: type.int, name: "dacp.nowplayingtime" };
// contentCodes["caov"] = { type: type.int, name: "unknown.ov.caov" };
// contentCodes["capr"] = { type: type.version, name: "dacp.protocolversion" };
contentCodes["casa"] = { type: type.int, name: "com.apple.itunes.unknown-sa" };
contentCodes["casc"] = { type: type.byte, name: "unknown.ss.casc" };
// contentCodes["cash"] = { type: type.int, name: "dacp.shufflestate" };
// contentCodes["casp"] = { type: type.list, name: "dacp.speakers" };
// contentCodes["cass"] = { type: type.int, name: "unknown.ss.cass" };
contentCodes["cast"] = { type: type.int, name: "dacp.songtime" };
// contentCodes["cavc"] = { type: type.int, name: "dacp.volumecontrollable" };
contentCodes["cavd"] = { type: type.byte, name: "com.apple.itunes.unknown-vd" };
contentCodes["cave"] = { type: type.byte, name: "dacp.visualizerenabled" };
contentCodes["cavs"] = { type: type.byte, name: "dacp.visualizer" };
contentCodes["ceGS"] = { type: type.byte, name: "com.apple.itunes.genius-selectable" };
// contentCodes["ceJC"] = { type: type.int, name: "com.apple.itunes.jukebox-client-vote" };
// contentCodes["ceJI"] = { type: type.int, name: "com.apple.itunes.jukebox-current" };
// contentCodes["ceJS"] = { type: type.int, name: "com.apple.itunes.jukebox-score" };
// contentCodes["ceJV"] = { type: type.int, name: "com.apple.itunes.jukebox-vote" };
// contentCodes["ceQa"] = { type: type.string, name: "com.apple.itunes.playqueue-album" };
// contentCodes["ceQg"] = { type: type.string, name: "com.apple.itunes.playqueue-genre" };
// contentCodes["ceQh"] = { type: type.string, name: "unknown.ceQh" };
contentCodes["ceQi"] = { type: type.int, name: "unknown.ceQi" };
contentCodes["ceQI"] = { type: type.int, name: "unknown.ceQI" };
contentCodes["ceQk"] = { type: type.string, name: "unknown.ceQk" };
contentCodes["ceQl"] = { type: type.string, name: "unknown.ceQl" };
contentCodes["ceQm"] = { type: type.int, name: "unknown.ceQm" };
contentCodes["ceQn"] = { type: type.string, name: "com.apple.itunes.playqueue-name" };
contentCodes["ceQR"] = { type: type.list, name: "com.apple.itunes.playqueue-contents-response" };
contentCodes["ceQr"] = { type: type.string, name: "com.apple.itunes.playqueue-artist" };
contentCodes["ceQS"] = { type: type.list, name: "com.apple.itunes.playqueue-content-unknown" };
contentCodes["ceQs"] = { type: type.string, name: "com.apple.itunes.playqueue-id" };
// contentCodes["ceQu"] = { type: type.int, name: "com.apple.itunes.unknown-Qu" };
// contentCodes["ceSG"] = { type: type.int, name: "com.apple.itunes.saved-genius" };
contentCodes["ceSX"] = { type: type.int, name: "unknown.sx.ceSX" };
// contentCodes["ceVO"] = { type: type.int, name: "com.apple.itunes.unknown-voting" };
// contentCodes["cmgt"] = { type: type.list, name: "dmcp.getpropertyresponse" };
// contentCodes["cmik"] = { type: type.int, name: "unknown-ik.cmik" };
contentCodes["cmmk"] = { type: type.int, name: "dmcp.mediakind" };
// contentCodes["cmnm"] = { type: type.string, name: "unknown-nm.cmnm" };
// contentCodes["cmpa"] = { type: type.list, name: "unknown.pa.cmpa" };
// contentCodes["cmpg"] = { type: type.data, name: "com.apple.itunes.unknown-pg" };
// contentCodes["cmpr"] = { type: type.version, name: "dmcp.protocolversion" };
// contentCodes["cmrl"] = { type: type.int, name: "unknown.rl.cmrl" };
// contentCodes["cmsp"] = { type: type.int, name: "unknown-sp.cmsp" };
// contentCodes["cmsr"] = { type: type.int, name: "dmcp.serverrevision" };
// contentCodes["cmst"] = { type: type.list, name: "dmcp.playstatus" };
// contentCodes["cmsv"] = { type: type.int, name: "unknown.sv.cmsv" };
// contentCodes["cmty"] = { type: type.string, name: "unknown-ty.cmty" };
// contentCodes["cmvo"] = { type: type.int, name: "dmcp.volume" };
// contentCodes["____"] = { type: type.int, name: "com.apple.itunes.req-fplay" };
// // contentCodes["f\21"] = { type: type.int, name: "dmap.haschildcontainers" };
// contentCodes["ipsa"] = { type: type.list, name: "dpap.iphotoslideshowadvancedoptions" };
// contentCodes["ipsl"] = { type: type.list, name: "dpap.iphotoslideshowoptions" };
// contentCodes["mbcl"] = { type: type.list, name: "dmap.bag" };
// contentCodes["mccr"] = { type: type.list, name: "dmap.contentcodesresponse" };
// contentCodes["mcna"] = { type: type.string, name: "dmap.contentcodesname" };
// contentCodes["mcnm"] = { type: type.int, name: "dmap.contentcodesnumber" };
// contentCodes["mcon"] = { type: type.list, name: "dmap.container" };
// contentCodes["mctc"] = { type: type.int, name: "dmap.containercount" };
// contentCodes["mcti"] = { type: type.int, name: "dmap.containeritemid" };
// contentCodes["mcty"] = { type: type.int, name: "dmap.contentcodestype" };
// contentCodes["mdbk"] = { type: type.int, name: "dmap.databasekind" };
// contentCodes["mdcl"] = { type: type.list, name: "dmap.dictionary" };
contentCodes["mdst"] = { type: type.int, name: "dmap.downloadstatus" };
// contentCodes["meds"] = { type: type.int, name: "dmap.editcommandssupported" };
// contentCodes["meia"] = { type: type.int, name: "dmap.itemdateadded" };
// contentCodes["meip"] = { type: type.int, name: "dmap.itemdateplayed" };
// contentCodes["mext"] = { type: type.int, name: "dmap.objectextradata" };
// contentCodes["miid"] = { type: type.int, name: "dmap.itemid" };
// contentCodes["mikd"] = { type: type.int, name: "dmap.itemkind" };
// contentCodes["mimc"] = { type: type.int, name: "dmap.itemcount" };
// contentCodes["minm"] = { type: type.string, name: "dmap.itemname" };
// contentCodes["mlcl"] = { type: type.list, name: "dmap.listing" };
// contentCodes["mlid"] = { type: type.int, name: "dmap.sessionid" };
// contentCodes["mlit"] = { type: type.list, name: "dmap.listingitem" };
// contentCodes["mlog"] = { type: type.list, name: "dmap.loginresponse" };
// contentCodes["mpco"] = { type: type.int, name: "dmap.parentcontainerid" };
// contentCodes["mper"] = { type: type.int, name: "dmap.persistentid" };
// contentCodes["mpro"] = { type: type.version, name: "dmap.protocolversion" };
// contentCodes["mrco"] = { type: type.int, name: "dmap.returnedcount" };
// contentCodes["mrpr"] = { type: type.int, name: "dmap.remotepersistentid" };
// contentCodes["msal"] = { type: type.int, name: "dmap.supportsautologout" };
// contentCodes["msas"] = { type: type.int, name: "dmap.authenticationschemes" };
// contentCodes["msau"] = { type: type.int, name: "dmap.authenticationmethod" };
// contentCodes["msbr"] = { type: type.int, name: "dmap.supportsbrowse" };
// contentCodes["mscu"] = { type: type.int, name: "unknown-cu.mscu" };
// contentCodes["msdc"] = { type: type.int, name: "dmap.databasescount" };
// contentCodes["msed"] = { type: type.int, name: "com.apple.itunes.unknown-ed" };
// contentCodes["msex"] = { type: type.int, name: "dmap.supportsextensions" };
contentCodes["mshc"] = { type: type.int, name: "dmap.sortingheaderchar" };
contentCodes["mshi"] = { type: type.int, name: "dmap.sortingheaderindex" };
contentCodes["mshl"] = { type: type.list, name: "dmap.sortingheaderlisting" };
contentCodes["mshn"] = { type: type.int, name: "dmap.sortingheadernumber" };
// contentCodes["msix"] = { type: type.int, name: "dmap.supportsindex" };
// contentCodes["mslr"] = { type: type.int, name: "dmap.loginrequired" };
// contentCodes["msma"] = { type: type.int, name: "dmap.machineaddress" };
// contentCodes["msml"] = { type: type.list, name: "com.apple.itunes.unknown-ml" };
// contentCodes["mspi"] = { type: type.int, name: "dmap.supportspersistentids" };
// contentCodes["msqy"] = { type: type.int, name: "dmap.supportsquery" };
// contentCodes["msrs"] = { type: type.int, name: "dmap.supportsresolve" };
// contentCodes["msrv"] = { type: type.list, name: "dmap.serverinforesponse" };
contentCodes["mstc"] = { type: type.date, name: "dmap.utctime" };
// contentCodes["mstm"] = { type: type.int, name: "dmap.timeoutinterval" };
contentCodes["msto"] = { type: type.int, name: "dmap.utcoffset" };
// contentCodes["msts"] = { type: type.string, name: "dmap.statusstring" };
// contentCodes["mstt"] = { type: type.int, name: "dmap.status" };
// contentCodes["msup"] = { type: type.int, name: "dmap.supportsupdate" };
// contentCodes["mtco"] = { type: type.int, name: "dmap.specifiedtotalcount" };
// contentCodes["mudl"] = { type: type.list, name: "dmap.deletedidlisting" };
// contentCodes["mupd"] = { type: type.list, name: "dmap.updateresponse" };
// contentCodes["musr"] = { type: type.int, name: "dmap.serverrevision" };
// contentCodes["muty"] = { type: type.int, name: "dmap.updatetype" };
// contentCodes["pasp"] = { type: type.string, name: "dpap.aspectratio" };
// contentCodes["pcmt"] = { type: type.string, name: "dpap.imagecomments" };
// contentCodes["peak"] = { type: type.int, name: "com.apple.itunes.photos.album-kind" };
// contentCodes["peed"] = { type: type.date, name: "com.apple.itunes.photos.exposure-date" };
// contentCodes["pefc"] = { type: type.list, name: "com.apple.itunes.photos.faces" };
// contentCodes["peki"] = { type: type.int, name: "com.apple.itunes.photos.key-image-id" };
// contentCodes["pekm"] = { type: type.list, name: "com.apple.itunes.photos.key-image" };
// contentCodes["pemd"] = { type: type.date, name: "com.apple.itunes.photos.modification-date" };
// contentCodes["pfai"] = { type: type.list, name: "dpap.failureids" };
// contentCodes["pfdt"] = { type: type.list, name: "dpap.filedata" };
// contentCodes["pfmt"] = { type: type.string, name: "dpap.imageformat" };
// contentCodes["phgt"] = { type: type.int, name: "dpap.imagepixelheight" };
// contentCodes["picd"] = { type: type.date, name: "dpap.creationdate" };
// contentCodes["pifs"] = { type: type.int, name: "dpap.imagefilesize" };
// contentCodes["pimf"] = { type: type.string, name: "dpap.imagefilename" };
// contentCodes["plsz"] = { type: type.int, name: "dpap.imagelargefilesize" };
// contentCodes["ppro"] = { type: type.version, name: "dpap.protocolversion" };
// contentCodes["prat"] = { type: type.int, name: "dpap.imagerating" };
// contentCodes["pret"] = { type: type.list, name: "dpap.retryids" };
// contentCodes["pwth"] = { type: type.int, name: "dpap.imagepixelwidth" };

exports.contentCodes = contentCodes;
