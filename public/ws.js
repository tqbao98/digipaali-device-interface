// Make connection
var socket = io.connect('http://192.168.0.110:5000');
//var socket = io.connect('http://localhost:5000');
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
      baleid = document.getElementById('baleid');
      outTemp = document.getElementById('outTemp');
      outHum = document.getElementById('outHum');
      inTemp = document.getElementById('inTemp');
      inHum = document.getElementById('inHum');
      dryMatter = document.getElementById('dryMatter');
      weight = document.getElementById('weight');
      totalBale = document.getElementById('total-bale');

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

technicalproblem.addEventListener("click", function(){
    socket.emit("technicalproblem",data);
});

impurity.addEventListener("click", function(){
    socket.emit("impurity",data);
});

// Listen for data from server
socket.on("device-data", function(data){
    baleid.innerHTML = data.data.baleId[0];
    outTemp.innerHTML = data.data.externalTemperature + "°C";
    outHum.innerHTML = data.data.externalHumidity + "%";
    inTemp.innerHTML =  "N/A";
    inHum.innerHTML = "N/A";
    dryMatter.innerHTML = data.data.dryMatterValue + "%";
    weight.innerHTML = data.data.baleWeight + "kg";
    totalBale.innerHTML = data.data.totalBale;
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






