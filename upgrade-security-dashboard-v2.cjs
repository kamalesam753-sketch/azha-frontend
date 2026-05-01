const fs = require("fs");

const p = "PAGES/security-logs/index.html";
let html = fs.readFileSync(p, "utf8");

html = html.replace(
`<section class="filters">
  <input class="input" id="searchInput" placeholder="Search guest..." />
  <input class="input" id="gateInput" placeholder="Filter gate..." />
</section>`,
`<section class="filters">
  <input class="input" id="searchInput" placeholder="Search guest..." />
  <input class="input" id="gateInput" placeholder="Filter gate..." />
</section>

<section class="stats" style="margin-top:-4px">
  <div class="card">
    <div class="card-title">Today Logs</div>
    <div class="card-value" id="todayCount">0</div>
  </div>

  <div class="card">
    <div class="card-title">Last Scan</div>
    <div class="card-value" id="lastScanTime" style="font-size:16px">--</div>
  </div>

  <div class="card">
    <div class="card-title">Security Users</div>
    <div class="card-value" id="securityUsers">0</div>
  </div>
</section>

<button class="refresh" id="exportBtn" style="margin-top:0;margin-bottom:14px">
Export CSV
</button>`
);

html = html.replace(
`const gateCountEl = document.getElementById("gateCount");`,
`const gateCountEl = document.getElementById("gateCount");

const todayCountEl = document.getElementById("todayCount");
const lastScanTimeEl = document.getElementById("lastScanTime");
const securityUsersEl = document.getElementById("securityUsers");`
);

html = html.replace(
`  totalLogsEl.textContent = list.length;`,
`
  totalLogsEl.textContent = list.length;

  const today = new Date().toDateString();

  const todayLogs = list.filter(x => {
    try{
      return new Date(x.timestamp).toDateString() === today;
    }catch(e){
      return false;
    }
  });

  todayCountEl.textContent = todayLogs.length;

  securityUsersEl.textContent =
    new Set(list.map(x => x.securityUsername || "-")).size;
`
);

html = html.replace(
`  gateCountEl.textContent =
    new Set(list.map(x => x.gateName || "-")).size;`,
`  gateCountEl.textContent =
    new Set(list.map(x => x.gateName || "-")).size;

  if(list.length){
    try{
      const latest = list[0];
      const t = new Date(latest.timestamp);

      lastScanTimeEl.textContent =
        t.toLocaleTimeString([],{
          hour:"2-digit",
          minute:"2-digit"
        });

    }catch(e){}
  }`
);

html = html.replace(
`        <div class="present">
          PRESENT
        </div>`,
`        <div class="present">
          ${x.present ? "PRESENT" : "NOT PRESENT"}
        </div>`
);

html = html.replace(
`loadLogs();

setInterval(loadLogs, 15000);`,
`
document
  .getElementById("exportBtn")
  .addEventListener("click", function(){

    if(!ALL.length){
      alert("No logs to export");
      return;
    }

    const headers = [
      "timestamp",
      "guestName",
      "permitId",
      "unit",
      "gateName",
      "securityUsername",
      "present"
    ];

    const rows = ALL.map(x => [
      x.timestamp,
      x.guestName,
      x.permitId,
      x.unit,
      x.gateName,
      x.securityUsername,
      x.present
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(r =>
        r.map(v =>
          '"' + String(v || "").replace(/"/g,'""') + '"'
        ).join(",")
      )
    ].join("\\n");

    const blob = new Blob([csv], {
      type:"text/csv"
    });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download =
      "azha-security-logs-" +
      new Date().toISOString().slice(0,10) +
      ".csv";

    a.click();
  });

loadLogs();

setInterval(loadLogs, 15000);`
);

fs.writeFileSync(p, html, "utf8");

console.log("✅ Security Logs Dashboard upgraded to V2");
