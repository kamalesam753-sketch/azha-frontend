(function () {
  "use strict";

  function getConfig() {
    return window.AZHA_CONFIG || {};
  }

  function getApiBaseUrl() {
    const config = getConfig();
    return (config.API && config.API.BASE_URL) || config.API_BASE || "";
  }

  function getTimeout() {
    const config = getConfig();
    return (config.API && config.API.TIMEOUT) || 15000;
  }

  function shouldCacheBust() {
    const config = getConfig();
    return !config.FLAGS || config.FLAGS.CACHE_BUSTER !== false;
  }

  function buildQuery(params) {
    const query = new URLSearchParams();

    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];

      if (value !== undefined && value !== null && String(value) !== "") {
        query.set(key, value);
      }
    });

    if (shouldCacheBust()) {
      query.set("t", Date.now());
    }

    return query.toString();
  }

  function withTimeout(promise, timeout) {
    return new Promise(function (resolve, reject) {
      const timer = setTimeout(function () {
        reject(new Error("Request timeout"));
      }, timeout);

      promise
        .then(function (res) {
          clearTimeout(timer);
          resolve(res);
        })
        .catch(function (err) {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  async function safeJson(response) {
    try {
      return await response.json();
    } catch (e) {
      throw new Error("Invalid JSON response");
    }
  }

  async function handleResponse(response) {
    if (!response.ok) {
      throw new Error("Network error: " + response.status);
    }

    const data = await safeJson(response);

    if (data && data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  function getSessionToken() {
    try {
      return window.AzhaAuth && typeof AzhaAuth.getToken === "function"
        ? AzhaAuth.getToken()
        : "";
    } catch (e) {
      return "";
    }
  }

  function injectAuth(payload) {
    const config = getConfig();
    const shouldInject = !config.FLAGS || config.FLAGS.AUTO_INJECT_SESSION !== false;
    const finalPayload = { ...(payload || {}) };

    if (!shouldInject) return finalPayload;

    const token = getSessionToken();

    // Keep both names for backend compatibility during migration.
    if (token && !finalPayload.sessionToken) {
      finalPayload.sessionToken = token;
    }

    return finalPayload;
  }

  function assertApiReady() {
    if (!getApiBaseUrl()) {
      throw new Error("API base URL is not configured");
    }
  }

  window.AzhaApi = {
    async get(params) {
      assertApiReady();

      const finalParams = injectAuth(params || {});
      const url = getApiBaseUrl() + "?" + buildQuery(finalParams);

      const response = await withTimeout(fetch(url), getTimeout());
      return await handleResponse(response);
    },

    async post(payload) {
      assertApiReady();

      const finalPayload = injectAuth(payload || {});

      const response = await withTimeout(
        fetch(getApiBaseUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(finalPayload)
        }),
        getTimeout()
      );

      return await handleResponse(response);
    },

    async ping() {
      return this.get({ action: "ping" });
    }
  };
})();
