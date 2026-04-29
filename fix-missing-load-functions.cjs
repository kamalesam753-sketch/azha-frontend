const fs = require("fs");
let js = fs.readFileSync("JS/dashboard.js", "utf8");

/* ===== FORCE RESTORE CORE LOAD FUNCTIONS ===== */

if (!js.includes("window.loadAdminPermits")) {

js += `

/* ===== AZHA ENTERPRISE LOAD ENGINE (FORCED) ===== */

window.loadAdminPermits = async function () {
  try {
    const res = await AzhaApi.get({ action: "getPermits" });
    const data = (res && res.data) || [];

    if (typeof window.renderAdminPermits === "function") {
      window.renderAdminPermits(data);
    }

  } catch (e) {
    console.error("loadAdminPermits failed:", e);
  }
};

window.loadAdminUsers = async function () {
  try {
    const res = await AzhaApi.get({ action: "getUsers" });
    const data = (res && res.data) || [];

    if (typeof window.renderAdminUsers === "function") {
      window.renderAdminUsers(data);
    }

  } catch (e) {
    console.error("loadAdminUsers failed:", e);
  }
};

window.loadAdminGates = async function () {
  try {
    const res = await AzhaApi.get({ action: "getGates" });
    const data = (res && res.data) || [];

    if (typeof window.renderAdminGates === "function") {
      window.renderAdminGates(data);
    }

  } catch (e) {
    console.error("loadAdminGates failed:", e);
  }
};

/* ===== END LOAD ENGINE ===== */

`;
}

fs.writeFileSync("JS/dashboard.js", js, "utf8");
console.log("🔥 FORCED LOAD FUNCTIONS RESTORED");
