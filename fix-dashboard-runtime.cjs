const fs = require("fs");
let js = fs.readFileSync("JS/dashboard.js", "utf8");
let html = fs.readFileSync("PAGES/dashboard.html", "utf8");

const injectBefore = "  window.loadAdminPermits = async function";

if (!js.includes("function buildActionButton(")) {
  js = js.replace(injectBefore, `
  function buildActionButton(action, id, label, cls) {
    return '<button type="button" class="admin-action-btn ' + escHtml(cls || "") +
      '" data-admin-action="' + escHtml(action) +
      '" data-admin-id="' + attr(id) + '">' + escHtml(label) + '</button>';
  }

  function bindEnterpriseActionDelegation() {
    if (window.__AZHA_ADMIN_ACTIONS_BOUND__) return;
    window.__AZHA_ADMIN_ACTIONS_BOUND__ = true;

    document.addEventListener("click", function (event) {
      const btn = event.target && event.target.closest ? event.target.closest("[data-admin-action]") : null;
      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();

      const action = btn.getAttribute("data-admin-action") || "";
      const id = decodeId(btn.getAttribute("data-admin-id") || "");

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

` + injectBefore);
}

/* إصلاح النصوص المضروبة الأساسية */
html = html
  .replace(/Ø¨Ø­Ø«[^"]*/g, "Search by unit / tenant / phone / car plate / status")
  .replace(/Ø¥Ø¶Ø§Ù.?Ø© ØªØµØ±ÙŠØ­/g, "Add Permit")
  .replace(/ØªÙ… Ø§Ù„Ø¯Ù.?Ø¹/g, "تم الدفع")
  .replace(/Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¯Ù.?Ø¹/g, "لم يتم الدفع")
  .replace(/Ø³Ø§Ø±ÙŠ/g, "ساري")
  .replace(/Ù„Ù… ÙŠØ¨Ø¯Ø£/g, "لم يبدأ")
  .replace(/Ø¢Ø®Ø± ÙŠÙˆÙ… Ø³Ø§Ø±ÙŠ/g, "آخر يوم ساري")
  .replace(/Ø§Ù†ØªÙ‡Ù‰/g, "انتهى")
  .replace(/ØºÙŠØ± Ù…Ø­Ø¯Ø¯/g, "غير محدد");

fs.writeFileSync("JS/dashboard.js", js, "utf8");
fs.writeFileSync("PAGES/dashboard.html", html, "utf8");

console.log("AZHA dashboard missing functions restored + encoding cleanup applied.");
