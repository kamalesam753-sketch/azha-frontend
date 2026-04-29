const fs = require("fs");

let js = fs.readFileSync("JS/dashboard.js", "utf8");
let html = fs.readFileSync("PAGES/dashboard.html", "utf8");

js = js
  .replace(/\bloadAdminPermits\(/g, "window.loadAdminPermits(")
  .replace(/\bloadAdminUsers\(/g, "window.loadAdminUsers(")
  .replace(/\bloadAdminGates\(/g, "window.loadAdminGates(")
  .replace(/\brenderAdminPermits\(/g, "window.renderAdminPermits(");

js = js.replace(
  /function renderAdminPermits\(data\) \{/,
  "window.renderAdminPermits = function (data) {"
);

html = html
  .replace(/Ø¨Ø­Ø«[^"]*/g, "Search by unit / tenant / phone / car plate / status")
  .replace(/Ø¥Ø¶Ø§Ù.?Ø© ØªØµØ±ÙŠØ.?/g, "Add Permit")
  .replace(/ØªÙ… Ø§Ù„Ø¯Ù.?Ø¹/g, "تم الدفع")
  .replace(/Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¯Ù.?Ø¹/g, "لم يتم الدفع")
  .replace(/Ø³Ø§Ø±ÙŠ/g, "ساري")
  .replace(/Ù„Ù… ÙŠØ¨Ø¯Ø£/g, "لم يبدأ")
  .replace(/Ø¢Ø®Ø± ÙŠÙˆÙ… Ø³Ø§Ø±ÙŠ/g, "آخر يوم ساري")
  .replace(/Ø§Ù†ØªÙ‡Ù‰/g, "انتهى")
  .replace(/ØºÙŠØ± Ù…Ø.?Ø¯Ø¯/g, "غير محدد");

fs.writeFileSync("JS/dashboard.js", js, "utf8");
fs.writeFileSync("PAGES/dashboard.html", html, "utf8");

console.log("AZHA admin panel scope fixed.");
