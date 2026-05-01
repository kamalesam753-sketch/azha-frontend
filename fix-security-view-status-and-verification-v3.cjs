const fs = require("fs");

const scannerPath = "PAGES/scanner.html";
const permitPath = "PAGES/index.html";

/* 1) Scanner overlay validity from real dates */
let scanner = fs.readFileSync(scannerPath, "utf8");

const scannerFix = `
<script id="azha-scanner-date-validity-lock">
(function(){
  window.azhaComputePermitValidity = function(d){
    function ymd(v){
      const m = String(v || "").match(/(\\d{4})-(\\d{2})-(\\d{2})/);
      return m ? m[1]+"-"+m[2]+"-"+m[3] : "";
    }
    const s = ymd(d.startDate);
    const e = ymd(d.endDate);
    const now = new Date();
    const t = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");

    if(s && e){
      if(t > e) return {type:"invalid", text:"التصريح منتهي", en:"Permit expired"};
      if(t < s) return {type:"warning", text:"لم يبدأ بعد", en:"Not started yet"};
      if(t === e) return {type:"warning", text:"آخر يوم ساري", en:"Last valid day"};
      return {type:"valid", text:"صالح للدخول", en:"Valid for entry"};
    }

    const cls = String(d.validityClass || "").toLowerCase();
    return {
      type: cls === "valid" ? "valid" : cls === "warning" ? "warning" : "invalid",
      text: d.validityText || d.statusArabic || "Permit Result",
      en: d.validityNote || ""
    };
  };
})();
</script>
`;

if(!scanner.includes("azha-scanner-date-validity-lock")){
  scanner = scanner.replace("</head>", scannerFix + "\n</head>");
}

/* Replace scanner success block to fetch permit data before overlay */
scanner = scanner.replace(
/if\(json && json\.success\)\{[\s\S]*?setTimeout\(function\(\)\{openPermitApp\(token\);\},\s*\d+\);[\s\S]*?return;\s*\}/,
`if(json && json.success){
        let d = json.data || {};
        try{
          const qs2 = new URLSearchParams({action:"getClientPermit", token:token, _t:Date.now()});
          const r2 = await fetch(API_BASE+"?"+qs2.toString(), {method:"GET", cache:"no-store"});
          const j2 = await r2.json();
          if(j2 && j2.success && j2.data) d = j2.data;
        }catch(e){}

        const result = window.azhaComputePermitValidity ? window.azhaComputePermitValidity(d) : {type:"valid", text:d.validityText || "Permit Result"};
        showOverlay(result.type, result.text, "Permit: " + (d.permitId||"-") + "<br>Unit: " + (d.unit||"-"));
        setTimeout(function(){openPermitApp(token);}, 120);
        return;
      }`
);

fs.writeFileSync(scannerPath, scanner, "utf8");


/* 2) Permit page: final security view + optional verification rebuilt */
let permit = fs.readFileSync(permitPath, "utf8");

const permitFix = `
<script id="azha-security-permit-final-v3">
(function(){
  function q(){return new URLSearchParams(location.search);}
  function apiBase(){
    return (window.AZHA_CONFIG && (window.AZHA_CONFIG.API_BASE || (window.AZHA_CONFIG.API && window.AZHA_CONFIG.API.BASE_URL))) ||
      "https://azha-backend-production.up.railway.app/api";
  }
  function esc(v){
    return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function splitNames(raw){
    return String(raw||"")
      .split(/\\s*\\/\\s*|\\s+-\\s+|[-–—•]+|[,،\\n]+/g)
      .map(x=>x.trim())
      .filter(Boolean);
  }
  function ymd(v){
    const m = String(v||"").match(/(\\d{4})-(\\d{2})-(\\d{2})/);
    return m ? m[1]+"-"+m[2]+"-"+m[3] : "";
  }
  function compute(d){
    const s = ymd(d.startDate);
    const e = ymd(d.endDate);
    const now = new Date();
    const t = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");

    if(s && e){
      if(t > e) return {cls:"invalid", ar:"التصريح منتهي", en:"Permit expired"};
      if(t < s) return {cls:"warning", ar:"لم يبدأ بعد", en:"Not started yet"};
      if(t === e) return {cls:"warning", ar:"آخر يوم ساري", en:"Last valid day"};
      return {cls:"valid", ar:"صالح للدخول", en:"Valid for entry"};
    }

    const cls = String(d.validityClass || "").toLowerCase();
    if(cls === "valid") return {cls:"valid", ar:d.validityText||"صالح للدخول", en:"Valid for entry"};
    if(cls === "warning") return {cls:"warning", ar:d.validityText||"تحذير", en:"Warning"};
    return {cls:"invalid", ar:d.validityText||"التصريح غير صالح", en:"Invalid permit"};
  }

  function cleanOld(){
    document.querySelectorAll(".verification-toggle-btn,#azhaSecurityVerificationPanel,#scannerVerificationPanel").forEach(x=>x.remove());
  }

  function updateVisibleStatus(result){
    document.body.classList.remove("permit-valid","permit-warning","permit-invalid");
    document.body.classList.add("permit-" + result.cls);

    Array.from(document.querySelectorAll("*")).forEach(el=>{
      const t = (el.textContent || "").trim();
      if(["صالح للدخول","التصريح منتهي","Permit expired","Valid for entry","لم يبدأ بعد","آخر يوم ساري","Not started yet","Last valid day"].includes(t)){
        if(/[A-Za-z]/.test(t)) el.textContent = result.en;
        else el.textContent = result.ar;
      }
    });
  }

  function buildSecurityPanel(d){
    cleanOld();

    const result = compute(d);
    updateVisibleStatus(result);

    const names = splitNames(d.tenantsNames || d.tenantNames || d.guestsNames || d.guests || d.tenant || "");
    const target = document.querySelector(".card") || document.querySelector(".permit-card") || document.querySelector("#app") || document.body;

    const banner = document.createElement("section");
    banner.id = "azhaSecurityDecisionBanner";
    banner.className = "security-decision-banner " + result.cls;
    banner.innerHTML =
      "<div class='sdb-status'>" + esc(result.ar) + "</div>" +
      "<div class='sdb-meta'>Unit: " + esc(d.unit || "-") + " • Guests: " + esc(d.tenantCount || names.length || "-") + "</div>" +
      "<div class='sdb-note'>يرجى إبراز بطاقة الهوية أو جواز السفر للتحقق من الأسماء.</div>";

    if(!document.getElementById("azhaSecurityDecisionBanner")){
      target.insertAdjacentElement("afterbegin", banner);
    }

    if(!names.length) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "verification-toggle-btn";
    btn.textContent = "Show Identity Verification";

    const panel = document.createElement("section");
    panel.id = "azhaSecurityVerificationPanel";
    panel.className = "scanner-verification-panel verification-hidden";

    panel.innerHTML =
      "<div class='presence-summary'>Present Guests: 0 / " + names.length + "</div>" +
      "<div class='svp-head'><div><div class='svp-title'>Identity Verification</div><div class='svp-sub'>يرجى تحديد الأشخاص الموجودين فعليًا أمام الأمن فقط</div></div></div>" +
      "<div class='svp-list'>" + names.map((n,i)=>
        "<button type='button' class='svp-row'><span class='svp-check'>☐</span><span class='svp-name'>" + (i+1) + ". " + esc(n) + "</span><small class='presence-status'>لم تصل بعد</small></button>"
      ).join("") + "</div>" +
      "<button type='button' class='svp-complete'>Save Present Guests</button>";

    target.appendChild(btn);
    target.appendChild(panel);

    btn.addEventListener("click",function(){
      panel.classList.toggle("verification-hidden");
      btn.textContent = panel.classList.contains("verification-hidden") ? "Show Identity Verification" : "Hide Identity Verification";
      if(!panel.classList.contains("verification-hidden")) panel.scrollIntoView({behavior:"smooth",block:"start"});
    });

    const rows = Array.from(panel.querySelectorAll(".svp-row"));
    const summary = panel.querySelector(".presence-summary");

    function update(){
      const checked = panel.querySelectorAll(".svp-row.checked").length;
      summary.textContent = "Present Guests: " + checked + " / " + rows.length;
      summary.classList.toggle("done", checked > 0);
    }

    rows.forEach(row=>{
      row.addEventListener("click",function(){
        row.classList.toggle("checked");
        row.querySelector(".svp-check").textContent = row.classList.contains("checked") ? "☑" : "☐";
        row.querySelector(".presence-status").textContent = row.classList.contains("checked")
          ? "دخل " + new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
          : "لم تصل بعد";
        update();
      });
    });

    panel.querySelector(".svp-complete").addEventListener("click",function(){
      const checked = panel.querySelectorAll(".svp-row.checked").length;
      if(checked === 0){
        alert("يرجى تحديد شخص واحد على الأقل");
        return;
      }
      this.textContent = "Present Guests Saved ✓";
      this.classList.add("done");
    });
  }

  async function load(){
    const params = q();
    if(!(params.get("from")==="scanner" || params.get("mode")==="security" || params.get("app")==="1")) return;

    const token = params.get("token");
    if(!token) return;

    try{
      const qs = new URLSearchParams({action:"getClientPermit", token:token, _t:Date.now()});
      const res = await fetch(apiBase()+"?"+qs.toString(), {method:"GET", cache:"no-store"});
      const json = await res.json();
      if(json && json.success && json.data) buildSecurityPanel(json.data);
    }catch(e){}
  }

  document.addEventListener("DOMContentLoaded",function(){
    setTimeout(load,400);
    setTimeout(load,1200);
    setTimeout(load,2200);
  });
})();
</script>

<style id="azha-security-permit-final-v3-style">
.security-decision-banner{
  margin:10px;
  padding:16px;
  border-radius:20px;
  text-align:center;
  font-weight:900;
}
.security-decision-banner.valid{background:#eaf8ee;color:#166534}
.security-decision-banner.warning{background:#fff8e6;color:#92400e}
.security-decision-banner.invalid{background:#fdecec;color:#b91c1c}
.sdb-status{font-size:24px;margin-bottom:6px}
.sdb-meta{font-size:13px;color:#0f172a;margin-bottom:6px}
.sdb-note{font-size:13px;line-height:1.6}

body.permit-invalid .status-pill,
body.permit-invalid .status-tag,
body.permit-invalid .validity-note,
body.permit-invalid [class*="valid"],
body.permit-invalid [class*="status"]{
  background:#fdecec!important;
  color:#b91c1c!important;
}

body.permit-valid .status-pill,
body.permit-valid .status-tag{
  background:#eaf8ee!important;
  color:#166534!important;
}

body.permit-warning .status-pill,
body.permit-warning .status-tag{
  background:#fff8e6!important;
  color:#92400e!important;
}

.verification-hidden{display:none!important}
.verification-toggle-btn{
  width:calc(100% - 20px);
  margin:12px 10px;
  min-height:52px;
  border:none;
  border-radius:16px;
  background:#0f4c81;
  color:#fff;
  font-size:14px;
  font-weight:900;
}
.scanner-verification-panel{
  margin:14px 10px 18px;
  padding:14px;
  border-radius:22px;
  background:#fff8e6;
  border:1px solid #facc15;
}
.presence-summary{
  margin-bottom:12px;
  padding:10px 12px;
  border-radius:14px;
  background:#0f4c81;
  color:#fff;
  text-align:center;
  font-weight:900;
}
.presence-summary.done{background:#16a34a}
.svp-title{font-size:17px;font-weight:900;color:#0f172a}
.svp-sub{font-size:12px;color:#92400e;line-height:1.7;font-weight:800;margin:4px 0 12px}
.svp-list{display:grid;gap:8px}
.svp-row{
  width:100%;
  border:none;
  display:grid;
  grid-template-columns:auto 1fr;
  gap:8px 10px;
  text-align:right;
  direction:rtl;
  background:#fff;
  border:1px solid #f2dfab;
  border-radius:15px;
  padding:12px;
  font-weight:900;
  color:#0f172a;
}
.svp-row.checked{
  background:#eaf8ee;
  border-color:#86efac;
  color:#166534;
}
.svp-check{font-size:22px}
.presence-status{
  grid-column:2;
  font-size:11px;
  color:#64748b;
  font-weight:900;
}
.svp-complete{
  width:100%;
  margin-top:12px;
  min-height:50px;
  border:none;
  border-radius:16px;
  background:#0f4c81;
  color:#fff;
  font-weight:900;
}
.svp-complete.done{background:#16a34a}
</style>
`;

if(!permit.includes("azha-security-permit-final-v3")){
  permit = permit.replace("</body>", permitFix + "\n</body>");
}

fs.writeFileSync(permitPath, permit);
console.log("✅ Fixed scanner overlay date status.");
console.log("✅ Rebuilt optional verification panel.");
console.log("✅ Forced expired status to red in security permit view.");
