const fs = require("fs");

const file = "PAGES/index.html";
let html = fs.readFileSync(file, "utf8");

// 1️⃣ تعديل عرض الأسماء (preview + full list)
html = html.replace(
/(\$\{escapeHtml\(d\.tenantsNames \|\| "-" \)\})/g,
`
\${(function(){
  const list = String(d.tenantsNames || "").split(/[,\\n]/).map(s=>s.trim()).filter(Boolean);

  if(!list.length) return "-";

  const preview = list.slice(0,3).map((n,i)=> (i+1)+". "+escapeHtml(n)).join("<br>");
  const more = list.length > 3 ? "<div class='more'>+ " + (list.length-3) + " more</div>" : "";

  return "<div class='names-preview'>" + preview + "</div>" + more;
})()}
`
);

// 2️⃣ إضافة قسم التحقق الكامل (لشاشة الأمن)
if (!html.includes("identity-check-section")) {
  html = html.replace("</body>", `
<script>
document.addEventListener("DOMContentLoaded", function(){
  const container = document.querySelector(".card, .permit-card, .section");
  if(!container) return;

  const d = window.currentPermitData || {};

  const list = String(d.tenantsNames || "")
    .split(/[,\\n]/)
    .map(s=>s.trim())
    .filter(Boolean);

  if(!list.length) return;

  const htmlBlock = \`
    <div class="identity-check-section">
      <div class="identity-title">Identity Verification</div>
      <div class="identity-note">
        يرجى إبراز بطاقة الهوية أو جواز السفر لجميع الأسماء التالية للتحقق
      </div>
      <div class="identity-list">
        \${list.map((n,i)=>"<div>"+(i+1)+". "+n+"</div>").join("")}
      </div>
    </div>
  \`;

  container.insertAdjacentHTML("beforeend", htmlBlock);
});
</script>

<style>
.identity-check-section{
  margin-top:14px;
  padding:14px;
  border-radius:18px;
  background:#fff8e6;
  border:1px solid #facc15;
}

.identity-title{
  font-weight:900;
  margin-bottom:6px;
  font-size:15px;
}

.identity-note{
  font-size:12px;
  margin-bottom:10px;
  color:#92400e;
}

.identity-list{
  font-size:14px;
  line-height:1.9;
  font-weight:700;
}

.names-preview{
  font-size:14px;
  line-height:1.7;
}

.more{
  margin-top:4px;
  font-size:12px;
  color:#64748b;
}
</style>

</body>`);
}

fs.writeFileSync(file, html, "utf8");

console.log("✅ Names display upgraded to professional verification mode");
