const fs = require("fs");

const htmlPath = "PAGES/dashboard.html";
const jsPath = "JS/dashboard.js";

let html = fs.readFileSync(htmlPath, "utf8");
let js = fs.readFileSync(jsPath, "utf8");

fs.copyFileSync(htmlPath, htmlPath + ".backup-before-dashboard-lock");
fs.copyFileSync(jsPath, jsPath + ".backup-before-dashboard-lock");

/* 1) Disable risky dashboard-hotfix include */
html = html.replace(
  /<script\s+src=["']\.\.\/JS\/dashboard-hotfix\.js["']>\s*<\/script>/g,
  "<!-- dashboard-hotfix disabled after dashboard lock -->"
);

/* 2) Fix Admin Permits table only */
const tbodyMarker = 'id="adminPermitsTableBody"';
const tbodyIndex = html.indexOf(tbodyMarker);
if (tbodyIndex === -1) throw new Error("adminPermitsTableBody not found");

const tableStart = html.lastIndexOf("<table", tbodyIndex);
const tableEnd = html.indexOf("</table>", tbodyIndex) + "</table>".length;
if (tableStart === -1 || tableEnd === -1) throw new Error("Admin permits table boundaries not found");

let tableBlock = html.slice(tableStart, tableEnd);

const finalThead = `<thead>
                <tr>
                  <th>Unit</th>
                  <th>Tenant</th>
                  <th>Guests</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Phone</th>
                  <th>Car Plate</th>
                  <th>Actions</th>
                </tr>
              </thead>`;

tableBlock = tableBlock.replace(/<thead>[\s\S]*?<\/thead>/, finalThead);
tableBlock = tableBlock.replace(/colspan="9"/g, 'colspan="10"');

html = html.slice(0, tableStart) + tableBlock + html.slice(tableEnd);

/* 3) Fix broken visible dashboard text */
html = html
  .replace(/âž•/g, "➕")
  .replace(/Ø¥Ø¶Ø§ÙØ© ØªØµØ±ÙŠØ­/g, "Add Permit")
  .replace(/ØªØ¹Ø¯ÙŠÙ„ ØªØµØ±ÙŠØ­/g, "Edit Permit")
  .replace(/Ø¨Ø­Ø« Ø¨Ø§Ù„ÙˆØ­Ø¯Ø© \/ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø± \/ Ø§Ù„Ù‡Ø§ØªÙ \/ Ø±Ù‚Ù… Ø§Ù„Ø³ÙŠØ§Ø±Ø© \/ Ø§Ù„Ø­Ø§Ù„Ø©/g, "Search by unit / tenant / phone / car plate / status")
  .replace(/Ø³Ø§Ø±ÙŠ/g, "ساري")
  .replace(/Ø§Ù†ØªÙ‡Ù‰/g, "انتهى")
  .replace(/Ù„Ù… ÙŠØ¨Ø¯Ø£/g, "لم يبدأ")
  .replace(/Ø¢Ø®Ø± ÙŠÙˆÙ… Ø³Ø§Ø±ÙŠ/g, "آخر يوم ساري")
  .replace(/ØºÙŠØ± Ù…Ø­Ø¯Ø¯/g, "غير محدد")
  .replace(/ØªÙ… Ø§Ù„Ø¯ÙØ¹/g, "تم الدفع");

/* 4) Safety check dashboard.js must be the new stable version */
if (js.includes("safeJson(pid)") || js.includes("colspan=\"9\"")) {
  throw new Error("Your JS/dashboard.js is the OLD broken version. Replace it with the CLEAN FINAL STABLE VERSION before pushing.");
}

if (!js.includes('data-admin-action') || !js.includes('client-card')) {
  throw new Error("dashboard.js missing enterprise action delegation/client-card logic.");
}

fs.writeFileSync(htmlPath, html, "utf8");

console.log("✅ Dashboard HTML locked.");
console.log("✅ Admin Permits columns aligned.");
console.log("✅ dashboard-hotfix disabled.");
console.log("✅ Mojibake visible text fixed.");
console.log("✅ dashboard.js safety check passed.");
