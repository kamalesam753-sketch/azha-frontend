const fs = require("fs");

const p = "PAGES/security-logs/index.html";
let html = fs.readFileSync(p, "utf8");

html = html.replace(
`        <div class="present">
          PRESENT
        </div>`,
`        <div class="present">
          \${x.present ? "PRESENT" : "NOT PRESENT"}
        </div>`
);

fs.writeFileSync(p, html, "utf8");

console.log("✅ PRESENT status renderer fixed");
