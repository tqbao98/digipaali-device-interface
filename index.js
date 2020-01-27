var express = require('express'); // hosts the web application
var socket = require('socket.io'); // handles connection with web interface to display data
var mqtt = require('mqtt'); // handles connection with other device (arduino) to receive data
// var fs = require('fs'); // communicate with file system to store data locally

var client  = mqtt.connect('http://192.168.0.110:1883'); // connect to MQTT broker
var client2 = mqtt.connect('http://192.168.0.156:1883'); // connect to Sampo reader broker

// create a temporary object to store incoming data and signals
var context = new Object();

// farm ID, which will be prefix of bale ID for distinguishing purpose
farmId = '002';

// context.timenow is used as indicator for bale existence, if data comes or tags are found but context.timenow does not exist, they will be ignored
timenow = new Date();
context.timenow = String(timenow.getTime());

// create iothub device instance
var connectionString = "HostName=DigiBaleDeviceHuB.azure-devices.net;DeviceId=LittleBoy;SharedAccessKey=eBmI9Cq1RbV3ISEeuJAUk+OtmimSj4fBdGyViSRkYJM=";
var Mqtt = require('azure-iot-device-mqtt').Mqtt;
var DeviceClient = require('azure-iot-device').Client
var AzureMessage = require('azure-iot-device').Message;
var azureclient = DeviceClient.fromConnectionString(connectionString, Mqtt);

 
var totalBale = 0; // total bale made in a day, reseted when project is reloaded
var baleData; // object to store data before send to server

// App setup
var app = express();
var server = app.listen(5000, function(){
    console.log('listening for requests on port 5000');
});

// Static files
app.use(express.static('./public'));

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

// connect to mqtt brokers, subscribe to topics
client2.on('connect', function () {
  client2.subscribe('nurapisample/epc', function (err) {
    if (err) {
      console.log(err);
    } 
  });
});

client.on('connect', function () {
    // receive 'trigger' when a new bale is started
    client.subscribe('trigger', function (err) {
      if (err) {
        console.log(err);
      }
    });

    // receive tag IDs
    client.subscribe('nurapisample/epc', function (err) {
      if (err) {
        console.log(err);
      }
    });

    // receive data from arduino for processing, before sending to database
    client.subscribe('todatabase', function (err) {
      if (err) {
        console.log(err);
      }
    });

    // this topic receives GPS of baler in an interval of time to update location
    client.subscribe('path', function (err) {
      if (err) {
        console.log(err);
      }
    });

    // this topic receives drymatter (and weight) data from either sensor or canbus
    client.subscribe('drymatter', function (err) {
      if (err) {
        console.log(err);
      }
    });

  });
  
  // handles tag IDs from reader
  client2.on('message', function (topic, message) {
    message = JSON.parse(message.toString()); // parse msg from buffer to string to json object
    switch(topic){
        case 'nurapisample/epc':
          if (!context.timenow){ // if context.timenow not exist, meaning no bale is in making, then ignore incoming tag ID
            break;}
          if (!context.arr) { // context.arr is to store all tag IDs found when making a bale, because more than 1 tag may be on a bale
            context.arr = new Array();
            context.arr[0] = farmId + context.timenow; // the first element of array will be used as bale ID
          }

          // loop to indicate whether incoming ID has been read and saved before or not, this is to prevent repeatition in array
          for (var j = 0; j <= context.arr.length; j++){ 
              if (context.arr[j] == message.id){
                  flag = true;
                  break;
              } else {flag = false;}
          }
          if (!flag){ // if incoming ID is new, it will be added to pushed to the array
            context.arr.push(message.id);
            // following code is to write baleID to the tag of incoming ID, so that all tag of a bale will have similar ID, 
            // however, if reader (e.g eNur) does not support needed Write function, this will not be used. In that case, tags will keep 
            // their current ID, array of all found ID will be sent to server so that when a tag is read, it will be mapped with correponding baleID
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
        default: break; // ignores all other topics
        }
  });

  // connects to arduino/microprocessor to get ambient, agricultural data
  client.on('message', function (topic, message) {
    message = JSON.parse(message.toString()); // message is Buffer
    switch(topic){

      case 'trigger': // receive from canbus/sensor when a new bale is to be made
            context = new Object(); // create temporary object to save data for new bale
            timenow = new Date(); // get timestamp for baleID
            context.timenow = String(timenow.getTime());
            console.log(timenow);
            context.arr = new Array([]); // temporary arr to store baleID and all tag IDs
            context.arr[0] = farmId + context.timenow; // first element is baleID
            io.sockets.emit('noti', "New bale stamping started"); // notify to UI
            break;
      
      case 'nurapisample/epc': // 
            if (!context.timenow){ // if context.timenow not exist, meaning no bale is in making, then ignore incoming tag ID
              break;}
            if (!context.arr) { // context.arr is to store all tag IDs found when making a bale, because more than 1 tag may be on a bale
              context.arr = new Array();
              context.arr[0] = farmId + context.timenow;  // the first element of array will be used as bale ID
            } 

            // loop to indicate whether incoming ID has been read and saved before or not, this is to prevent repeatition in array
            for (var j = 0; j <= context.arr.length; j++){ 
                if (context.arr[j] == message.id){
                    flag = true;
                    break;
                } else {flag = false;}
            }
            if (!flag){ // if incoming ID is new, it will be added to pushed to the array
              context.arr.push(message.id); 
              // following code is to write baleID to the tag of incoming ID, so that all tag of a bale will have similar ID, 
              // however, if reader (e.g eNur) does not support needed Write function, this will not be used. In that case, tags will keep 
              // their current ID, array of all found ID will be sent to server so that when a tag is read, it will be mapped with correponding baleID
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
                context.dryMatter.push(message.dryMatter); // store instantaneous value of DM to calculate avarage value in the end 
                if (typeof context.weight == 'undefined'){context.weight = [];}
                context.weight.push(message.weight); // to calculate weight value
              }
              io.sockets.emit('drymatter', message.dryMatter.toFixed(1));
            break;

      case 'path': // receive location data
            if(context.timenow){ // store data to array only when it corresponds to a bale 
              if(!context.arr2){context.arr2 = [];}
              context.arr2.push({
                 Latitude : message.lat,
                 Longitude : message.long,
                 DateTimeCreated: new Date(),
                 IsDeleted : false
              });
              //console.log(context);
            }

            // send message to server to update baler location
            io.sockets.emit('locationPath', message);
            
            // message send to iothub must follow below structure with deviceId, key, protocol, data
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
            azureclient.open(function (err) {
              if (err) {
                console.error('Could not connect: ' + err.message);
              } else {
                console.log('Client connected');
            
                azureclient.on('error', function (err) {
                  console.error(err.message);
                  process.exit(-1);
                });
                var tractorMsg = new AzureMessage(JSON.stringify(tractorData.data));
                azureclient.sendEvent(tractorMsg, function (err) {
                  if (err) {
                    console.error('send error: ' + err.toString());
                  } else {
                    console.log('message sent');
                  }
                });
            }});
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
            // let DMWeight = volume*((3.5*(100-kosteus))+90);

            // calculate avarage value of DM and weight
            if (typeof context.dryMatter !== 'undefined') {
              var dryMatter = context.dryMatter.reduce((a, b) => a + b, 0)/context.dryMatter.length;
            } else {var dryMatter = 0;}
            if (typeof context.weight !== 'undefined') {
              var weight = context.weight.reduce((a, b) => a + b, 0)/context.weight.length;
            } else {var weight = 0;}

            // fill incoming data to message to be sent to iothub
            baleData = {
                deviceId: "LittleBoy",
                key: "eBmI9Cq1RbV3ISEeuJAUk+OtmimSj4fBdGyViSRkYJM=",
                protocol: "mqtt",
                data: {
                    baleId : context.arr,
                    externalTemperature: String(message.temp1.toFixed(1)),
                    externalHumidity: String(message.humid1.toFixed(1)),
                    //internalTemperature: String(message.temp2.toFixed(2)),
                    //internalHumidity: String(message.humid2.toFixed(2)),
                    dryMatterValue: dryMatter.toFixed(2),
                    FaultyCode: [100],
                    baleWeight: weight.toFixed(0),
                    dateTimeAdded: new Date(),
                    IsFaulty: false,
                    // final location of bale on field
                    harvestedLongitude : message.long, 
                    harvestedLatitude: message.lat,
                    // the path where silage has been harvested
                    harvestedLocations : context.arr2,
                    timestamp: Date.now(),
                    // time it took to make the bale
                    harvestIntervalTime : parseFloat(millisToMinutesAndSeconds(new Date() - context.timenow))
                }
            };
            client.publish('device-data', JSON.stringify(baleData));
            azureclient.open(function (err) {
              if (err) {
                console.error('Could not connect: ' + err.message);
              } else {
                console.log('Client connected');
            
                azureclient.on('error', function (err) {
                  console.error(err.message);
                  process.exit(-1);
                });
                var azuremsg = new AzureMessage(JSON.stringify(baleData.data));
                azureclient.sendEvent(azuremsg, function (err) {
                  if (err) {
                    console.error('send error: ' + err.toString());
                  } else {
                    console.log('message sent');
                  }
                });
            }});
            totalBale++; // +1 to total amount of bales made
            baleData.data.totalBale = totalBale;
            io.sockets.emit('device-data', baleData);
            io.sockets.emit('noti', "Uploaded");
            console.log(baleData);

            // start new new bale
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