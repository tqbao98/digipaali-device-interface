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
            //console.log(infoWindow[i].content);
        }
    }

    function addMarker(obj){
        for(var i = 0; i<obj.length; i++){
        //console.log(obj.length);
        markers[i] = new google.maps.Marker({
            position: {lat: obj[i].CurrentLocation.Latitude, lng: obj[i].CurrentLocation.Longitude},
            map: map
            });
        }
    }
    
}