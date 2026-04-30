const fs = require("fs");
let html = fs.readFileSync("PAGES/dashboard.html", "utf8");

const finalTable = `<table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Tenant</th>
                  <th>Guests</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Phone</th>
                  <th>Car Plate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="adminPermitsTableBody">
                <tr>
                  <td colspan="10" class="empty">Loading permits...</td>
                </tr>
              </tbody>
            </table>`;

html = html.replace(
/<table>[\s\S]*?<tbody id="adminPermitsTableBody">[\s\S]*?<\/tbody>\s*<\/table>/,
finalTable
);

fs.writeFileSync("PAGES/dashboard.html", html, "utf8");
console.log("Admin permits table replaced safely by tbody id.");
