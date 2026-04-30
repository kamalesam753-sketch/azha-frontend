const fs = require("fs");

const p = "PAGES/index.html";
let html = fs.readFileSync(p, "utf8");

const fix = `
<script id="azha-permit-validity-hard-lock">
(function(){
  function ymd(v){
    const m = String(v || "").match(/(\\d{4})-(\\d{2})-(\\d{2})/);
    return m ? m[1]+"-"+m[2]+"-"+m[3] : "";
  }

  function today(){
    const d = new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }

  function compute(start,end){
    const s = ymd(start), e = ymd(end), t = today();
    if(!s || !e) return null;
    if(t > e) return {ar:"التصريح منتهي", en:"Permit expired", cls:"invalid"};
    if(t < s) return {ar:"لم يبدأ بعد", en:"Not started yet", cls:"warning"};
    if(t === e) return {ar:"آخر يوم ساري", en:"Last valid day", cls:"warning"};
    return {ar:"صالح للدخول", en:"Valid for entry", cls:"valid"};
  }

  function splitNames(raw){
    return String(raw || "")
      .split(/\\s*\\/\\s*|\\s+-\\s+|[-–—•]+|[,،\\n]+/g)
      .map(x=>x.trim())
      .filter(Boolean);
  }

  function apply(){
    const txt = document.body.innerText || "";
    const dates = Array.from(txt.matchAll(/\\d{4}-\\d{2}-\\d{2}/g)).map(x=>x[0]);
    if(dates.length < 2) return;

    const result = compute(dates[0], dates[1]);
    if(!result) return;

    const all = Array.from(document.querySelectorAll("*"));

    all.forEach(el=>{
      const t = (el.textContent || "").trim();
      if(["صالح للدخول","التصريح منتهي","Permit expired","Valid for entry","لم يبدأ بعد","آخر يوم ساري"].includes(t)){
        if(t.includes("Valid") || t.includes("expired") || t.includes("Not") || t.includes("Last")){
          el.textContent = result.en;
        }else{
          el.textContent = result.ar;
        }
      }
    });

    document.body.classList.remove("permit-valid","permit-warning","permit-invalid");
    document.body.classList.add("permit-" + result.cls);
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(apply,300);
    setTimeout(apply,900);
    setTimeout(apply,1800);
  });
})();
</script>

<style id="azha-permit-validity-hard-lock-style">
body.permit-invalid .status-pill,
body.permit-invalid .status-tag{
  background:#fdecec!important;
  color:#b91c1c!important;
}
body.permit-warning .status-pill,
body.permit-warning .status-tag{
  background:#fff8e6!important;
  color:#92400e!important;
}
body.permit-valid .status-pill,
body.permit-valid .status-tag{
  background:#eaf8ee!important;
  color:#166534!important;
}
</style>
`;

if(!html.includes("azha-permit-validity-hard-lock")){
  html = html.replace("</body>", fix + "\n</body>");
}

/* split names by slash too in existing verification scripts */
html = html.replace(
  /split\(\/\\s\+-\\s\+\|\[-–—•\]\+\|\[,،\\n\]\+\/g\)/g,
  'split(/\\\\s*\\\\/\\\\s*|\\\\s+-\\\\s+|[-–—•]+|[,،\\\\n]+/g)'
);

html = html.replace(
  /split\(\/\[,،\\n\]\+\/\)/g,
  'split(/\\\\s*\\\\/\\\\s*|\\\\s+-\\\\s+|[-–—•]+|[,،\\\\n]+/g)'
);

fs.writeFileSync(p, html, "utf8");
console.log("✅ Permit validity hard-locked from dates.");
console.log("✅ Guest names split by slash/dash/comma/newline.");
