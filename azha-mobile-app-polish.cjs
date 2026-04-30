const fs = require("fs");
const path = require("path");

/* 1) Create clean SVG brand assets */
fs.writeFileSync("ASSETS/azha-wordmark.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="180" viewBox="0 0 520 180">
  <rect width="520" height="180" rx="34" fill="#ffffff"/>
  <text x="260" y="78" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="900" letter-spacing="6" fill="#0f4c81">AZHA</text>
  <text x="260" y="120" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#0f4c81">أزهي</text>
  <line x1="130" y1="138" x2="390" y2="138" stroke="#d4af37" stroke-width="5" stroke-linecap="round"/>
</svg>
`.trim(), "utf8");

fs.writeFileSync("ASSETS/azha-app-icon.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0f4c81"/>
  <circle cx="256" cy="256" r="190" fill="#ffffff" opacity=".10"/>
  <text x="256" y="245" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="8" fill="#ffffff">AZHA</text>
  <text x="256" y="315" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#ffffff">أزهي</text>
  <line x1="150" y1="344" x2="362" y2="344" stroke="#d4af37" stroke-width="10" stroke-linecap="round"/>
</svg>
`.trim(), "utf8");

/* 2) Upgrade manifest to app-like Gate/Scanner start */
let manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
manifest.name = "AZHA Security App";
manifest.short_name = "AZHA Security";
manifest.start_url = "/gate?app=1";
manifest.display = "standalone";
manifest.orientation = "portrait";
manifest.icons = [
  { src: "/ASSETS/azha-app-icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
];
manifest.shortcuts = [
  { name: "Gate Console", url: "/gate?app=1" },
  { name: "Scanner", url: "/gate?app=1&mode=scanner" },
  { name: "Dashboard", url: "/dashboard" }
];
fs.writeFileSync("manifest.webmanifest", JSON.stringify(manifest, null, 2), "utf8");

/* 3) Inject mobile app mode into gate.html */
const gatePath = "PAGES/gate.html";
let gate = fs.readFileSync(gatePath, "utf8");

const css = `
<style id="azha-mobile-app-mode">
@media (max-width: 760px){
  body{
    padding:10px!important;
    background:#eaf4fb!important;
  }

  body.azha-app-mode .azha-brand-header{
    min-height:66px!important;
    margin:0 auto 12px!important;
    padding:10px 14px!important;
    border-radius:22px!important;
    background:linear-gradient(135deg,#0b3558,#1977b5)!important;
  }

  body.azha-app-mode .azha-brand-header img{
    display:none!important;
  }

  body.azha-app-mode .azha-brand-header::after{
    content:"AZHA";
    font-size:24px!important;
    font-weight:900!important;
    color:#fff!important;
    letter-spacing:.08em!important;
  }

  body.azha-app-mode .azha-brand-title strong{
    font-size:14px!important;
    color:#fff!important;
  }

  body.azha-app-mode .azha-brand-title span{
    font-size:9px!important;
    color:rgba(255,255,255,.72)!important;
  }

  body.azha-app-mode .hero,
  body.azha-app-mode .gate-hero,
  body.azha-app-mode .command-hero{
    padding:20px 16px!important;
    border-radius:26px!important;
    margin-bottom:14px!important;
  }

  body.azha-app-mode h1{
    font-size:28px!important;
    line-height:1.15!important;
  }

  body.azha-app-mode .section,
  body.azha-app-mode .panel,
  body.azha-app-mode .card{
    border-radius:24px!important;
  }

  body.azha-app-mode button,
  body.azha-app-mode .btn{
    min-height:52px!important;
    border-radius:18px!important;
    font-size:15px!important;
  }

  body.azha-scanner-mode .hero,
  body.azha-scanner-mode .gate-hero,
  body.azha-scanner-mode .command-hero{
    display:none!important;
  }

  body.azha-scanner-mode .azha-brand-header{
    display:none!important;
  }

  body.azha-scanner-mode{
    padding:8px!important;
    background:#061827!important;
  }

  body.azha-scanner-mode #reader,
  body.azha-scanner-mode video,
  body.azha-scanner-mode canvas{
    max-width:100%!important;
  }
}
</style>
`;

if (!gate.includes("azha-mobile-app-mode")) {
  gate = gate.replace("</head>", css + "\n</head>");
}

const js = `
<script id="azha-gate-mobile-app-controller">
(function(){
  function qs(){ return new URLSearchParams(location.search); }

  function isMobile(){
    return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  }

  function findButtonByText(parts){
    const buttons = Array.from(document.querySelectorAll("button,.btn,a"));
    return buttons.find(function(btn){
      const t = (btn.innerText || btn.textContent || "").toLowerCase();
      return parts.every(function(p){ return t.includes(p); });
    });
  }

  function findScannerTarget(){
    return document.querySelector("#reader") ||
           document.querySelector("#qrcode") ||
           document.querySelector("[id*='scanner' i]") ||
           document.querySelector("[class*='scanner' i]") ||
           document.querySelector("[id*='scan' i]") ||
           document.querySelector("[class*='scan' i]");
  }

  function scrollToScanner(){
    setTimeout(function(){
      const target = findScannerTarget();
      if(target){
        target.scrollIntoView({behavior:"smooth", block:"start"});
      }
    }, 500);
  }

  function openScannerMode(){
    document.body.classList.add("azha-scanner-mode");

    const scanBtn =
      findButtonByText(["scan", "secure"]) ||
      findButtonByText(["scanner"]) ||
      findButtonByText(["qr"]);

    if(scanBtn){
      scanBtn.click();
    }

    scrollToScanner();
  }

  window.addEventListener("load", function(){
    if(isMobile() || qs().get("app") === "1"){
      document.body.classList.add("azha-app-mode");
    }

    if(qs().get("mode") === "scanner"){
      setTimeout(openScannerMode, 700);
    }

    document.addEventListener("click", function(e){
      const btn = e.target.closest("button,.btn,a");
      if(!btn) return;

      const t = (btn.innerText || btn.textContent || "").toLowerCase();
      if(t.includes("scan secure qr") || t.includes("secure qr") || t.includes("scanner")){
        setTimeout(scrollToScanner, 400);
      }
    }, true);
  });
})();
</script>
`;

if (!gate.includes("azha-gate-mobile-app-controller")) {
  gate = gate.replace("</body>", js + "\n</body>");
}

/* 4) Replace ugly logo usage visually across pages with SVG asset where direct images exist */
const pagesDir = "PAGES";
for (const file of fs.readdirSync(pagesDir)) {
  if (!file.endsWith(".html")) continue;
  const p = path.join(pagesDir, file);
  let html = fs.readFileSync(p, "utf8");

  html = html.replace(/src=["']\.\.\/ASSETS\/azha-logo\.png["']/g, 'src="../ASSETS/azha-wordmark.svg"');
  html = html.replace(/src=["']\/ASSETS\/azha-logo\.png["']/g, 'src="/ASSETS/azha-wordmark.svg"');

  fs.writeFileSync(p, html, "utf8");
}

fs.writeFileSync(gatePath, gate, "utf8");

console.log("✅ Mobile PWA app mode applied.");
console.log("✅ Scanner mode opens camera section directly with /gate?app=1&mode=scanner.");
console.log("✅ Clean SVG AZHA wordmark created and injected.");
console.log("✅ Manifest start URL changed to /gate?app=1.");
