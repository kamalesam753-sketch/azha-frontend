const fs = require("fs");

const p = "PAGES/index.html";
let html = fs.readFileSync(p,"utf8");

/* remove duplicated verification buttons */
html = html.replace(
/<button[^>]*>\s*Show Identity Verification\s*<\/button>\s*<button[^>]*>\s*Show Identity Verification\s*<\/button>/gis,
match => {
  const first = match.match(/<button[\s\S]*?<\/button>/i);
  return first ? first[0] : match;
}
);

/* prevent future duplicate injection */
html = html.replace(
/if\s*\(\s*!html\.includes\(["']identity-check-section["']\)\s*\)\s*\{/,
`if (
  !html.includes("identity-check-section") &&
  !html.includes("Show Identity Verification")
) {`
);

fs.writeFileSync(p, html, "utf8");

console.log("✅ Duplicate verification button fixed");
