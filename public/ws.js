// Make connection
//var socket = io.connect('http://192.168.0.110:5000');
var socket = io.connect('http://localhost:5000');
var data = "hello";
//import {addMarker} from './main.js';

// Query DOM
var message = document.getElementById('message'),

      //Exception
      preservative = document.getElementById('preservative'),
      badSilage = document.getElementById('bad-silage'),
      badWrap = document.getElementById('bad-wrap'),

      //Table
      baleid = document.getElementById('baleid');
      outTemp = document.getElementById('outTemp');
      outHum = document.getElementById('outHum');
      inTemp = document.getElementById('inTemp');
      inHum = document.getElementById('inHum');
      dryMatter = document.getElementById('dryMatter');
      weight = document.getElementById('weight');
      totalBale = document.getElementById('total-bale');

// Emit exception bale data
preservative.addEventListener("click", function(){
    socket.emit("preservative",data);
});

badSilage.addEventListener("click", function(){
    socket.emit("badSilage",data);
});

badWrap.addEventListener("click", function(){
    socket.emit("badWrap",data);
});

// Listen for data from server
socket.on("device-data", function(data){
    baleid.innerHTML = data.data.baleId;
    outTemp.innerHTML = data.data.externalTemperature + "°C";
    outHum.innerHTML = data.data.externalHumidity + "%";
    inTemp.innerHTML = data.data.internalTemperature + "°C";
    inHum.innerHTML = data.data.internalHumidity + "%";
    dryMatter.innerHTML = data.data.dryMatter + "%";
    //weight.innerHTML = data.data.weight;
    totalBale.innerHTML = "You have made " + data.data.totalBale + " bales today!";
});

socket.on('updated-alert', function(data){
    //alert('Bale was marked as '+ data);
});




