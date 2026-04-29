const fs = require("fs");
let js = fs.readFileSync("JS/dashboard.js", "utf8");

const loadEngine = `
/* ===== AZHA ENTERPRISE FORCED ADMIN LOAD ENGINE ===== */
window.loadAdminPermits = async function () {
  try {
    const res = await AzhaApi.get({ action: "getPermits" });
    const data = (res && res.data) || [];
    if (typeof window.renderAdminPermits === "function") window.renderAdminPermits(data);
  } catch (e) {
    console.error("loadAdminPermits failed:", e);
  }
};

window.loadAdminUsers = async function () {
  try {
    const res = await AzhaApi.get({ action: "getUsers" });
    const data = (res && res.data) || [];
    if (typeof renderAdminUsers === "function") renderAdminUsers(data);
  } catch (e) {
    console.error("loadAdminUsers failed:", e);
  }
};

window.loadAdminGates = async function () {
  try {
    const res = await AzhaApi.get({ action: "getGates" });
    const data = (res && res.data) || [];
    if (typeof renderAdminGates === "function") renderAdminGates(data);
  } catch (e) {
    console.error("loadAdminGates failed:", e);
  }
};
/* ===== END ADMIN LOAD ENGINE ===== */

`;

js = js.replace(/\/\* ===== AZHA ENTERPRISE FORCED ADMIN LOAD ENGINE ===== \*\/[\s\S]*?\/\* ===== END ADMIN LOAD ENGINE ===== \*\/\s*/g, "");

js = loadEngine + js;

fs.writeFileSync("JS/dashboard.js", js, "utf8");
console.log("FORCE PREPENDED admin load engine.");
