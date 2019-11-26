function initMap(){
    var homeLocation= {lat: 10.762622, lng:  106.660172};
    var farm = "Marttila";
    var url = 'https://digibaleapi.azurewebsites.net/DigiBaleOpenApi/1/farm/GetFarmBales/' + farm + '?fetchAll=true';
    var options = {
        zoom: 7,
        center: homeLocation};
    var markers = new Array([]);
    var map = new google.maps.Map(document.getElementById('map'), options);
    var infoWindow = new Array([]);
    /*
    const Http = new XMLHttpRequest();
    Http.open("GET", url,true);
    Http.withCredentials = true;
    Http.setRequestHeader('Content-Type', 'application/json');
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
    };*/

    function addInfo(obj){
            infoWindow[markers.length+1] = new google.maps.InfoWindow({
            content: "This is " + obj.data.baleId});
    }

    function addMarker(obj){
        //console.log(obj.length);
        markers[markers.length+1] = new google.maps.Marker({
            position: {lat: obj.data.harvestedLatitude, lng: obj.data.harvestedLongitude},
            map: map,
            label: 'P',
            });
    }
    // Display new bale location
    //var socket = io.connect('http://192.168.0.110:5000');
    var socket = io.connect('http://localhost:5000');
    socket.on("device-data", function(baleData){
        addMarker(data);
        addInfo(data);
        map.setCenter({lat: baleData.data.harvestedLatitude, lng: baleData.data.harvestedLongitude});
        map.setZoom(16);
    });
}