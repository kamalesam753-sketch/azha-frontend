const fs = require("fs");

const htmlPath = "PAGES/dashboard.html";
const hotfixPath = "JS/dashboard-hotfix.js";

let html = fs.readFileSync(htmlPath, "utf8");

const hotfix = `(function () {
  "use strict";

  function cleanText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function closestButton(target) {
    return target && target.closest ? target.closest("button") : null;
  }

  function getRowPermitId(btn) {
    const row = btn.closest("tr");
    if (!row) return "";
    const cells = row.querySelectorAll("td");
    const unit = cells[8] ? cells[8].textContent.trim() : "";
    const tenant = cells[7] ? cells[7].textContent.trim() : "";
    const all = window.adminPermits || [];
    const found = all.find(function (p) {
      return String(p.unit || "").trim() === unit || String(p.tenant || "").trim() === tenant;
    });
    return found ? (found.permitId || found._id || "") : "";
  }

  function stripBrokenInlineActions() {
    document.querySelectorAll(".admin-row-actions button").forEach(function (btn) {
      btn.removeAttribute("onclick");
    });
  }

  function lockSidebarLeft() {
    document.documentElement.setAttribute("dir", "ltr");
    document.body.setAttribute("dir", "ltr");

    const styleId = "azha-final-left-sidebar-hotfix";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = \`
        html, body { direction: ltr !important; }
        .layout {
          direction: ltr !important;
          display: grid !important;
          grid-template-columns: var(--sidebar-w) minmax(0, 1fr) !important;
        }
        .sidebar {
          grid-column: 1 !important;
          grid-row: 1 !important;
          left: 0 !important;
          right: auto !important;
          border-right: 1px solid var(--line) !important;
          border-left: none !important;
        }
        .main {
          grid-column: 2 !important;
          grid-row: 1 !important;
          direction: ltr !important;
        }
        @media (max-width: 1250px) {
          .layout { grid-template-columns: 1fr !important; }
          .main { grid-column: 1 !important; }
          .sidebar {
            position: fixed !important;
            left: 0 !important;
            right: auto !important;
            transform: translateX(-100%) !important;
          }
          .sidebar.open { transform: translateX(0) !important; }
        }
      \`;
      document.head.appendChild(style);
    }
  }

  function bindSafeActionInterceptor() {
    document.addEventListener("click", function (event) {
      const btn = closestButton(event.target);
      if (!btn) return;

      const text = cleanText(btn.textContent);
      const row = btn.closest("tr");
      const inPermits = !!btn.closest("#adminPermitsTableBody");
      const inUsers = !!btn.closest("#adminUsersTableBody");
      const inGates = !!btn.closest("#adminGatesTableBody");

      if (btn.closest(".admin-row-actions")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (inPermits) {
          const pid = getRowPermitId(btn);
          if (!pid) {
            if (typeof showToast === "function") showToast("err", "Permit ID not found for this row.");
            return;
          }

          if (text.includes("edit") && typeof window.editAdminPermit === "function") return window.editAdminPermit(pid);
          if (text.includes("client") && typeof window.generateClientPermitLink === "function") return window.generateClientPermitLink(pid);
          if (text.includes("delete") && typeof window.deleteAdminPermit === "function") return window.deleteAdminPermit(pid);
        }

        if (inUsers) {
          const username = row && row.children[0] ? row.children[0].textContent.trim() : "";
          const all = window.adminUsers || [];
          const found = all.find(function (u) { return String(u.username || "").trim() === username; });
          const uid = found ? (found._id || found.username || username) : username;

          if (text.includes("edit") && typeof window.editAdminUser === "function") return window.editAdminUser(uid);
          if (text.includes("reset") && typeof window.resetAdminUserPassword === "function") return window.resetAdminUserPassword(uid);
          if (text.includes("delete") && typeof window.deleteAdminUser === "function") return window.deleteAdminUser(uid);
        }

        if (inGates) {
          const gateName = row && row.children[0] ? row.children[0].textContent.trim() : "";
          const all = window.adminGates || [];
          const found = all.find(function (g) { return String(g.name || "").trim() === gateName; });
          const gid = found ? (found._id || "") : "";

          if (!gid) {
            if (typeof showToast === "function") showToast("err", "Gate ID not found for this row.");
            return;
          }

          if (text.includes("edit") && typeof window.editAdminGate === "function") return window.editAdminGate(gid);
          if (text.includes("delete") && typeof window.deleteAdminGate === "function") return window.deleteAdminGate(gid);
        }
      }
    }, true);
  }

  const oldRenderPermitsHook = setInterval(function () {
    stripBrokenInlineActions();
  }, 500);

  setTimeout(function () {
    clearInterval(oldRenderPermitsHook);
  }, 30000);

  document.addEventListener("DOMContentLoaded", function () {
    lockSidebarLeft();
    stripBrokenInlineActions();
    bindSafeActionInterceptor();
  });

  window.addEventListener("load", function () {
    lockSidebarLeft();
    stripBrokenInlineActions();
  });
})();`;

fs.writeFileSync(hotfixPath, hotfix, "utf8");

if (!html.includes("../JS/dashboard-hotfix.js")) {
  html = html.replace(
    '<script src="../JS/dashboard.js"></script>',
    '<script src="../JS/dashboard.js"></script>\\n  <script src="../JS/dashboard-hotfix.js"></script>'
  );
}

fs.writeFileSync(htmlPath, html, "utf8");

console.log("AZHA HOTFIX INSTALLED SUCCESSFULLY");
