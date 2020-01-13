// Make connection
//var socket = io.connect('http://192.168.0.110:5000');
var socket = io.connect('http://localhost:5000');
var data = "hello";

// Query DOM
var message = document.getElementById('message'),

      //Exception
      preservative = document.getElementById('preservative'),
      technicalproblem = document.getElementById('technicalproblem'),
      impurity = document.getElementById('impurity'),
      add = document.getElementById('add');
      upload = document.getElementById('upload');

      //Table

      outTemp = document.getElementById('outTemp');
      outHum = document.getElementById('outHum');
      harvestTime = document.getElementById('harvestTime');
      dryMatter = document.getElementById('dryMatter');
      weight = document.getElementById('weight');
      totalBale = document.getElementById('total-bale');
      add = document.getElementById('add');
      upload = document.getElementById('upload');

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

technicalproblem.addEventListener("click", function(){
    socket.emit("technicalproblem",data);
});

impurity.addEventListener("click", function(){
    socket.emit("impurity",data);
});

// Listen for data from server
socket.on("device-data", function(data){
    console.log(data);
    outTemp.innerHTML = data.data.externalTemperature + "°C";
    outHum.innerHTML = data.data.externalHumidity + "%";
    dryMatter.innerHTML = data.data.dryMatterValue + "%";
    weight.innerHTML = data.data.baleWeight + "kg";
    totalBale.innerHTML = data.data.totalBale;
    harvestTime.innerHTML = data.data.harvestIntervalTime 
});

socket.on('drymatter', function(data){
    dryMatter.innerHTML = data + "%";
});

socket.on('noti', function(data){
    snackbar(data);
    console.log(data);
});

socket.on('reader-ready', function(data){
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
  
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
            socket.emit("upload", {lat: position.coords.latitude, long: position.coords.longitude});
        });
    } else { 
        alert("Geolocation is not supported by this browser.");
    }
}






