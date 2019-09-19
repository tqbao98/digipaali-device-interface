// Make connection
//var socket = io.connect('http://192.168.0.110:5000');
var socket = io.connect('http://localhost:5000');
var data = "hello";

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
      add = document.getElementById('add');
      upload = document.getElementById('upload');
     // dot = document.getElementById('dot1');

// Emit triggers
add.addEventListener('click', function(){
    socket.emit("add", data);
});

upload.addEventListener('click',function(){
    socket.emit("upload", data);
});

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
    baleid.innerHTML = data.data.baleId[0];
    outTemp.innerHTML = data.data.externalTemperature + "°C";
    outHum.innerHTML = data.data.externalHumidity + "%";
    inTemp.innerHTML = data.data.internalTemperature + "°C";
    inHum.innerHTML = data.data.internalHumidity + "%";
    dryMatter.innerHTML = data.data.dryMatterValue + "%";
    weight.innerHTML = data.data.baleWeight;
    totalBale.innerHTML = "You have made " + data.data.totalBale + " bales today!";
});

socket.on('noti', function(data){
    snackbar(data);
    console.log(data);
});

socket.on('reader-ready', function(data){
    //alert('Bale was marked as '+ data);
    console.log("ready");
    dot.style.backgroundColor = "green";
});

function snackbar(data) {
    // Get the snackbar DIV
    var snackbar = document.getElementById("snackbar");
    snackbar.innerHTML = data;
    // Add the "show" class to DIV
    snackbar.className = "show";
  
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
  }




