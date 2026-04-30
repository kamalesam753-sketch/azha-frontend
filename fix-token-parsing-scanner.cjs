const fs = require("fs");

const files = [
  "PAGES/scanner.html",
  "PAGES/client.html",
  "PAGES/index.html"
];

/* 1) Add global token sanitizer to client + permit pages */
const sanitizer = `
<script id="azha-token-sanitizer">
(function(){
  const params = new URLSearchParams(location.search);
  const raw = params.get("token") || "";
  const match = raw.match(/AZHASEC-[A-Za-z0-9-]+/);
  if(match && raw !== match[0]){
    params.set("token", match[0]);
    history.replaceState(null, "", location.pathname + "?" + params.toString());
  }
})();
</script>
`;

for (const f of ["PAGES/client.html", "PAGES/index.html"]) {
  let html = fs.readFileSync(f, "utf8");
  if (!html.includes("azha-token-sanitizer")) {
    html = html.replace("</head>", sanitizer + "\n</head>");
  }
  fs.writeFileSync(f, html, "utf8");
}

/* 2) Fix scanner token extraction hard */
let scanner = fs.readFileSync("PAGES/scanner.html", "utf8");

scanner = scanner.replace(
/function extractToken\(value\)\{[\s\S]*?\n  \}/,
`function extractToken(value){
    const raw = String(value || "").trim();

    const direct = raw.match(/AZHASEC-[A-Za-z0-9-]+/);
    if (direct) return direct[0];

    try {
      const u = new URL(raw);
      const t = u.searchParams.get("token") || "";
      const m = t.match(/AZHASEC-[A-Za-z0-9-]+/);
      return m ? m[0] : t;
    } catch(e) {
      const m = raw.match(/[?&]token=([^&]+)/);
      if (!m) return raw;
      const decoded = decodeURIComponent(m[1]);
      const clean = decoded.match(/AZHASEC-[A-Za-z0-9-]+/);
      return clean ? clean[0] : decoded;
    }
  }`
);

/* 3) Make scan open permit with clean token only */
scanner = scanner.replace(
/location\.href = "\/permit\?token=" \+ encodeURIComponent\(token\)[\s\S]*?;/,
`location.href = "/permit?token=" + encodeURIComponent(token) + "&mode=security&app=1&from=scanner&sessionToken=" + encodeURIComponent(getSessionToken());`
);

fs.writeFileSync("PAGES/scanner.html", scanner, "utf8");

console.log("✅ Token parsing fixed.");
console.log("✅ Corrupted client/permit token URLs auto-cleaned.");
console.log("✅ Scanner now sends clean AZHASEC token only.");
