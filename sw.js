const CACHE_NAME = "azha-security-pwa-v10";

const APP_SHELL = [
  "/",
  "/login",
  "/gate",
  "/dashboard",
  "/client",
  "/STYLES/main.css",
  "/STYLES/design-tokens.css",
  "/STYLES/components.css",
  "/STYLES/animations.css",
  "/STYLES/layouts.css",
  "/JS/core/config.js",
  "/JS/core/auth.js",
  "/JS/api/client.js",
  "/JS/shared/utils.js",
  "/JS/shared/notifications.js",
  "/ASSETS/azha-logo-final.png",
  "/ASSETS/madaar-logo-final.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () { return null; });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);

  // Never cache API calls
  if (url.href.includes("azha-backend") || url.pathname.startsWith("/api")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for pages, cache fallback
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request).then(function (r) {
        return r || caches.match("/login");
      });
    })
  );
});
