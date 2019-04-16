// Make connection
var socket = io.connect('http://localhost:5000');
var data = "hello";
// Query DOM
var message = document.getElementById('message'),
      handle = document.getElementById('handle'),
      btn = document.getElementById('preservative'),
      output = document.getElementById('output'),
      feedback = document.getElementById('feedback');

btn.addEventListener("click", function(){
    socket.emit("timestamp",data);
    console.log(data + "world ");
});

// Listen for events
socket.on("timestamp1", function(data){
    console.log(data + "123");
});


