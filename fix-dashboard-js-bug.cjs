const fs = require("fs");
let js = fs.readFileSync("JS/dashboard.js","utf8");

/* 🔥 نحذف أي injection غلط */
js = js.replace(/function getStatusMeta[\s\S]*?return\s*\{[\s\S]*?\}\s*\}/g, "");

/* 🔥 نحذف أي getSortValue */
js = js.replace(/function getSortValue[\s\S]*?\}/g, "");

/* 🔥 نضيف النسخة الصح في مكان آمن قبل isPaid */

js = js.replace(
"function isPaid",
`
/* ===== AZHA ENTERPRISE STATUS ENGINE ===== */

function getStatusMeta(p){
  const cls = String((p && p.validityClass) || "").toLowerCase();
  const txt = (p && (p.validityText || p.statusArabic)) || "-";

  if (cls === "valid") return { text: txt, tag: "tag-valid" };
  if (cls === "warning") return { text: txt, tag: "tag-warning" };
  if (cls === "invalid") return { text: txt, tag: "tag-invalid" };

  if (txt.includes("انتهى")) return { text: txt, tag: "tag-invalid" };
  if (txt.includes("آخر يوم") || txt.includes("لم يبدأ") || txt.includes("غد")) return { text: txt, tag: "tag-warning" };
  if (txt.includes("ساري")) return { text: txt, tag: "tag-valid" };

  return { text: txt, tag: "tag-soft" };
}

function getSortValue(p, key){
  if(!p) return "";
  if(key==="startAsc") return p.startDate||"";
  if(key==="endAsc") return p.endDate||"";
  if(key==="unitAsc") return p.unit||"";
  if(key==="tenantAsc") return p.tenant||"";
  return p.updatedAt||p.startDate||"";
}

/* ===== END ENGINE ===== */

function isPaid
`
);

fs.writeFileSync("JS/dashboard.js",js,"utf8");
console.log("🔥 FIXED BROKEN FUNCTION INJECTION");
