const fs = require("fs");

let html = fs.readFileSync("PAGES/dashboard.html", "utf8");

html = html.replace(
/<th>Unit<\/th>\s*<th>Tenant<\/th>\s*<th>Start Date<\/th>\s*<th>End Date<\/th>\s*<th>Status<\/th>\s*<th>Payment<\/th>\s*<th>Phone<\/th>\s*<th>Car Plate<\/th>\s*<th>Actions<\/th>/,
`<th>Unit</th>
                  <th>Tenant</th>
                  <th>Guests</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Phone</th>
                  <th>Car Plate</th>
                  <th>Actions</th>`
);

html = html.replace(/<td colspan="9" class="empty">/g, '<td colspan="10" class="empty">');

fs.writeFileSync("PAGES/dashboard.html", html, "utf8");
console.log("Admin permits table header aligned with dashboard.js.");
