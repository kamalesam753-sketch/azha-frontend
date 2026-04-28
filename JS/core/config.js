(function () {
  "use strict";

  const API_BASE_URL = "https://azha-backend-production.up.railway.app/api";

  window.AZHA_CONFIG = {
    API: {
      BASE_URL: API_BASE_URL,
      TIMEOUT: 20000,
      TRANSPORT: "node",
      VERSION: "v1"
    },

    API_BASE: API_BASE_URL,

    ROUTES: {
      login: "/login",
      dashboard: "/dashboard",
      gate: "/gate",
      permitPreview: "/permit",
      client: "/client",
      clientCard: "/client"
    },

    STORAGE: {
      sessionToken: "sessionToken",
      role: "role",
      username: "sessionUsername",
      fullName: "sessionFullName",
      gateName: "sessionGateName",
      gateLocation: "sessionGateLocation"
    },

    ROLES: {
      DASHBOARD: ["admin", "supervisor", "viewer"],
      GATE: ["guard", "scanner"],
      MANAGEMENT: ["admin", "supervisor"]
    },

    FLAGS: {
      ENABLE_LOGS: false,
      STRICT_MODE: true,
      AUTO_INJECT_SESSION: true,
      CACHE_BUSTER: true
    },

    APP: {
      NAME: "AZHA Enterprise Security Operating System",
      VERSION: "1.0.0",
      ENV: "production",
      PRODUCT_STAGE: "enterprise-live"
    }
  };
})();
