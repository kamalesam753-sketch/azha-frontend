const fs = require("fs");

const dashboardPath = "JS/dashboard.js";
const hotfixPath = "JS/dashboard-hotfix.js";
const htmlPath = "PAGES/dashboard.html";

let dashboard = fs.readFileSync(dashboardPath, "utf8");
let hotfix = fs.readFileSync(hotfixPath, "utf8");
let html = fs.readFileSync(htmlPath, "utf8");

/* expose admin arrays to hotfix */
dashboard = dashboard.replace(
  /adminPermits = res\.data \|\| \[\];\s*renderAdminPermits\(adminPermits\);/,
  `adminPermits = res.data || [];
      window.adminPermits = adminPermits;
      renderAdminPermits(adminPermits);`
);

dashboard = dashboard.replace(
  /adminUsers = res\.data \|\| \[\];\s*renderAdminUsers\(adminUsers\);/,
  `adminUsers = res.data || [];
      window.adminUsers = adminUsers;
      renderAdminUsers(adminUsers);`
);

dashboard = dashboard.replace(
  /adminGates = res\.data \|\| \[\];\s*renderAdminGates\(adminGates\);/,
  `adminGates = res.data || [];
      window.adminGates = adminGates;
      renderAdminGates(adminGates);`
);

/* fix mojibake/static text */
const replacements = [
  [/â€¢/g, "•"],
  [/âž•/g, "➕"],
  [/Admin Panel/g, "Admin Panel"],
  [/Security Users/g, "Security Users"],
  [/Gates Registry/g, "Gates Registry"]
];

for (const [bad, good] of replacements) {
  dashboard = dashboard.replace(bad, good);
  html = html.replace(bad, good);
  hotfix = hotfix.replace(bad, good);
}

/* replace broken Arabic search placeholder with clean English */
html = html.replace(
  /placeholder="[^"]*الوحدة[^"]*"/g,
  'placeholder="Search by unit / tenant / phone / car plate / status"'
);

html = html.replace(/>.*Add Permit/g, ">➕ Add Permit");
html = html.replace(/â€‍/g, "");
html = html.replace(/�/g, "");

/* stronger permit id resolver */
hotfix = hotfix.replace(
  /function getRowPermitId\(btn\) \{[\s\S]*?\n  \}/,
`function getRowPermitId(btn) {
    const row = btn.closest("tr");
    if (!row) return "";

    const rows = Array.from(document.querySelectorAll("#adminPermitsTableBody tr"));
    const rowIndex = rows.indexOf(row);
    const all = window.adminPermits || [];

    const cells = row.querySelectorAll("td");
    const unit = cells[8] ? cells[8].textContent.trim() : "";
    const tenant = cells[7] ? cells[7].textContent.trim() : "";
    const phone = cells[2] ? cells[2].textContent.trim() : "";
    const carPlate = cells[1] ? cells[1].textContent.trim() : "";

    let found = all.find(function (p) {
      return (
        String(p.unit || "").trim() === unit &&
        String(p.tenant || "").trim() === tenant
      );
    });

    if (!found) {
      found = all.find(function (p) {
        return (
          String(p.unit || "").trim() === unit ||
          String(p.tenant || "").trim() === tenant ||
          String(p.phone || "").trim() === phone ||
          String(p.carPlate || "").trim() === carPlate
        );
      });
    }

    if (!found && rowIndex >= 0 && all[rowIndex]) {
      found = all[rowIndex];
    }

    return found ? (found.permitId || found._id || "") : "";
  }`
);

fs.writeFileSync(dashboardPath, dashboard, "utf8");
fs.writeFileSync(hotfixPath, hotfix, "utf8");
fs.writeFileSync(htmlPath, html, "utf8");

console.log("AZHA ACTION IDS + ENCODING FIX APPLIED");
