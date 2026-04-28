(function () {
  "use strict";

  const configStorage = window.AZHA_CONFIG && AZHA_CONFIG.STORAGE;

  window.AzhaAuth = {
    keys: configStorage || {
      sessionToken: "sessionToken",
      role: "role",
      username: "sessionUsername",
      fullName: "sessionFullName",
      gateName: "sessionGateName",
      gateLocation: "sessionGateLocation"
    },

    storageKey: function (name) {
      return this.keys[name] || name;
    },

    getToken: function () {
      try {
        return localStorage.getItem(this.storageKey("sessionToken")) || "";
      } catch (e) {
        return "";
      }
    },

    getRole: function () {
      try {
        return (localStorage.getItem(this.storageKey("role")) || "").toLowerCase();
      } catch (e) {
        return "";
      }
    },

    getUsername: function () {
      try {
        return localStorage.getItem(this.storageKey("username")) || "";
      } catch (e) {
        return "";
      }
    },

    getSession: function () {
      return {
        token: this.getToken(),
        role: this.getRole(),
        username: localStorage.getItem(this.storageKey("username")) || "",
        fullName: localStorage.getItem(this.storageKey("fullName")) || "",
        gateName: localStorage.getItem(this.storageKey("gateName")) || "",
        gateLocation: localStorage.getItem(this.storageKey("gateLocation")) || ""
      };
    },

    isLoggedIn: function () {
      return !!this.getToken();
    },

    saveSession: function (data) {
      try {
        data = data || {};

        const token = data.token || data.sessionToken || this.getToken() || "";

        const safeSet = function (key, value) {
          localStorage.setItem(key, value || "");
        };

        safeSet(this.storageKey("sessionToken"), token);
        safeSet(this.storageKey("role"), data.role);
        safeSet(this.storageKey("username"), data.username);
        safeSet(this.storageKey("fullName"), data.fullName || data.name);
        safeSet(this.storageKey("gateName"), data.gateName);
        safeSet(this.storageKey("gateLocation"), data.gateLocation);
      } catch (e) {
        console.error("AzhaAuth.saveSession error:", e);
      }
    },

    clearSession: function () {
      try {
        Object.keys(this.keys).forEach((key) => {
          localStorage.removeItem(this.keys[key]);
        });
      } catch (e) {
        console.error("AzhaAuth.clearSession error:", e);
      }
    },

    getRoute: function (name, fallback) {
      const routes = window.AZHA_CONFIG && AZHA_CONFIG.ROUTES;
      return (routes && routes[name]) || fallback;
    },

    redirectToLogin: function () {
      this.clearSession();
      window.location.replace(this.getRoute("login", "/login"));
    },

    redirectByRole: function () {
      const role = this.getRole();

      const roles = (window.AZHA_CONFIG && AZHA_CONFIG.ROLES) || {};
      const gateRoles = roles.GATE || ["guard", "scanner"];
      const dashboardRoles = roles.DASHBOARD || ["admin", "supervisor", "viewer"];

      if (gateRoles.includes(role)) {
        window.location.replace(this.getRoute("gate", "/gate"));
        return;
      }

      if (dashboardRoles.includes(role)) {
        window.location.replace(this.getRoute("dashboard", "/dashboard"));
        return;
      }

      this.redirectToLogin();
    },

    requireAuth: function () {
      if (!this.isLoggedIn()) {
        this.redirectToLogin();
        return false;
      }

      return true;
    },

    requireRoles: function (allowedRoles) {
      const role = this.getRole();
      const allowed = Array.isArray(allowedRoles) ? allowedRoles : [];

      if (!this.isLoggedIn() || !allowed.includes(role)) {
        this.redirectToLogin();
        return false;
      }

      return true;
    }
  };
})();
