const fs = require("fs");

function read(p){ return fs.readFileSync(p, "utf8"); }
function write(p,s){ fs.writeFileSync(p, s, "utf8"); }

function replaceFunction(src, fnName, replacement) {
  const marker = "function " + fnName + "(";
  const start = src.indexOf(marker);
  if (start === -1) throw new Error("Function not found: " + fnName);
  const braceStart = src.indexOf("{", start);
  let depth = 0, end = -1;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    if (depth === 0) { end = i + 1; break; }
  }
  if (end === -1) throw new Error("Function end not found: " + fnName);
  return src.slice(0, start) + replacement + src.slice(end);
}

let html = read("PAGES/dashboard.html");
let js = read("JS/dashboard.js");

/* ---------- Dashboard HTML Upgrade ---------- */

if (!html.includes('id="adminStatusFilter"')) {
  html = html.replace(
    '<button class="btn btn-primary" onclick="openAdminPermitModal()">➕ Add Permit</button>\n          </div>',
    `<button class="btn btn-primary" onclick="openAdminPermitModal()">➕ Add Permit</button>
          </div>

          <div class="admin-enterprise-filters">
            <select id="adminStatusFilter" class="select">
              <option value="">All Statuses</option>
              <option value="valid">Active / Valid</option>
              <option value="warning">Warning</option>
              <option value="invalid">Expired / Invalid</option>
              <option value="not_found">Not Found</option>
            </select>

            <select id="adminPaymentFilter" class="select">
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <select id="adminSortFilter" class="select">
              <option value="updatedDesc">Newest Updated</option>
              <option value="startAsc">Start Date ↑</option>
              <option value="endAsc">End Date ↑</option>
              <option value="unitAsc">Unit ↑</option>
              <option value="tenantAsc">Tenant ↑</option>
              <option value="statusAsc">Status ↑</option>
            </select>
          </div>`
  );
}

if (!html.includes("AZHA ENTERPRISE DASHBOARD FINAL UPGRADE")) {
  html = html.replace(
    "</style>",
    `
    /* AZHA ENTERPRISE DASHBOARD FINAL UPGRADE */
    .admin-enterprise-filters{
      display:grid;
      grid-template-columns:repeat(3, minmax(180px, 1fr));
      gap:10px;
      margin:0 0 14px;
    }
    .admin-enterprise-filters .select{
      min-height:44px;
      font-weight:800;
      background:#fff;
    }
    .status-tag{
      box-shadow:0 6px 14px rgba(15,76,129,.06);
    }
    .status-tag.tag-valid{
      background:var(--ok-bg)!important;
      color:var(--ok-text)!important;
      border:1px solid #cdebd5;
    }
    .status-tag.tag-warning{
      background:var(--warn-bg)!important;
      color:var(--warn-text)!important;
      border:1px solid #f2dfab;
    }
    .status-tag.tag-invalid{
      background:var(--bad-bg)!important;
      color:var(--bad-text)!important;
      border:1px solid #f5c2c7;
    }
    .status-subline{
      display:block;
      margin-top:6px;
      font-size:11px;
      color:#64748b;
      font-weight:800;
      line-height:1.5;
    }
    .admin-table table{
      min-width:1320px!important;
    }
    .admin-row-actions{
      display:flex!important;
      flex-wrap:wrap;
      gap:7px!important;
    }
    @media(max-width:860px){
      .admin-enterprise-filters{
        grid-template-columns:1fr;
      }
    }
  </style>`
  );
}

if (!html.includes("<th>Guests</th>")) {
  html = html.replace(
    "<th>Tenant</th>\n                  <th>Start Date</th>",
    "<th>Tenant</th>\n                  <th>Guests</th>\n                  <th>Start Date</th>"
  );
}

html = html.replace(
  /<td colspan="9" class="empty">Loading permits\.\.\.<\/td>/g,
  '<td colspan="10" class="empty">Loading permits...</td>'
);

if (!html.includes('id="adminTenantCount"')) {
  html = html.replace(
    `<div class="field">
                  <div class="field-label">Tenant Name</div>
                  <input id="adminTenant" class="input" type="text" required placeholder="Tenant name" />
                </div>`,
    `<div class="field">
                  <div class="field-label">Tenant Name</div>
                  <input id="adminTenant" class="input" type="text" required placeholder="Tenant name" />
                </div>
                <div class="field">
                  <div class="field-label">Guests Count</div>
                  <input id="adminTenantCount" class="input" type="number" min="0" placeholder="Guests count" />
                </div>`
  );
}

html = html
  .replace(/placeholder="[^"]*Ø[^"]*"/g, 'placeholder="Search by unit / tenant / phone / car plate / status"')
  .replace(/<h3 class="admin-modal-title" id="adminPermitModalTitle">[^<]*<\/h3>/, '<h3 class="admin-modal-title" id="adminPermitModalTitle">Add Permit</h3>');

write("PAGES/dashboard.html", html);

/* ---------- Dashboard JS Upgrade ---------- */

if (!js.includes("function getStatusMeta(")) {
  js = js.replace(
    "  function getPaymentText(value) {",
    `  function getStatusMeta(p) {
    const cls = String((p && p.validityClass) || "").toLowerCase();
    const txt = (p && (p.validityText || p.statusArabic || p.status)) || "-";

    if (cls === "valid") return { text: txt, tag: "tag-valid" };
    if (cls === "warning") return { text: txt, tag: "tag-warning" };
    if (cls === "invalid" || cls === "not_found") return { text: txt, tag: "tag-invalid" };

    const lower = String(txt || "").toLowerCase();
    if (lower.includes("expired") || txt.includes("انتهى")) return { text: txt, tag: "tag-invalid" };
    if (lower.includes("warning") || txt.includes("غد") || txt.includes("لم يبدأ") || txt.includes("آخر يوم")) return { text: txt, tag: "tag-warning" };
    if (lower.includes("active") || txt.includes("ساري")) return { text: txt, tag: "tag-valid" };

    return { text: txt, tag: "tag-soft" };
  }

  function getSortValue(p, key) {
    if (!p) return "";
    if (key === "startAsc") return p.startDate || "";
    if (key === "endAsc") return p.endDate || "";
    if (key === "unitAsc") return p.unit || "";
    if (key === "tenantAsc") return p.tenant || "";
    if (key === "statusAsc") return p.validityText || p.statusArabic || "";
    return p.updatedAt || p.createdAt || p.startDate || "";
  }

`
  );
}

js = replaceFunction(js, "renderAdminPermitSummary", `function renderAdminPermitSummary(data) {
    const el = document.getElementById("adminPermitSummaryCards");
    if (!el) return;

    const total = data.length;
    const paid = data.filter((p) => isPaid(p.paymentArabic || p.paymentStatus)).length;
    const unpaid = total - paid;
    const active = data.filter((p) => String(p.validityClass || "").toLowerCase() === "valid").length;
    const warning = data.filter((p) => String(p.validityClass || "").toLowerCase() === "warning").length;
    const expired = data.filter((p) => String(p.validityClass || "").toLowerCase() === "invalid").length;

    el.innerHTML =
      '<div class="mini-card"><div class="mini-k">Total Permits</div><div class="mini-v">' + escHtml(total) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Active</div><div class="mini-v">' + escHtml(active) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Warning</div><div class="mini-v">' + escHtml(warning) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Expired</div><div class="mini-v">' + escHtml(expired) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Paid</div><div class="mini-v">' + escHtml(paid) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Unpaid</div><div class="mini-v">' + escHtml(unpaid) + '</div></div>';
  }`);

js = replaceFunction(js, "renderAdminPermits", `function renderAdminPermits(data) {
    const body = document.getElementById("adminPermitsTableBody");
    if (!body) return;

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="10" class="empty">No permits found.</td></tr>';
      return;
    }

    const searchVal = (document.getElementById("adminPermitSearch") || {}).value || "";
    const statusFilter = (document.getElementById("adminStatusFilter") || {}).value || "";
    const paymentFilter = (document.getElementById("adminPaymentFilter") || {}).value || "";
    const sortFilter = (document.getElementById("adminSortFilter") || {}).value || "updatedDesc";

    let filtered = data.slice();

    if (searchVal.trim()) {
      const q = searchVal.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        String(p.unit || "").toLowerCase().includes(q) ||
        String(p.tenant || "").toLowerCase().includes(q) ||
        String(p.tenantCount || "").toLowerCase().includes(q) ||
        String(p.phone || "").toLowerCase().includes(q) ||
        String(p.carPlate || "").toLowerCase().includes(q) ||
        String(p.permitId || "").toLowerCase().includes(q) ||
        String(p.statusArabic || "").toLowerCase().includes(q) ||
        String(p.validityText || "").toLowerCase().includes(q) ||
        String(p.paymentArabic || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => String(p.validityClass || "").toLowerCase() === statusFilter);
    }

    if (paymentFilter) {
      filtered = filtered.filter((p) => paymentFilter === "paid" ? isPaid(p.paymentArabic || p.paymentStatus) : !isPaid(p.paymentArabic || p.paymentStatus));
    }

    filtered.sort((a, b) => {
      const av = String(getSortValue(a, sortFilter) || "");
      const bv = String(getSortValue(b, sortFilter) || "");
      if (sortFilter === "updatedDesc") return bv.localeCompare(av);
      return av.localeCompare(bv);
    });

    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="10" class="empty">No matching permits.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map((p) => {
      const pid = p.permitId || p._id || "";
      const status = getStatusMeta(p);

      return '<tr data-permit-id="' + attr(pid) + '">' +
        '<td>' + escHtml(p.unit || "-") + '</td>' +
        '<td>' + escHtml(p.tenant || "-") + '</td>' +
        '<td>' + escHtml(p.tenantCount || "-") + '</td>' +
        '<td>' + escHtml(p.startDate || "-") + '</td>' +
        '<td>' + escHtml(p.endDate || "-") + '</td>' +
        '<td><span class="status-tag ' + escHtml(status.tag) + '">' + escHtml(status.text) + '</span><span class="status-subline">' + escHtml(p.validityNote || "") + '</span></td>' +
        '<td>' + escHtml(getPaymentText(p.paymentArabic || p.paymentStatus || "-")) + '</td>' +
        '<td>' + escHtml(p.phone || "-") + '</td>' +
        '<td>' + escHtml(p.carPlate || "-") + '</td>' +
        '<td><div class="admin-row-actions">' +
        buildActionButton("edit-permit", pid, "Edit", "edit") +
        buildActionButton("client-card", pid, "Client Card", "reset") +
        buildActionButton("delete-permit", pid, "Delete", "delete") +
        '</div></td>' +
        '</tr>';
    }).join("");
  }`);

if (!js.includes('document.getElementById("adminTenantCount")) document.getElementById("adminTenantCount").value')) {
  js = js.replace(
    'if (document.getElementById("adminTenant")) document.getElementById("adminTenant").value = p.tenant || "";',
    'if (document.getElementById("adminTenant")) document.getElementById("adminTenant").value = p.tenant || "";\n    if (document.getElementById("adminTenantCount")) document.getElementById("adminTenantCount").value = p.tenantCount || "";'
  );
}

if (!js.includes('tenantCount: (document.getElementById("adminTenantCount") || {}).value')) {
  js = js.replace(
    'tenant: (document.getElementById("adminTenant") || {}).value || "",',
    'tenant: (document.getElementById("adminTenant") || {}).value || "",\n      tenantCount: (document.getElementById("adminTenantCount") || {}).value || "",'
  );
}

js = replaceFunction(js, "initAdminSearchBinding", `function initAdminSearchBinding() {
    ["adminPermitSearch", "adminStatusFilter", "adminPaymentFilter", "adminSortFilter"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.__azhaBound) {
        el.__azhaBound = true;
        el.addEventListener(id === "adminPermitSearch" ? "input" : "change", function () {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(() => renderAdminPermits(adminPermits), 180);
        });
      }
    });
  }`);

write("JS/dashboard.js", js);

console.log("AZHA Enterprise Dashboard Upgrade applied.");
