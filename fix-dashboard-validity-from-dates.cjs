const fs = require("fs");
const p = "JS/dashboard.js";
let js = fs.readFileSync(p, "utf8");

fs.copyFileSync(p, p + ".backup-before-dashboard-validity-lock");

const start = js.indexOf("function getStatusMeta(p)");
if (start === -1) throw new Error("getStatusMeta not found");

let i = js.indexOf("{", start);
let depth = 0;
let end = -1;

for (; i < js.length; i++) {
  if (js[i] === "{") depth++;
  if (js[i] === "}") depth--;
  if (depth === 0) {
    end = i + 1;
    break;
  }
}

if (end === -1) throw new Error("getStatusMeta end not found");

const finalGetStatusMeta = `function parseDashboardDateOnly(v) {
    const s = String(v || "").trim();
    const m = s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
    if (!m) return "";
    return m[1] + "-" + m[2] + "-" + m[3];
  }

  function todayDashboardYmd() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function getStatusMeta(p) {
    const startDate = parseDashboardDateOnly(p && p.startDate);
    const endDate = parseDashboardDateOnly(p && p.endDate);
    const today = todayDashboardYmd();

    if (startDate && endDate) {
      if (today > endDate) {
        return { text: "التصريح منتهي", tag: "tag-invalid", cls: "invalid", note: "Permit expired" };
      }

      if (today < startDate) {
        return { text: "لم يبدأ بعد", tag: "tag-warning", cls: "warning", note: "Not started yet" };
      }

      if (today === endDate) {
        return { text: "آخر يوم ساري", tag: "tag-warning", cls: "warning", note: "Last valid day" };
      }

      return { text: "ساري", tag: "tag-valid", cls: "valid", note: "Valid for entry" };
    }

    const cls = String((p && p.validityClass) || "").toLowerCase();
    const txt = (p && (p.validityText || p.statusArabic || p.status)) || "-";

    if (cls === "valid") return { text: txt, tag: "tag-valid", cls: "valid" };
    if (cls === "warning") return { text: txt, tag: "tag-warning", cls: "warning" };
    if (cls === "invalid" || cls === "not_found") return { text: txt, tag: "tag-invalid", cls: "invalid" };

    return { text: txt, tag: "tag-soft", cls: "unknown" };
  }`;

js = js.slice(0, start) + finalGetStatusMeta + js.slice(end);

js = js.replace(
  /const active = list\.filter\(\(p\) => String\(p\.validityClass \|\| ""\)\.toLowerCase\(\) === "valid"\)\.length;\s*const warning = list\.filter\(\(p\) => String\(p\.validityClass \|\| ""\)\.toLowerCase\(\) === "warning"\)\.length;\s*const expired = list\.filter\(\(p\) => String\(p\.validityClass \|\| ""\)\.toLowerCase\(\) === "invalid"\)\.length;/,
  `const active = list.filter((p) => getStatusMeta(p).cls === "valid").length;
    const warning = list.filter((p) => getStatusMeta(p).cls === "warning").length;
    const expired = list.filter((p) => getStatusMeta(p).cls === "invalid").length;`
);

js = js.replace(
  /\(p\.validityNote \? '<span class="status-subline">' \+ escHtml\(p\.validityNote\) \+ "<\/span>" : ""\)/,
  `((status.note || p.validityNote) ? '<span class="status-subline">' + escHtml(status.note || p.validityNote) + "</span>" : "")`
);

fs.writeFileSync(p, js, "utf8");
console.log("✅ Dashboard validity locked from startDate/endDate.");
