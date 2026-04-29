const fs = require("fs");

const jsPath = "JS/dashboard.js";
const htmlPath = "PAGES/dashboard.html";

let js = fs.readFileSync(jsPath, "utf8");
let html = fs.readFileSync(htmlPath, "utf8");

fs.writeFileSync(jsPath + ".backup-before-final-fix", js);
fs.writeFileSync(htmlPath + ".backup-before-final-fix", html);

js = js.replace(/function\s+safeJson\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}/, `function safeArg(v) {
  return encodeURIComponent(String(v || ""));
}`);

js = js.replace(/safeJson\(/g, "safeArg(");

const fixes = [
  ["editAdminPermit", "pid", "Edit"],
  ["generateClientPermitLink", "pid", "Client Card"],
  ["deleteAdminPermit", "pid", "Delete"],
  ["editAdminUser", "uid", "Edit"],
  ["resetAdminUserPassword", "uid", "Reset PW"],
  ["deleteAdminUser", "uid", "Delete"],
  ["editAdminGate", "gid", "Edit"],
  ["deleteAdminGate", "gid", "Delete"]
];

for (const [fn, variable, label] of fixes) {
  const re = new RegExp(`'<button class="admin-action-btn ([^"]+)" onclick="${fn}\\\\(' \\+ safeArg\\\\(${variable}\\\\) \\+ '\\\\)">` + label + `<\\\\/button>'`, "g");
  js = js.replace(re, `'<button class="admin-action-btn $1" onclick="${fn}(decodeURIComponent(\\\\'' + safeArg(${variable}) + '\\\\'))">${label}</button>'`);
}

js = js.replace(
  /window\.generateClientPermitLink = async function \(permitId\) \{[\s\S]*?\n\s*\};\s*\n\s*window\.deleteAdminPermit/,
`window.generateClientPermitLink = async function (permitId) {
    if (!permitId) {
      toast("err", "Missing permit ID.");
      return;
    }

    try {
      if (typeof showLoading === "function") showLoading("Generating client card link...");

      let res = await AdminPermitService.generateClientToken(permitId);

      if (!(res && res.success && res.data)) {
        res = await svc.get({ action: "getTokenByPermit", id: permitId });
      }

      if (!(res && res.success && res.data)) {
        toast("err", (res && res.message) || "Failed to generate client card link.");
        return;
      }

      const token = res.data.token || res.data.secureToken || "";
      if (!token) {
        toast("err", "Token was not returned from backend.");
        return;
      }

      const clientLink = window.location.origin + "/client?token=" + encodeURIComponent(token);
      window.lastGeneratedClientLink = clientLink;

      const copied = await copyText(clientLink);

      if (typeof showNotice === "function") {
        showNotice("ok", "Client Card Link: " + clientLink, false);
      }

      toast("ok", copied ? "Client card link generated and copied." : "Client card link generated.");

      if (!copied) {
        prompt("Copy client card link:", clientLink);
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error generating client card link.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.deleteAdminPermit`
);

html = html.replace(
  /window\.generateClientPermitLink = async function \(permitId\) \{[\s\S]*?\n\s*\};\s*(?=\n\s*document\.addEventListener\("DOMContentLoaded")/,
  ""
);

if (!html.includes("FINAL SIDEBAR LEFT LOCK")) {
  html = html.replace("</style>", `
    /* FINAL SIDEBAR LEFT LOCK - NO DOWNGRADE */
    .layout {
      grid-template-columns: var(--sidebar-w) 1fr !important;
    }

    .sidebar {
      grid-column: 1 !important;
      border-right: 1px solid var(--line) !important;
      border-left: none !important;
    }

    .main {
      grid-column: 2 !important;
    }

    @media (max-width: 1250px) {
      .sidebar {
        left: 0 !important;
        right: auto !important;
        transform: translateX(-100%) !important;
      }

      .sidebar.open {
        transform: translateX(0) !important;
      }
    }
  </style>`);
}

fs.writeFileSync(jsPath, js, "utf8");
fs.writeFileSync(htmlPath, html, "utf8");

console.log("FINAL FIX APPLIED SUCCESSFULLY");
