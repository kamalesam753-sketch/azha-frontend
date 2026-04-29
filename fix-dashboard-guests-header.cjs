const fs = require("fs");
let html = fs.readFileSync("PAGES/dashboard.html", "utf8");

if (!html.includes("<th>Guests</th>")) {
  html = html.replace(
    "<th>Tenant</th>",
    "<th>Tenant</th>\n                  <th>Guests</th>"
  );
}

html = html.replace(/<td colspan="9" class="empty">/g, '<td colspan="10" class="empty">');

fs.writeFileSync("PAGES/dashboard.html", html, "utf8");
console.log("Dashboard table header fixed.");
