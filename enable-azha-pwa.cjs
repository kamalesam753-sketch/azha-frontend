const fs = require("fs");
const path = require("path");

fs.writeFileSync("manifest.webmanifest", JSON.stringify({
  name: "AZHA Security Scanner",
  short_name: "AZHA Scanner",
  description: "AZHA Enterprise Security Operating System",
  start_url: "/login",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#082d4b",
  theme_color: "#0f4c81",
  icons: [
    {
      src: "/ASSETS/azha-logo.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/ASSETS/azha-logo.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ],
  shortcuts: [
    { name: "Gate Console", url: "/gate" },
    { name: "Scanner", url: "/gate" },
    { name: "Dashboard", url: "/dashboard" }
  ]
}, null, 2), "utf8");

fs.writeFileSync("sw.js", `
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
`, "utf8");

const inject = `
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#0f4c81">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="AZHA Scanner">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function(){});
  });
}
</script>
`;

const pagesDir = "PAGES";
for (const file of fs.readdirSync(pagesDir)) {
  if (!file.endsWith(".html")) continue;

  const p = path.join(pagesDir, file);
  let html = fs.readFileSync(p, "utf8");

  if (!html.includes('rel="manifest"')) {
    html = html.replace("</head>", inject + "\n</head>");
    fs.writeFileSync(p, html, "utf8");
  }
}

console.log("✅ AZHA PWA enabled.");
console.log("✅ manifest.webmanifest created.");
console.log("✅ service worker created.");
console.log("✅ PWA tags injected into all HTML pages.");
