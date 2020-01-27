# Digipaali device and interface

Digipaali (2018-2020) is a public-funded project conducted by Häme University of Applied Sciences, and Natural Resources Institute Finland, in cooperation with Finnish innovative farms. The project aims to improve the efficiency of silage bale life-cycle management. This repository includes programs receiving and processing data from Arduino/Wemos board, and sending bales' data to IoT Hub. The code also hosts a local web application to control the device and display real-time measurements. 

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

## Prerequisites

* [NodeJS and npm](https://nodejs.org/en/)
* [Data collecting device](https://github.com/tqbao98/digipaali-arduino.git)

## Installing

Clone the repo or download zip file and extract it, in your desire folder:

```
git clone https://github.com/tqbao98/digipaali-device.git
```

Install potentially required packages:

```
npm install
```
## Editing files to fit your setup

* In ```index.js```, edit path to static files. By default, it is './public', which should work in most cases, but sometimes full path is required, e.g:

```
app.use(express.static('/home/pi/digipaali-device/public'));
```

* In ```index.js```, change url to your MQTT broker, e.g:
```
var client  = mqtt.connect('http://localhost:1883')
```

* For Google map to work on web application, [create a Map Javascript API credential](https://developers.google.com/maps/documentation/javascript/get-api-key) and paste the key to ```/public/index.html``` file:

```
src="https://maps.googleapis.com/maps/api/js?key=YOUR-API-KEY&callback=initMap">
```

## Running

To run the program, in repository folder:

```
node index.js
```

Optionally, you can run the project with [nodemon](https://www.npmjs.com/package/nodemon) or [pm2](https://www.npmjs.com/package/pm2) for better project management.<br/> <br/>
To run on nodemon, first install it:

```
npm install -g nodemon
```

then: 

```
nodemon index.js
```

To run on pm2, first install it:

```
npm install pm2 -g
```

then: 

```
pm2 index.js
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details
