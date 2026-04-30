const fs = require("fs");

const scannerPath = "PAGES/scanner.html";
const clientPath = "PAGES/client.html";
const indexPath = "PAGES/index.html";

/* 1) Ultra-fast scanner tuning */
let scanner = fs.readFileSync(scannerPath, "utf8");

scanner = scanner
  .replace(
    /\{fps:24, qrbox:\{width:340,height:340\}, aspectRatio:1\.0, disableFlip:true\}/g,
    `{fps:30, qrbox:{width:360,height:360}, aspectRatio:1.0, disableFlip:true}`
  )
  .replace(
    /setTimeout\(function\(\)\{openPermitApp\(token\);\}, 180\);/g,
    `setTimeout(function(){openPermitApp(token);}, 80);`
  );

fs.writeFileSync(scannerPath, scanner, "utf8");


/* 2) Better name splitting for scanner permit result */
let index = fs.readFileSync(indexPath, "utf8");

index = index.replace(
  /String\(raw\)\.split\(\/\[,،\\n\]\+\/\)\.map\(s=>s\.trim\(\)\)\.filter\(Boolean\)/g,
  `String(raw)
      .split(/\\s+-\\s+|[-–—•]+|[,،\\n]+/g)
      .map(s=>s.trim())
      .filter(Boolean)`
);

fs.writeFileSync(indexPath, index, "utf8");


/* 3) Client card mobile clarity + remove clutter + add ID note */
let client = fs.readFileSync(clientPath, "utf8");

const mobileCss = `
<style id="azha-client-mobile-final-clarity">
@media(max-width:760px){
  html,body{
    width:100%!important;
    min-height:100%!important;
    overflow-x:hidden!important;
  }

  body{
    padding:8px!important;
    background:#061827!important;
  }

  .azha-brand-header{
    display:none!important;
  }

  .wrap{
    max-width:100%!important;
    width:100%!important;
    margin:0!important;
  }

  .card{
    width:100%!important;
    max-width:100%!important;
    border-radius:22px!important;
    box-shadow:0 18px 45px rgba(0,0,0,.24)!important;
  }

  .hero{
    padding:16px 12px 14px!important;
  }

  .hero h1{
    font-size:22px!important;
  }

  .hero p{
    font-size:11px!important;
    line-height:1.45!important;
  }

  .secure-strip{
    display:none!important;
  }

  .permit-id{
    margin:10px!important;
    padding:10px!important;
    font-size:14px!important;
  }

  .status-pill{
    margin:0 10px 8px!important;
    padding:12px!important;
    font-size:20px!important;
    border-radius:16px!important;
  }

  .validity-note{
    margin:0 10px 10px!important;
    padding:10px!important;
    font-size:13px!important;
    line-height:1.6!important;
  }

  .countdown-box{
    margin:0 10px 10px!important;
    grid-template-columns:repeat(3,1fr)!important;
    gap:6px!important;
  }

  .count-card{
    padding:9px 6px!important;
    border-radius:13px!important;
  }

  .count-card .k{
    font-size:9px!important;
  }

  .count-card .v{
    font-size:12px!important;
  }

  .badges,
  .qr-caption,
  .token-line,
  .note,
  .time{
    display:none!important;
  }

  .qr-box{
    margin:10px!important;
  }

  .qr-frame{
    width:190px!important;
    min-width:190px!important;
    padding:10px!important;
    border-radius:18px!important;
  }

  #qrcode{
    width:168px!important;
    min-height:168px!important;
  }

  #qrcode img,
  #qrcode canvas{
    max-width:168px!important;
    max-height:168px!important;
  }

  .qr-title{
    font-size:11px!important;
    margin-top:7px!important;
  }

  .grid{
    padding:10px!important;
    gap:7px!important;
    grid-template-columns:1fr!important;
  }

  .item{
    padding:10px!important;
    border-radius:14px!important;
  }

  .label{
    font-size:10px!important;
    margin-bottom:4px!important;
  }

  .value{
    font-size:14px!important;
    line-height:1.45!important;
  }

  .actions{
    padding:0 10px 12px!important;
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:8px!important;
  }

  .btn{
    margin:0!important;
    padding:10px 8px!important;
    font-size:11px!important;
    border-radius:12px!important;
  }

  .id-required-note{
    margin:10px!important;
    padding:12px!important;
    border-radius:16px!important;
    background:#fff8e6!important;
    border:1px solid #facc15!important;
    color:#92400e!important;
    font-size:13px!important;
    font-weight:900!important;
    line-height:1.7!important;
    text-align:center!important;
  }
}
</style>
`;

if (!client.includes("azha-client-mobile-final-clarity")) {
  client = client.replace("</head>", mobileCss + "\n</head>");
}

/* add ID note after validity-note in rendered card */
if (!client.includes("id-required-note")) {
  client = client.replace(
    `<div class="validity-note">
                \${escapeHtml(d.validityNote || "يرجى إبراز هذه البطاقة عند الطلب.")}
              </div>`,
    `<div class="validity-note">
                \${escapeHtml(d.validityNote || "يرجى إبراز هذه البطاقة عند الطلب.")}
              </div>

              <div class="id-required-note">
                يرجى إبراز بطاقة الهوية أو جواز السفر لجميع الأسماء الواردة بالتصريح للتحقق عند الدخول.
                <br>
                Please present a valid ID or passport for every listed guest upon entry.
              </div>`
  );
}

/* Shorten action labels */
client = client
  .replace(/Print \/ PDF/g, "Print")
  .replace(/Open Full Screen/g, "Full Screen")
  .replace(/Copy Link/g, "Copy");

fs.writeFileSync(clientPath, client, "utf8");

console.log("✅ Scanner speed tuned.");
console.log("✅ Guest names splitter improved for dash-separated names.");
console.log("✅ Client card mobile clarity fixed.");
console.log("✅ ID verification note added.");
