const fs = require("fs");
let js = fs.readFileSync("JS/dashboard.js","utf8");

/* 🔥 لو مش موجودين → نحطهم في أول الملف */
if (!js.includes("function buildActionButton(")) {

js =
`/* ===== AZHA ENTERPRISE ACTION CORE ===== */

function buildActionButton(action, id, label, cls) {
  return '<button type="button" class="admin-action-btn ' +
    (cls || "") +
    '" data-admin-action="' + action +
    '" data-admin-id="' + id + '">' + label + '</button>';
}

function bindEnterpriseActionDelegation() {
  if (window.__AZHA_ADMIN_ACTIONS_BOUND__) return;
  window.__AZHA_ADMIN_ACTIONS_BOUND__ = true;

  document.addEventListener("click", function (event) {
    const btn = event.target.closest && event.target.closest("[data-admin-action]");
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    const action = btn.getAttribute("data-admin-action");
    const id = btn.getAttribute("data-admin-id");

    if (action === "edit-permit") return window.editAdminPermit(id);
    if (action === "client-card") return window.generateClientPermitLink(id);
    if (action === "delete-permit") return window.deleteAdminPermit(id);

    if (action === "edit-user") return window.editAdminUser(id);
    if (action === "reset-user-password") return window.resetAdminUserPassword(id);
    if (action === "delete-user") return window.deleteAdminUser(id);

    if (action === "edit-gate") return window.editAdminGate(id);
    if (action === "delete-gate") return window.deleteAdminGate(id);
  }, true);
}

/* ===== END ACTION CORE ===== */

` + js;

}

fs.writeFileSync("JS/dashboard.js",js,"utf8");
console.log("🔥 FORCE-INJECTED ACTION ENGINE AT TOP");
