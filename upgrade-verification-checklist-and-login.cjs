const fs = require("fs");

const indexPath = "PAGES/index.html";
const loginPath = "PAGES/security-login.html";

let index = fs.readFileSync(indexPath, "utf8");

/* Add checklist tracking to permit result */
const checklistBlock = `
<script id="azha-identity-checklist-tracking">
document.addEventListener("DOMContentLoaded", function(){
  function enhance(){
    const section = document.querySelector(".identity-check-section");
    if(!section || section.dataset.enhanced === "1") return;

    const rows = Array.from(section.querySelectorAll(".identity-list > div"));
    if(!rows.length) return;

    section.dataset.enhanced = "1";

    const counter = document.createElement("div");
    counter.className = "identity-counter";
    counter.textContent = "Verified: 0 / " + rows.length;

    rows.forEach(function(row, index){
      row.className = "identity-person-row";
      row.innerHTML = "<span class='check-box'>☐</span><span>" + row.textContent.replace(/^\\d+\\.\\s*/, "") + "</span>";
      row.addEventListener("click", function(){
        row.classList.toggle("checked");
        row.querySelector(".check-box").textContent = row.classList.contains("checked") ? "☑" : "☐";
        updateCounter();
      });
    });

    const complete = document.createElement("button");
    complete.className = "identity-complete-btn";
    complete.textContent = "Complete Verification";
    complete.addEventListener("click", function(){
      const checked = section.querySelectorAll(".identity-person-row.checked").length;
      if(checked < rows.length){
        alert("Please verify all listed guests first. / يرجى التحقق من جميع الأسماء أولاً");
        return;
      }
      complete.textContent = "Verification Completed ✓";
      complete.classList.add("done");
    });

    function updateCounter(){
      const checked = section.querySelectorAll(".identity-person-row.checked").length;
      counter.textContent = "Verified: " + checked + " / " + rows.length;
      counter.classList.toggle("done", checked === rows.length);
    }

    section.insertBefore(counter, section.querySelector(".identity-list"));
    section.appendChild(complete);
  }

  enhance();
  setTimeout(enhance, 700);
  setTimeout(enhance, 1500);
});
</script>

<style id="azha-identity-checklist-style">
.identity-counter{
  margin:10px 0;
  padding:10px 12px;
  border-radius:14px;
  background:#0f4c81;
  color:#fff;
  font-weight:900;
  text-align:center;
}

.identity-counter.done{
  background:#16a34a;
}

.identity-person-row{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  margin-bottom:8px;
  border-radius:14px;
  background:#fff;
  border:1px solid #f2dfab;
  cursor:pointer;
  font-weight:900;
}

.identity-person-row.checked{
  background:#eaf8ee;
  border-color:#86efac;
  color:#166534;
}

.check-box{
  font-size:20px;
  min-width:28px;
}

.identity-complete-btn{
  width:100%;
  margin-top:10px;
  min-height:48px;
  border:none;
  border-radius:16px;
  background:#0f4c81;
  color:#fff;
  font-weight:900;
  cursor:pointer;
}

.identity-complete-btn.done{
  background:#16a34a;
}
</style>
`;

if(!index.includes("azha-identity-checklist-tracking")){
  index = index.replace("</body>", checklistBlock + "\n</body>");
}

fs.writeFileSync(indexPath, index, "utf8");


/* Force guard/scanner login to scanner */
let login = fs.readFileSync(loginPath, "utf8");

const loginRedirect = `
<script id="azha-login-scanner-auto-redirect">
(function(){
  function getRole(){
    return String(localStorage.getItem("role") || sessionStorage.getItem("role") || "").toLowerCase();
  }

  function getToken(){
    return localStorage.getItem("sessionToken") || sessionStorage.getItem("sessionToken") || "";
  }

  function goScannerIfSecurity(){
    const role = getRole();
    if(getToken() && (role === "guard" || role === "scanner")){
      location.href = "/scanner";
    }
  }

  window.addEventListener("load", function(){
    setTimeout(goScannerIfSecurity, 600);
    setTimeout(goScannerIfSecurity, 1400);
  });
})();
</script>
`;

if(!login.includes("azha-login-scanner-auto-redirect")){
  login = login.replace("</body>", loginRedirect + "\n</body>");
}

fs.writeFileSync(loginPath, login, "utf8");

console.log("✅ Identity checklist + tracking added.");
console.log("✅ Guard/scanner login now opens scanner automatically.");
