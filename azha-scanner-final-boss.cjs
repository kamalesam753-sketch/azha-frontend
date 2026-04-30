const fs = require("fs");

const p = "PAGES/scanner.html";
let html = fs.readFileSync(p, "utf8");

fs.copyFileSync(p, p + ".backup-before-scanner-final-boss");

html = html.replace("</style>", `
.overlay-result{
  position:fixed;
  inset:0;
  z-index:99999;
  display:none;
  align-items:center;
  justify-content:center;
  padding:22px;
  text-align:center;
  color:#fff;
  animation:popIn .22s ease both;
}
.overlay-result.show{display:flex}
.overlay-result.valid{background:linear-gradient(135deg,#064e3b,#16a34a)}
.overlay-result.warning{background:linear-gradient(135deg,#78350f,#d97706)}
.overlay-result.invalid{background:linear-gradient(135deg,#7f1d1d,#dc2626)}
.overlay-card{
  width:min(420px,100%);
  border-radius:30px;
  padding:28px 22px;
  background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.22);
  backdrop-filter:blur(14px);
  box-shadow:0 30px 90px rgba(0,0,0,.32);
}
.overlay-icon{
  font-size:62px;
  margin-bottom:12px;
}
.overlay-title{
  font-size:28px;
  font-weight:900;
  margin-bottom:10px;
}
.overlay-info{
  font-size:15px;
  font-weight:800;
  line-height:1.8;
  opacity:.92;
}
.offline-pill{
  position:fixed;
  top:12px;
  left:12px;
  z-index:9999;
  display:none;
  background:#f97316;
  color:#fff;
  padding:9px 12px;
  border-radius:999px;
  font-size:12px;
  font-weight:900;
}
.offline-pill.show{display:block}
@keyframes popIn{
  from{opacity:0;transform:scale(.94)}
  to{opacity:1;transform:scale(1)}
}
</style>`);
    
html = html.replace(`<div class="app">`, `
<div id="offlinePill" class="offline-pill">Offline Queue: 0</div>

<div id="overlayResult" class="overlay-result" onclick="hideOverlayAndRestart()">
  <div class="overlay-card">
    <div class="overlay-icon" id="overlayIcon">✓</div>
    <div class="overlay-title" id="overlayTitle">Verified</div>
    <div class="overlay-info" id="overlayInfo">--</div>
  </div>
</div>

<div class="app">`);

html = html.replace(
`  let scanner = null;
  let locked = false;`,
`  let scanner = null;
  let locked = false;
  const OFFLINE_KEY = "azhaOfflineScanQueue";`
);

html = html.replace(
`  function setStatus(text, cls){`,
`  function beep(type){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = type === "valid" ? 880 : type === "warning" ? 520 : 220;
      gain.gain.value = 0.08;

      osc.start();
      setTimeout(function(){
        osc.stop();
        ctx.close();
      }, type === "valid" ? 130 : 220);
    }catch(e){}
  }

  function getQueue(){
    try{return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");}
    catch(e){return [];}
  }

  function setQueue(list){
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(list || []));
    updateOfflinePill();
  }

  function updateOfflinePill(){
    const pill = document.getElementById("offlinePill");
    const count = getQueue().length;
    if(!pill) return;
    pill.textContent = "Offline Queue: " + count;
    pill.classList.toggle("show", count > 0 || !navigator.onLine);
  }

  function queueOfflineScan(token){
    const list = getQueue();
    list.push({
      token: token,
      sessionToken: getSessionToken(),
      mode: "pwa_scanner_offline_queue",
      createdAt: new Date().toISOString()
    });
    setQueue(list);
  }

  async function syncOfflineQueue(){
    if(!navigator.onLine) return;
    const list = getQueue();
    if(!list.length) return;

    const remaining = [];

    for(const item of list){
      try{
        const qs = new URLSearchParams({
          action:"scanToken",
          token:item.token,
          sessionToken:item.sessionToken || getSessionToken(),
          mode:item.mode || "pwa_scanner_offline_sync",
          offlineCreatedAt:item.createdAt || "",
          _t:Date.now()
        });

        const res = await fetch(API_BASE + "?" + qs.toString(), {method:"GET", cache:"no-store"});
        const json = await res.json();
        if(!(json && json.success)) remaining.push(item);
      }catch(e){
        remaining.push(item);
      }
    }

    setQueue(remaining);
  }

  function showOverlay(type, title, info){
    const overlay = document.getElementById("overlayResult");
    const icon = document.getElementById("overlayIcon");
    const titleEl = document.getElementById("overlayTitle");
    const infoEl = document.getElementById("overlayInfo");

    if(!overlay) return;

    overlay.className = "overlay-result show " + (type || "invalid");
    icon.textContent = type === "valid" ? "✓" : type === "warning" ? "!" : "✕";
    titleEl.textContent = title || "Result";
    infoEl.innerHTML = info || "";

    beep(type || "invalid");
  }

  window.hideOverlayAndRestart = function(){
    const overlay = document.getElementById("overlayResult");
    if(overlay) overlay.className = "overlay-result";
    window.restartScanner();
  };

  function setStatus(text, cls){`
);

html = html.replace(
`      if(json && json.success){
        const cls = ((json.data || {}).validityClass || "").toLowerCase();
        if(cls === "valid") setStatus("Valid - Opening Permit", "result-valid");
        else if(cls === "warning") setStatus("Warning - Opening Permit", "result-warning");
        else setStatus("Invalid - Opening Permit", "result-invalid");

        setTimeout(function(){ openPermitApp(token); }, 450);
        return;
      }

      setStatus("Invalid QR", "result-invalid");
      setTimeout(function(){ locked = false; }, 1800);
    }catch(e){
      setStatus("Connection Error", "result-invalid");
      setTimeout(function(){ locked = false; }, 1800);
    }`,
`      if(json && json.success){
        const d = json.data || {};
        const cls = String(d.validityClass || "").toLowerCase();

        if(cls === "valid"){
          setStatus("Valid - Opening Permit", "result-valid");
          showOverlay("valid", "Valid Permit", "Permit: " + (d.permitId || "-") + "<br>Unit: " + (d.unit || "-"));
        } else if(cls === "warning"){
          setStatus("Warning - Opening Permit", "result-warning");
          showOverlay("warning", d.validityText || "Warning", "Permit: " + (d.permitId || "-") + "<br>Unit: " + (d.unit || "-"));
        } else {
          setStatus("Invalid - Opening Permit", "result-invalid");
          showOverlay("invalid", d.validityText || "Invalid Permit", "Permit: " + (d.permitId || "-") + "<br>Unit: " + (d.unit || "-"));
        }

        setTimeout(function(){ openPermitApp(token); }, 850);
        return;
      }

      showOverlay("invalid", "Invalid QR", "لم يتم قبول الرمز");
      setStatus("Invalid QR", "result-invalid");
      setTimeout(function(){ locked = false; }, 1800);
    }catch(e){
      queueOfflineScan(token);
      showOverlay("warning", "Offline Saved", "تم حفظ عملية المسح مؤقتًا وسيتم رفعها عند عودة الإنترنت");
      setStatus("Offline - Saved", "result-warning");
      setTimeout(function(){ locked = false; }, 2200);
    }`
);

html = html.replace(
`  start().catch(function(){
    setStatus("Camera Permission Required", "result-invalid");
  });`,
`  window.addEventListener("online", syncOfflineQueue);
  window.addEventListener("offline", updateOfflinePill);
  updateOfflinePill();
  syncOfflineQueue();

  start().catch(function(){
    setStatus("Camera Permission Required", "result-invalid");
  });`
);

fs.writeFileSync(p, html, "utf8");

console.log("✅ Scanner Final Boss upgrade applied.");
console.log("✅ Success/Fail fullscreen overlay added.");
console.log("✅ Beep sounds added.");
console.log("✅ Offline queue + sync added.");
