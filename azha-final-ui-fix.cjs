const fs = require("fs");

function read(p){ return fs.readFileSync(p, "utf8"); }
function write(p,s){ fs.writeFileSync(p, s, "utf8"); }

function replaceFunction(src, fnName, replacement) {
  const marker = "function " + fnName + "(";
  const start = src.indexOf(marker);
  if (start === -1) throw new Error("Function not found: " + fnName);

  const braceStart = src.indexOf("{", start);
  let depth = 0;
  let end = -1;

  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }

  if (end === -1) throw new Error("Function end not found: " + fnName);
  return src.slice(0, start) + replacement + src.slice(end);
}

/* =========================
   dashboard.js enterprise fix
========================= */
let js = read("JS/dashboard.js");

js = replaceFunction(js, "renderAdminPermitSummary", `function renderAdminPermitSummary(data) {
    const el = document.getElementById("adminPermitSummaryCards");
    if (!el) return;

    const total = data.length;
    const paid = data.filter((p) => isPaid(p.paymentArabic || p.paymentStatus)).length;
    const unpaid = total - paid;
    const active = data.filter((p) => String(p.validityClass || "").toLowerCase() === "valid").length;

    el.innerHTML =
      '<div class="mini-card"><div class="mini-k">Total Permits</div><div class="mini-v">' + escHtml(total) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Paid</div><div class="mini-v">' + escHtml(paid) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Unpaid</div><div class="mini-v">' + escHtml(unpaid) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Active / Current</div><div class="mini-v">' + escHtml(active) + '</div></div>';
  }`);

js = replaceFunction(js, "renderAdminPermits", `function renderAdminPermits(data) {
    const body = document.getElementById("adminPermitsTableBody");
    if (!body) return;

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="10" class="empty">No permits found.</td></tr>';
      return;
    }

    const searchVal = (document.getElementById("adminPermitSearch") || {}).value || "";
    let filtered = data;

    if (searchVal.trim()) {
      const q = searchVal.trim().toLowerCase();
      filtered = data.filter((p) =>
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

    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="10" class="empty">No matching permits.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map((p) => {
      const pid = p.permitId || p._id || "";
      const statusText = p.validityText || p.statusArabic || "-";
      const statusClass = String(p.validityClass || "soft").toLowerCase();
      const tagClass = statusClass === "valid" ? "tag-valid" : statusClass === "warning" ? "tag-warning" : statusClass === "invalid" || statusClass === "not_found" ? "tag-invalid" : "tag-soft";

      return '<tr data-permit-id="' + attr(pid) + '">' +
        '<td>' + escHtml(p.unit || "-") + '</td>' +
        '<td>' + escHtml(p.tenant || "-") + '</td>' +
        '<td>' + escHtml(p.tenantCount || "-") + '</td>' +
        '<td>' + escHtml(p.startDate || "-") + '</td>' +
        '<td>' + escHtml(p.endDate || "-") + '</td>' +
        '<td><span class="status-tag ' + escHtml(tagClass) + '">' + escHtml(statusText) + '</span></td>' +
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

js = js.replace(
  'if (document.getElementById("adminTenant")) document.getElementById("adminTenant").value = p.tenant || "";',
  'if (document.getElementById("adminTenant")) document.getElementById("adminTenant").value = p.tenant || "";\n    if (document.getElementById("adminTenantCount")) document.getElementById("adminTenantCount").value = p.tenantCount || "";'
);

js = js.replace(
  'tenant: (document.getElementById("adminTenant") || {}).value || "",',
  'tenant: (document.getElementById("adminTenant") || {}).value || "",\n      tenantCount: (document.getElementById("adminTenantCount") || {}).value || "",'
);

write("JS/dashboard.js", js);

/* =========================
   dashboard.html enterprise fix
========================= */
let html = read("PAGES/dashboard.html");

html = html
  .replace(/\\n\s*<script src="\.\.\/JS\/dashboard-hotfix\.js"><\/script>/g, '\n  <script src="../JS/dashboard-hotfix.js"></script>')
  .replace(/placeholder="[^"]*Ø[^"]*"/g, 'placeholder="Search by unit / tenant / phone / car plate / status"')
  .replace(/<h3 class="admin-modal-title" id="adminPermitModalTitle">[^<]*<\/h3>/, '<h3 class="admin-modal-title" id="adminPermitModalTitle">Add Permit</h3>')
  .replace(/<option value="ØªÙ… Ø§Ù„Ø¯ÙAØ¹">[^<]*<\/option>/g, '<option value="تم الدفع">تم الدفع</option>')
  .replace(/<option value="Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¯ÙAØ¹">[^<]*<\/option>/g, '<option value="لم يتم الدفع">لم يتم الدفع</option>')
  .replace(/<option value="Ø³Ø§Ø±ÙŠ">[^<]*<\/option>/g, '<option value="ساري">ساري</option>')
  .replace(/<option value="Ù„Ù… ÙŠØ¨Ø¯Ø£">[^<]*<\/option>/g, '<option value="لم يبدأ">لم يبدأ</option>')
  .replace(/<option value="Ø¢Ø®Ø± ÙŠÙˆÙ… Ø³Ø§Ø±ÙŠ">[^<]*<\/option>/g, '<option value="آخر يوم ساري">آخر يوم ساري</option>')
  .replace(/<option value="Ø§Ù†ØªÙ‡Ù‰">[^<]*<\/option>/g, '<option value="انتهى">انتهى</option>')
  .replace(/<option value="ØºÙŠØ± Ù…Ø­Ø¯Ø¯">[^<]*<\/option>/g, '<option value="غير محدد">غير محدد</option>');

html = html.replace(
  '<th>Tenant</th>\n                  <th>Start Date</th>',
  '<th>Tenant</th>\n                  <th>Guests</th>\n                  <th>Start Date</th>'
);

html = html.replace(
  '<td colspan="9" class="empty">Loading permits...</td>',
  '<td colspan="10" class="empty">Loading permits...</td>'
);

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

html = html.replace(
  '</style>',
  `
    /* AZHA FINAL ENTERPRISE UI FIX */
    .admin-panel-rtl{direction:ltr !important;text-align:left !important;}
    .admin-panel-rtl th,.admin-panel-rtl td{text-align:left !important;}
    .admin-form-grid{direction:ltr !important;text-align:left !important;}
    .admin-form-grid .field-label{text-align:left !important;}
    .admin-form-grid .input,.admin-form-grid .select{text-align:left !important;direction:ltr !important;}
    .status-tag.tag-valid{background:var(--ok-bg);color:var(--ok-text);}
    .status-tag.tag-warning{background:var(--warn-bg);color:var(--warn-text);}
    .status-tag.tag-invalid{background:var(--bad-bg);color:var(--bad-text);}
  </style>`
);

write("PAGES/dashboard.html", html);

/* =========================
   client.html compact enterprise fix
========================= */
let client = read("PAGES/client.html");

client = client.replace(
  /buildInternalVerificationUrl: function \(secureToken\) \{[\s\S]*?\n        \}/,
  `buildInternalVerificationUrl: function (secureToken) {
          return location.origin + "/permit?token=" + encodeURIComponent(secureToken);
        }`
);

client = client.replace(/width: 246,\s*\n\s*height: 246,/g, 'width: 200,\n          height: 200,');

client = client.replace(
  '</style>',
  `
    /* AZHA FINAL COMPACT CLIENT CARD - NO DOWNGRADE */
    .wrap{max-width:680px !important;}
    .azha-brand-header{max-width:680px !important;margin-bottom:14px !important;padding:12px 18px !important;border-radius:20px !important;}
    .card,.loading-card,.error-card{border-radius:28px !important;}
    .hero{padding:26px 18px 22px !important;}
    .hero h1{font-size:26px !important;}
    .hero p{font-size:13px !important;margin-top:6px !important;}
    .secure-strip{padding:12px 14px !important;}
    .secure-chip{padding:7px 11px !important;font-size:11px !important;}
    .permit-id{margin:16px !important;padding:11px 14px !important;font-size:15px !important;}
    .status-pill{margin:0 16px 12px !important;padding:14px !important;font-size:19px !important;}
    .validity-note{margin:0 16px 14px !important;padding:12px 14px !important;font-size:13px !important;}
    .countdown-box{margin:0 16px 14px !important;gap:8px !important;}
    .count-card{padding:12px !important;border-radius:16px !important;}
    .count-card .v{font-size:18px !important;}
    .qr-box{margin:14px 16px !important;}
    .qr-frame{min-width:238px !important;padding:16px !important;border-radius:24px !important;}
    #qrcode{width:200px !important;min-height:200px !important;}
    #qrcode img,#qrcode canvas{max-width:200px !important;max-height:200px !important;}
    .grid{padding:16px !important;gap:10px !important;}
    .item{padding:12px !important;border-radius:16px !important;}
    .value{font-size:15px !important;}
    .note{margin:0 16px 16px !important;padding:13px !important;font-size:13px !important;}
    .actions{padding:0 16px 16px !important;}
    .btn{padding:11px 15px !important;border-radius:13px !important;}
  </style>`
);

write("PAGES/client.html", client);

console.log("AZHA Enterprise UI fix applied successfully.");
