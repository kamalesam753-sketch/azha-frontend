
/* ===== AZHA ENTERPRISE FORCED ADMIN LOAD ENGINE ===== */
window.loadAdminPermits = async function () {
  try {
    const res = await AzhaApi.get({ action: "getPermits" });
    const data = (res && res.data) || [];
    if (typeof window.renderAdminPermits === "function") window.renderAdminPermits(data);
  } catch (e) {
    console.error("loadAdminPermits failed:", e);
  }
};

window.loadAdminUsers = async function () {
  try {
    const res = await AzhaApi.get({ action: "getUsers" });
    const data = (res && res.data) || [];
    if (typeof renderAdminUsers === "function") renderAdminUsers(data);
  } catch (e) {
    console.error("loadAdminUsers failed:", e);
  }
};

window.loadAdminGates = async function () {
  try {
    const res = await AzhaApi.get({ action: "getGates" });
    const data = (res && res.data) || [];
    if (typeof renderAdminGates === "function") renderAdminGates(data);
  } catch (e) {
    console.error("loadAdminGates failed:", e);
  }
};
/* ===== END ADMIN LOAD ENGINE ===== */

/* ===== AZHA ENTERPRISE ACTION CORE ===== */

function buildActionButton(action, id, label, cls) {
  return '<button type="button" class="admin-action-btn ' +
    (cls || "") +
    '" data-admin-action="' + action +
    '" data-admin-id="' + id + '">' + label + '</button>';
}

function bindEnterpriseActionDelegation() {
  if (window.__AZHA_ADMIN_ACTIONS_BOUND__) return;
  window.__AZHA_ADMIN_ACTIONS_BOUND__ = true;

  document.addEventListener("click", function (event) {
    const btn = event.target.closest && event.target.closest("[data-admin-action]");
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    const action = btn.getAttribute("data-admin-action");
    const id = btn.getAttribute("data-admin-id");

    if (action === "edit-permit") return window.editAdminPermit(id);
    if (action === "client-card") return window.generateClientPermitLink(id);
    if (action === "delete-permit") return window.deleteAdminPermit(id);

    if (action === "edit-user") return window.editAdminUser(id);
    if (action === "reset-user-password") return window.resetAdminUserPassword(id);
    if (action === "delete-user") return window.deleteAdminUser(id);

    if (action === "edit-gate") return window.editAdminGate(id);
    if (action === "delete-gate") return window.deleteAdminGate(id);
  }, true);
}

/* ===== END ACTION CORE ===== */

﻿// ==============================
// AZHA ENTERPRISE DASHBOARD JS
// FINAL ENTERPRISE VERSION - NO DOWNGRADE
// Action-Based API - Direct Production Transport
// Safe DOM Events - No Broken Inline onclick
// Client Card Generator Enabled
// ==============================

(function () {
  "use strict";

  const API_BASE =
    (window.AZHA_CONFIG && (AZHA_CONFIG.API_BASE || (window.AZHA_CONFIG.API && window.AZHA_CONFIG.API.BASE_URL))) ||
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
  let searchTimer = null;

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
    if (typeof showToast === "function") showToast(type, msg);
    else if (typeof showNotice === "function") showNotice(type, msg);
    else alert(msg);
  }

  ;

  function renderAdminPermitSummary(data) {
    const el = document.getElementById("adminPermitSummaryCards");
    if (!el) return;

    const total = data.length;
    const paid = data.filter((p) => isPaid(p.paymentArabic || p.paymentStatus)).length;
    const unpaid = total - paid;
    const active = data.filter((p) => String(p.validityClass || "").toLowerCase() === "valid").length;
    const warning = data.filter((p) => String(p.validityClass || "").toLowerCase() === "warning").length;
    const expired = data.filter((p) => String(p.validityClass || "").toLowerCase() === "invalid").length;

    el.innerHTML =
      '<div class="mini-card"><div class="mini-k">Total Permits</div><div class="mini-v">' + escHtml(total) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Active</div><div class="mini-v">' + escHtml(active) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Warning</div><div class="mini-v">' + escHtml(warning) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Expired</div><div class="mini-v">' + escHtml(expired) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Paid</div><div class="mini-v">' + escHtml(paid) + '</div></div>' +
      '<div class="mini-card"><div class="mini-k">Unpaid</div><div class="mini-v">' + escHtml(unpaid) + '</div></div>';
  }

  window.renderAdminPermits = function (data) {
    const body = document.getElementById("adminPermitsTableBody");
    if (!body) return;

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="10" class="empty">No permits found.</td></tr>';
      return;
    }

    const searchVal = (document.getElementById("adminPermitSearch") || {}).value || "";
    const statusFilter = (document.getElementById("adminStatusFilter") || {}).value || "";
    const paymentFilter = (document.getElementById("adminPaymentFilter") || {}).value || "";
    const sortFilter = (document.getElementById("adminSortFilter") || {}).value || "updatedDesc";

    let filtered = data.slice();

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
      filtered = filtered.filter((p) => paymentFilter === "paid" ? isPaid(p.paymentArabic || p.paymentStatus) : !isPaid(p.paymentArabic || p.paymentStatus));
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
      const pid = p.permitId || p._id || "";
      const status = getStatusMeta(p);

      return '<tr data-permit-id="' + attr(pid) + '">' +
        '<td>' + escHtml(p.unit || "-") + '</td>' +
        '<td>' + escHtml(p.tenant || "-") + '</td>' +
        '<td>' + escHtml(p.tenantCount || "-") + '</td>' +
        '<td>' + escHtml(p.startDate || "-") + '</td>' +
        '<td>' + escHtml(p.endDate || "-") + '</td>' +
        '<td><span class="status-tag ' + escHtml(status.tag) + '">' + escHtml(status.text) + '</span><span class="status-subline">' + escHtml(p.validityNote || "") + '</span></td>' +
        '<td>' + escHtml(getPaymentText(p.paymentArabic || p.paymentStatus || "-")) + '</td>' +
        '<td>' + escHtml(p.phone || "-") + '</td>' +
        '<td>' + escHtml(p.carPlate || "-") + '</td>' +
        '<td><div class="admin-row-actions">' +
        buildActionButton("edit-permit", pid, "Edit", "edit") +
        buildActionButton("client-card", pid, "Client Card", "reset") +
        buildActionButton("delete-permit", pid, "Delete", "delete") +
        '</div></td>' +
        '</tr>';
    }).join("");
  }

  window.resetAdminPermitSearch = function () {
    const el = document.getElementById("adminPermitSearch");
    if (el) el.value = "";
    window.renderAdminPermits(adminPermits);
  };

  window.openAdminPermitModal = function () {
    editingPermitId = null;

    const modal = document.getElementById("adminPermitModal");
    const title = document.getElementById("adminPermitModalTitle");
    const form = document.getElementById("adminPermitForm");

    if (form) form.reset();
    if (title) title.textContent = "Add Permit";
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
    const p = findPermitById(permitId);

    if (!p) {
      toast("err", "Permit not found.");
      return;
    }

    editingPermitId = permitId;

    const title = document.getElementById("adminPermitModalTitle");
    if (title) title.textContent = "Edit Permit";

    if (document.getElementById("adminPermitId")) document.getElementById("adminPermitId").value = permitId;
    if (document.getElementById("adminUnit")) document.getElementById("adminUnit").value = p.unit || "";
    if (document.getElementById("adminTenant")) document.getElementById("adminTenant").value = p.tenant || "";
    if (document.getElementById("adminTenantCount")) document.getElementById("adminTenantCount").value = p.tenantCount || "";
    if (document.getElementById("adminStartDate")) document.getElementById("adminStartDate").value = p.startDate || "";
    if (document.getElementById("adminEndDate")) document.getElementById("adminEndDate").value = p.endDate || "";
    if (document.getElementById("adminPhone")) document.getElementById("adminPhone").value = p.phone || "";
    if (document.getElementById("adminCarPlate")) document.getElementById("adminCarPlate").value = p.carPlate || "";
    if (document.getElementById("adminPaymentStatus")) document.getElementById("adminPaymentStatus").value = p.paymentArabic || p.paymentStatus || "paid";
    if (document.getElementById("adminOperationalStatus")) document.getElementById("adminOperationalStatus").value = p.statusArabic || p.status || "ساري";

    const modal = document.getElementById("adminPermitModal");
    if (modal) modal.classList.add("show");
  };

  window.saveAdminPermit = async function (event) {
    if (event) event.preventDefault();

    const data = {
      unit: (document.getElementById("adminUnit") || {}).value || "",
      tenant: (document.getElementById("adminTenant") || {}).value || "",
      tenantCount: (document.getElementById("adminTenantCount") || {}).value || "",
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
        await window.loadAdminPermits();
      } else {
        toast("err", (res && res.message) || "Failed to save permit.");
      }
    } catch (e) {
      console.error(e);
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

      let res = await AdminPermitService.generateClientToken(permitId);

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

      if (typeof showNotice === "function") {
        showNotice("ok", "Client Card Link: " + clientLink, false);
      }

      toast("ok", copied ? "Client card link generated and copied." : "Client card link generated.");

      if (!copied) {
        prompt("Copy client card link:", clientLink);
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error generating client card link.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.deleteAdminPermit = async function (permitId) {
    if (!permitId) {
      toast("err", "Missing permit ID.");
      return;
    }

    if (!confirm("Delete this permit permanently?")) return;

    try {
      if (typeof showLoading === "function") showLoading("Deleting permit...");
      const res = await AdminPermitService.remove(permitId);

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

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="7" class="empty">No users found.</td></tr>';
      return;
    }

    body.innerHTML = data.map((u) => {
      const uid = u._id || u.username || "";
      return '<tr data-user-id="' + attr(uid) + '">' +
        '<td>' + escHtml(u.username || "-") + '</td>' +
        '<td>' + escHtml(u.fullName || "-") + '</td>' +
        '<td>' + escHtml(u.role || "-") + '</td>' +
        '<td>' + escHtml(u.gateName || "-") + '</td>' +
        '<td>' + escHtml(u.gateLocation || "-") + '</td>' +
        '<td>' + escHtml(u.status || "-") + '</td>' +
        '<td><div class="admin-row-actions">' +
        buildActionButton("edit-user", uid, "Edit", "edit") +
        buildActionButton("reset-user-password", uid, "Reset PW", "reset") +
        buildActionButton("delete-user", uid, "Delete", "delete") +
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
    const u = findUserById(userId);

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
        await window.loadAdminUsers();
      } else {
        toast("err", (res && res.message) || "Failed to save user.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error saving user.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.deleteAdminUser = async function (userId) {
    if (!userId) {
      toast("err", "Missing user ID.");
      return;
    }

    if (!confirm("Delete this user permanently?")) return;

    try {
      if (typeof showLoading === "function") showLoading("Deleting user...");
      const res = await AdminUserService.remove(userId);

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
      if (typeof hideLoading === "function") hideLoading();
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
      if (typeof showLoading === "function") showLoading("Resetting password...");

      const res = await AdminUserService.resetPassword(userId, pw);

      if (res && res.success) {
        toast("ok", "Password reset successfully.");
      } else {
        toast("err", (res && res.message) || "Password reset failed.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error resetting password.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.loadAdminGates = async function (showMsg) {
    try {
      const res = await AdminGateService.getAll();

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

    if (!data || !data.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty">No gates found.</td></tr>';
      return;
    }

    body.innerHTML = data.map((g) => {
      const gid = g._id || "";
      return '<tr data-gate-id="' + attr(gid) + '">' +
        '<td>' + escHtml(g.name || "-") + '</td>' +
        '<td>' + escHtml(g.location || "-") + '</td>' +
        '<td>' + escHtml(g.description || "-") + '</td>' +
        '<td>' + escHtml(g.status || "-") + '</td>' +
        '<td><div class="admin-row-actions">' +
        buildActionButton("edit-gate", gid, "Edit", "edit") +
        buildActionButton("delete-gate", gid, "Delete", "delete") +
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
    const g = findGateById(gateId);

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
        await window.loadAdminGates();
      } else {
        toast("err", (res && res.message) || "Failed to save gate.");
      }
    } catch (e) {
      console.error(e);
      toast("err", "System error saving gate.");
    } finally {
      if (typeof hideLoading === "function") hideLoading();
    }
  };

  window.deleteAdminGate = async function (gateId) {
    if (!gateId) {
      toast("err", "Missing gate ID.");
      return;
    }

    if (!confirm("Delete this gate permanently?")) return;

    try {
      if (typeof showLoading === "function") showLoading("Deleting gate...");
      const res = await AdminGateService.remove(gateId);

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
      if (typeof hideLoading === "function") hideLoading();
    }
  };

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

  function autoLoadAdminTables() {
    if (document.getElementById("adminPermitsTableBody")) window.loadAdminPermits();
    if (document.getElementById("adminUsersTableBody")) window.loadAdminUsers();
    if (document.getElementById("adminGatesTableBody")) window.loadAdminGates();
  }

  bindEnterpriseActionDelegation();

  setTimeout(function () {
    initAdminSearchBinding();
    autoLoadAdminTables();
  }, 1200);

})();