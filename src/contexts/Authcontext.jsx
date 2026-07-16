import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

// ─── ROLE ROUTE PERMISSIONS ───────────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  admin: {
    label: "Admin",
    allowedRoutes: "*",
    defaultRoute: "/admin/dashboard",
  },
  nurse: {
    label: "Nurse",
    allowedRoutes: [
      "/admin/dashboard", "/admin/inventory/items",
      "/admin/stock-issue", "/admin/expiry-tracking",
      "/admin/consumption-damaged-items",
    ],
    defaultRoute: "/admin/dashboard",
  },
  location_manager: {
    label: "Location Manager",
    allowedRoutes: [
      "/admin/dashboard", "/admin/inventory/items", "/admin/inventory/indent",
      "/admin/purchase-orders", "/admin/goods-receipt", "/admin/stock-issue",
      "/admin/transfers", "/admin/expiry-tracking", "/admin/replacement",
      "/admin/reports", "/admin/suppliers", "/admin/manufacturers",
      "/admin/categories", "/admin/documents", "/admin/locations",
    ],
    defaultRoute: "/admin/dashboard",
  },
  location_manager_super: {
    label: "Location Manager (Super)",
    allowedRoutes: "*",
    defaultRoute: "/admin/dashboard",
  },
  department_approver: {
    label: "Department Approver",
    allowedRoutes: [
      "/admin/dashboard", "/admin/inventory/items",
      "/admin/inventory/indent", "/admin/stock-issue",
      "/admin/consumption-damaged-items",
    ],
    defaultRoute: "/admin/dashboard",
  },
  store_manager: {
    label: "Store Manager",
    allowedRoutes: [
      "/admin/dashboard", "/admin/inventory/items", "/admin/inventory/indent",
      "/admin/goods-receipt", "/admin/stock-issue", "/admin/transfers",
      "/admin/expiry-tracking",
    ],
    defaultRoute: "/admin/dashboard",
  },
};

// ─── PERMISSION KEY CONSTANTS ─────────────────────────────────────────────────
export const PERMISSION_KEYS = {
  ADD_ITEM: "ITEM_ADD",
  EDIT_ITEM: "ITEM_EDIT",

  CREATE_INDENT: "INDENT_CREATE",
  APPROVE_INDENT_ITEMS: "INDENT_APPROVE",
  REJECT_INDENT_ITEMS: "INDENT_REJECT",

  CREATE_PO: "PO_CREATE",
  APPROVE_PO_ITEMS: "PO_APPROVE",
  REJECT_PO_ITEMS: "PO_REJECT",

  VIEW_PO: "PO_VIEW",
  UPDATE_PO: "PO_UPDATE",

  INVENTORY_ITEM_ADD: "INVENTORY_ITEM_ADD",
  INVENTORY_ITEM_EDIT: "INVENTORY_ITEM_EDIT",
  INVENTORY_ITEM_VIEW: "INVENTORY_ITEM_VIEW",
};

export function canAccess(role, path) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.allowedRoutes === "*") return true;
  return perms.allowedRoutes.includes(path);
}

function deriveRoleFromPermissions(permissions = []) {
  const has = (p) => permissions.includes(p);

  if (
    has("ITEM_ADD") ||
    has("addItem")
  ) {
    if (
      has("PO_CREATE") ||
      has("createPO")
    ) {
      return "admin";
    }
  }

  if (
    has("approveIndentItems") &&
    !has("createPO")
  ) {
    return "department_approver";
  }

  if (
    has("createIndent") &&
    !has("approveIndentItems")
  ) {
    return "nurse";
  }

  return "nurse";
}


const ADMIN_PERMS = {
  addItem: 1, editItem: 1, deleteItem: 1, createIndent: 1, approveIndentItems: 1, rejectIndentItems: 1,
  createPO: 1, approvePOItems: 1, rejectPOItems: 1, createGRN: 1, approveGRNItems: 1, rejectGRNItems: 1,
  shortDeliveryApprove: 1, markGRNDiscrepancy: 1, stockIssueRequest: 1, approveStockIssue: 1, rejectStockIssue: 1, issueStock: 1,
  createTransfer: 1, approveTransfer: 1, rejectTransfer: 1, dispatchTransfer: 1, acknowledgementReceipt: 1,
  transferRequest: 1, transferItemsApprove: 1, dispatch: 1, disposeItems: 1, replacementItems: 1, consumptionDamagedItems: 1,
};

const NURSE_PERMS = {
  addItem: 0, editItem: 0, deleteItem: 0, createIndent: 1, approveIndentItems: 0, rejectIndentItems: 0,
  createPO: 0, approvePOItems: 0, rejectPOItems: 0, createGRN: 0, approveGRNItems: 0, rejectGRNItems: 0,
  shortDeliveryApprove: 0, markGRNDiscrepancy: 0, stockIssueRequest: 1, approveStockIssue: 0, rejectStockIssue: 0, issueStock: 0,
  createTransfer: 0, approveTransfer: 0, rejectTransfer: 0, dispatchTransfer: 0, acknowledgementReceipt: 0,
  transferRequest: 0, transferItemsApprove: 0, dispatch: 0, disposeItems: 0, replacementItems: 0,
  consumptionDamagedItems: 1,
};

const DEPT_APPROVER_PERMS = {
  addItem: 0, editItem: 0, deleteItem: 0, createIndent: 1, approveIndentItems: 0, rejectIndentItems: 0,
  createPO: 0, approvePOItems: 0, rejectPOItems: 0, createGRN: 0, approveGRNItems: 0, rejectGRNItems: 0,
  shortDeliveryApprove: 0, markGRNDiscrepancy: 0, stockIssueRequest: 1, approveStockIssue: 0, rejectStockIssue: 0, issueStock: 0,
  createTransfer: 0, approveTransfer: 0, rejectTransfer: 0, dispatchTransfer: 0, acknowledgementReceipt: 1,
  transferRequest: 0, transferItemsApprove: 0, dispatch: 0, disposeItems: 0, replacementItems: 0,
  consumptionDamagedItems: 1,
};

const STORE_MGR_PERMS = {
  addItem: 1, editItem: 1, deleteItem: 0, createIndent: 1, approveIndentItems: 1, rejectIndentItems: 1,
  createPO: 0, approvePOItems: 0, rejectPOItems: 0, createGRN: 1, approveGRNItems: 1, rejectGRNItems: 1,
  shortDeliveryApprove: 0, markGRNDiscrepancy: 1, stockIssueRequest: 1, approveStockIssue: 1, rejectStockIssue: 1, issueStock: 1,
  createTransfer: 1, approveTransfer: 1, rejectTransfer: 0, dispatchTransfer: 1, acknowledgementReceipt: 1,
  transferRequest: 1, transferItemsApprove: 1, dispatch: 1, disposeItems: 1, replacementItems: 1,
};

const LOC_MGR_PERMS = {
  addItem: 1, editItem: 1, deleteItem: 0, createIndent: 1, approveIndentItems: 1, rejectIndentItems: 1,
  createPO: 1, approvePOItems: 1, rejectPOItems: 1, createGRN: 0, approveGRNItems: 0, rejectGRNItems: 0,
  shortDeliveryApprove: 0, markGRNDiscrepancy: 0, stockIssueRequest: 1, approveStockIssue: 0, rejectStockIssue: 0, issueStock: 0,
  createTransfer: 1, approveTransfer: 1, rejectTransfer: 1, dispatchTransfer: 1, acknowledgementReceipt: 0,
  transferRequest: 1, transferItemsApprove: 1, dispatch: 1, disposeItems: 0, replacementItems: 0,
};

const LOC_MGR_SUPER_PERMS = {
  addItem: 1, editItem: 1, deleteItem: 1, createIndent: 1, approveIndentItems: 1, rejectIndentItems: 1,
  createPO: 1, approvePOItems: 1, rejectPOItems: 1, createGRN: 1, approveGRNItems: 1, rejectGRNItems: 1,
  shortDeliveryApprove: 1, markGRNDiscrepancy: 1, stockIssueRequest: 1, approveStockIssue: 1, rejectStockIssue: 1, issueStock: 1,
  createTransfer: 1, approveTransfer: 1, rejectTransfer: 1, dispatchTransfer: 1, acknowledgementReceipt: 1,
  transferRequest: 1, transferItemsApprove: 1, dispatch: 1, disposeItems: 1, replacementItems: 1,
};

export const SEED_USERS = [
  {
    id: 1, username: "admin", password: "admin123", role: "admin",
    name: "Super Admin", email: "admin@hospital.com", status: "active",
    perms: ADMIN_PERMS, department: "Central Store", locationName: "",
    locationCode: "APL", phone: "", notes: "", avatarBg: "#6D28D9", initials: "SA",
  },
  {
    id: 2, username: "nurse", password: "nurse123", role: "nurse",
    name: "Saniya", email: "saniya@hospital.com", status: "active",
    perms: NURSE_PERMS, department: "Clinic / OPD", locationName: "Main Acute Care Hospital",
    locationCode: "APL", phone: "9876543210", notes: "Nurse - OPD", avatarBg: "#0891B2", initials: "S",
  },
  {
    id: 3, username: "department", password: "department123", role: "department_approver",
    name: "Sarah Anderson", email: "sarah@hospital.com", status: "active",
    perms: DEPT_APPROVER_PERMS, department: "Central Store", locationName: "Main Acute Care Hospital",
    locationCode: "APL", phone: "9876543211", notes: "Department Approver", avatarBg: "#A21CAF", initials: "SA",
  },
  {
    id: 4, username: "store_manager", password: "store123", role: "store_manager",
    name: "John", email: "john@hospital.com", status: "active",
    perms: STORE_MGR_PERMS, department: "Central Store", locationName: "Main Acute Care Hospital",
    locationCode: "APL", phone: "9876543212", notes: "Store Manager", avatarBg: "#EA580C", initials: "J",
  },
  {
    id: 5, username: "location_manager", password: "location123", role: "location_manager",
    name: "Shreya", email: "shreya@hospital.com", status: "active",
    perms: LOC_MGR_PERMS, department: "Central Store", locationName: "Main Acute Care Hospital",
    locationCode: "APL", phone: "9876543213", notes: "Location Manager", avatarBg: "#0369A1", initials: "S",
  },
  {
    id: 8, username: "location_manager_mumbai", password: "location123", role: "location_manager",
    name: "Miller", email: "location@gmail.com", status: "active",
    perms: LOC_MGR_PERMS, department: "Central Store", locationName: "Central Warehouse & Stores",
    locationCode: "CWS-01", phone: "1234567890", notes: "Location Manager - Mumbai", avatarBg: "#0369A1", initials: "LM",
  },
  {
    id: 7, username: "store_manager_mumbai", password: "store123", role: "store_manager",
    name: "Smith", email: "smith@hospital.com", status: "active",
    perms: STORE_MGR_PERMS, department: "Central Store", locationName: "Central Warehouse & Stores",
    locationCode: "CWS-01", phone: "9876543214", notes: "Store Manager - Mumbai", avatarBg: "#EA580C", initials: "S",
  },
];


function permsObjectToKeys(perms = {}) {
  const keys = [PERMISSION_KEYS.VIEW_PO, PERMISSION_KEYS.UPDATE_PO, PERMISSION_KEYS.INVENTORY_ITEM_VIEW];
  if (perms.addItem) {
    keys.push(PERMISSION_KEYS.ADD_ITEM, PERMISSION_KEYS.INVENTORY_ITEM_ADD);
  }
  if (perms.editItem) {
    keys.push(PERMISSION_KEYS.EDIT_ITEM, PERMISSION_KEYS.INVENTORY_ITEM_EDIT);
  }
  if (perms.createIndent) keys.push(PERMISSION_KEYS.CREATE_INDENT);
  if (perms.approveIndentItems) keys.push(PERMISSION_KEYS.APPROVE_INDENT_ITEMS);
  if (perms.rejectIndentItems) keys.push(PERMISSION_KEYS.REJECT_INDENT_ITEMS);
  if (perms.createPO) keys.push(PERMISSION_KEYS.CREATE_PO);
  if (perms.approvePOItems) keys.push(PERMISSION_KEYS.APPROVE_PO_ITEMS);
  if (perms.rejectPOItems) keys.push(PERMISSION_KEYS.REJECT_PO_ITEMS);
  return [...new Set(keys)];
}

function findSeedUser(username, password) {
  return SEED_USERS.find(
    (u) => u.username === username && u.password === password
  );
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const Authcontext = createContext(null);

const APP_VERSION = "2.4";

export function AuthProvider({ children }) {

  useEffect(() => {
    const cachedVersion = localStorage.getItem("app_version");
    if (cachedVersion !== APP_VERSION) {
      console.log("App version changed, clearing old cache...");
      localStorage.removeItem("app_users");
      localStorage.removeItem("current_user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("role");
      localStorage.setItem("app_version", APP_VERSION);
    }
  }, []);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("current_user");
      if (saved) {
        const user = JSON.parse(saved);
        if (!user.permissions) user.permissions = [];
        if (!user.role) {
          localStorage.removeItem("current_user");
          return null;
        }
        return user;
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("current_user", JSON.stringify(currentUser));
      localStorage.setItem("role", currentUser.role);
      localStorage.setItem("permissions", JSON.stringify(currentUser.permissions || []));
    }
  }, [currentUser]);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  async function login(username, password) {
    try {
      const response = await authService.login(username, password);

      const rawUser = response.data.user;
      const accessToken = response.data.accessToken;

      
    let permissions = [];

if (Array.isArray(rawUser.permissions)) {
  permissions = rawUser.permissions;
} else if (
  rawUser.permissions &&
  typeof rawUser.permissions === "object"
) {
  permissions = Object.keys(rawUser.permissions).filter(
    (key) => rawUser.permissions[key] === 1
  );
}

  const user = {
  ...rawUser,
  id: rawUser.user_id,
  name: rawUser.full_name,
  locationName: rawUser.location_name || "",
  permissions,
  permissionObject: rawUser.permissions || {},
  role: "custom",
};
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("current_user", JSON.stringify(user));

      setCurrentUser(user);

      return { success: true, user };
    } catch (error) {
  
      const seedMatch = findSeedUser(username, password);
      if (seedMatch) {
        console.warn(
          "API login failed, using local SEED_USERS fallback for:",
          username
        );
        const user = {
          ...seedMatch,
          permissions: permsObjectToKeys(seedMatch.perms),
        };
        delete user.password;

        localStorage.setItem("current_user", JSON.stringify(user));
  
        localStorage.removeItem("accessToken");

        setCurrentUser(user);

        return { success: true, user, offline: true };
      }

      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch (_) {
      /* ignore — best-effort */
    }
    setCurrentUser(null);
    localStorage.removeItem("current_user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
  }

  function hasAccess(path) {
    if (!currentUser) return false;
    return canAccess(currentUser.role, path);
  }

   function hasPermission(permission) {
  if (!currentUser) return false;

  return (
    currentUser.permissionObject?.[permission] === 1 ||
    currentUser.permissions?.includes(permission)
  );
}
  return (
    <Authcontext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        hasAccess,
        hasPermission,
      }}
    >
      {children}
    </Authcontext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Authcontext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}