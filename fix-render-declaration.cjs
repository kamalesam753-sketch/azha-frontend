const fs = require("fs");
let js = fs.readFileSync("JS/dashboard.js", "utf8");

js = js
  .replace(/function\s+window\.renderAdminPermits\s*\(data\)\s*\{/g, "window.renderAdminPermits = function (data) {")
  .replace(/window\.window\.loadAdminPermits\(/g, "window.loadAdminPermits(")
  .replace(/window\.window\.loadAdminUsers\(/g, "window.loadAdminUsers(")
  .replace(/window\.window\.loadAdminGates\(/g, "window.loadAdminGates(")
  .replace(/window\.window\.renderAdminPermits\(/g, "window.renderAdminPermits(");

fs.writeFileSync("JS/dashboard.js", js, "utf8");
console.log("Fixed invalid window.renderAdminPermits declaration.");
