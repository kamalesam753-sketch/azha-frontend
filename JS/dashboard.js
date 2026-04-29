// ==============================
// AZHA ENTERPRISE DASHBOARD JS
// CLEAN FINAL STABLE VERSION - NO DOWNGRADE
// Node.js Backend + MongoDB + Vercel Clean Routes
// ==============================

(function () {
  "use strict";

  const API_BASE =
    (window.AZHA_CONFIG &&
      (window.AZHA_CONFIG.API_BASE ||
        (window.AZHA_CONFIG.API && window.AZHA_CONFIG.API.BASE_URL))) ||
    "https://azha-backend-production.up.railway.app/api";

  let adminPermits = [];
  let adminUsers = [];
  let adminGates = [];
  let editingPermitId = null;
  let editingUserId = null;
  let editingGateId = null;
  let searchTimer = null;

  function getSessionToken() {
    try {
      return (
        (window.AzhaAuth && typeof window.AzhaAuth.getToken === "function" && window.AzhaAuth.getToken()) ||
        localStorage.getItem("sessionToken") ||
        sessionStorage.getItem("sessionToken") ||
        ""
      );
    } catch (e) {
      return "";
    }
  }

  const svc = {
    async get(payload) {
      const params = new URLSearchParams(
        Object.assign({}, payload || {}, {
          sessionToken: getSessionToken(),
          _t: Date.now()
        })
      );

      const res = await fetch(API_BASE + "?" + params.toString(), {
        method: "GET",
        cache: "no-store"
      });

      return await safeJson(res);
    },

    async post(payload) {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(
          Object.assign({}, payload || {}, {
            sessionToken: getSessionToken()
          })
        )
      });

      return await safeJson(res);
    }
  };

  async function safeJson(response) {
    let data = null;

    try {
      data = await response.json();
    } catch (e) {
      data = {
        success: false,
        message: "Invalid server response"
      };
    }

    if (!response.ok && data && data.success !== true) {
      data.status = response.status;
    }

    return data;
  }

  window.AdminPermitService = {
    getAll: () => svc.get({ action: "getPermits" }),
    create: (data) => svc.post(Object.assign({ action: "createPermit" }, data || {})),
    update: (id, data) => svc.post(Object.assign({ action: "updatePermit", id }, data || {})),
    remove: (id) => svc.post({ action: "deletePermit", id }),
    generateClientToken: (id) => svc.post({ action: "generateClientToken", id })
  };

  window.AdminUserService = {
    getAll: () => svc.get({ action: "getUsers" }),
    create: (data) => svc.post(Object.assign({ action: "createUser" }, data || {})),
    update: (id, data) => svc.post(Object.assign({ action: "updateUser", id }, data || {})),
    remove: (id) => svc.post({ action: "deleteUser", id }),
    resetPassword: (id, newPassword) => svc.post({ action: "resetUserPassword", id, newPassword })
  };

  window.AdminGateService = {
    getAll: () => svc.get({ action: "getGates" }),
    create: (data) => svc.post(Object.assign({ action: "createGate" }, data || {})),
    update: (id, data) => svc.post(Object.assign({ action: "updateGate", id }, data || {})),
    remove: (id) => svc.post({ action: "deleteGate", id })
  };

  function escHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function attr(v) {
    return escHtml(encodeURIComponent(String(v || "")));
  }

  function decodeId(v) {
    try {
      return decodeURIComponent(String(v || ""));
    } catch (e) {
      return String(v || "");
    }
  }

  function toast(type, msg) {
    if (typeof window.showToast === "function") {
      window.showToast(type, msg);
      return;
    }

    if (typeof window.showNotice === "function") {
      window.showNotice(type, msg, false);
      return;
    }

    if (msg) alert(msg);
  }

  function showBusy(text) {
    if (typeof window.showLoading === "function") window.showLoading(text || "Loading...");
  }

  function hideBusy() {
    if (typeof window.hideLoading === "function") window.hideLoading();
  }

  function normalizePayment(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isPaid(value) {
    const v = normalizePayment(value);
    return (
      v === "paid" ||
      v === "تم الدفع" ||
      v.includes("paid") ||
      v.includes("تم")
    );
  }

  function getPaymentText(value) {
    if (!value || value === "-") return "-";
    return isPaid(value) ? "Paid" : "Unpaid";
  }

  function getStatusMeta(p) {
    const cls = String((p && p.validityClass) || "").toLowerCase();
    const txt = (p && (p.validityText || p.statusArabic || p.status)) || "-";

    if (cls === "valid") return { text: txt, tag: "tag-valid" };
    if (cls === "warning") return { text: txt, tag: "tag-warning" };
    if (cls === "invalid" || cls === "not_found") return { text: txt, tag: "tag-invalid" };

    const lower = String(txt || "").toLowerCase();
    if (lower.includes("expired") || txt.includes("انتهى")) return { text: txt, tag: "tag-invalid" };
    if (lower.includes("warning") || txt.includes("غد") || txt.includes("لم يبدأ") || txt.includes("آخر يوم")) {
      return { text: txt, tag: "tag-warning" };
    }
    if (lower.includes("active") || txt.includes("ساري")) return { text: txt, tag: "tag-valid" };

    return { text: txt, tag: "tag-soft" };
  }

  function getSortValue(p, key) {
    if (!p) return "";

    if (key === "startAsc") return p.startDate || "";
    if (key === "endAsc") return p.endDate || "";
    if (key === "unitAsc") return p.unit || "";
    if (key === "tenantAsc") return p.tenant || "";
    if (key === "statusAsc") return p.validityText || p.statusArabic || "";
    return p.updatedAt || p.createdAt || p.startDate || "";
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard
        .writeText(text)
        .then(() => true)
        .catch(() => false);
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return Promise.resolve(!!ok);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function cleanClientLink(token) {
    const route =
      (window.AZHA_CONFIG &&
        window.AZHA_CONFIG.ROUTES &&
        window.AZHA_CONFIG.ROUTES.clientCard) ||
      "/client";

    return window.location.origin + route + "?token=" + encodeURIComponent(token);
  }

  function getListId(item, keys) {
    for (const key of keys) {
      if (item && item[key]) return String(item[key]);
    }

    return "";
  }

  function findPermitById(id) {
    const key = String(id || "");
    return (
      adminPermits.find((p) => {
        const ids = [
          p._id,
          p.id,
          p.permitId,
          p.token,
          p.secureToken
        ].map((x) => String(x || ""));
        return ids.includes(key);
      }) || null
    );
  }

  function findUserById(id) {
    const key = String(id || "");
    return (
      adminUsers.find((u) => {
        const ids = [u._id, u.id, u.username].map((x) => String(x || ""));
        return ids.includes(key);
      }) || null
    );
  }

  function findGateById(id) {
    const key = String(id || "");
    return (
      adminGates.find((g) => {
        const ids = [g._id, g.id, g.name, g.gateName].map((x) => String(x || ""));
        return ids.includes(key);
      }) || null
    );
  }

  function buildActionButton(action, id, label, cls) {
    return (
      '<button type="button" class="admin-action-btn ' +
      escHtml(cls || "") +
      '" data-admin-action="' +
      escHtml(action) +
      '" data-admin-id="' +
      attr(id) +
      '">' +
      escHtml(label) +
      "</button>"
    );
  }

  function renderAdminPermitSummary(data) {
    const el = document.getElementById("adminPermitSummaryCards");
    if (!el) return;

    const list = Array.isArray(data) ? data : [];
    const total = list.length;
    const active = list.filter((p) => String(p.validityClass || "").toLowerCase() === "valid").length;
    const warning = list.filter((p) => String(p.validityClass || "").toLowerCase() === "warning").length;
    const expired = list.filter((p) => String(p.validityClass || "").toLowerCase() === "invalid").length;
    const paid = list.filter((p) => isPaid(p.paymentArabic || p.paymentStatus)).length;
    const unpaid = total - paid;

    el.innerHTML =
      '<div class="mini-card"><div class="mini-k">Total Permits</div><div class="mini-v">' + escHtml(total) + "</div></div>" +
      '<div class="mini-card"><div class="mini-k">Active</div><div class="mini-v">' + escHtml(active) + "</div></div>" +
      '<div class="mini-card"><div class="mini-k">Warning</div><div class="mini-v">' + escHtml(warning) + "</div></div>" +
      '<div class="mini-card"><div class="mini-k">Expired</div><div class="mini-v">' + escHtml(expired) + "</div></div>" +
      '<div class="mini-card"><div class="mini-k">Paid</div><div class="mini-v">' + escHtml(paid) + "</div></div>" +
      '<div class="mini-card"><div class="mini-k">Unpaid</div><div class="mini-v">' + escHtml(unpaid) + "</div></div>";
  }

  window.renderAdminPermits = function (data) {
    const body = document.getElementById("adminPermitsTableBody");
    if (!body) return;

    const list = Array.isArray(data) ? data : [];

    renderAdminPermitSummary(list);

    if (!list.length) {
      body.innerHTML = '<tr><td colspan="10" class="empty">No permits found.</td></tr>';
      return;
    }

    const searchVal = (document.getElementById("adminPermitSearch") || {}).value || "";
    const statusFilter = (document.getElementById("adminStatusFilter") || {}).value || "";
    const paymentFilter = (document.getElementById("adminPaymentFilter") || {}).value || "";
    const sortFilter = (document.getElementById("adminSortFilter") || {}).value || "updatedDesc";

    let filtered = list.slice();

    if (searchVal.trim()) {
      const q = searchVal.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        String(p.unit || "").toLowerCase().includes(q) ||
        String(p.tenant || "").toLowerCase().includes(q) ||
        String(p.tenantCount || "").toLowerCase().includes(q) ||
        String(p.phone || "").toLowerCase().includes(q) ||
        String(p.carPlate || "").toLowerCase().includes(q) ||
        String(p.permitId || "").toLowerCase().includes(q) ||
        String(p.statusArabic || "").toLowerCase().includes(q) ||
        String(p.validityText || "").toLowerCase().includes(q) ||
        String(p.paymentArabic || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => String(p.validityClass || "").toLowerCase() === statusFilter);
    }

    if (paymentFilter) {
      filtered = filtered.filter((p) =>
        paymentFilter === "paid"
          ? isPaid(p.paymentArabic || p.paymentStatus)
          : !isPaid(p.paymentArabic || p.paymentStatus)
      );
    }

    filtered.sort((a, b) => {
      const av = String(getSortValue(a, sortFilter) || "");
      const bv = String(getSortValue(b, sortFilter) || "");
      if (sortFilter === "updatedDesc") return bv.localeCompare(av);
      return av.localeCompare(bv);
    });

    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="10" class="empty">No matching permits.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map((p) => {
      const pid = getListId(p, ["permitId", "_id", "id"]);
      const status = getStatusMeta(p);

      return (
        '<tr data-permit-id="' + attr(pid) + '">' +
        "<td>" + escHtml(p.unit || "-") + "</td>" +
        "<td>" + escHtml(p.tenant || "-") + "</td>" +
        "<td>" + escHtml(p.tenantCount || "-") + "</td>" +
        "<td>" + escHtml(p.startDate || "-") + "</td>" +
        "<td>" + escHtml(p.endDate || "-") + "</td>" +
        '<td><span class="status-tag ' + escHtml(status.tag) + '">' + escHtml(status.text) + "</span>" +
        (p.validityNote ? '<span class="status-subline">' + escHtml(p.validityNote) + "</span>" : "") +
        "</td>" +
        "<td>" + escHtml(getPaymentText(p.paymentArabic || p.paymentStatus || "-")) + "</td>" +
        "<td>" + escHtml(p.phone || "-") + "</td>" +
        "<td>" + escHtml(p.carPlate || "-") + "</td>" +
        '<td><div class="admin-row-actions">' +
        buildActionButton("edit-permit", pid, "Edit", "edit") +
        buildActionButton("client-card", pid, "Client Card", "reset") +
        buildActionButton("delete-permit", pid, "Delete", "delete") +
        "</div></td>" +
        "</tr>"
      );
    }).join("");
  };

  window.loadAdminPermits = async function (showMsg) {
    try {
      const res = await window.AdminPermitService.getAll();

      if (!(res && res.success)) {
        toast("err", (res && res.message) || "Failed to load permits.");
        return;
      }

      adminPermits = Array.isArray(res.data) ? res.data : [];
      window.adminPermits = adminPermits;
      window.renderAdminPermits(adminPermits);

      if (showMsg) toast("ok", "Permits refreshed.");
    } catch (e) {
      console.error("loadAdminPermits failed:", e);
      toast("err", "System error loading permits.");
    }
  };

  window.resetAdminPermitSearch = function () {
    const el = document.getElementById("adminPermitSearch");
    if (el) el.value = "";

    const status = document.getElementById("adminStatusFilter");
    if (status) status.value = "";

    const payment = document.getElementById("adminPaymentFilter");
    if (payment) payment.value = "";

    const sort = document.getElementById("adminSortFilter");
    if (sort) sort.value = "updatedDesc";

    window.renderAdminPermits(adminPermits);
  };

  window.openAdminPermitModal = function () {
    editingPermitId = null;

    const modal = document.getElementById("adminPermitModal");
    const title = document.getElementById("adminPermitModalTitle");
    const form = document.getElementById("adminPermitForm");

    if (form) form.reset();
    if (title) title.textContent = "Add Permit";

    const permitIdEl = document.getElementById("adminPermitId");
    if (permitIdEl) permitIdEl.value = "";

    if (modal) modal.classList.add("show");
  };

  window.closeAdminPermitModal = function () {
    const modal = document.getElementById("adminPermitModal");
    if (modal) modal.classList.remove("show");
    editingPermitId = null;
  };

  window.handleAdminModalBackdrop = function (event) {
    if (event.target === event.currentTarget) window.closeAdminPermitModal();
  };

  window.editAdminPermit = function (permitId) {
    const p = findPermitById(permitId);

    if (!p) {
      toast("err", "Permit not found.");
      return;
    }

    editingPermitId = getListId(p, ["permitId", "_id", "id"]) || permitId;

    const title = document.getElementById("adminPermitModalTitle");
    if (title) title.textContent = "Edit Permit";

    setValue("adminPermitId", editingPermitId);
    setValue("adminUnit", p.unit || "");
    setValue("adminTenant", p.tenant || "");
    setValue("adminTenantCount", p.tenantCount || "");
    setValue("adminStartDate", p.startDate || "");
    setValue("adminEndDate", p.endDate || "");
    setValue("adminPhone", p.phone || "");
    setValue("adminCarPlate", p.carPlate || "");
    setValue("adminPaymentStatus", p.paymentArabic || p.paymentStatus || "paid");
    setValue("adminOperationalStatus", p.statusArabic || p.status || "ساري");

    const modal = document.getElementById("adminPermitModal");
    if (modal) modal.classList.add("show");
  };

  window.saveAdminPermit = async function (event) {
    if (event) event.preventDefault();

    const data = {
      unit: getValue("adminUnit"),
      tenant: getValue("adminTenant"),
      tenantCount: getValue("adminTenantCount"),
      startDate: getValue("adminStartDate"),
      endDate: getValue("adminEndDate"),
      phone: getValue("adminPhone"),
      carPlate: getValue("adminCarPlate"),
      paymentArabic: getValue("adminPaymentStatus"),
      statusArabic: getValue("adminOperationalStatus")
    };

    if (!data.unit || !data.tenant || !data.startDate || !data.endDate) {
      toast("err", "Please fill all required fields.");
      return;
    }

    if (new Date(data.endDate) < new Date(data.startDate)) {
      toast("err", "End date cannot be before start date.");
      return;
    }

    try {
      showBusy("Saving permit...");

      const res = editingPermitId
        ? await window.AdminPermitService.update(editingPermitId, data)
        : await window.AdminPermitService.create(data);

      if (res && res.success) {
        toast("ok", editingPermitId ? "Permit updated." : "Permit created.");
        window.closeAdminPermitModal();
        await window.loadAdminPermits();
      } else {
        toast("err", (res && res.message) || "Failed to save permit.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error saving permit.");
    } finally {
      hideBusy();
    }
  };

  window.generateClientPermitLink = async function (permitId) {
    if (!permitId) {
      toast("err", "Missing permit ID.");
      return;
    }

    try {
      showBusy("Generating client card link...");

      let res = await window.AdminPermitService.generateClientToken(permitId);

      if (!(res && res.success && res.data)) {
        res = await svc.get({ action: "getTokenByPermit", id: permitId });
      }

      if (!(res && res.success && res.data)) {
        toast("err", (res && res.message) || "Failed to generate client card link.");
        return;
      }

      const token = res.data.token || res.data.secureToken || "";
      if (!token) {
        toast("err", "Token was not returned from backend.");
        return;
      }

      const clientLink = cleanClientLink(token);
      window.lastGeneratedClientLink = clientLink;

      const copied = await copyText(clientLink);

      if (typeof window.showNotice === "function") {
        window.showNotice("ok", "Client Card Link: " + clientLink, false);
      }

      toast("ok", copied ? "Client card link generated and copied." : "Client card link generated.");

      if (!copied) {
        prompt("Copy client card link:", clientLink);
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error generating client card link.");
    } finally {
      hideBusy();
    }
  };

  window.deleteAdminPermit = async function (permitId) {
    if (!permitId) {
      toast("err", "Missing permit ID.");
      return;
    }

    if (!confirm("Delete this permit permanently?")) return;

    try {
      showBusy("Deleting permit...");
      const res = await window.AdminPermitService.remove(permitId);

      if (res && res.success) {
        toast("ok", "Permit deleted.");
        await window.loadAdminPermits();
      } else {
        toast("err", (res && res.message) || "Failed to delete permit.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error deleting permit.");
    } finally {
      hideBusy();
    }
  };

  window.loadAdminUsers = async function (showMsg) {
    try {
      const res = await window.AdminUserService.getAll();

      if (!(res && res.success)) {
        toast("err", (res && res.message) || "Failed to load users.");
        return;
      }

      adminUsers = Array.isArray(res.data) ? res.data : [];
      window.adminUsers = adminUsers;
      renderAdminUsers(adminUsers);

      if (showMsg) toast("ok", "Users refreshed.");
    } catch (e) {
      console.error(e);
      toast("err", "System error loading users.");
    }
  };

  function renderAdminUsers(data) {
    const body = document.getElementById("adminUsersTableBody");
    if (!body) return;

    const list = Array.isArray(data) ? data : [];

    if (!list.length) {
      body.innerHTML = '<tr><td colspan="7" class="empty">No users found.</td></tr>';
      return;
    }

    body.innerHTML = list.map((u) => {
      const uid = getListId(u, ["_id", "id", "username"]);

      return (
        '<tr data-user-id="' + attr(uid) + '">' +
        "<td>" + escHtml(u.username || "-") + "</td>" +
        "<td>" + escHtml(u.fullName || u.name || "-") + "</td>" +
        "<td>" + escHtml(u.role || "-") + "</td>" +
        "<td>" + escHtml(u.gateName || "-") + "</td>" +
        "<td>" + escHtml(u.gateLocation || "-") + "</td>" +
        "<td>" + escHtml(u.status || "-") + "</td>" +
        '<td><div class="admin-row-actions">' +
        buildActionButton("edit-user", uid, "Edit", "edit") +
        buildActionButton("reset-user-password", uid, "Reset PW", "reset") +
        buildActionButton("delete-user", uid, "Delete", "delete") +
        "</div></td>" +
        "</tr>"
      );
    }).join("");
  }

  window.openAdminUserModal = function () {
    editingUserId = null;

    const modal = document.getElementById("adminUserModal");
    const title = document.getElementById("adminUserModalTitle");
    const form = document.getElementById("adminUserForm");

    if (form) form.reset();
    if (title) title.textContent = "Add Security User";

    const pwField = document.getElementById("adminUserPasswordField");
    if (pwField) pwField.style.display = "";

    if (modal) modal.classList.add("show");
  };

  window.closeAdminUserModal = function () {
    const modal = document.getElementById("adminUserModal");
    if (modal) modal.classList.remove("show");
    editingUserId = null;
  };

  window.handleAdminUserModalBackdrop = function (event) {
    if (event.target === event.currentTarget) window.closeAdminUserModal();
  };

  window.editAdminUser = function (userId) {
    const u = findUserById(userId);

    if (!u) {
      toast("err", "User not found.");
      return;
    }

    editingUserId = getListId(u, ["_id", "id", "username"]) || userId;

    const title = document.getElementById("adminUserModalTitle");
    if (title) title.textContent = "Edit Security User";

    setValue("adminUserUsername", u.username || "");
    setValue("adminUserFullName", u.fullName || u.name || "");
    setValue("adminUserRole", u.role || "guard");
    setValue("adminUserGateName", u.gateName || "");
    setValue("adminUserGateLocation", u.gateLocation || "");
    setValue("adminUserStatus", u.status || "active");

    const pwField = document.getElementById("adminUserPasswordField");
    if (pwField) pwField.style.display = "none";

    const modal = document.getElementById("adminUserModal");
    if (modal) modal.classList.add("show");
  };

  window.saveAdminUser = async function (event) {
    if (event) event.preventDefault();

    const data = {
      username: getValue("adminUserUsername"),
      fullName: getValue("adminUserFullName"),
      role: getValue("adminUserRole") || "guard",
      gateName: getValue("adminUserGateName"),
      gateLocation: getValue("adminUserGateLocation"),
      status: getValue("adminUserStatus") || "active"
    };

    if (!editingUserId) {
      data.password = getValue("adminUserPassword");
      if (!data.password) {
        toast("err", "Password is required for new users.");
        return;
      }
    }

    if (!data.username) {
      toast("err", "Username is required.");
      return;
    }

    try {
      showBusy("Saving user...");

      const res = editingUserId
        ? await window.AdminUserService.update(editingUserId, data)
        : await window.AdminUserService.create(data);

      if (res && res.success) {
        toast("ok", editingUserId ? "User updated." : "User created.");
        window.closeAdminUserModal();
        await window.loadAdminUsers();
      } else {
        toast("err", (res && res.message) || "Failed to save user.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error saving user.");
    } finally {
      hideBusy();
    }
  };

  window.deleteAdminUser = async function (userId) {
    if (!userId) {
      toast("err", "Missing user ID.");
      return;
    }

    if (!confirm("Delete this user permanently?")) return;

    try {
      showBusy("Deleting user...");
      const res = await window.AdminUserService.remove(userId);

      if (res && res.success) {
        toast("ok", "User deleted.");
        await window.loadAdminUsers();
      } else {
        toast("err", (res && res.message) || "Failed to delete user.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error deleting user.");
    } finally {
      hideBusy();
    }
  };

  window.resetAdminUserPassword = async function (userId) {
    if (!userId) {
      toast("err", "Missing user ID.");
      return;
    }

    const pw = prompt("Enter new password for this user:");

    if (!pw || pw.length < 4) {
      toast("err", "Password must be at least 4 characters.");
      return;
    }

    try {
      showBusy("Resetting password...");

      const res = await window.AdminUserService.resetPassword(userId, pw);

      if (res && res.success) {
        toast("ok", "Password reset successfully.");
      } else {
        toast("err", (res && res.message) || "Password reset failed.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error resetting password.");
    } finally {
      hideBusy();
    }
  };

  window.loadAdminGates = async function (showMsg) {
    try {
      const res = await window.AdminGateService.getAll();

      if (!(res && res.success)) {
        toast("err", (res && res.message) || "Failed to load gates.");
        return;
      }

      adminGates = Array.isArray(res.data) ? res.data : [];
      window.adminGates = adminGates;
      renderAdminGates(adminGates);

      if (showMsg) toast("ok", "Gates refreshed.");
    } catch (e) {
      console.error(e);
      toast("err", "System error loading gates.");
    }
  };

  function renderAdminGates(data) {
    const body = document.getElementById("adminGatesTableBody");
    if (!body) return;

    const list = Array.isArray(data) ? data : [];

    if (!list.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty">No gates found.</td></tr>';
      return;
    }

    body.innerHTML = list.map((g) => {
      const gid = getListId(g, ["_id", "id", "name", "gateName"]);

      return (
        '<tr data-gate-id="' + attr(gid) + '">' +
        "<td>" + escHtml(g.name || g.gateName || "-") + "</td>" +
        "<td>" + escHtml(g.location || g.gateLocation || "-") + "</td>" +
        "<td>" + escHtml(g.description || "-") + "</td>" +
        "<td>" + escHtml(g.status || "-") + "</td>" +
        '<td><div class="admin-row-actions">' +
        buildActionButton("edit-gate", gid, "Edit", "edit") +
        buildActionButton("delete-gate", gid, "Delete", "delete") +
        "</div></td>" +
        "</tr>"
      );
    }).join("");
  }

  window.openAdminGateModal = function () {
    editingGateId = null;

    const modal = document.getElementById("adminGateModal");
    const title = document.getElementById("adminGateModalTitle");
    const form = document.getElementById("adminGateForm");

    if (form) form.reset();
    if (title) title.textContent = "Add Gate";
    if (modal) modal.classList.add("show");
  };

  window.closeAdminGateModal = function () {
    const modal = document.getElementById("adminGateModal");
    if (modal) modal.classList.remove("show");
    editingGateId = null;
  };

  window.handleAdminGateModalBackdrop = function (event) {
    if (event.target === event.currentTarget) window.closeAdminGateModal();
  };

  window.editAdminGate = function (gateId) {
    const g = findGateById(gateId);

    if (!g) {
      toast("err", "Gate not found.");
      return;
    }

    editingGateId = getListId(g, ["_id", "id", "name", "gateName"]) || gateId;

    const title = document.getElementById("adminGateModalTitle");
    if (title) title.textContent = "Edit Gate";

    setValue("adminGateName", g.name || g.gateName || "");
    setValue("adminGateLocation", g.location || g.gateLocation || "");
    setValue("adminGateDescription", g.description || "");
    setValue("adminGateStatus", g.status || "active");

    const modal = document.getElementById("adminGateModal");
    if (modal) modal.classList.add("show");
  };

  window.saveAdminGate = async function (event) {
    if (event) event.preventDefault();

    const data = {
      name: getValue("adminGateName"),
      location: getValue("adminGateLocation"),
      description: getValue("adminGateDescription"),
      status: getValue("adminGateStatus") || "active"
    };

    if (!data.name) {
      toast("err", "Gate name is required.");
      return;
    }

    try {
      showBusy("Saving gate...");

      const res = editingGateId
        ? await window.AdminGateService.update(editingGateId, data)
        : await window.AdminGateService.create(data);

      if (res && res.success) {
        toast("ok", editingGateId ? "Gate updated." : "Gate created.");
        window.closeAdminGateModal();
        await window.loadAdminGates();
      } else {
        toast("err", (res && res.message) || "Failed to save gate.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error saving gate.");
    } finally {
      hideBusy();
    }
  };

  window.deleteAdminGate = async function (gateId) {
    if (!gateId) {
      toast("err", "Missing gate ID.");
      return;
    }

    if (!confirm("Delete this gate permanently?")) return;

    try {
      showBusy("Deleting gate...");
      const res = await window.AdminGateService.remove(gateId);

      if (res && res.success) {
        toast("ok", "Gate deleted.");
        await window.loadAdminGates();
      } else {
        toast("err", (res && res.message) || "Failed to delete gate.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error deleting gate.");
    } finally {
      hideBusy();
    }
  };

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value == null ? "" : value;
  }

  function initAdminSearchBinding() {
    ["adminPermitSearch", "adminStatusFilter", "adminPaymentFilter", "adminSortFilter"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.__azhaBound) {
        el.__azhaBound = true;
        el.addEventListener(id === "adminPermitSearch" ? "input" : "change", function () {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(() => window.renderAdminPermits(adminPermits), 180);
        });
      }
    });
  }

  function bindEnterpriseActionDelegation() {
    if (window.__AZHA_ADMIN_ACTIONS_BOUND__) return;
    window.__AZHA_ADMIN_ACTIONS_BOUND__ = true;

    document.addEventListener(
      "click",
      function (event) {
        const btn = event.target && event.target.closest ? event.target.closest("[data-admin-action]") : null;
        if (!btn) return;

        event.preventDefault();
        event.stopPropagation();

        const action = btn.getAttribute("data-admin-action") || "";
        const id = decodeId(btn.getAttribute("data-admin-id") || "");

        if (action === "edit-permit") return window.editAdminPermit(id);
        if (action === "client-card") return window.generateClientPermitLink(id);
        if (action === "delete-permit") return window.deleteAdminPermit(id);

        if (action === "edit-user") return window.editAdminUser(id);
        if (action === "reset-user-password") return window.resetAdminUserPassword(id);
        if (action === "delete-user") return window.deleteAdminUser(id);

        if (action === "edit-gate") return window.editAdminGate(id);
        if (action === "delete-gate") return window.deleteAdminGate(id);
      },
      true
    );
  }

  function autoLoadAdminTables() {
    if (document.getElementById("adminPermitsTableBody")) window.loadAdminPermits();
    if (document.getElementById("adminUsersTableBody")) window.loadAdminUsers();
    if (document.getElementById("adminGatesTableBody")) window.loadAdminGates();
  }

  window.azhaAdminReload = autoLoadAdminTables;

  bindEnterpriseActionDelegation();

  document.addEventListener("DOMContentLoaded", function () {
    initAdminSearchBinding();
    setTimeout(autoLoadAdminTables, 300);
  });

  setTimeout(function () {
    initAdminSearchBinding();
    autoLoadAdminTables();
  }, 1200);
})();