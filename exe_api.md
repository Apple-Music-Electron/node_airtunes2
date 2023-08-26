# How airtunes2.exe works

## **Audio : Pipe PCM 16bit 44100Hz 2ch to airtunes2.exe stdin's or via the WS API**

## **WS API: Connect to ```"ws://localhost:8980"```**

### **Available commands: send JSON string to WS server**

1. Scanning available AirPlay devices:

       {"type":"scanDevices",
         "timeout": 3000} // timeout in ms , default is 1000ms

2. Adding devices:

        {"type":"addDevices",
         "host":"192.168.3.4",
         "args":{"port":7000,
         "volume":50,
         "password":3000,
         "txt":["tp=UDP","sm=false","sv=false","ek=1","et=0,1","md=0,1,2","cn=0,1","ch=2","ss=16","sr=44100","pw=false","vn=3","txtvers=1"],
         "airplay2":1,
         "debug":true,
         "forceAlac":false,
         "devicetype": "airplay"}} // devicetype: airplay or googlecast

3. Setting volume:

         {"type":"setVolume",
          "devicekey": "192.168.3.4:7000",
          "volume":30}

4. Setting progress:

         {"type":"setProgress",
          "devicekey": "192.168.3.4:7000",
          "progress": 0,
          "duration": 0}

5. Setting artwork:

         {"type":"setArtwork",
          "devicekey": "192.168.3.4:7000",
          "contentType" : "image/png",
          "artworkURL": "http://xxx.xxx.xxx/xxx.png"
          "artwork": "b64 data"}

6. Setting track info:

         {"type":"setTrackInfo",
          "devicekey": "192.168.3.4:7000",
          "artist": "John Doe",
          "album": "John Doe Album",
          "name": "John Doe Song"}

7. Setting passcode:

         {"type":"setPasscode",
          "devicekey": "192.168.3.4:7000",
          "passcode": "1234"}

8. Stopping device :

         {"type":"stop",
          "devicekey": "192.168.3.4:7000"}


9. Stopping all devices:

         {"type":"stopAll"}

9. Send raw audio:

         {"type":"sendAudio",
          "data": "base64 string data"} // 16bit 44100Hz 2ch (s16le), atob(data)

### **Available response: JSON string**

1. Available AirPlay devices:

    {"type":"airplayDevices",
    "devices":[{"name":"Bedroom",
    "host":"192.168.100.12",
    "port":7000,
    "addresses":["192.168.100.12"],
    "txt":["cn=0,1,2,3","da=true","et=0,3,5","ft=0x4A7FCA00,0xBC354BD0","sf=0x80404","md=0,1,2","am=AudioAccessory5,1","pk=sample","tp=UDP","vn=65537","vs=670.6.2","ov=16.2","vv=2"],
    "airplay2":null,
    "devicetype": "airplay"}]}

2. Device status:

      {
        type : "deviceStatus",
        key : key ?? "",
        status: status ?? "",
        desc: desc ?? ""
    }

3. Buffer status:

    {
        type : "bufferStatus",
        status: status ?? "",
    }
     