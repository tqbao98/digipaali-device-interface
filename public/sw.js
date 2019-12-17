const staticCacheName = 'site-static-v3'; 
const dynamicCacheName = 'site-dynamic-v3'; 
const assets = [
    '/',
    '/index.html',
    '/js/app.js',
    '/main.js',
    '/main.css',
    '/ws.js',
    '/img/icons/drymatter.png',
    '/img/icons/hashtag.png',
    '/img/icons/humidity.png',
    '/img/icons/scale.png',
    '/img/icons/temperature.png',
    '/img/icons/time.png',
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "https://cdnjs.cloudflare.com/ajax/libs/materialize/0.98.2/css/materialize.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.js",
    "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js",
    "https://cdnjs.cloudflare.com/ajax/libs/materialize/0.98.2/js/materialize.min.js",
    "https://code.jquery.com/jquery-2.1.1.min.js",
    "https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2"
];
   
// cache size limit function
const limitCacheSize = (name, size) => { //getting name of cache and its limit size 
    caches.open(name).then(cache => { // open cache
        cache.keys().then(keys => { // getting all the keys from cache 
            if(keys.length > size){ // if there's more keys than limit size
                cache.delete(keys[0]).then(limitCacheSize(name, size)); // delete oldest key, continue until number of keys is smaller than limit
            }
        })
    })
};

// install serveice worked
self.addEventListener('install', evt => { // new cache is installed after SW is modified
    //console.log('service worker installed'); 
    evt.waitUntil(caches.open(staticCacheName).then(cache => { // waitUntil so that SW wont stop before all key is cached 
        //console.log('caching shell assets');
        cache.addAll(assets); // add all static assests decleared above
    }));
});

// activate sw
self.addEventListener('activate', evt => { // new activate event wont happen until app is reopened.  
    //console.log('sw has been activated');
    evt.waitUntil( // so that activate event wait for all following action to be taken
        caches.keys().then(keys => { // for all/each key is caches, both static and dynamic
            //console.log(keys);
            return Promise.all(keys
                .filter(key => key !== staticCacheName && key !== dynamicCacheName) // getting all caches that is not identical to staticCacheName and dynamicCacheName, into a new temporary array
                .map(key => caches.delete(key)) // delete those keys. 
            )
        })
    );
});

// fetch events
self.addEventListener('fetch', evt => { // fetch happens when requests are send to server
    //console.log('fetch event', evt);
    evt.respondWith(
        caches.match(evt.request).then(cacheRes => { // check if caches have response for that request, so not to request from server, to improve performance
            return cacheRes || fetch(evt.request).then(fetchRes => { // res from cache if req exists in caches, otherwise request from server
                return caches.open(dynamicCacheName).then(cache => { // after receiving res from server, open dynamic cache 
                    cache.put(evt.request.url, fetchRes.clone()); // and store the new res for corresponding req
                    limitCacheSize(dynamicCacheName, 200); // check if limit size is exceeded
                    return fetchRes; // res to app 
                })
            });
        }).catch(() => { // if cannot get res from server
            if(evt.request.url.indexOf('.html') > -1){ // conditional fallback: check if req contain certain key words, e.g if requesting for a html file
                return caches.match('/'); // response with appropriate file
            }
        })
    );
});