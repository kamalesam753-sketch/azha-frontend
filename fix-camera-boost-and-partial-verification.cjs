const fs = require("fs");

const scannerPath = "PAGES/scanner.html";
const indexPath = "PAGES/index.html";

/* 1) Camera Boost Mode */
let scanner = fs.readFileSync(scannerPath, "utf8");

scanner = scanner
  .replace(
    /\{fps:\d+,\s*qrbox:\{width:\d+,height:\d+\},\s*aspectRatio:1\.0,\s*disableFlip:true(?:,\s*experimentalFeatures:\{useBarCodeDetectorIfSupported:true\})?\}/g,
    `{fps:30, qrbox:{width:380,height:380}, aspectRatio:1.0, disableFlip:true, experimentalFeatures:{useBarCodeDetectorIfSupported:true}}`
  )
  .replace(
    /setStatus\("Ready",""\);/,
    `
    try {
      const video = document.querySelector("#reader video");
      const track = video && video.srcObject && video.srcObject.getVideoTracks && video.srcObject.getVideoTracks()[0];

      if (track && track.getCapabilities) {
        const caps = track.getCapabilities();
        const advanced = {};

        if (caps.focusMode && caps.focusMode.includes("continuous")) {
          advanced.focusMode = "continuous";
        }

        if (caps.exposureMode && caps.exposureMode.includes("continuous")) {
          advanced.exposureMode = "continuous";
        }

        if (caps.torch) {
          // Low-light enhancement when supported
          advanced.torch = true;
        }

        if (caps.zoom) {
          // Auto zoom boost
          advanced.zoom = Math.min(caps.zoom.max || 1, Math.max(caps.zoom.min || 1, 1.5));
        }

        if (Object.keys(advanced).length) {
          track.applyConstraints({ advanced:[advanced] }).catch(function(){});
        }
      }
    } catch(e) {}

    setStatus("Ready","");
    `
  )
  .replace(
    /beep\(type \|\| "invalid"\);/,
    `
    beep(type || "invalid");
    try {
      if (navigator.vibrate) {
        navigator.vibrate(type === "valid" ? [80] : type === "warning" ? [80,40,80] : [160,60,160]);
      }
    } catch(e) {}
    `
  );

fs.writeFileSync(scannerPath, scanner, "utf8");


/* 2) Verification becomes partial / present tracking */
let index = fs.readFileSync(indexPath, "utf8");

index = index
  .replace(/Verified:/g, "Present:")
  .replace(/Complete Verification/g, "Save Present Guests")
  .replace(/Verification Completed ✓/g, "Present Guests Saved ✓")
  .replace(
    /if\(checked<rows\.length\)\{alert\("يرجى التحقق من جميع الأسماء أولاً"\);return;\}/g,
    `if(checked === 0){alert("يرجى تحديد شخص واحد على الأقل");return;}`
  )
  .replace(
    /if\(checked < rows\.length\)\{\s*alert\("Please verify all listed guests first\. \/ يرجى التحقق من جميع الأسماء أولاً"\);\s*return;\s*\}/g,
    `if(checked === 0){ alert("يرجى تحديد شخص واحد على الأقل"); return; }`
  )
  .replace(
    /complete\.textContent="Verification Completed ✓";/g,
    `complete.textContent="Present Guests Saved ✓";`
  )
  .replace(
    /complete\.textContent = "Verification Completed ✓";/g,
    `complete.textContent = "Present Guests Saved ✓";`
  );

fs.writeFileSync(indexPath, index, "utf8");

console.log("✅ Camera Boost applied: fps, barcode detector, continuous focus, exposure, torch if supported, auto zoom.");
console.log("✅ Vibration feedback applied.");
console.log("✅ Verification changed from mandatory all-guests to partial present-guests tracking.");
