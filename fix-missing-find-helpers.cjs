const fs = require("fs");
let js = fs.readFileSync("JS/dashboard.js", "utf8");

const helpers = `
/* ===== AZHA ENTERPRISE SAFE FIND HELPERS ===== */
function findUserById(id) {
  id = String(id || "");
  if (!Array.isArray(window.adminUsers) && typeof adminUsers !== "undefined") window.adminUsers = adminUsers;
  const list = window.adminUsers || [];
  return list.find(u =>
    String(u._id || u.id || u.username || "") === id ||
    String(u.username || "") === id
  ) || null;
}

function findGateById(id) {
  id = String(id || "");
  if (!Array.isArray(window.adminGates) && typeof adminGates !== "undefined") window.adminGates = adminGates;
  const list = window.adminGates || [];
  return list.find(g =>
    String(g._id || g.id || g.name || g.gateName || "") === id ||
    String(g.name || "") === id ||
    String(g.gateName || "") === id
  ) || null;
}

function findPermitById(id) {
  id = String(id || "");
  if (!Array.isArray(window.adminPermits) && typeof adminPermits !== "undefined") window.adminPermits = adminPermits;
  const list = window.adminPermits || [];
  return list.find(p =>
    String(p._id || p.id || p.permitId || "") === id ||
    String(p.permitId || "") === id
  ) || null;
}
/* ===== END SAFE FIND HELPERS ===== */

`;

js = js.replace(/\/\* ===== AZHA ENTERPRISE SAFE FIND HELPERS ===== \*\/[\s\S]*?\/\* ===== END SAFE FIND HELPERS ===== \*\/\s*/g, "");
js = helpers + js;

fs.writeFileSync("JS/dashboard.js", js, "utf8");
console.log("AZHA safe find helpers injected.");
