const fs = require("fs");
let html = fs.readFileSync("PAGES/dashboard.html", "utf8");

/* Add Guests header after Tenant if missing */
if (!html.includes("<th>Guests</th>")) {
  html = html.replace(
    /<th>\s*Tenant\s*<\/th>/i,
    "<th>Tenant</th>\n                  <th>Guests</th>"
  );
}

/* Fix loading colspan */
html = html.replace(/colspan="9"/g, 'colspan="10"');

fs.writeFileSync("PAGES/dashboard.html", html, "utf8");
console.log("Fixed dashboard table columns alignment.");
