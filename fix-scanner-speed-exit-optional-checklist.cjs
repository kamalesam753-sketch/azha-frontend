const fs = require("fs");

const scannerPath = "PAGES/scanner.html";
const indexPath = "PAGES/index.html";

/* =========================
   1) Scanner speed + exit fix
========================= */
let scanner = fs.readFileSync(scannerPath, "utf8");

// Bigger scanner area + better camera recognition
scanner = scanner.replace(
  /qrbox:\{ width:260, height:260 \}/g,
  'qrbox:{ width:320, height:320 }'
);

scanner = scanner.replace(
  /\{ fps:10, qrbox:\{ width:320, height:320 \} \}/g,
  '{ fps:18, qrbox:{ width:320, height:320 }, aspectRatio:1.0 }'
);

// Faster redirect after successful scan
scanner = scanner.replace(
  /setTimeout\(function\(\)\{ openPermitApp\(token\); \}, 850\);/g,
  'setTimeout(function(){ openPermitApp(token); }, 250);'
);

scanner = scanner.replace(
  /setTimeout\(function\(\)\{ openPermitApp\(token\); \}, 450\);/g,
  'setTimeout(function(){ openPermitApp(token); }, 250);'
);

// Fix Exit Scanner button text/function
scanner = scanner.replace(
  /<button class="danger" onclick="goGate\(\)">[\s\S]*?<\/button>/,
  '<button class="danger" onclick="goGate()">Exit Scanner</button>'
);

// Make goGate robust
scanner = scanner.replace(
  /window\.goGate\s*=\s*function\(\)\{[\s\S]*?\};/,
  `window.goGate = async function(){
    try{
      if(scanner) await scanner.stop();
    }catch(e){}
    location.href = "/gate?app=1";
  };`
);

// Improve footer safe area on mobile
if (!scanner.includes("safe-area-inset-bottom")) {
  scanner = scanner.replace("</style>", `
.footer{
  padding-bottom:calc(12px + env(safe-area-inset-bottom))!important;
}
.reader-wrap{
  padding-bottom:88px!important;
}
#reader video{
  object-fit:cover!important;
}
</style>`);
}

fs.writeFileSync(scannerPath, scanner, "utf8");


/* =========================
   2) Optional checklist panel in permit page
========================= */
let index = fs.readFileSync(indexPath, "utf8");

// Hide verification panel by default + toggle button
if (!index.includes("azha-optional-verification-toggle")) {
  const optionalBlock = `
<script id="azha-optional-verification-toggle">
document.addEventListener("DOMContentLoaded", function(){
  function applyOptional(){
    const panel =
      document.getElementById("scannerVerificationPanel") ||
      document.querySelector(".identity-check-section");

    if(!panel || panel.dataset.optionalReady === "1") return;

    panel.dataset.optionalReady = "1";
    panel.classList.add("verification-hidden");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "verification-toggle-btn";
    btn.textContent = "Show Identity Verification";

    btn.addEventListener("click", function(){
      panel.classList.toggle("verification-hidden");
      btn.textContent = panel.classList.contains("verification-hidden")
        ? "Show Identity Verification"
        : "Hide Identity Verification";
    });

    panel.parentNode.insertBefore(btn, panel);
  }

  setTimeout(applyOptional, 500);
  setTimeout(applyOptional, 1200);
  setTimeout(applyOptional, 2200);
});
</script>

<style id="azha-optional-verification-toggle-style">
.verification-hidden{
  display:none!important;
}

.verification-toggle-btn{
  width:calc(100% - 20px);
  margin:12px 10px;
  min-height:50px;
  border:none;
  border-radius:16px;
  background:#0f4c81;
  color:#fff;
  font-size:14px;
  font-weight:900;
  box-shadow:0 14px 35px rgba(15,76,129,.18);
}
</style>
`;
  index = index.replace("</body>", optionalBlock + "\n</body>");
}

fs.writeFileSync(indexPath, index, "utf8");

console.log("✅ Scanner speed improved.");
console.log("✅ Exit Scanner button fixed.");
console.log("✅ Identity verification checklist is now optional.");
