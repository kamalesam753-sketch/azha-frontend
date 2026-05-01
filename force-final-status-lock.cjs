const fs = require("fs");

const p = "PAGES/index.html";
let html = fs.readFileSync(p, "utf8");

const hardOverride = `
<script id="azha-final-hard-override">
(function(){

  function ymd(v){
    const m = String(v||"").match(/(\\d{4})-(\\d{2})-(\\d{2})/);
    return m ? m[1]+"-"+m[2]+"-"+m[3] : "";
  }

  function today(){
    const d = new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }

  function compute(start,end){
    const s = ymd(start);
    const e = ymd(end);
    const t = today();

    if(!s || !e) return null;

    if(t > e) return {cls:"invalid", ar:"التصريح منتهي", en:"Permit expired"};
    if(t < s) return {cls:"warning", ar:"لم يبدأ بعد", en:"Not started yet"};
    if(t === e) return {cls:"warning", ar:"آخر يوم ساري", en:"Last valid day"};
    return {cls:"valid", ar:"صالح للدخول", en:"Valid for entry"};
  }

  function apply(){

    // 🧠 نجيب التواريخ من الصفحة
    const txt = document.body.innerText || "";
    const dates = Array.from(txt.matchAll(/\\d{4}-\\d{2}-\\d{2}/g)).map(x=>x[0]);

    if(dates.length < 2) return;

    const result = compute(dates[0], dates[1]);
    if(!result) return;

    // 🔥 امسح أي classes قديمة
    document.body.className = document.body.className
      .replace(/permit-valid|permit-warning|permit-invalid/g,"");

    document.body.classList.add("permit-" + result.cls);

    // 🔥 امسح أي لون غلط
    document.querySelectorAll("*").forEach(el=>{
      el.style.background = "";
      el.style.color = "";
    });

    // 🔥 عدل النصوص
    document.querySelectorAll("*").forEach(el=>{
      const t = (el.textContent || "").trim();

      if([
        "صالح للدخول",
        "التصريح منتهي",
        "Permit expired",
        "Valid for entry",
        "لم يبدأ بعد",
        "آخر يوم ساري"
      ].includes(t)){
        el.textContent = /[A-Za-z]/.test(t) ? result.en : result.ar;
      }
    });

  }

  // 🔥 نكرر override عشان نكسر أي script تاني
  setTimeout(apply,200);
  setTimeout(apply,800);
  setTimeout(apply,1600);
  setTimeout(apply,3000);

})();
</script>
`;

if(!html.includes("azha-final-hard-override")){
  html = html.replace("</body>", hardOverride + "\n</body>");
}

fs.writeFileSync(p, html, "utf8");

console.log("🔥 HARD OVERRIDE APPLIED (NO MORE WRONG STATUS)");
