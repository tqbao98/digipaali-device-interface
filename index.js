var express = require("express");
var socket = require("socket.io");
var mqtt = require("mqtt");
var fs = require("fs");
var client = mqtt.connect("http://192.168.0.110:1883");
var client2 = mqtt.connect("http://192.168.0.156:1883");
var context = new Object();

// to start system automatically
timenow = new Date();
context.timenow = String(timenow.getTime());

// create iothub device instance
var clientFromConnectionString = require("azure-iot-device-mqtt")
  .clientFromConnectionString;
var Message = require("azure-iot-device").Message;
var connectionString =
  "HostName=DigiBaleDeviceHuB.azure-devices.net;DeviceId=AapisMaitoDevice;SharedAccessKey=D198PHiL+d8bhH2yGfs+QMywl/tiJ39nSbboFE5OxDs=";
var iotclient = clientFromConnectionString(connectionString);

var totalBale = 0; // total bale made in a day, reseted when prj reloaded
var baleData; // obj to store data before send to server
var count = 0;
// App setup
var app = express();
var server = app.listen(5000, function() {
  console.log("listening for requests on port 5000");
});

// Static files
app.use(express.static("/home/pi/digipaali-device-interface/public")); // change to /home/pi/digipaali-device-interface/public

// Socket setup & pass server
var io = socket(server);
module.exports.totalBale = totalBale;
module.exports.baleData = baleData;
module.exports.count = count;
module.exports.io = io;
module.exports.client = client;
module.exports.client2 = client2;

io.on("connection", socket => {
  console.log("made socket connection", socket.id);

  // Handle events
  socket.on("preservative", function(data) {
    exceptionHandler("preservative", data);
  });
  socket.on("badSilage", function(data) {
    exceptionHandler("badSilage", data);
  });
  socket.on("badWrap", function(data) {
    exceptionHandler("badWrap", data);
  });
  socket.on("add", function(data) {
    client.publish("trigger", "1");
  });
  socket.on("upload", function(data) {
    client.publish("sensors", "1");
  });
});

function exceptionHandler(topic, data) {
  var errorCode;
  if (baleData != null) {
    switch (topic) {
      case "preservative":
        errorCode = 101;
        errorHandling(errorCode, topic);
        break;
      case "badSilage":
        errorCode = 102;
        errorHandling(errorCode, topic);
        break;
      case "badWrap":
        errorCode = 103;
        errorHandling(errorCode, topic);
        break;
      default:
        errorCode = 100;
        errorHandling(errorCode, topic);
        break;
    }
  }
  io.sockets.emit("noti", "Bale marked");
}

client2.on("connect", function() {
  client2.subscribe("nurapisample/epc", function(err) {
    onSubscribeFunction(epcFunction, "nurapisample/epc");
    if (err) {
      console.log(err);
    }
  });
});

client.on("connect", function() {
  // THEN SUBSCRIBE TOPIC
  client.subscribe("trigger", function(err) {
    onSubscribeFunction(triggerFunction, "trigger");
    if (err) {
      console.log(err);
    }
  });

  client.subscribe("nurapisample/epc", function(err) {
    onSubscribeFunction(epcFunction, "nurapisample/epc");
    if (err) {
      console.log(err);
    }
  });

  client.subscribe("todatabase", function(err) {
    onSubscribeFunction(toDatabaseFunction, "todatabase");
    if (err) {
      console.log(err);
    }
  });

  //update location and time
  client.subscribe("outTopic3", function(err) {
    onSubscribeFunction(outTopic3Function, "outTopic3");
    if (err) {
      console.log(err);
    }
  });

  //update location and time
  client.subscribe("dry-matter", function(err) {
    onSubscribeFunction(dryMatterFunction, "dry-matter");
    if (err) {
      console.log(err);
    }
  });

  //update location and time
  client.subscribe("weight", function(err) {
    if (err) {
      console.log(err);
    }
  });
});

var onSubscribeFunction = function(functionModule, topicSubscribe) {
  client.on("message", function(topic, message) {
    if (topicSubscribe == topic) {
      message = JSON.parse(message.toString());
      functionModule(topic, message);
    }
  });
};

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

var errorHandling = function(errorCode, topic) {
  if (!Context.errorCode) {
    Context.errorCode = new Array();
  }
  context.errorCode.push(errorCode);
  baleData.data.IsFaulty = true;
  baleData.data.FaultyCode = context.errorCode;
  baleData.data.timestamp = Date.now();
  console.log(baleData);
  client.publish("device-data", JSON.stringify(baleData));
};

var triggerFunction = function(topic, message) {
  // console.log("trigger 1")
  context = new Object();
  timenow = new Date();
  console.log(message);
  console.log(timenow);
  //msg2 = null;
  //sent = false;
  io.sockets.emit("noti", "New bale stamping started");
  return (context.timenow = String(timenow.getTime()));
};

var epcFunction = function(topic, message) {
  if (!context.timenow) {
    return;
  }
  if (!context.arr) {
    context.arr = new Array();
    context.arr[0] = "002" + context.timenow;
  }
  for (var j = 0; j <= context.arr.length; j++) {
    if (context.arr[j] == message.id) {
      flag = true;
      break;
    } else {
      flag = false;
    }
  }
  if (!flag) {
    context.arr.push(message.id);
    var msg = [];
    msg[0] = String(message.id);
    let length = message.id.length;
    msg[1] =
      "001" + context.timenow + message.id.substring(length - 8, length + 1);
    //context.arr.push(msg[1]);
    client.publish("changeEPC", JSON.stringify(msg));
    io.sockets.emit("noti", "New tag found");
    // console.log(msg);
    console.log(msg);
    console.log(context.arr);
  }
  return context.arr;
};

var dryMatterFunction = function(topic, message) {
  if (context.timenow) {
    context.dryMatter = message.dryMatter;
    console.log(context.dryMatter);
  }
  return;
};

var outTopic3Function = function(topic, message) {
  if (context.timenow) {
    if (!context.arr2) {
      context.arr2 = [];
    }
    context.arr2.push({
      Latitude: message.lat,
      Longitude: message.long,
      DateTimeCreated: new Date(),
      IsDeleted: false
    });
    console.log(context);
  }
  io.sockets.emit("locationPath", message);
  var tractorData = {
    deviceId: "LastBorn",
    key: "JGUrI7BlNQayBL8I/kxWY3xlUbEp6icGKqmVWyT/E9U=",
    protocol: "mqtt",
    data: {
      dateTimeAdded: new Date(),
      tractorLon: message.long,
      tractorLat: message.lat
    }
  };
  client.publish("tractor-data", JSON.stringify(tractorData));
  return;
};

var toDatabaseFunction = function(topic, message) {
  if (!context.arr) {
    context = [];
    return;
  }
  let volume = 12 * 12 * 3.14159265359 * 5;
  let weight =
    volume *
    (message.dryMatter.toFixed(2) * 997 +
      (3.5 * (100 - message.dryMatter.toFixed(2)) + 90));
  let DMWeight = volume * (3.5 * (100 - message.dryMatter.toFixed(2)) + 90);
  baleData = {
    // GET DATA FROM BALE
    deviceId: "LastBorn",
    key: "JGUrI7BlNQayBL8I/kxWY3xlUbEp6icGKqmVWyT/E9U=",
    protocol: "mqtt",
    data: {
      baleId: context.arr,
      externalTemperature: String(message.temp1.toFixed(2)),
      externalHumidity: String(message.humid1.toFixed(2)),
      internalTemperature: String(message.temp2.toFixed(2)),
      internalHumidity: String(message.humid2.toFixed(2)),
      dryMatterValue: String(100 - message.dryMatter.toFixed(2)),
      FaultyCode: [100],
      baleWeight: String(weight.toFixed(2)),
      //DMWeight: String(DMWeight.toFixed(2)),
      dateTimeAdded: new Date(),
      IsFaulty: false,
      harvestedLongitude: message.long,
      harvestedLatitude: message.lat,
      harvestedLocations: context.arr2,
      timestamp: Date.now(),
      harvestIntervalTime: parseFloat(
        millisToMinutesAndSeconds(new Date() - context.timenow)
      )
    }
  };
  //iotclient.open(connectCallback);
  client.publish("device-data", JSON.stringify(baleData));
  /*fs.appendFile('data.txt', JSON.stringify(baleData), function (err) {
              if (err) throw err;
              console.log('Updated!');
            });*/
  totalBale++;
  //baleData.data.totalBale = totalBale;
  io.sockets.emit("device-data", baleData);
  io.sockets.emit("noti", "Uploaded");
  console.log(baleData);
  context = null;
  client.publish("trigger", "1");
  console.log(context);
  return;
};

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + "." + (seconds < 10 ? "0" : "") + seconds;
}

var connectCallback = function(err) {
  if (err) {
    console.error("Could not connect: " + err);
  } else {
    console.log("Client connected");
    //var msg = new Message('some data from my device');
    iotclient.sendEvent(msg, function(err) {
      if (err) console.log(err.toString());
    });
    iotclient.on("message", function(msg) {
      console.log(msg);
      iotclient.complete(msg, function() {
        console.log("completed");
      });
    });
  }
};
