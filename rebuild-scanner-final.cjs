const fs = require("fs");

const scannerPath = "PAGES/scanner.html";
const indexPath = "PAGES/index.html";
const swPath = "sw.js";

const scannerHtml = String.raw`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
<title>AZHA Scanner</title>
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#061827">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<script src="https://unpkg.com/html5-qrcode"></script>
<script src="../JS/core/config.js"></script>
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#061827;color:#fff;font-family:Arial,sans-serif}
.app{height:100dvh;display:flex;flex-direction:column}
.top{height:72px;padding:12px 14px;background:linear-gradient(135deg,#082d4b,#0f4c81);display:flex;align-items:center;justify-content:space-between}
.brand{font-weight:900;letter-spacing:.06em;font-size:16px}
.meta{font-size:11px;color:rgba(255,255,255,.75);margin-top:3px}
.status{padding:9px 11px;border-radius:999px;background:rgba(255,255,255,.14);font-size:12px;font-weight:900}
.reader-wrap{flex:1;position:relative;background:#020617;display:flex;align-items:center;justify-content:center;padding:8px 8px 92px}
#reader{width:100%;max-width:520px;border-radius:24px;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,.16)}
#reader video{object-fit:cover!important}
.scan-note{position:absolute;left:12px;right:12px;bottom:104px;background:rgba(15,76,129,.88);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(12px);border-radius:18px;padding:12px;text-align:center;font-weight:900;line-height:1.55}
.footer{position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:10px 10px calc(10px + env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#061827;border-top:1px solid rgba(255,255,255,.10)}
button{border:none;border-radius:18px;min-height:54px;font-weight:900;font-size:15px}
.light{background:#edf4fb;color:#0f4c81}
.danger{background:#b91c1c;color:#fff}
.result-valid{background:#16a34a!important}
.result-warning{background:#d97706!important}
.result-invalid{background:#b91c1c!important}
.overlay-result{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:22px;text-align:center;color:#fff}
.overlay-result.show{display:flex}
.overlay-result.valid{background:linear-gradient(135deg,#064e3b,#16a34a)}
.overlay-result.warning{background:linear-gradient(135deg,#78350f,#d97706)}
.overlay-result.invalid{background:linear-gradient(135deg,#7f1d1d,#dc2626)}
.overlay-card{width:min(420px,100%);border-radius:30px;padding:28px 22px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(14px)}
.overlay-icon{font-size:62px;margin-bottom:12px}
.overlay-title{font-size:28px;font-weight:900;margin-bottom:10px}
.overlay-info{font-size:15px;font-weight:800;line-height:1.8}
.offline-pill{position:fixed;top:12px;left:12px;z-index:9999;display:none;background:#f97316;color:#fff;padding:9px 12px;border-radius:999px;font-size:12px;font-weight:900}
.offline-pill.show{display:block}
</style>
</head>
<body>
<div id="offlinePill" class="offline-pill">Offline Queue: 0</div>

<div id="overlayResult" class="overlay-result">
  <div class="overlay-card">
    <div class="overlay-icon" id="overlayIcon">✓</div>
    <div class="overlay-title" id="overlayTitle">Verified</div>
    <div class="overlay-info" id="overlayInfo">--</div>
  </div>
</div>

<div class="app">
  <div class="top">
    <div>
      <div class="brand">AZHA SCANNER</div>
      <div class="meta" id="sessionMeta">Secure gate verification</div>
    </div>
    <div class="status" id="statusBadge">Ready</div>
  </div>

  <div class="reader-wrap">
    <div id="reader"></div>
    <div class="scan-note" id="scanNote">وجّه الكاميرا نحو QR الخاص بالعميل</div>
  </div>

  <div class="footer">
    <button class="light" id="restartBtn" type="button">Scan Again</button>
    <button class="danger" id="exitBtn" type="button">Exit Scanner</button>
  </div>
</div>

<script>
(function(){
  "use strict";

  const API_BASE =
    (window.AZHA_CONFIG && (window.AZHA_CONFIG.API_BASE || (window.AZHA_CONFIG.API && window.AZHA_CONFIG.API.BASE_URL))) ||
    "https://azha-backend-production.up.railway.app/api";

  const OFFLINE_KEY = "azhaOfflineScanQueue";
  let scanner = null;
  let locked = false;

  function getSessionToken(){return localStorage.getItem("sessionToken") || sessionStorage.getItem("sessionToken") || "";}
  function getRole(){return String(localStorage.getItem("role") || sessionStorage.getItem("role") || "").toLowerCase();}
  function allowed(){return ["admin","supervisor","guard","scanner"].includes(getRole());}

  function setStatus(text, cls){
    const badge = document.getElementById("statusBadge");
    const note = document.getElementById("scanNote");
    badge.className = "status " + (cls || "");
    badge.textContent = text || "Ready";
    note.textContent = text || "جاهز للمسح";
  }

  function beep(type){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = type === "valid" ? 920 : type === "warning" ? 540 : 230;
      gain.gain.value = 0.08;
      osc.start();
      setTimeout(function(){osc.stop();ctx.close();}, type === "valid" ? 110 : 180);
    }catch(e){}
  }

  function showOverlay(type,title,info){
    const o=document.getElementById("overlayResult");
    document.getElementById("overlayIcon").textContent=type==="valid"?"✓":type==="warning"?"!":"✕";
    document.getElementById("overlayTitle").textContent=title || "Result";
    document.getElementById("overlayInfo").innerHTML=info || "";
    o.className="overlay-result show " + (type || "invalid");
    beep(type || "invalid");
  }

  function extractToken(value){
    const raw=String(value||"").trim();
    try{const u=new URL(raw);return u.searchParams.get("token") || raw;}catch(e){
      const m=raw.match(/[?&]token=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : raw;
    }
  }

  function openPermitApp(token){
    location.href = "/permit?token=" + encodeURIComponent(token) + "&mode=security&app=1&from=scanner&sessionToken=" + encodeURIComponent(getSessionToken());
  }

  function getQueue(){try{return JSON.parse(localStorage.getItem(OFFLINE_KEY)||"[]");}catch(e){return[];}}
  function setQueue(list){localStorage.setItem(OFFLINE_KEY,JSON.stringify(list||[]));updateOfflinePill();}
  function updateOfflinePill(){
    const pill=document.getElementById("offlinePill");
    const count=getQueue().length;
    pill.textContent="Offline Queue: " + count;
    pill.classList.toggle("show", count>0 || !navigator.onLine);
  }
  function queueOfflineScan(token){
    const list=getQueue();
    list.push({token:token,sessionToken:getSessionToken(),mode:"pwa_scanner_offline_queue",createdAt:new Date().toISOString()});
    setQueue(list);
  }

  async function syncOfflineQueue(){
    if(!navigator.onLine) return;
    const list=getQueue();
    if(!list.length) return;
    const remaining=[];
    for(const item of list){
      try{
        const qs=new URLSearchParams({action:"scanToken",token:item.token,sessionToken:item.sessionToken||getSessionToken(),mode:"pwa_scanner_offline_sync",offlineCreatedAt:item.createdAt||"",_t:Date.now()});
        const res=await fetch(API_BASE+"?"+qs.toString(),{method:"GET",cache:"no-store"});
        const json=await res.json();
        if(!(json&&json.success)) remaining.push(item);
      }catch(e){remaining.push(item);}
    }
    setQueue(remaining);
  }

  async function onScanSuccess(decodedText){
    if(locked) return;
    locked=true;

    const token=extractToken(decodedText);
    setStatus("Checking...","");

    try{
      const qs=new URLSearchParams({action:"scanToken",token:token,sessionToken:getSessionToken(),mode:"pwa_scanner",_t:Date.now()});
      const res=await fetch(API_BASE+"?"+qs.toString(),{method:"GET",cache:"no-store"});
      const json=await res.json();

      if(json && json.success){
        const d=json.data||{};
        const cls=String(d.validityClass||"").toLowerCase();
        const type=cls==="valid"?"valid":cls==="warning"?"warning":"invalid";
        showOverlay(type, d.validityText || (type==="valid"?"Valid Permit":"Permit Result"), "Permit: " + (d.permitId||"-") + "<br>Unit: " + (d.unit||"-"));
        setTimeout(function(){openPermitApp(token);}, 180);
        return;
      }

      showOverlay("invalid","Invalid QR","لم يتم قبول الرمز");
      setTimeout(function(){locked=false;document.getElementById("overlayResult").className="overlay-result";},1400);
    }catch(e){
      queueOfflineScan(token);
      showOverlay("warning","Offline Saved","تم حفظ عملية المسح مؤقتًا وسيتم رفعها عند عودة الإنترنت");
      setTimeout(function(){locked=false;document.getElementById("overlayResult").className="overlay-result";},1800);
    }
  }

  async function start(){
    if(!getSessionToken() || !allowed()){
      location.href="/login";
      return;
    }

    document.getElementById("sessionMeta").textContent =
      (localStorage.getItem("sessionUsername") || sessionStorage.getItem("sessionUsername") || "security") +
      " • " +
      (localStorage.getItem("sessionGateName") || sessionStorage.getItem("sessionGateName") || "Gate");

    scanner = new Html5Qrcode("reader");

    await scanner.start(
      {facingMode:"environment"},
      {fps:24, qrbox:{width:340,height:340}, aspectRatio:1.0, disableFlip:true},
      onScanSuccess,
      function(){}
    );

    setStatus("Ready","");
  }

  async function restart(){
    locked=false;
    document.getElementById("overlayResult").className="overlay-result";
    setStatus("Restarting...","");
    try{if(scanner) await scanner.stop();}catch(e){}
    document.getElementById("reader").innerHTML="";
    start().catch(function(){setStatus("Camera Error","result-invalid");});
  }

  async function exitScanner(){
    try{if(scanner) await scanner.stop();}catch(e){}
    window.location.assign("/gate?app=1");
  }

  document.getElementById("restartBtn").addEventListener("click", restart);
  document.getElementById("exitBtn").addEventListener("click", exitScanner);

  window.addEventListener("online", syncOfflineQueue);
  window.addEventListener("offline", updateOfflinePill);
  updateOfflinePill();
  syncOfflineQueue();

  start().catch(function(){setStatus("Camera Permission Required","result-invalid");});
})();
</script>
</body>
</html>`;

fs.writeFileSync(scannerPath, scannerHtml, "utf8");

let index = fs.readFileSync(indexPath, "utf8");

const panel = String.raw`
<script id="azha-optional-security-verification-panel-final">
(function(){
  function params(){return new URLSearchParams(location.search);}
  function esc(v){return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
  function apiBase(){return (window.AZHA_CONFIG && (window.AZHA_CONFIG.API_BASE || (window.AZHA_CONFIG.API && window.AZHA_CONFIG.API.BASE_URL))) || "https://azha-backend-production.up.railway.app/api";}
  function splitNames(d){
    const raw=d.tenantsNames||d.tenantNames||d.guestsNames||d.guests||d.tenant||"";
    return String(raw).split(/[,،\n]+/).map(s=>s.trim()).filter(Boolean);
  }

  function build(d){
    if(document.getElementById("azhaSecurityVerificationPanel")) return;
    const names=splitNames(d);
    if(!names.length) return;

    const target=document.querySelector("#app .card")||document.querySelector(".card")||document.querySelector(".permit-card")||document.querySelector("#app")||document.body;

    const btn=document.createElement("button");
    btn.type="button";
    btn.className="verification-toggle-btn";
    btn.textContent="Show Identity Verification";

    const panel=document.createElement("section");
    panel.id="azhaSecurityVerificationPanel";
    panel.className="scanner-verification-panel verification-hidden";
    panel.innerHTML=
      '<div class="svp-head"><div><div class="svp-title">Identity Verification</div><div class="svp-sub">يرجى إبراز بطاقة الهوية أو جواز السفر لجميع الأسماء التالية</div></div><div class="svp-count" id="svpCounter">0 / '+names.length+'</div></div>'+
      '<div class="svp-meta"><div><b>Unit</b><span>'+esc(d.unit||"-")+'</span></div><div><b>Guests</b><span>'+esc(d.tenantCount||names.length)+'</span></div></div>'+
      '<div class="svp-list">'+names.map((n,i)=>'<button type="button" class="svp-row"><span class="svp-check">☐</span><span class="svp-name">'+(i+1)+'. '+esc(n)+'</span></button>').join("")+'</div>'+
      '<button type="button" class="svp-complete" id="svpComplete">Complete Verification</button>';

    target.appendChild(btn);
    target.appendChild(panel);

    btn.addEventListener("click",function(){
      panel.classList.toggle("verification-hidden");
      btn.textContent=panel.classList.contains("verification-hidden")?"Show Identity Verification":"Hide Identity Verification";
      if(!panel.classList.contains("verification-hidden")) panel.scrollIntoView({behavior:"smooth",block:"start"});
    });

    const rows=Array.from(panel.querySelectorAll(".svp-row"));
    const counter=panel.querySelector("#svpCounter");
    const complete=panel.querySelector("#svpComplete");

    function update(){
      const checked=panel.querySelectorAll(".svp-row.checked").length;
      counter.textContent=checked+" / "+rows.length;
      counter.classList.toggle("done",checked===rows.length);
    }

    rows.forEach(row=>{
      row.addEventListener("click",function(){
        row.classList.toggle("checked");
        row.querySelector(".svp-check").textContent=row.classList.contains("checked")?"☑":"☐";
        update();
      });
    });

    complete.addEventListener("click",function(){
      const checked=panel.querySelectorAll(".svp-row.checked").length;
      if(checked<rows.length){alert("يرجى التحقق من جميع الأسماء أولاً");return;}
      complete.textContent="Verification Completed ✓";
      complete.classList.add("done");
    });
  }

  async function load(){
    const q=params();
    if(!(q.get("from")==="scanner" || q.get("app")==="1")) return;
    const token=q.get("token");
    if(!token) return;

    try{
      const qs=new URLSearchParams({action:"getClientPermit",token:token,_t:Date.now()});
      const res=await fetch(apiBase()+"?"+qs.toString(),{method:"GET",cache:"no-store"});
      const json=await res.json();
      if(json&&json.success&&json.data) build(json.data);
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded",function(){
    setTimeout(load,500);
    setTimeout(load,1400);
    setTimeout(load,2400);
  });
})();
</script>

<style id="azha-optional-security-verification-panel-style-final">
.verification-hidden{display:none!important}
.verification-toggle-btn{width:calc(100% - 20px);margin:12px 10px;min-height:50px;border:none;border-radius:16px;background:#0f4c81;color:#fff;font-size:14px;font-weight:900;box-shadow:0 14px 35px rgba(15,76,129,.18)}
.scanner-verification-panel{margin:14px 10px 18px;padding:14px;border-radius:22px;background:#fff8e6;border:1px solid #facc15;box-shadow:0 18px 45px rgba(0,0,0,.10)}
.svp-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}
.svp-title{font-size:17px;font-weight:900;color:#0f172a}
.svp-sub{font-size:12px;color:#92400e;line-height:1.7;font-weight:800;margin-top:4px}
.svp-count{min-width:64px;text-align:center;padding:8px 10px;border-radius:999px;background:#0f4c81;color:#fff;font-weight:900}
.svp-count.done{background:#16a34a}
.svp-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.svp-meta div{background:#fff;border:1px solid #f2dfab;border-radius:14px;padding:9px}
.svp-meta b{display:block;font-size:11px;color:#64748b;margin-bottom:4px}
.svp-meta span{font-size:14px;font-weight:900;color:#0f172a}
.svp-list{display:grid;gap:8px}
.svp-row{width:100%;border:none;display:flex;align-items:center;gap:10px;text-align:right;direction:rtl;background:#fff;border:1px solid #f2dfab;border-radius:15px;padding:12px;font-weight:900;color:#0f172a}
.svp-row.checked{background:#eaf8ee;border-color:#86efac;color:#166534}
.svp-check{font-size:22px;min-width:28px}
.svp-name{flex:1;line-height:1.5}
.svp-complete{width:100%;margin-top:12px;min-height:50px;border:none;border-radius:16px;background:#0f4c81;color:#fff;font-weight:900;font-size:14px}
.svp-complete.done{background:#16a34a}
</style>
`;

if(!index.includes("azha-optional-security-verification-panel-final")){
  index = index.replace("</body>", panel + "\n</body>");
}
fs.writeFileSync(indexPath, index, "utf8");

if(fs.existsSync(swPath)){
  let sw = fs.readFileSync(swPath, "utf8");
  sw = sw.replace(/azha-security-pwa-v\d+/g, "azha-security-pwa-v9");
  fs.writeFileSync(swPath, sw, "utf8");
}

console.log("✅ Scanner fully rebuilt: faster scan, working exit, optional verification panel.");
