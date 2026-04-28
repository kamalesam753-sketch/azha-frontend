// ==============================
// AZHA ENTERPRISE DASHBOARD JS
// FINAL - NO DOWNGRADE VERSION
// Action-Based API — Direct Production Transport
// Client Card Generator Enabled
// ==============================

(function () {
  "use strict";

  const API_BASE =
    (window.AZHA_CONFIG && (AZHA_CONFIG.API_BASE || (AZHA_CONFIG.API && AZHA_CONFIG.API.BASE_URL))) ||
    "https://azha-backend-production.up.railway.app/api";

  const svc = {
    get: async function (payload) {
      const token = localStorage.getItem("sessionToken") || sessionStorage.getItem("sessionToken") || "";
      const params = new URLSearchParams(Object.assign({}, payload || {}, {
        sessionToken: token,
        _t: Date.now()
      }));

      const res = await fetch(API_BASE + "?" + params.toString(), {
        method: "GET",
        cache: "no-store"
      });

      return res.json();
    },

    post: async function (payload) {
      const token = localStorage.getItem("sessionToken") || sessionStorage.getItem("sessionToken") || "";

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(Object.assign({}, payload || {}, {
          sessionToken: token
        }))
      });

      return res.json();
    }
  };

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

  let adminPermits = [];
  let adminUsers = [];
  let adminGates = [];
  let editingPermitId = null;
  let editingUserId = null;
  let editingGateId = null;

  function escHtml(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeJson(v) {
    return JSON.stringify(String(v || ""));
  }

  function toast(type, msg) {
    if (typeof showToast === "function") showToast(type, msg);
    else if (typeof showNotice === "function") showNotice(type, msg);
    else alert(msg);
  }

  function getClientBasePath() {
    if (window.location.pathname.includes("/PAGES/")) {
      return window.location.origin + "/PAGES/";
    }
    return window.location.origin + "/";
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "readonly");
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (e) {
      copied = false;
    }

    document.body.removeChild(temp);
    return copied;
  }

  window.loadAdminPermits = async function (showMsg) {
    try {
      const res = await AdminPermitService.getAll();
      if (!(res && res.success)) {
        toast("err", (res && res.message) || "Failed to load permits.");
        return;
      }
      adminPermits = res.data || [];
      renderAdminPermits(adminPermits);
      renderAdminPermitSummary(adminPermits);
      if (showMsg) toast("ok", "Admin permits refreshed.");
    } catch (e) {
      toast("err", "System error loading permits.");
    }
  };

  function renderAdminPermitSummary(data) {
    const el = document.getElementById("adminPermitSummaryCards");
    if (!el) return;

    const total = data.length;
    const paid = data.filter((p) => /paid|مدفوع|تم الدفع|تم السداد|مسدد/i.test(p.paymentArabic || "")).length;
    const unpaid = total - paid;
    const active = data.filter((p) => p.validityClass === "valid").length;

    el.innerHTML =
      '<div class="mini-card"><div class="mini-k">Total Permits</div><div class="mini-v">' + escHtml(total) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Paid</div><div class="mini-v">' + escHtml(paid) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Unpaid</div><div class="mini-v">' + escHtml(unpaid) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Active / Current</div><div class="mini-v">' + escHtml(active) + '</div></div>';
  }

  function renderAdminPermits(data) {
    const body = document.getElementById("adminPermitsTableBody");
    if (!body) return;

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="9" class="empty">No permits found.</td></tr>';
      return;
    }

    const searchVal = (document.getElementById("adminPermitSearch") || {}).value || "";
    let filtered = data;

    if (searchVal.trim()) {
      const q = searchVal.trim().toLowerCase();
      filtered = data.filter((p) =>
        (p.unit || "").toLowerCase().includes(q) ||
        (p.tenant || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q) ||
        (p.carPlate || "").toLowerCase().includes(q) ||
        (p.permitId || "").toLowerCase().includes(q) ||
        (p.statusArabic || "").toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="9" class="empty">No matching permits.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map((p) => {
      const pid = p.permitId || p._id || "";
      return '<tr>' +
        '<td>' + escHtml(p.unit) + '</td>' +
        '<td>' + escHtml(p.tenant) + '</td>' +
        '<td>' + escHtml(p.startDate) + '</td>' +
        '<td>' + escHtml(p.endDate) + '</td>' +
        '<td>' + escHtml(p.statusArabic) + '</td>' +
        '<td>' + escHtml(p.paymentArabic) + '</td>' +
        '<td>' + escHtml(p.phone) + '</td>' +
        '<td>' + escHtml(p.carPlate) + '</td>' +
        '<td><div class="admin-row-actions">' +
        '<button class="admin-action-btn edit" onclick="editAdminPermit(' + safeJson(pid) + ')">Edit</button>' +
        '<button class="admin-action-btn reset" onclick="generateClientPermitLink(' + safeJson(pid) + ')">Client Card</button>' +
        '<button class="admin-action-btn delete" onclick="deleteAdminPermit(' + safeJson(pid) + ')">Delete</button>' +
        '</div></td>' +
        '</tr>';
    }).join("");
  }

  window.resetAdminPermitSearch = function () {
    const el = document.getElementById("adminPermitSearch");
    if (el) el.value = "";
    renderAdminPermits(adminPermits);
  };

  let searchTimer = null;
  setTimeout(function () {
    const el = document.getElementById("adminPermitSearch");
    if (el) {
      el.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => renderAdminPermits(adminPermits), 250);
      });
    }
  }, 500);

  window.openAdminPermitModal = function () {
    editingPermitId = null;
    const modal = document.getElementById("adminPermitModal");
    const title = document.getElementById("adminPermitModalTitle");
    const form = document.getElementById("adminPermitForm");

    if (form) form.reset();
    if (title) title.textContent = "إضافة تصريح";
    if (document.getElementById("adminPermitId")) document.getElementById("adminPermitId").value = "";
    if (modal) modal.classList.add("show");
  };

  window.closeAdminPermitModal = function () {
    const modal = document.getElementById("adminPermitModal");
    if (modal) modal.classList.remove("show");
    editingPermitId = null;
  };

  window.handleAdminModalBackdrop = function (event) {
    if (event.target === event.currentTarget) closeAdminPermitModal();
  };

  window.editAdminPermit = function (permitId) {
    const p = adminPermits.find((x) => (x.permitId || x._id) === permitId);
    if (!p) {
      toast("err", "Permit not found.");
      return;
    }

    editingPermitId = permitId;

    const title = document.getElementById("adminPermitModalTitle");
    if (title) title.textContent = "تعديل تصريح";

    if (document.getElementById("adminPermitId")) document.getElementById("adminPermitId").value = permitId;
    if (document.getElementById("adminUnit")) document.getElementById("adminUnit").value = p.unit || "";
    if (document.getElementById("adminTenant")) document.getElementById("adminTenant").value = p.tenant || "";
    if (document.getElementById("adminStartDate")) document.getElementById("adminStartDate").value = p.startDate || "";
    if (document.getElementById("adminEndDate")) document.getElementById("adminEndDate").value = p.endDate || "";
    if (document.getElementById("adminPhone")) document.getElementById("adminPhone").value = p.phone || "";
    if (document.getElementById("adminCarPlate")) document.getElementById("adminCarPlate").value = p.carPlate || "";
    if (document.getElementById("adminPaymentStatus")) document.getElementById("adminPaymentStatus").value = p.paymentArabic || "تم الدفع";
    if (document.getElementById("adminOperationalStatus")) document.getElementById("adminOperationalStatus").value = p.statusArabic || "ساري";

    const modal = document.getElementById("adminPermitModal");
    if (modal) modal.classList.add("show");
  };

  window.saveAdminPermit = async function (event) {
    if (event) event.preventDefault();

    const data = {
      unit: (document.getElementById("adminUnit") || {}).value || "",
      tenant: (document.getElementById("adminTenant") || {}).value || "",
      startDate: (document.getElementById("adminStartDate") || {}).value || "",
      endDate: (document.getElementById("adminEndDate") || {}).value || "",
      phone: (document.getElementById("adminPhone") || {}).value || "",
      carPlate: (document.getElementById("adminCarPlate") || {}).value || "",
      paymentArabic: (document.getElementById("adminPaymentStatus") || {}).value || "",
      statusArabic: (document.getElementById("adminOperationalStatus") || {}).value || ""
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
      if (typeof showLoading === "function") showLoading("Saving permit...");

      const res = editingPermitId
        ? await AdminPermitService.update(editingPermitId, data)
        : await AdminPermitService.create(data);

      if (res && res.success) {
        toast("ok", editingPermitId ? "Permit updated." : "Permit created.");
        closeAdminPermitModal();
        await loadAdminPermits();
      } else {
        toast("err", (res && res.message) || "Failed to save permit.");
      }
    } catch (e) {
      toast("err", "System error saving permit.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.generateClientPermitLink = async function (permitId) {
    if (!permitId) {
      toast("err", "Missing permit ID.");
      return;
    }

    try {
      if (typeof showLoading === "function") showLoading("Generating client card link...");

      const res = await AdminPermitService.generateClientToken(permitId);

      if (!(res && res.success && res.data)) {
        toast("err", (res && res.message) || "Failed to generate client card link.");
        return;
      }

      const token = res.data.token || res.data.secureToken || "";
      if (!token) {
        toast("err", "Token was not returned from backend.");
        return;
      }

      const clientLink = getClientBasePath() + "client.html?token=" + encodeURIComponent(token);
      window.lastGeneratedClientLink = clientLink;

      const copied = await copyText(clientLink);

      if (copied) {
        toast("ok", "Client card link generated and copied.");
      } else {
        prompt("Copy client card link:", clientLink);
        toast("ok", "Client card link generated.");
      }

      if (typeof showNotice === "function") {
        showNotice("ok", "Client Card Link: " + clientLink, false);
      }
    } catch (e) {
      toast("err", "System error generating client card link.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.deleteAdminPermit = async function (permitId) {
    if (!permitId) return;
    if (!confirm("Delete this permit permanently?")) return;

    try {
      if (typeof showLoading === "function") showLoading("Deleting permit...");
      const res = await AdminPermitService.remove(permitId);

      if (res && res.success) {
        toast("ok", "Permit deleted.");
        await loadAdminPermits();
      } else {
        toast("err", (res && res.message) || "Failed to delete permit.");
      }
    } catch (e) {
      toast("err", "System error deleting permit.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.loadAdminUsers = async function (showMsg) {
    try {
      const res = await AdminUserService.getAll();

      if (!(res && res.success)) {
        toast("err", (res && res.message) || "Failed to load users.");
        return;
      }

      adminUsers = res.data || [];
      renderAdminUsers(adminUsers);

      if (showMsg) toast("ok", "Users refreshed.");
    } catch (e) {
      toast("err", "System error loading users.");
    }
  };

  function renderAdminUsers(data) {
    const body = document.getElementById("adminUsersTableBody");
    if (!body) return;

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="7" class="empty">No users found.</td></tr>';
      return;
    }

    body.innerHTML = data.map((u) => {
      const uid = u._id || u.username || "";
      return '<tr>' +
        '<td>' + escHtml(u.username) + '</td>' +
        '<td>' + escHtml(u.fullName) + '</td>' +
        '<td>' + escHtml(u.role) + '</td>' +
        '<td>' + escHtml(u.gateName) + '</td>' +
        '<td>' + escHtml(u.gateLocation) + '</td>' +
        '<td>' + escHtml(u.status) + '</td>' +
        '<td><div class="admin-row-actions">' +
        '<button class="admin-action-btn edit" onclick="editAdminUser(' + safeJson(uid) + ')">Edit</button>' +
        '<button class="admin-action-btn reset" onclick="resetAdminUserPassword(' + safeJson(uid) + ')">Reset PW</button>' +
        '<button class="admin-action-btn delete" onclick="deleteAdminUser(' + safeJson(uid) + ')">Delete</button>' +
        '</div></td>' +
        '</tr>';
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
    if (event.target === event.currentTarget) closeAdminUserModal();
  };

  window.editAdminUser = function (userId) {
    const u = adminUsers.find((x) => (x._id || x.username) === userId);

    if (!u) {
      toast("err", "User not found.");
      return;
    }

    editingUserId = userId;

    const title = document.getElementById("adminUserModalTitle");
    if (title) title.textContent = "Edit Security User";

    if (document.getElementById("adminUserUsername")) document.getElementById("adminUserUsername").value = u.username || "";
    if (document.getElementById("adminUserFullName")) document.getElementById("adminUserFullName").value = u.fullName || "";
    if (document.getElementById("adminUserRole")) document.getElementById("adminUserRole").value = u.role || "guard";
    if (document.getElementById("adminUserGateName")) document.getElementById("adminUserGateName").value = u.gateName || "";
    if (document.getElementById("adminUserGateLocation")) document.getElementById("adminUserGateLocation").value = u.gateLocation || "";
    if (document.getElementById("adminUserStatus")) document.getElementById("adminUserStatus").value = u.status || "active";

    const pwField = document.getElementById("adminUserPasswordField");
    if (pwField) pwField.style.display = "none";

    const modal = document.getElementById("adminUserModal");
    if (modal) modal.classList.add("show");
  };

  window.saveAdminUser = async function (event) {
    if (event) event.preventDefault();

    const data = {
      username: (document.getElementById("adminUserUsername") || {}).value || "",
      fullName: (document.getElementById("adminUserFullName") || {}).value || "",
      role: (document.getElementById("adminUserRole") || {}).value || "guard",
      gateName: (document.getElementById("adminUserGateName") || {}).value || "",
      gateLocation: (document.getElementById("adminUserGateLocation") || {}).value || "",
      status: (document.getElementById("adminUserStatus") || {}).value || "active"
    };

    if (!editingUserId) {
      data.password = (document.getElementById("adminUserPassword") || {}).value || "";
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
      if (typeof showLoading === "function") showLoading("Saving user...");

      const res = editingUserId
        ? await AdminUserService.update(editingUserId, data)
        : await AdminUserService.create(data);

      if (res && res.success) {
        toast("ok", editingUserId ? "User updated." : "User created.");
        closeAdminUserModal();
        await loadAdminUsers();
      } else {
        toast("err", (res && res.message) || "Failed to save user.");
      }
    } catch (e) {
      toast("err", "System error saving user.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.deleteAdminUser = async function (userId) {
    if (!confirm("Delete this user permanently?")) return;

    try {
      if (typeof showLoading === "function") showLoading("Deleting user...");
      const res = await AdminUserService.remove(userId);

      if (res && res.success) {
        toast("ok", "User deleted.");
        await loadAdminUsers();
      } else {
        toast("err", (res && res.message) || "Failed to delete user.");
      }
    } catch (e) {
      toast("err", "System error deleting user.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.resetAdminUserPassword = async function (userId) {
    const pw = prompt("Enter new password for this user:");

    if (!pw || pw.length < 4) {
      toast("err", "Password must be at least 4 characters.");
      return;
    }

    try {
      const res = await AdminUserService.resetPassword(userId, pw);

      if (res && res.success) {
        toast("ok", "Password reset successfully.");
      } else {
        toast("err", (res && res.message) || "Password reset failed.");
      }
    } catch (e) {
      toast("err", "System error resetting password.");
    }
  };

  window.loadAdminGates = async function (showMsg) {
    try {
      const res = await AdminGateService.getAll();

      if (!(res && res.success)) {
        toast("err", (res && res.message) || "Failed to load gates.");
        return;
      }

      adminGates = res.data || [];
      renderAdminGates(adminGates);

      if (showMsg) toast("ok", "Gates refreshed.");
    } catch (e) {
      toast("err", "System error loading gates.");
    }
  };

  function renderAdminGates(data) {
    const body = document.getElementById("adminGatesTableBody");
    if (!body) return;

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty">No gates found.</td></tr>';
      return;
    }

    body.innerHTML = data.map((g) => {
      const gid = g._id || "";
      return '<tr>' +
        '<td>' + escHtml(g.name) + '</td>' +
        '<td>' + escHtml(g.location) + '</td>' +
        '<td>' + escHtml(g.description) + '</td>' +
        '<td>' + escHtml(g.status) + '</td>' +
        '<td><div class="admin-row-actions">' +
        '<button class="admin-action-btn edit" onclick="editAdminGate(' + safeJson(gid) + ')">Edit</button>' +
        '<button class="admin-action-btn delete" onclick="deleteAdminGate(' + safeJson(gid) + ')">Delete</button>' +
        '</div></td>' +
        '</tr>';
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
    if (event.target === event.currentTarget) closeAdminGateModal();
  };

  window.editAdminGate = function (gateId) {
    const g = adminGates.find((x) => x._id === gateId);

    if (!g) {
      toast("err", "Gate not found.");
      return;
    }

    editingGateId = gateId;

    const title = document.getElementById("adminGateModalTitle");
    if (title) title.textContent = "Edit Gate";

    if (document.getElementById("adminGateName")) document.getElementById("adminGateName").value = g.name || "";
    if (document.getElementById("adminGateLocation")) document.getElementById("adminGateLocation").value = g.location || "";
    if (document.getElementById("adminGateDescription")) document.getElementById("adminGateDescription").value = g.description || "";
    if (document.getElementById("adminGateStatus")) document.getElementById("adminGateStatus").value = g.status || "active";

    const modal = document.getElementById("adminGateModal");
    if (modal) modal.classList.add("show");
  };

  window.saveAdminGate = async function (event) {
    if (event) event.preventDefault();

    const data = {
      name: (document.getElementById("adminGateName") || {}).value || "",
      location: (document.getElementById("adminGateLocation") || {}).value || "",
      description: (document.getElementById("adminGateDescription") || {}).value || "",
      status: (document.getElementById("adminGateStatus") || {}).value || "active"
    };

    if (!data.name) {
      toast("err", "Gate name is required.");
      return;
    }

    try {
      if (typeof showLoading === "function") showLoading("Saving gate...");

      const res = editingGateId
        ? await AdminGateService.update(editingGateId, data)
        : await AdminGateService.create(data);

      if (res && res.success) {
        toast("ok", editingGateId ? "Gate updated." : "Gate created.");
        closeAdminGateModal();
        await loadAdminGates();
      } else {
        toast("err", (res && res.message) || "Failed to save gate.");
      }
    } catch (e) {
      toast("err", "System error saving gate.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.deleteAdminGate = async function (gateId) {
    if (!confirm("Delete this gate permanently?")) return;

    try {
      if (typeof showLoading === "function") showLoading("Deleting gate...");
      const res = await AdminGateService.remove(gateId);

      if (res && res.success) {
        toast("ok", "Gate deleted.");
        await loadAdminGates();
      } else {
        toast("err", (res && res.message) || "Failed to delete gate.");
      }
    } catch (e) {
      toast("err", "System error deleting gate.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  setTimeout(function () {
    if (document.getElementById("adminPermitsTableBody")) loadAdminPermits();
    if (document.getElementById("adminUsersTableBody")) loadAdminUsers();
    if (document.getElementById("adminGatesTableBody")) loadAdminGates();
  }, 1500);

})();