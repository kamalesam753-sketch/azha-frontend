const fs = require("fs");
const path = require("path");

const pagesDir = "PAGES";

for (const file of fs.readdirSync(pagesDir)) {
  if (!file.endsWith(".html")) continue;

  const p = path.join(pagesDir, file);
  let html = fs.readFileSync(p, "utf8");

  html = html
    .replace(/azha-logo\.png/g, "azha-logo-final.png")
    .replace(/azha-wordmark\.svg/g, "azha-logo-final.png")
    .replace(/azha-brand\.svg/g, "azha-logo-final.png")
    .replace(/madaar-logo\.png/g, "madaar-logo-final.png")
    .replace(/madaar-brand\.svg/g, "madaar-logo-final.png");

  const style = `
<style id="azha-final-real-logo-system">
  img[src*="azha-logo-final"]{
    width:auto!important;
    height:58px!important;
    object-fit:contain!important;
    background:transparent!important;
    filter:none!important;
  }

  img[src*="madaar-logo-final"]{
    width:auto!important;
    height:34px!important;
    object-fit:contain!important;
    background:transparent!important;
    filter:none!important;
    opacity:.95!important;
  }

  .azha-brand-header img[src*="azha-logo-final"]{
    height:64px!important;
    max-width:220px!important;
  }

  .logo-chip img[src*="azha-logo-final"],
  .logo-chip img[src*="madaar-logo-final"]{
    filter:none!important;
  }

  @media(max-width:760px){
    img[src*="azha-logo-final"]{
      height:44px!important;
    }

    img[src*="madaar-logo-final"]{
      height:26px!important;
    }

    .azha-brand-header img[src*="azha-logo-final"]{
      height:48px!important;
      max-width:170px!important;
    }
  }
</style>
`;

  if (!html.includes("azha-final-real-logo-system")) {
    html = html.replace("</head>", style + "\n</head>");
  }

  fs.writeFileSync(p, html, "utf8");
}

let manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
manifest.icons = [
  {
    src: "/ASSETS/azha-logo-final.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any maskable"
  }
];
fs.writeFileSync("manifest.webmanifest", JSON.stringify(manifest, null, 2), "utf8");

console.log("✅ Final real logos applied across the system.");
