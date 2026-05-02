/**
 * AZHA Notification System
 * Unified toast + notice system for all pages.
 */
(function () {
  "use strict";

  // Create toast container if not present
  function ensureContainer() {
    var container = document.getElementById("azha-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "azha-toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  window.showToast = function (type, message, duration) {
    var container = ensureContainer();
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "info");
    toast.innerHTML =
      '<span class="toast-text">' + (window.AzhaUtils ? window.AzhaUtils.escapeHtml(message) : message) + '</span>';
    container.appendChild(toast);

    var ms = duration || 4000;
    setTimeout(function () {
      toast.classList.add("out");
      setTimeout(function () { toast.remove(); }, 350);
    }, ms);
  };

  window.showNotice = function (type, message, persist) {
    var box = document.getElementById("noticeBox");
    if (!box) return;
    box.className = "notice show " + (type || "info");
    box.textContent = message || "";
    if (!persist) {
      setTimeout(function () { box.classList.remove("show"); }, 6000);
    }
  };

  window.showLoading = function (text) {
    var overlay = document.getElementById("loadingOverlay");
    if (!overlay) return;
    var textEl = overlay.querySelector(".loading-text");
    if (textEl) textEl.textContent = text || "Loading...";
    overlay.classList.add("active");
  };

  window.hideLoading = function () {
    var overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.remove("active");
  };
})();
