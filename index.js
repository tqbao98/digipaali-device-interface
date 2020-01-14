var express = require('express');
var socket = require('socket.io');
var mqtt = require('mqtt');
var fs = require('fs');

//var client  = mqtt.connect('http://192.168.0.110:1883');
var client2 = mqtt.connect('http://192.168.0.156:1883');
//var client  = mqtt.connect('mqtts://iot.research.hamk.fi:8883');
var client  = mqtt.connect('http://localhost:1883');
// to start system automatically
var context = new Object();
farmId = '002';
timenow = new Date();
context.timenow = String(timenow.getTime());

// create iothub device instance
/*var connectionString = "HostName=DigiBaleDeviceHuB.azure-devices.net;DeviceId=LittleBoy;SharedAccessKey=eBmI9Cq1RbV3ISEeuJAUk+OtmimSj4fBdGyViSRkYJM=";
var Mqtt = require('azure-iot-device-mqtt').Mqtt;
var DeviceClient = require('azure-iot-device').Client
var AzureMessage = require('azure-iot-device').Message;
var azureclient = DeviceClient.fromConnectionString(connectionString, Mqtt);*/
 
var totalBale = 0; // total bale made in a day, reseted when prj reloaded
var baleData; // obj to store data before send to server

// App setup
var app = express();
var server = app.listen(5000, function(){
    console.log('listening for requests on port 5000');
});

// Static files
app.use(express.static('./public')); // change to /home/pi/digipaali-device-interface/public

// to check context obj via robotframework
app.get('/test', (req, res) => {
  return res.send(JSON.stringify(context));
});

app.get('/baleData', (req, res) => {
  return res.send(JSON.stringify(baleData));
});

// web socket setup
var io = socket(server);
io.on('connection', (socket) => {  
    console.log('made socket connection', socket.id);

    // Handle events
    socket.on('preservative', function(data){
      exceptionHandler('preservative',data);
    });
    socket.on('technicalproblem', function(data){
      exceptionHandler('technicalproblem',data);
    });
    socket.on('impurity', function(data){
      exceptionHandler('impurity',data);
    });
    socket.on('add', function(data){
      client.publish("trigger", "1");
    });
    socket.on('upload', function(data){
      //io.sockets.emit("position", data);
      client.publish("sensors", "1");
    });

    // Disconnect listener
    socket.on('disconnect', function() {
      console.log('Client disconnected.');
    });
});

function exceptionHandler(topic, data){
  var errorCode;
  if (baleData != null){
    switch(topic){
      case 'preservative': errorCode = 101; break;
      case 'technicalproblem': errorCode = 102; break;
      case 'impurity': errorCode = 103; break;
      default: errorCode = 100; break;
    }
    if (!context.errorCode) {context.errorCode = new Array();}
    context.errorCode.push(errorCode); 
    baleData.data.IsFaulty = true;
    baleData.data.FaultyCode = context.errorCode;
    baleData.data.timestamp = Date.now();
    console.log(baleData);
    client.publish('device-data', JSON.stringify(baleData));
  }
  io.sockets.emit('noti', "Bale marked as " + topic);
  io.sockets.emit('error-bale', baleData);
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

    client.subscribe('drymatter', function (err) {
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
            break;}
          if (!context.arr) {
            context.arr = new Array();
            context.arr[0] = farmId + context.timenow;
          }
          for (var j = 0; j <= context.arr.length; j++){ 
              if (context.arr[j] == message.id){
                  flag = true;
                  break;
              } else {flag = false;}
          }
          if (!flag){
            context.arr.push(message.id);
            /*var msg = [];
            msg[0] = String(message.id);
            let length = message.id.length;
            msg[1] = farmId + context.timenow + message.id.substring(length-8 , length+1);*/
            //context.arr.push(msg[1]);
            //client.publish('changeEPC', JSON.stringify(msg));
            io.sockets.emit('noti', "New tag found");
            console.log(context.arr);
          }
          break;
        default: break;
        }
  });

  client.on('message', function (topic, message) {
    message = JSON.parse(message.toString()); // message is Buffer
    switch(topic){

      case 'trigger': 
            context = new Object(); // create context for new bale
            timenow = new Date(); // get timestamp for baleID
            context.timenow = String(timenow.getTime());
            console.log(timenow);
            context.arr = new Array([]); // temporary arr to store baleID and all tag IDs
            context.arr[0] = farmId + context.timenow; // first element is baleID
            io.sockets.emit('noti', "New bale stamping started"); // notify to UI
            break;
      
      case 'nurapisample/epc':
            if (!context.timenow){ // only process tag ID if a bale is being made
              break;}
            if (!context.arr) { // create new arr of IDs if there's not any
              context.arr = new Array();
              context.arr[0] = farmId + context.timenow;  
            } 
            for (var j = 0; j <= context.arr.length; j++){ 
                if (context.arr[j] == message.id){
                    flag = true;
                    break;
                } else {flag = false;}
            }
            if (!flag){
              context.arr.push(message.id);
              /*var msg = [];
              msg[0] = String(message.id);
              let length = message.id.length;
              msg[1] = farmId + context.timenow + message.id.substring(length-8 , length+1);*/
              //context.arr.push(msg[1]);
              //client.publish('changeEPC', JSON.stringify(msg));
              io.sockets.emit('noti', "New tag found");
              console.log(context.arr);
            }
            break;
            
      case 'drymatter':
              //console.log(message)
              if(context.timenow){
                if (typeof context.dryMatter == 'undefined'){context.dryMatter = [];}
                context.dryMatter.push(message.dryMatter);
                if (typeof context.weight == 'undefined'){context.weight = [];}
                context.weight.push(message.weight);
              }

              io.sockets.emit('drymatter', message.dryMatter.toFixed(1));
              //console.log(kosteus);
              //console.log(paino);
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
              //console.log(context);
            }
            io.sockets.emit('locationPath', message);
            var tractorData = {
                deviceId: "LittleBoy",
                key: "eBmI9Cq1RbV3ISEeuJAUk+OtmimSj4fBdGyViSRkYJM=",
                protocol: "mqtt",
                data: {
                  dateTimeAdded : new Date(),
                  tractorLon: message.long,
                  tractorLat: message.lat  
                }
            }
            client.publish('tractor-data', JSON.stringify(tractorData));
            break;
      
      case "todatabase":
            //console.log(message)
            if (!context.arr){
                context = new Object();
                timenow = new Date();
                context.timenow = String(timenow.getTime());
                context.arr = new Array([]); 
                context.arr[0] = farmId + context.timenow;
                console.log(context.timenow);
                break;
            }
            //let DMWeight = volume*((3.5*(100-kosteus))+90);

            // calculate avarage value of DM and weight
            if (typeof context.dryMatter !== 'undefined') {
              var dryMatter = context.dryMatter.reduce((a, b) => a + b, 0)/context.dryMatter.length;
            } else {var dryMatter = 0;}
            if (typeof context.weight !== 'undefined') {
              var weight = context.weight.reduce((a, b) => a + b, 0)/context.weight.length;
            } else {var weight = 0;}

            baleData = {
                deviceId: "LittleBoy",
                key: "eBmI9Cq1RbV3ISEeuJAUk+OtmimSj4fBdGyViSRkYJM=",
                protocol: "mqtt",
                data: {
                    baleId : context.arr,
                    externalTemperature: String(message.temp1.toFixed(1)),
                    externalHumidity: String(message.humid1.toFixed(1)),
                    internalTemperature: String(message.temp2.toFixed(2)),
                    internalHumidity: String(message.humid2.toFixed(2)),
                    dryMatterValue: dryMatter.toFixed(2),
                    FaultyCode: [100],
                    baleWeight: weight.toFixed(0),
                    dateTimeAdded: new Date(),
                    IsFaulty: false,
                    harvestedLongitude : message.long, 
                    harvestedLatitude: message.lat,
                    harvestedLocations : context.arr2,
                    timestamp: Date.now(),
                    harvestIntervalTime : parseFloat(millisToMinutesAndSeconds(new Date() - context.timenow))
                }
            };
            client.publish('device-data', JSON.stringify(baleData));
            /*azureclient.open(function (err) {
              if (err) {
                console.error('Could not connect: ' + err.message);
              } else {
                console.log('Client connected');
            
                azureclient.on('error', function (err) {
                  console.error(err.message);
                  process.exit(-1);
                });
            var azuremsg = new AzureMessage(JSON.stringify(baleData));
            azureclient.sendEvent(azuremsg, function (err) {
              if (err) {
                console.error('send error: ' + err.toString());
              } else {
                console.log('message sent');
              }
            });
            }});*/
            totalBale++;
            baleData.data.totalBale = totalBale;
            io.sockets.emit('device-data', baleData);
            io.sockets.emit('noti', "Uploaded");
            console.log(baleData);

            context = new Object();
            timenow = new Date();
            context.timenow = String(timenow.getTime());
            context.arr = new Array([]); 
            context.arr[0] = farmId + context.timenow;
            console.log(timenow);
            io.sockets.emit('noti', "New bale stamping started");
            break;
            
    }
  });

  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + "." + (seconds < 10 ? '0' : '') + seconds;
  }