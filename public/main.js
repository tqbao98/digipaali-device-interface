function initMap(){
    var homeLocation= {lat: 61.26421, lng: 24.03122};
    var marker = [];
    var farm = "farm2";
    var url = 'http://digibaleapi.azurewebsites.net/DigiBaleOpenApi/1/bale/findAllByFarmId?farmId=' + farm + '&fetchAll=true';
    var shakira = "shakira";
    var url1 = "https://api.lyrics.ovh/v1/" + shakira + "/waka-waka";
    var options = {
        zoom: 7,
        center: homeLocation};
    var markers = [
        {coords: {lat: 61.26421, lng: 24.03122}},
        {coords: {lat: 61.26421, lng: 25.03122}},
        {coords: {lat: 60.26421, lng: 25.03122}}];
    totalBale = document.getElementById('total-bale');
    //makeCorsRequest();
    var map = new google.maps.Map(document.getElementById('map'), options);
    var infoWindow = new google.maps.InfoWindow({
        content: 'dalla dalla dalla'});

    for(var i = 0; i<markers.length; i++){
        addMarker(i, markers[i]);}

    marker.forEach(element =>{
        element.addListener('click', function(){
            infoWindow.open(map, element);
        });
    });
    //makeCorsRequest();
    /*const Http = new XMLHttpRequest();
    Http.open("GET", url1);
    Http.send();
    Http.onreadystatechange=(e)=>{
        console.log(Http.responseText);
    };*/

    function addMarker(index, props){
        marker[index] = new google.maps.Marker({
            position: props.coords,
            map: map
        });}
       
    // Create the XHR object.
    function createCORSRequest(method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
        } else {
        // CORS not supported.
        xhr = null;
        }
        return xhr;
    }
    
    // Helper method to parse the title tag from the response.
    function getTitle(text) {
        return text.match('<title>(.*)?</title>')[1];
    }
    
    // Make the actual CORS request.
    function makeCorsRequest() {
        // This is a sample server that supports CORS.
        
    
        var xhr = createCORSRequest('GET', url);
        if (!xhr) {
        alert('CORS not supported');
        return;
        }
        xhr.send();
        // Response handlers.
        xhr.onload = function() {
        var text = xhr.responseText;
        //var title = getTitle(text);
        console.log(text);
        //alert('Response from CORS request to ' + url);
        };
    
        xhr.onerror = function() {
        //alert('Woops, there was an error making the request.');
        };
        
    }
    
}