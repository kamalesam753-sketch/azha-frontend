const fs = require("fs");

const file = "PAGES/scanner.html";
let html = fs.readFileSync(file, "utf8");

// 1️⃣ Fix footer to be fixed bottom
html = html.replace(/\.footer\s*\{[\s\S]*?\}/, `
.footer{
  position:fixed;
  bottom:0;
  left:0;
  right:0;

  padding:12px;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;

  background:#061827;
  border-top:1px solid rgba(255,255,255,.08);
  z-index:9999;
}
`);

// 2️⃣ Add body padding-bottom (لو مش موجود)
if (!html.includes("padding-bottom:90px")) {
  html = html.replace(/body\s*\{/, `
body{
  padding-bottom:90px;
`);
}

// 3️⃣ Improve button style
if (!html.includes("footer button")) {
  html = html.replace("</style>", `
.footer button{
  min-height:54px;
  border-radius:18px;
  font-size:15px;
  font-weight:900;
}

.primary{
  background:#1977b5;
  color:#fff;
}

.light{
  background:#edf4fb;
  color:#0f4c81;
}
</style>`);
}

// 4️⃣ Optional: rename buttons text
html = html
  .replace("Restart", "Scan Again")
  .replace("Gate", "Exit Scanner");

fs.writeFileSync(file, html, "utf8");

console.log("✅ Scanner footer fixed (visible & app-style)");
