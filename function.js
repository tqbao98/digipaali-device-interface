var index = require("./index");
var context = new Object();
timenow = new Date();
context.timenow = String(timenow.getTime());

var errorHandling = function(errorCode, topic) {
  if (!Context.errorCode) {
    Context.errorCode = new Array();
  }
  context.errorCode.push(errorCode);
  index.baleData.data.IsFaulty = true;
  index.baleData.data.FaultyCode = context.errorCode;
  index.baleData.data.timestamp = Date.now();
  console.log(index.baleData);
  index.client.publish("device-data", JSON.stringify(index.baleData));
};

module.exports.errorHandling = errorHandling;

var triggerFunction = function(topic, message) {
  // console.log("trigger 1")
  context = new Object();
  timenow = new Date();
  console.log(message);
  console.log(timenow);
  //msg2 = null;
  //sent = false;
  index.io.sockets.emit("noti", "New bale stamping started");
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
    index.client.publish("changeEPC", JSON.stringify(msg));
    index.io.sockets.emit("noti", "New tag found");
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
  index.io.sockets.emit("locationPath", message);
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
  index.client.publish("tractor-data", JSON.stringify(tractorData));
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
  index.baleData = {
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
  index.client.publish("device-data", JSON.stringify(index.baleData));
  /*fs.appendFile('data.txt', JSON.stringify(index.baleData), function (err) {
              if (err) throw err;
              console.log('Updated!');
            });*/
  index.totalBale++;
  //index.baleData.data.totalBale = totalBale;
  index.io.sockets.emit("device-data", index.baleData);
  index.io.sockets.emit("noti", "Uploaded");
  console.log(index.baleData);
  context = null;
  index.client.publish("trigger", "1");
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

module.exports.triggerFunction = triggerFunction;
module.exports.epcFunction = epcFunction;
module.exports.dryMatterFunction = dryMatterFunction;
module.exports.outTopic3Function = outTopic3Function;
module.exports.toDatabaseFunction = toDatabaseFunction;
module.exports.millisToMinutesAndSeconds = millisToMinutesAndSeconds;
module.exports.connectCallback = connectCallback;
