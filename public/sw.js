// install serveice worker
self.addEventListener("install", evt => {
  console.log("service worker installed");
});

// activate sw
self.addEventListener("activate", etc => {
  console.log("sw has been activated");
});
