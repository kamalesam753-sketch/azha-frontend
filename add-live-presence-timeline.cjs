const fs = require("fs");

const p = "PAGES/security-logs/index.html";
let html = fs.readFileSync(p, "utf8");

/* =========================
   ENTERPRISE LIVE PANEL
========================= */

if (!html.includes("presenceTimeline")) {

html = html.replace(
`</body>`,
`
<style>

.timeline{
  margin-top:18px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.timeline-card{
  background:#0f172a;
  color:#fff;
  border-radius:18px;
  padding:14px;
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 10px 30px rgba(0,0,0,.18);
}

.timeline-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}

.timeline-name{
  font-size:16px;
  font-weight:900;
}

.timeline-time{
  font-size:12px;
  opacity:.7;
}

.timeline-meta{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}

.meta-box{
  background:rgba(255,255,255,.06);
  padding:10px;
  border-radius:12px;
  font-size:13px;
}

.present-pill{
  margin-top:12px;
  padding:10px;
  border-radius:12px;
  text-align:center;
  font-weight:900;
}

.present-yes{
  background:#14532d;
  color:#bbf7d0;
}

.present-no{
  background:#7f1d1d;
  color:#fecaca;
}

.live-dot{
  width:10px;
  height:10px;
  border-radius:999px;
  background:#22c55e;
  box-shadow:0 0 12px #22c55e;
  animation:pulse 1s infinite;
}

.live-head{
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:12px;
  font-size:15px;
  font-weight:900;
}

@keyframes pulse{
  0%{opacity:1}
  50%{opacity:.3}
  100%{opacity:1}
}

</style>

<script>

(function(){

  const old = document.getElementById("logs");

  if(!old) return;

  const wrap = document.createElement("div");

  wrap.innerHTML = \`
    <div class="live-head">
      <div class="live-dot"></div>
      LIVE SECURITY PRESENCE
    </div>

    <div id="presenceTimeline" class="timeline"></div>
  \`;

  old.parentNode.insertBefore(wrap, old);

  const originalRender = window.renderLogs;

  window.renderLogs = function(list){

    if(originalRender){
      originalRender(list);
    }

    const box =
      document.getElementById("presenceTimeline");

    if(!box) return;

    box.innerHTML = "";

    const sorted =
      [...list]
      .sort((a,b)=>
        new Date(b.timestamp) - new Date(a.timestamp)
      )
      .slice(0,20);

    sorted.forEach(x=>{

      const d = new Date(x.timestamp);

      const el = document.createElement("div");

      el.className = "timeline-card";

      el.innerHTML = \`
        <div class="timeline-top">
          <div class="timeline-name">
            \${x.guestName || "-"}
          </div>

          <div class="timeline-time">
            \${d.toLocaleTimeString([],{
              hour:"2-digit",
              minute:"2-digit",
              second:"2-digit"
            })}
          </div>
        </div>

        <div class="timeline-meta">

          <div class="meta-box">
            <b>Permit</b><br>
            \${x.permitId || "-"}
          </div>

          <div class="meta-box">
            <b>Unit</b><br>
            \${x.unit || "-"}
          </div>

          <div class="meta-box">
            <b>Gate</b><br>
            \${x.gateName || "-"}
          </div>

          <div class="meta-box">
            <b>Security</b><br>
            \${x.securityUsername || "-"}
          </div>

        </div>

        <div class="present-pill \${x.present ? "present-yes" : "present-no"}">
          \${x.present ? "PRESENT" : "NOT PRESENT"}
        </div>
      \`;

      box.appendChild(el);

    });

  };

})();
</script>

</body>`
);

}

fs.writeFileSync(p, html, "utf8");

console.log("✅ Enterprise LIVE Security Timeline Added");

