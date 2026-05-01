const fs = require("fs");

const p = "PAGES/index.html";
let html = fs.readFileSync(p, "utf8");

const block = `
<script id="azha-verification-stable-server-connected">
(function(){
  function q(){ return new URLSearchParams(location.search); }

  function apiBase(){
    return (window.AZHA_CONFIG && (window.AZHA_CONFIG.API_BASE || (window.AZHA_CONFIG.API && window.AZHA_CONFIG.API.BASE_URL))) ||
      "https://azha-backend-production.up.railway.app/api";
  }

  function presenceUrl(){
    return apiBase().replace(/\\/api\\/?$/, "/api/presence");
  }

  function esc(v){
    return String(v||"")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function splitNames(raw){
    return String(raw || "")
      .split(/\\s*\\/\\s*|\\s+-\\s+|[-–—•]+|[,،\\n]+/g)
      .map(x => x.trim())
      .filter(Boolean);
  }

  function getToken(){ return q().get("token") || ""; }

  function context(){
    return {
      token: getToken(),
      sessionToken: q().get("sessionToken") || localStorage.getItem("sessionToken") || "",
      securityUsername: localStorage.getItem("sessionUsername") || sessionStorage.getItem("sessionUsername") || "",
      gateName: localStorage.getItem("sessionGateName") || sessionStorage.getItem("sessionGateName") || ""
    };
  }

  async function fetchPermit(){
    const token = getToken();
    if(!token) return null;

    try{
      const qs = new URLSearchParams({ action:"getClientPermit", token, _t:Date.now() });
      const res = await fetch(apiBase() + "?" + qs.toString(), { cache:"no-store" });
      const json = await res.json();
      return json && json.success ? json.data : null;
    }catch(e){
      return null;
    }
  }

  async function fetchPresence(){
    const token = getToken();
    if(!token) return {};

    try{
      const res = await fetch(presenceUrl() + "?token=" + encodeURIComponent(token) + "&_t=" + Date.now(), { cache:"no-store" });
      const json = await res.json();
      const latest = {};
      if(json && json.success && Array.isArray(json.data)){
        json.data.forEach(x => {
          if(x.guestName) latest[x.guestName] = x;
        });
      }
      return latest;
    }catch(e){
      return {};
    }
  }

  async function postPresence(name, present, data){
    const ctx = context();

    try{
      await fetch(presenceUrl(), {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          token: ctx.token,
          permitId: data.permitId || "",
          unit: data.unit || "",
          guestName: name,
          present,
          sessionToken: ctx.sessionToken,
          securityUsername: ctx.securityUsername,
          gateName: ctx.gateName
        })
      });
    }catch(e){}
  }

  function removeDuplicates(){
    document.querySelectorAll("#azhaStableVerificationWrap").forEach((x,i)=>{ if(i>0) x.remove(); });
  }

  async function build(){
    if(!(q().get("from") === "scanner" || q().get("mode") === "security" || q().get("app") === "1")) return;

    removeDuplicates();
    if(document.getElementById("azhaStableVerificationWrap")) return;

    const data = await fetchPermit();
    if(!data) return;

    const names = splitNames(data.tenantsNames || data.tenantNames || data.guestsNames || data.guests || data.tenant || "");
    if(!names.length) return;

    const saved = await fetchPresence();

    const target =
      document.querySelector(".card") ||
      document.querySelector(".permit-card") ||
      document.querySelector("#app") ||
      document.body;

    const wrap = document.createElement("div");
    wrap.id = "azhaStableVerificationWrap";
    wrap.innerHTML = \`
      <button type="button" class="azha-v-toggle">Show Identity Verification</button>

      <section class="azha-v-panel azha-v-hidden">
        <div class="azha-v-head">
          <div class="azha-v-title">Identity Verification</div>
          <div class="azha-v-sub">يرجى تحديد الأشخاص الموجودين فعليًا أمام الأمن فقط</div>
        </div>

        <div class="azha-v-summary">Present Guests: 0 / \${names.length}</div>

        <div class="azha-v-list">
          \${names.map((n,i)=>\`
            <button type="button" class="azha-v-row" data-name="\${esc(n)}">
              <span class="azha-v-check">☐</span>
              <span class="azha-v-name">\${i+1}. \${esc(n)}</span>
              <small class="azha-v-status">لم تصل بعد</small>
            </button>
          \`).join("")}
        </div>

        <button type="button" class="azha-v-save">Save Present Guests</button>
      </section>
    \`;

    target.appendChild(wrap);

    const toggle = wrap.querySelector(".azha-v-toggle");
    const panel = wrap.querySelector(".azha-v-panel");
    const rows = Array.from(wrap.querySelectorAll(".azha-v-row"));
    const summary = wrap.querySelector(".azha-v-summary");
    const save = wrap.querySelector(".azha-v-save");

    function update(){
      const checked = rows.filter(r => r.classList.contains("checked")).length;
      summary.textContent = "Present Guests: " + checked + " / " + rows.length;
      summary.classList.toggle("done", checked > 0);
    }

    function mark(row, present, timeText){
      row.classList.toggle("checked", present);
      row.querySelector(".azha-v-check").textContent = present ? "☑" : "☐";
      row.querySelector(".azha-v-status").textContent = present ? ("دخل " + timeText) : "لم تصل بعد";
      update();
    }

    rows.forEach(row => {
      const name = row.dataset.name;
      const old = saved[name];

      if(old && old.present){
        mark(row, true, new Date(old.timestamp).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}));
      }

      row.addEventListener("click", async function(){
        const present = !row.classList.contains("checked");
        const time = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
        mark(row, present, time);
        await postPresence(name, present, data);
      });
    });

    toggle.addEventListener("click", function(){
      panel.classList.toggle("azha-v-hidden");
      toggle.textContent = panel.classList.contains("azha-v-hidden") ? "Show Identity Verification" : "Hide Identity Verification";
      if(!panel.classList.contains("azha-v-hidden")) panel.scrollIntoView({behavior:"smooth", block:"start"});
    });

    save.addEventListener("click", function(){
      const checked = rows.filter(r => r.classList.contains("checked")).length;
      if(checked === 0){
        alert("يرجى تحديد شخص واحد على الأقل");
        return;
      }
      save.textContent = "Present Guests Saved ✓";
      save.classList.add("done");
    });

    update();
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(build, 500);
    setTimeout(build, 1500);
    setTimeout(build, 3000);
  });
})();
</script>

<style id="azha-verification-stable-server-connected-style">
#azhaStableVerificationWrap{
  width:100%;
}

.azha-v-toggle{
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

.azha-v-hidden{
  display:none!important;
}

.azha-v-panel{
  margin:14px 10px 18px;
  padding:14px;
  border-radius:22px;
  background:#fff8e6;
  border:1px solid #facc15;
  box-shadow:0 18px 45px rgba(0,0,0,.10);
}

.azha-v-title{
  font-size:17px;
  font-weight:900;
  color:#0f172a;
}

.azha-v-sub{
  margin-top:4px;
  margin-bottom:12px;
  font-size:12px;
  color:#92400e;
  line-height:1.7;
  font-weight:800;
}

.azha-v-summary{
  margin-bottom:12px;
  padding:10px 12px;
  border-radius:14px;
  background:#0f4c81;
  color:#fff;
  text-align:center;
  font-weight:900;
}

.azha-v-summary.done{
  background:#16a34a;
}

.azha-v-list{
  display:grid;
  gap:8px;
}

.azha-v-row{
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

.azha-v-row.checked{
  background:#eaf8ee;
  border-color:#86efac;
  color:#166534;
}

.azha-v-check{
  font-size:22px;
}

.azha-v-status{
  grid-column:2;
  font-size:11px;
  color:#64748b;
  font-weight:900;
}

.azha-v-save{
  width:100%;
  margin-top:12px;
  min-height:50px;
  border:none;
  border-radius:16px;
  background:#0f4c81;
  color:#fff;
  font-weight:900;
}

.azha-v-save.done{
  background:#16a34a;
}
</style>
`;

if(!html.includes("azha-verification-stable-server-connected")){
  html = html.replace("</body>", block + "\n</body>");
}

fs.writeFileSync(p, html, "utf8");

console.log("✅ Optional stable server-connected verification restored.");
