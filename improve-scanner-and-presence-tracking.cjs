const fs = require("fs");

const scannerPath = "PAGES/scanner.html";
const indexPath = "PAGES/index.html";

/* 1) Scanner visual boost + disable torch */
let scanner = fs.readFileSync(scannerPath, "utf8");

// Disable torch completely
scanner = scanner.replace(/if \(caps\.torch\) \{[\s\S]*?advanced\.torch = true;[\s\S]*?\}/g, "");

// Improve camera config, no torch
scanner = scanner.replace(
  /\{fps:\d+,\s*qrbox:\{width:\d+,height:\d+\},\s*aspectRatio:1\.0,\s*disableFlip:true(?:,\s*experimentalFeatures:\{useBarCodeDetectorIfSupported:true\})?\}/g,
  `{fps:30, qrbox:{width:390,height:390}, aspectRatio:1.0, disableFlip:true, experimentalFeatures:{useBarCodeDetectorIfSupported:true}}`
);

// Add laser/reticle CSS
if (!scanner.includes("scan-reticle")) {
  scanner = scanner.replace("</style>", `
.scan-reticle{
  position:absolute;
  width:min(72vw,390px);
  height:min(72vw,390px);
  max-width:390px;
  max-height:390px;
  pointer-events:none;
  border-radius:22px;
  z-index:5;
}

.scan-reticle::before,
.scan-reticle::after{
  content:"";
  position:absolute;
  inset:0;
  border-radius:22px;
}

.scan-reticle::before{
  border:3px solid rgba(255,255,255,.18);
}

.corner{
  position:absolute;
  width:44px;
  height:44px;
  border-color:#ffffff;
  border-style:solid;
}

.c1{top:0;left:0;border-width:5px 0 0 5px}
.c2{top:0;right:0;border-width:5px 5px 0 0}
.c3{bottom:0;left:0;border-width:0 0 5px 5px}
.c4{bottom:0;right:0;border-width:0 5px 5px 0}

.scan-line{
  position:absolute;
  left:18px;
  right:18px;
  height:3px;
  top:20px;
  background:linear-gradient(90deg,transparent,#22c55e,transparent);
  box-shadow:0 0 18px rgba(34,197,94,.9);
  animation:scanLine 1.35s linear infinite;
}

@keyframes scanLine{
  0%{transform:translateY(0)}
  100%{transform:translateY(calc(min(72vw,390px) - 40px))}
}
</style>`);
}

// Inject reticle over camera
scanner = scanner.replace(
  `<div id="reader"></div>`,
  `<div id="reader"></div>
    <div class="scan-reticle">
      <span class="corner c1"></span>
      <span class="corner c2"></span>
      <span class="corner c3"></span>
      <span class="corner c4"></span>
      <span class="scan-line"></span>
    </div>`
);

fs.writeFileSync(scannerPath, scanner, "utf8");


/* 2) Present Guests Tracking inside permit result */
let index = fs.readFileSync(indexPath, "utf8");

const trackingBlock = `
<script id="azha-present-guests-tracking-final">
(function(){
  function tokenKey(){
    const q = new URLSearchParams(location.search);
    return "azha-present-guests-" + (q.get("token") || "unknown");
  }

  function nowText(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  }

  function getState(){
    try { return JSON.parse(localStorage.getItem(tokenKey()) || "{}"); }
    catch(e){ return {}; }
  }

  function setState(state){
    localStorage.setItem(tokenKey(), JSON.stringify(state || {}));
  }

  function enhancePresence(){
    const panel =
      document.getElementById("azhaSecurityVerificationPanel") ||
      document.querySelector(".scanner-verification-panel") ||
      document.querySelector(".identity-check-section");

    if(!panel || panel.dataset.presenceTracking === "1") return;

    const rows = Array.from(panel.querySelectorAll(".svp-row, .identity-person-row"));
    if(!rows.length) return;

    panel.dataset.presenceTracking = "1";

    const state = getState();

    rows.forEach(function(row){
      const nameEl = row.querySelector(".svp-name") || row.querySelector("span:last-child");
      if(!nameEl) return;

      const rawName = nameEl.textContent.trim();
      const cleanName = rawName.replace(/^\\d+\\.\\s*/, "").trim();

      let status = row.querySelector(".presence-status");
      if(!status){
        status = document.createElement("small");
        status.className = "presence-status";
        row.appendChild(status);
      }

      function render(){
        if(state[cleanName]){
          row.classList.add("checked");
          const check = row.querySelector(".svp-check,.check-box");
          if(check) check.textContent = "☑";
          status.textContent = "دخل " + state[cleanName];
        }else{
          row.classList.remove("checked");
          const check = row.querySelector(".svp-check,.check-box");
          if(check) check.textContent = "☐";
          status.textContent = "لم تصل بعد";
        }
      }

      row.addEventListener("click", function(){
        if(state[cleanName]){
          delete state[cleanName];
        }else{
          state[cleanName] = nowText();
        }
        setState(state);
        render();
        updateSummary();
      });

      render();
    });

    const summary = document.createElement("div");
    summary.className = "presence-summary";
    panel.insertBefore(summary, panel.firstChild);

    function updateSummary(){
      const total = rows.length;
      const present = Object.keys(getState()).length;
      summary.textContent = "Present Guests: " + present + " / " + total;
      summary.classList.toggle("done", present > 0);
    }

    const complete =
      panel.querySelector(".svp-complete") ||
      panel.querySelector(".identity-complete-btn");

    if(complete){
      complete.textContent = "Save Present Guests";
      complete.onclick = function(e){
        e.preventDefault();
        const present = Object.keys(getState()).length;
        if(present === 0){
          alert("يرجى تحديد شخص واحد على الأقل");
          return false;
        }
        complete.textContent = "Present Guests Saved ✓";
        complete.classList.add("done");
        return false;
      };
    }

    updateSummary();
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(enhancePresence, 600);
    setTimeout(enhancePresence, 1400);
    setTimeout(enhancePresence, 2600);
  });
})();
</script>

<style id="azha-present-guests-tracking-style-final">
.presence-summary{
  margin-bottom:12px;
  padding:10px 12px;
  border-radius:14px;
  background:#0f4c81;
  color:#fff;
  text-align:center;
  font-weight:900;
}

.presence-summary.done{
  background:#16a34a;
}

.presence-status{
  display:block;
  margin-top:4px;
  font-size:11px;
  color:#64748b;
  font-weight:900;
}

.svp-row.checked .presence-status,
.identity-person-row.checked .presence-status{
  color:#166534;
}
</style>
`;

if(!index.includes("azha-present-guests-tracking-final")){
  index = index.replace("</body>", trackingBlock + "\n</body>");
}

fs.writeFileSync(indexPath, index, "utf8");

console.log("✅ Torch disabled.");
console.log("✅ Scanner reticle + laser animation added.");
console.log("✅ Present guest tracking added locally per permit.");
console.log("✅ Guests can be marked individually with entry time.");
