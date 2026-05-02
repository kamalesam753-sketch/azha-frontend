/**
 * AZHA Shared Utilities
 * Centralized utility functions used across all frontend pages.
 * Eliminates 4x duplicated escapeHtml and normalizeArabic definitions.
 */
(function () {
  "use strict";

  window.AzhaUtils = {
    escapeHtml: function (value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    normalizeArabic: function (value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي");
    },

    isUnpaid: function (value) {
      var v = this.normalizeArabic(value);
      return v.includes("لم يتم الدفع") || v.includes("غير مدفوع") || v.includes("غير مسدد") || v.includes("unpaid");
    },

    copyText: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; });
      }
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return Promise.resolve(!!ok);
      } catch (e) {
        return Promise.resolve(false);
      }
    },

    formatDate: function (value) {
      if (!value) return "-";
      try { return new Date(value).toLocaleDateString(); } catch (e) { return "-"; }
    },

    formatDateTime: function (value) {
      if (!value) return "-";
      try { return new Date(value).toLocaleString(); } catch (e) { return "-"; }
    },

    daysUntil: function (dateValue) {
      if (!dateValue) return "-";
      var now = new Date(); now.setHours(0, 0, 0, 0);
      var end = new Date(dateValue); end.setHours(0, 0, 0, 0);
      var diff = Math.ceil((end - now) / 86400000);
      if (isNaN(diff)) return "-";
      return diff < 0 ? "Expired" : String(diff);
    },

    safeCssClass: function (value) {
      var v = String(value || "").toLowerCase();
      if (v === "valid" || v === "warning" || v === "invalid" || v === "not_found") return v;
      return "invalid";
    }
  };
})();
