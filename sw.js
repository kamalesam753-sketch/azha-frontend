
const CACHE_NAME = "azha-security-pwa-v1";

const APP_SHELL = [
  "/",
  "/login",
  "/gate",
  "/dashboard",
  "/client",
  "/STYLES/main.css",
  "/JS/core/config.js",
  "/JS/core/auth.js",
  "/JS/api/client.js",
  "/ASSETS/azha-logo.png",
  "/ASSETS/bg-light.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (url.href.includes("azha-backend-production.up.railway.app")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match("/login")))
  );
});
