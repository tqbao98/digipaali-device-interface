var express = require('express');
var socket = require('socket.io');
var mqtt = require('mqtt');
var fs = require('fs');
var client  = mqtt.connect('http://192.168.0.110:1883');
var client2 = mqtt.connect('http://192.168.0.156:1883');
var context = new Object();

// create iothub device instance
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var connectionString = "HostName=DigiBaleDeviceHuB.azure-devices.net;DeviceId=AapisMaitoDevice;SharedAccessKey=D198PHiL+d8bhH2yGfs+QMywl/tiJ39nSbboFE5OxDs=";
var iotclient = clientFromConnectionString(connectionString);

var totalBale = 0;
var baleData;
var count = 0;
// App setup
var app = express();
var server = app.listen(5000, function(){
    console.log('listening for requests on port 5000');
});

// Static files
app.use(express.static('/home/pi/digipaali-device-interface/public'));

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {
    console.log('made socket connection', socket.id);

    // Handle events
    socket.on('preservative', function(data){
      exceptionHandler('preservative',data);
    });
    socket.on('badSilage', function(data){
      exceptionHandler('badSilage',data);
    });
    socket.on('badWrap', function(data){
      exceptionHandler('badWrap',data);
    });
    socket.on('add', function(data){
      client.publish("trigger", "1");
    });
    socket.on('upload', function(data){
      client.publish("sensors", "1");
    });
});

function exceptionHandler(topic, data){
  var errorCode;
  if (baleData != null){
    switch(topic){
      case 'preservative': errorCode = 101; break;
      case 'badSilage': errorCode = 102; break;
      case 'badWrap': errorCode = 103; break;
      default: errorCode = 100; break;
    }
    baleData.data.IsFaulty = true;
    baleData.data.FaultyCode = String(errorCode);
    baleData.data.timestamp = Date.now();
    console.log(baleData);
    client.publish('device-data', JSON.stringify(baleData));
  }
  io.sockets.emit('noti', "Bale marked");
}

client2.on('connect', function () {
  client2.subscribe('nurapisample/epc', function (err) {
    if (err) {
      console.log(err);
    } 
  });
});

client.on('connect', function () {
    client.subscribe('trigger', function (err) {
      if (err) {
        console.log(err);
      }
    });

    client.subscribe('nurapisample/epc', function (err) {
      if (err) {
        console.log(err);
      }
    });

    client.subscribe('todatabase', function (err) {
      if (err) {
        console.log(err);
      }
    });

    //update location and time
    client.subscribe('outTopic3', function (err) {
      if (err) {
        console.log(err);
      }
    });

  });
  
  client2.on('message', function (topic, message) {
    message = JSON.parse(message.toString());
    switch(topic){
      case 'nurapisample/epc':
            if (!context.timenow){
              //msg2 = null;
              //sent = false;
              break;}
            if (!context.arr) {context.arr = new Array();}
            for (var j = 0; j <= context.arr.length; j++){ 
                if (context.arr[j] == message.id){
                    flag = true;
                    break;
                } else {flag = false;}
            }
            if (!flag){
              context.arr.push(message.id);
              var msg = [];
              msg[0] = String(message.id);
              let length = message.id.length;
              msg[1] = "001" + context.timenow + message.id.substring(length-8 , length+1);
              context.arr.push(msg[1]);
              client2.publish('changeEPC', JSON.stringify(msg));
              io.sockets.emit('noti', "New tag found");
            } 
            //console.log(msg);
            //sent = true;
            //where = true;
            break;
            }
  });

  client.on('message', function (topic, message) {
    message = JSON.parse(message.toString());
    // message is Buffer
    switch(topic){
      case 'trigger':
            context = new Object();
            timenow = new Date();
            context.timenow = String(timenow.getTime());
            console.log(timenow);
            //msg2 = null;
            //sent = false;
            io.sockets.emit('noti', "New bale stamping started");
            break;
      
      case 'outTopic3':
            if(context.timenow){
              if(!context.arr2){context.arr2 = [];}
              context.arr2.push({
                 Latitude : message.lat,
                 Longitude : message.long,
                 DateTimeCreated: new Date(),
                 IsDeleted : false
              });
              //msg2 = null;
              //sent = false;
              console.log(context);
            }
            io.sockets.emit('locationPath', message);
            var tractorData = {
                deviceId: "AapisMaitoDevice",
                key: "D198PHiL+d8bhH2yGfs+QMywl/tiJ39nSbboFE5OxDs=",
                protocol: "mqtt",
                data: {
                  dateTimeAdded : new Date(),
                  tractorLon: message.long,
                  tractorLat: message.lat
                }
            }
            client.publish('tractor-data', JSON.stringify(tractorData));
            break;
      
      case 'nurapisample/epc':
            //console.log(message);
            if (!context.timenow){
              //msg2 = null;
              //sent = false;
              break;}
            if (!context.arr) {context.arr = new Array();}
            for (var j = 0; j <= context.arr.length; j++){ 
                if (context.arr[j] == message.id){
                    flag = true;
                    break;
                } else {flag = false;}
            }
            if (!flag){
            context.arr.push(message.id);
            var msg = [];
            msg[0] = String(message.id);
            msg[1] = "001" + context.timenow + message.id;
            msg[1] = msg[1].substring(0,25);
            console.log(msg);}
            //client.publish('changeEPC1', msg.toString());}
            //console.log(msg);
            //sent = true;
            //where = true;
            break;

            
      case "todatabase":
            if (!context.arr){
                //msg2 = null;
                //sent = false;
                context = [];
                break;
            }
            baleData = {
                deviceId: "AapisMaitoDevice",
                key: "D198PHiL+d8bhH2yGfs+QMywl/tiJ39nSbboFE5OxDs=",
                protocol: "mqtt",
                data: {
                    baleId : "001" + context.timenow,
                    externalTemperature: String(message.temp1.toFixed(2)),
                    externalHumidity: String(message.humid1.toFixed(2)),
                    internalTemperature: String(message.temp2.toFixed(2)),
                    internalHumidity: String(message.humid2.toFixed(2)),
                    dryMatter:String(message.dryMatter.toFixed(2)),
                    FaultyCode: "100",
                    //baleWeight: ,
                    dateTimeAdded: new Date(),
                    IsFaulty: false,
                    harvestedLongitude : message.long, 
                    harvestedLatitude: message.lat,
                    harvestedLocations : context.arr2,
                    timestamp: Date.now(),
                    //baler: global.get("worker"),
                    harvestIntervalTime : parseFloat(millisToMinutesAndSeconds(new Date() - context.timenow))
                }
            };
            //iotclient.open(connectCallback);
            //msg2 = null;
            //sent = true;
            //where = false;
            client.publish('device-data', JSON.stringify(baleData));
            fs.appendFile('data.txt', JSON.stringify(baleData), function (err) {
              if (err) throw err;
              console.log('Updated!');
            });
            totalBale++;
            baleData.data.totalBale = totalBale;
            io.sockets.emit('device-data', baleData);
            io.sockets.emit('noti', "Uploaded");
            console.log(baleData);
            context = null;
            client.publish('trigger', '1');
            console.log(context);
            break;
            
    }
  });

  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + "." + (seconds < 10 ? '0' : '') + seconds;
  }

  var connectCallback = function (err) {
    if (err) {
      console.error('Could not connect: ' + err);
    } else {
      console.log('Client connected');
      //var msg = new Message('some data from my device');
      iotclient.sendEvent(msg, function (err) {
        if (err) console.log(err.toString());
      });
      iotclient.on('message', function (msg) { 
        console.log(msg); 
        iotclient.complete(msg, function () {
          console.log('completed');
        });
      }); 
    }
  };