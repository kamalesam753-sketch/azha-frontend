const fs = require("fs");

const p = "PAGES/client.html";
let html = fs.readFileSync(p, "utf8");

fs.copyFileSync(p, p + ".backup-before-client-pro-final");

const proCss = `
    /* AZHA CLIENT CARD PRO FINAL - PRODUCT READY */
    .wrap{max-width:560px!important}
    .azha-brand-header{max-width:560px!important;margin-bottom:10px!important;padding:10px 14px!important;border-radius:18px!important}
    .azha-brand-header img{height:34px!important}
    .azha-brand-title strong{font-size:13px!important}
    .azha-brand-title span{font-size:9px!important}

    .card,.loading-card,.error-card{border-radius:24px!important}
    .card::after{font-size:74px!important;opacity:.025!important}

    .hero{padding:18px 14px 15px!important}
    .hero h1{font-size:22px!important}
    .hero p{font-size:11px!important;margin-top:4px!important}

    .secure-strip{padding:8px 10px!important;gap:6px!important}
    .secure-chip{padding:5px 9px!important;font-size:9.5px!important}

    .permit-id{margin:10px!important;padding:8px 10px!important;font-size:13px!important}
    .status-pill{margin:0 10px 8px!important;padding:10px!important;font-size:16px!important;border-radius:15px!important}
    .validity-note{margin:0 10px 10px!important;padding:9px!important;font-size:12px!important;border-radius:14px!important}

    .countdown-box{margin:0 10px 10px!important;gap:6px!important;grid-template-columns:repeat(3,1fr)!important}
    .count-card{padding:8px!important;border-radius:12px!important}
    .count-card .k{font-size:9px!important;margin-bottom:3px!important}
    .count-card .v{font-size:14px!important}

    .badges{margin:0 10px 10px!important;gap:6px!important}
    .badge{padding:6px 9px!important;font-size:10px!important}

    .qr-box{margin:10px!important}
    .qr-frame{min-width:178px!important;padding:10px!important;border-radius:18px!important;cursor:pointer}
    #qrcode{width:150px!important;min-height:150px!important}
    #qrcode img,#qrcode canvas{max-width:150px!important;max-height:150px!important}
    .qr-title{font-size:11px!important;margin-top:8px!important}
    .qr-caption{font-size:9.5px!important;line-height:1.45!important}
    .token-line{display:none!important}

    .grid{padding:10px!important;gap:6px!important}
    .item{padding:9px!important;border-radius:12px!important}
    .label{font-size:10px!important;margin-bottom:4px!important}
    .value{font-size:13px!important;line-height:1.35!important}

    .note{margin:0 10px 10px!important;padding:9px!important;font-size:11px!important;line-height:1.55!important}
    .actions{padding:0 10px 10px!important}
    .btn{padding:8px 11px!important;font-size:11px!important;border-radius:10px!important}
    .time{font-size:10px!important;padding:0 10px 14px!important}

    .qr-modal{
      position:fixed;
      inset:0;
      display:none;
      align-items:center;
      justify-content:center;
      background:rgba(5,10,18,.82);
      backdrop-filter:blur(10px);
      z-index:99999;
      padding:18px;
    }
    .qr-modal.show{display:flex}
    .qr-modal-card{
      width:min(420px,100%);
      background:#fff;
      border-radius:28px;
      padding:22px;
      text-align:center;
      box-shadow:0 30px 90px rgba(0,0,0,.34);
    }
    .qr-modal-title{
      font-size:18px;
      font-weight:900;
      color:#0f4c81;
      margin-bottom:14px;
    }
    #qrFull{
      width:280px;
      min-height:280px;
      margin:auto;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    #qrFull img,#qrFull canvas{
      max-width:280px;
      max-height:280px;
    }

    body.share-mode .azha-brand-header,
    body.share-mode .actions,
    body.share-mode .feedback,
    body.share-mode .time{
      display:none!important;
    }
    body.share-mode{padding:10px!important}
    body.share-mode .wrap{max-width:520px!important}

    @media(max-width:700px){
      body{padding:10px!important}
      .grid{grid-template-columns:1fr 1fr!important}
      .countdown-box{grid-template-columns:repeat(3,1fr)!important}
      .count-card .v{font-size:12px!important}
      .qr-frame{min-width:166px!important}
      #qrcode{width:140px!important;min-height:140px!important}
      #qrcode img,#qrcode canvas{max-width:140px!important;max-height:140px!important}
    }

    @media print{
      body{background:#fff!important;padding:0!important}
      body::before,.azha-brand-header,.actions,.feedback,.madaar-card-logo,.qr-modal{display:none!important}
      .wrap{max-width:100%!important}
      .card{box-shadow:none!important;border:none!important;border-radius:0!important}
      .hero{print-color-adjust:exact;-webkit-print-color-adjust:exact}
      .token-line{display:none!important}
    }
`;

/* Replace old final compact block only */
html = html.replace(
  /\/\* AZHA FINAL COMPACT CLIENT CARD - NO DOWNGRADE \*\/[\s\S]*?(?=\s*<\/style>)/,
  proCss
);

/* Add QR modal before </body> if missing */
if (!html.includes('id="qrModal"')) {
  html = html.replace(
    /<\/body>/,
    `
  <div class="qr-modal" id="qrModal" onclick="closeQrFullScreen(event)">
    <div class="qr-modal-card">
      <div class="qr-modal-title">Secure Verification QR</div>
      <div id="qrFull"></div>
      <button class="btn primary" onclick="closeQrFullScreen(event)">Close</button>
    </div>
  </div>
</body>`
  );
}

/* Upgrade QR frame click */
html = html.replace(
  '<div class="qr-frame">',
  '<div class="qr-frame" onclick="openQrFullScreen()">'
);

/* Fix visual order in the rendered card */
html = html.replace(
  `<div class="countdown-box">
                <div class="count-card">
                  <div class="k">Start</div>
                  <div class="v">\${escapeHtml(d.startDate || "-")}</div>
                </div>
                <div class="count-card">
                  <div class="k">End</div>
                  <div class="v">\${escapeHtml(d.endDate || "-")}</div>
                </div>
                <div class="count-card">
                  <div class="k">Days Left</div>
                  <div class="v">\${escapeHtml(remainingDays)}</div>
                </div>
              </div>`,
  `<div class="countdown-box">
                <div class="count-card">
                  <div class="k">Days Left</div>
                  <div class="v">\${escapeHtml(remainingDays)}</div>
                </div>
                <div class="count-card">
                  <div class="k">End</div>
                  <div class="v">\${escapeHtml(d.endDate || "-")}</div>
                </div>
                <div class="count-card">
                  <div class="k">Start</div>
                  <div class="v">\${escapeHtml(d.startDate || "-")}</div>
                </div>
              </div>`
);

/* Add PRO functions before loadClientCard */
if (!html.includes("window.openQrFullScreen")) {
  html = html.replace(
    /function loadClientCard\(\) \{/,
    `
      window.openQrFullScreen = function () {
        const modal = document.getElementById("qrModal");
        const full = document.getElementById("qrFull");
        if (!modal || !full || !window.lastQrTarget) return;

        full.innerHTML = "";
        if (typeof QRCode !== "undefined") {
          new QRCode(full, {
            text: window.lastQrTarget,
            width: 280,
            height: 280,
            correctLevel: QRCode.CorrectLevel.H
          });
        }
        modal.classList.add("show");
      };

      window.closeQrFullScreen = function (event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        const modal = document.getElementById("qrModal");
        if (modal) modal.classList.remove("show");
      };

      if (new URLSearchParams(location.search).get("share") === "1") {
        document.body.classList.add("share-mode");
      }

      document.addEventListener("keydown", function(e){
        if (e.key === "Escape") window.closeQrFullScreen(e);
      });

      function loadClientCard() {`
  );
}

/* Store qr target */
html = html.replace(
  "const qrTarget = AzhaClientCardService.buildInternalVerificationUrl(secureToken);",
  "const qrTarget = AzhaClientCardService.buildInternalVerificationUrl(secureToken);\n        window.lastQrTarget = qrTarget;"
);

fs.writeFileSync(p, html, "utf8");
console.log("✅ Client Card PRO Final applied.");
console.log("✅ Compact layout applied.");
console.log("✅ QR full screen enabled.");
console.log("✅ Share mode enabled with ?share=1.");
console.log("✅ Print/PDF optimized.");
