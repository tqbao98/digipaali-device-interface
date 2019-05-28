function initMap(){
    var homeLocation= {lat: 61.26421, lng: 24.03122};
    var farm = "farm2";
    var url = 'http://digibaleapi.azurewebsites.net/DigiBaleOpenApi/1/bale/findAllByFarmId?farmId=' + farm + '&fetchAll=true';
    var options = {
        zoom: 7,
        center: homeLocation};
    var markers = [];
    var map = new google.maps.Map(document.getElementById('map'), options);
    var infoWindow = [];
    var infoWindow1 = new google.maps.InfoWindow({
        content: "This is " });

    var infoWindow2 = new google.maps.InfoWindow({
        content: 'dalla dalla dalla'});

    const Http = new XMLHttpRequest();
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange=(e)=>{
        var data= JSON.parse(Http.responseText);
        addMarker(data);
        addInfo(data);
        markers.forEach(element =>{
            element.addListener('click', function(item, index){
                var index = markers.indexOf(element);
                infoWindow[index].open(map, element);
            });
        });
    };

    function addInfo(obj){
        for(var i = 0; i<obj.length; i++){
            infoWindow[i] = new google.maps.InfoWindow({
                content: "This is " + obj[i].id});
            //console.log(obj[i]);
        }
    }

    function addMarker(obj){
        for(var i = 0; i<obj.length; i++){
        //console.log(obj.length);
        markers[i] = new google.maps.Marker({
            position: {lat: obj[i].CurrentLocation.Latitude, lng: obj[i].CurrentLocation.Longitude},
            map: map,
            label: 'P'
            });
        }
    }

    // Display tractor's location
    var pinColor = "4fc3f7";
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34));
    //var socket = io.connect('http://192.168.0.110:5000');
    var socket = io.connect('http://localhost:5000');
    socket.on("locationPath", function(data){
        var path = new google.maps.Marker({
            position: {lat: data.lat, lng: data.long},
            map: map,
            animation: google.maps.Animation.DROP,
            icon: pinImage
            });
        map.setCenter({lat: data.lat, lng: data.long});
        map.setZoom(16);
        
    });
    
}