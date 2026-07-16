import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Chip, IconButton, Avatar, TextField, MenuItem,
  Select, FormControl, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, InputAdornment, Snackbar, Alert, Tooltip, Stack, Dialog,
  DialogContent, Grid, Card, CardContent, Checkbox, FormControlLabel, DialogActions,
} from "@mui/material";
import {
  Add, Edit, Block, CheckCircle, Search, Close, AccountCircle,
  DeleteOutline, WarningAmberRounded,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/Authcontext";

import CreateUser from "./Createuser";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: "#F8FAFC", border: "#E5E7EB",
  textPrimary: "#111827", textSecondary: "#6B7280", primary: "#1976D2",
};

const DEPARTMENTS = [
  "Central Store", "Ward / Department Store", "Pharmacy",
  "Operation Theater", "Laboratory", "Clinic / OPD",
];

const HOSPITAL_LOCATIONS = [
  { id: "LOC-01", name: "Main Acute Care Hospital" },
  { id: "LOC-02", name: "Central Warehouse & Stores" },
  { id: "LOC-03", name: "Ambulatory Surgery Center" },
  { id: "LOC-04", name: "Urgent Care Center" },
  { id: "LOC-05", name: "Women's & Children's Hospital" },
  { id: "LOC-06", name: "Core Laboratory" },
  { id: "LOC-07", name: "Outpatient Imaging Center" },
  { id: "LOC-08", name: "Blood Bank" },
  { id: "LOC-09", name: "Retail / Discharge Pharmacy" },
  { id: "LOC-10", name: "Specialty Pharmacy" },
];

const ROLES = [
  "Location Manager(Super)", "Location Manager", "Pharmacist",
  "Department Approver", "Nurse", "Store Manager", "Admin",
];

const ROLE_KEY_MAP = {
  "Location Manager(Super)": "location_manager_super",
  "Location Manager":        "location_manager",
  "Pharmacist":              "pharmacist",
  "Department Approver":     "department_approver",
  "Nurse":                   "nurse",
  "Store Manager":           "store_manager",
  "Admin":                   "admin",
};

const ROLE_KEY_TO_LABEL = Object.fromEntries(
  Object.entries(ROLE_KEY_MAP).map(([label, key]) => [key, label])
);

const PERMISSION_LIST = [
  { key: "addItem",                label: "Add Item" },
  { key: "editItem",               label: "Edit Item" },
  { key: "createIndent",           label: "Create Indent" },
  { key: "approveIndentItems",     label: "Approve Indent Items" },
  { key: "createPO",               label: "Create PO (Generate PO)" },
  { key: "approvePOItems",         label: "Approve PO Items" },
  { key: "createGRN",              label: "Create GRN (Generate GRN)" },
  { key: "approveGRNItems",        label: "Approve GRN Items" },
  { key: "shortDeliveryApprove",   label: "Short Delivery Approve" },
  { key: "stockIssueRequest",      label: "Stock Issue Request" },
  { key: "issueStock",             label: "Issue Stock" },
  { key: "acknowledgementReceipt", label: "Acknowledgement Receipt" },
  { key: "transferRequest",        label: "Transfer Request" },
  { key: "transferItemsApprove",   label: "Transfer Items Approve" },
  { key: "dispatch",               label: "Dispatch" },
  { key: "disposeItems",           label: "Dispose Items" },
  { key: "replacementItems",       label: "Replacement Items" },
];

const ROLE_DEFAULT_PERMS = {
  "Super Admin":             { addItem:1, editItem:1, deleteItem:1, createIndent:1, approveIndentItems:1, rejectIndentItems:1, createPO:1, approvePOItems:1, rejectPOItems:1, createGRN:1, approveGRNItems:1, rejectGRNItems:1, shortDeliveryApprove:1, markGRNDiscrepancy:1, stockIssueRequest:1, approveStockIssue:1, rejectStockIssue:1, issueStock:1, createTransfer:1, approveTransfer:1, rejectTransfer:1, dispatchTransfer:1, acknowledgementReceipt:1, transferRequest:1, transferItemsApprove:1, dispatch:1, disposeItems:1, replacementItems:1 },
  "Location Manager":        { addItem:1, editItem:1, deleteItem:1, createIndent:1, approveIndentItems:1, rejectIndentItems:1, createPO:1, approvePOItems:1, rejectPOItems:1, createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:1, markGRNDiscrepancy:0, stockIssueRequest:1, approveStockIssue:0, rejectStockIssue:0, issueStock:0, createTransfer:1, approveTransfer:1, rejectTransfer:1, dispatchTransfer:1, acknowledgementReceipt:0, transferRequest:1, transferItemsApprove:1, dispatch:1, disposeItems:1, replacementItems:1 },
  "Department Approver":     { addItem:0, editItem:0, deleteItem:0, createIndent:1, approveIndentItems:1, rejectIndentItems:0, createPO:0, approvePOItems:0, rejectPOItems:0, createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0, markGRNDiscrepancy:0, stockIssueRequest:1, approveStockIssue:0, rejectStockIssue:0, issueStock:0, createTransfer:0, approveTransfer:0, rejectTransfer:0, dispatchTransfer:0, acknowledgementReceipt:1, transferRequest:0, transferItemsApprove:0, dispatch:0, disposeItems:0, replacementItems:0 },
  "Nurse":                   { addItem:0, editItem:0, deleteItem:0, createIndent:1, approveIndentItems:0, rejectIndentItems:0, createPO:0, approvePOItems:0, rejectPOItems:0, createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0, markGRNDiscrepancy:0, stockIssueRequest:1, approveStockIssue:0, rejectStockIssue:0, issueStock:0, createTransfer:0, approveTransfer:0, rejectTransfer:0, dispatchTransfer:0, acknowledgementReceipt:0, transferRequest:0, transferItemsApprove:0, dispatch:0, disposeItems:0, replacementItems:0 },
  "Store Manager":           { addItem:1, editItem:1, deleteItem:1, createIndent:1, approveIndentItems:1, rejectIndentItems:1, createPO:0, approvePOItems:0, rejectPOItems:0, createGRN:1, approveGRNItems:1, rejectGRNItems:1, shortDeliveryApprove:0, markGRNDiscrepancy:1, stockIssueRequest:1, approveStockIssue:1, rejectStockIssue:1, issueStock:1, createTransfer:1, approveTransfer:1, rejectTransfer:1, dispatchTransfer:1, acknowledgementReceipt:1, transferRequest:1, transferItemsApprove:1, dispatch:1, disposeItems:1, replacementItems:1 },
};

const generateRolePermissionMatrix = () => {
  const roleColorMap = {
    "Super Admin":         { color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
    "Location Manager":    { color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD" },
    "Store Manager":       { color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" },
    "Department Approver": { color: "#7E22CE", bg: "#FAF5FF", border: "#E9D5FF" },
    "Nurse":               { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  };
  return Object.entries(ROLE_DEFAULT_PERMS).map(([roleLabel, perms]) => ({
    role: roleLabel,
    ...(roleColorMap[roleLabel] || { color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" }),
    ...perms,
  }));
};

const ROLE_PERMISSION_MATRIX = generateRolePermissionMatrix();

const PERM_COLS = [
  { key: "addItem",                label: "ADD ITEM" },
  { key: "editItem",               label: "EDIT ITEM" },
  { key: "deleteItem",             label: "DELETE ITEM" },
  { key: "createIndent",           label: "CREATE INDENT" },
  { key: "approveIndentItems",     label: "APPROVE INDENT" },
  { key: "rejectIndentItems",      label: "REJECT INDENT" },
  { key: "createPO",               label: "CREATE PO" },
  { key: "approvePOItems",         label: "APPROVE PO" },
  { key: "rejectPOItems",          label: "REJECT PO" },
  { key: "createGRN",              label: "CREATE GRN" },
  { key: "approveGRNItems",        label: "APPROVE GRN" },
  { key: "rejectGRNItems",         label: "REJECT GRN" },
  { key: "shortDeliveryApprove",   label: "SHORT DELIVERY" },
  { key: "markGRNDiscrepancy",     label: "MARK DISCREPANCY" },
  { key: "stockIssueRequest",      label: "ISSUE REQUEST" },
  { key: "approveStockIssue",      label: "APPROVE ISSUE" },
  { key: "rejectStockIssue",       label: "REJECT ISSUE" },
  { key: "issueStock",             label: "ISSUE STOCK" },
  { key: "createTransfer",         label: "CREATE TRANSFER" },
  { key: "approveTransfer",        label: "APPROVE TRANSFER" },
  { key: "rejectTransfer",         label: "REJECT TRANSFER" },
  { key: "dispatchTransfer",       label: "DISPATCH TRANSFER" },
  { key: "acknowledgementReceipt", label: "ACKNOWLEDGE" },
  { key: "transferRequest",        label: "TRANSFER REQUEST" },
  { key: "transferItemsApprove",   label: "TRANSFER APPROVE" },
  { key: "dispatch",               label: "DISPATCH" },
  { key: "disposeItems",           label: "DISPOSE ITEMS" },
  { key: "replacementItems",       label: "REPLACEMENT ITEMS" },
];

const ROLE_COLORS = {
  "Location Manager(Super)": { bg: "#EFF6FF", color: "#1D4ED8", avatarBg: "#1976D2" },
  "Location Manager":        { bg: "#F0F9FF", color: "#0369A1", avatarBg: "#0369A1" },
  "Pharmacist":              { bg: "#F0FDF4", color: "#15803D", avatarBg: "#059669" },
  "Department Approver":     { bg: "#FAF5FF", color: "#7E22CE", avatarBg: "#7C3AED" },
  "Nurse":                   { bg: "#ECFEFF", color: "#0891B2", avatarBg: "#0891B2" },
  "Store Manager":           { bg: "#FFF7ED", color: "#C2410C", avatarBg: "#EA580C" },
  "Admin":                   { bg: "#F5F3FF", color: "#6D28D9", avatarBg: "#6D28D9" },
};

const LOC_COLOR_POOL = [
  { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  { bg: "#FAF5FF", color: "#7E22CE", border: "#E9D5FF" },
  { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD" },
  { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  { bg: "#ECFEFF", color: "#0891B2", border: "#A5F3FC" },
  { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
  { bg: "#FFF7ED", color: "#B45309", border: "#FDE68A" },
  { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
];

function getLocColor(name = "") {
  if (!name || name.trim() === "") return LOC_COLOR_POOL[0];
  return LOC_COLOR_POOL[name.charCodeAt(0) % LOC_COLOR_POOL.length];
}

function toDisplayUser(u) {
  // API returns full_name / user_id — map to name / id
  const name      = u.name      || u.full_name  || u.username || "?";
  const id        = u.id        || u.user_id;
  const roleKey   = u.role      || "nurse";
  const roleLabel = ROLE_KEY_TO_LABEL[roleKey] || roleKey;
  const rc        = ROLE_COLORS[roleLabel] || { bg: "#F5F3FF", color: "#6D28D9", avatarBg: "#6D28D9" };
  const lc        = getLocColor(u.locationName || u.location_name || "");
  const initials  = u.initials  || name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return {
    ...u,
    id,
    name,
    initials,
    avatarBg:       u.avatarBg       || rc.avatarBg,
    role:           roleLabel,
    roleBg:         rc.bg,
    roleColor:      rc.color,
    locationName:   u.locationName   || u.location_name  || "",
    locationCode:   u.locationCode   || (u.locationName  || u.location_name || "LOC").slice(0, 3).toUpperCase(),
    locationBg:     lc.bg,
    locationColor:  lc.color,
    locationBorder: lc.border,
    department:     u.department     || "",
    status:         u.status === "active" || u.status === "Active" ? "Active" : "Blocked",
    perms:          u.perms          || {},
    notes:          u.notes          || "",
  };
}

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px", fontSize: 13, bgcolor: "#F9FAFB",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#9CA3AF" },
    "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
  },
};
const SECTION_LABEL_SX = { fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: 0.8, textTransform: "uppercase", mb: 1.5, mt: 1 };
const FIELD_LABEL_SX   = { fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5, textTransform: "uppercase", mb: 0.5 };
const SELECT_SX = {
  borderRadius: "8px", fontSize: 13, bgcolor: "#F9FAFB",
  "& fieldset": { borderColor: "#E5E7EB" },
  "&:hover fieldset": { borderColor: "#9CA3AF" },
  "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
};

const TH = ({ children, width, align = "left" }) => (
  <TableCell sx={{ width, fontWeight: 700, fontSize: 11, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", py: 1.4, px: 1.5, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap", bgcolor: "#F9FAFB", textAlign: align }}>
    {children}
  </TableCell>
);

const Perm = ({ v }) =>
  v
    ? <Typography sx={{ color: "#16A34A", fontWeight: 700, fontSize: 14, textAlign: "center" }}>✓</Typography>
    : <Typography sx={{ color: "#D1D5DB", fontSize: 14, textAlign: "center" }}>—</Typography>;

function PermissionsBlock({ perms, onChange }) {
  return (
    <Box>
      <Typography sx={{ ...SECTION_LABEL_SX, mt: 2 }}>Permissions</Typography>
      <Grid container spacing={0.5}>
        {PERMISSION_LIST.map((p, i) => (
          <Grid item xs={6} key={p.key}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!perms[p.key]}
                  onChange={(e) => onChange(p.key, e.target.checked)}
                  size="small"
                  sx={{ color: "#d1d5db", "&.Mui-checked": { color: "#2563eb" }, p: 0.5 }}
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", minWidth: 16 }}>{i + 1}.</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{p.label}</Typography>
                </Box>
              }
              sx={{ m: 0, alignItems: "center" }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function DeleteConfirmDialog({ open, onClose, user, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" } }}>
      <Box sx={{ px: "24px", pt: "24px", pb: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <WarningAmberRounded sx={{ color: "#DC2626", fontSize: 28 }} />
        </Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", textAlign: "center" }}>Delete User</Typography>
        <Typography sx={{ fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 1.6, pb: 1 }}>
          Are you sure you want to delete{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "#111827" }}>{user?.name}</Box>
          ? This action cannot be undone.
        </Typography>
      </Box>
      <DialogActions sx={{ px: "24px", pb: "20px", pt: "4px", gap: "10px", justifyContent: "center" }}>
        <Button onClick={onClose}
          sx={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "8px", px: "24px", py: "9px", border: "1px solid #e5e7eb", background: "#fff", "&:hover": { background: "#f9fafb" }, minWidth: 100 }}>
          Cancel
        </Button>
        <Button onClick={() => { onConfirm(user?.id); onClose(); }}
          sx={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "none", borderRadius: "8px", px: "24px", py: "9px", background: "#DC2626", boxShadow: "0 2px 8px rgba(220,38,38,0.35)", "&:hover": { background: "#b91c1c" }, minWidth: 100 }}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const EMPTY_PERMS = {
  addItem:0, editItem:0, deleteItem:0, createIndent:0, approveIndentItems:0,
  rejectIndentItems:0, createPO:0, approvePOItems:0, rejectPOItems:0,
  createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0,
  markGRNDiscrepancy:0, stockIssueRequest:0, approveStockIssue:0,
  rejectStockIssue:0, issueStock:0, createTransfer:0, approveTransfer:0,
  rejectTransfer:0, dispatchTransfer:0, acknowledgementReceipt:0,
};

function EditUserDialog({ open, onClose, user, onSave }) {
  const u = user || {};
  const [localForm, setLocalForm] = useState({});
  const [perms, setPerms] = useState({});

  const handleOpen = () => {
    const roleLabel = ROLE_KEY_TO_LABEL[u.role] || u.role || "Nurse";
    setLocalForm({
      fullName:   u.name         || u.full_name  || "",
      username:   (u.username    || "").replace("@", ""),
      email:      u.email        || "",
      phone:      u.phone        || "",
      department: u.department   || "",
      role:       roleLabel,
      location:   u.locationName || u.location_name || "",
      notes:      u.notes        || "",
    });
    setPerms({ ...(u.perms || ROLE_DEFAULT_PERMS[ROLE_KEY_TO_LABEL[u.role] || u.role] || ROLE_DEFAULT_PERMS["Nurse"]) });
  };

  const set = (k) => (e) => setLocalForm((p) => ({ ...p, [k]: e.target.value }));

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setLocalForm((p) => ({ ...p, role }));
    setPerms({ ...(ROLE_DEFAULT_PERMS[role] || ROLE_DEFAULT_PERMS["Nurse"]) });
  };

  const handlePermChange = (key, checked) => setPerms((p) => ({ ...p, [key]: checked ? 1 : 0 }));
  const handleSave = () => { onSave(u.id, { ...localForm, perms }); onClose(); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      TransitionProps={{ onEnter: handleOpen }}
      PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" } }}>
      <Box sx={{ px: "24px", pt: "20px", pb: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AccountCircle sx={{ color: "#7C3AED", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Edit User</Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>Update credentials, role &amp; permissions</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30, "&:hover": { background: "#f3f4f6", color: "#374151" } }}>
          <Close sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: "24px", py: "20px", overflowY: "auto", maxHeight: "72vh", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 } }}>
        <Typography sx={SECTION_LABEL_SX}>Account</Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Full Name</Typography>
            <TextField fullWidth size="small" value={localForm.fullName || ""} onChange={set("fullName")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Username</Typography>
            <TextField fullWidth size="small" value={localForm.username || ""} onChange={set("username")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Email</Typography>
            <TextField fullWidth size="small" value={localForm.email || ""} onChange={set("email")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Phone</Typography>
            <TextField fullWidth size="small" value={localForm.phone || ""} onChange={set("phone")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={FIELD_LABEL_SX}>Department</Typography>
            <Select fullWidth size="small" value={localForm.department || ""} onChange={set("department")} displayEmpty sx={SELECT_SX}>
              <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>Select department...</MenuItem>
              {DEPARTMENTS.map((d) => <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>{d}</MenuItem>)}
            </Select>
          </Grid>
        </Grid>
        <Typography sx={SECTION_LABEL_SX}>Role &amp; Location</Typography>
        <Grid container spacing={1.5} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Role</Typography>
            <Select fullWidth size="small" value={localForm.role || "Nurse"} onChange={handleRoleChange} sx={SELECT_SX}>
              {ROLES.map((r) => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Location</Typography>
            <Select fullWidth size="small" value={localForm.location || ""} onChange={set("location")} displayEmpty sx={SELECT_SX}>
              <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>Select location...</MenuItem>
              {HOSPITAL_LOCATIONS.map((l) => <MenuItem key={l.id} value={l.name} sx={{ fontSize: 13 }}>{l.name}</MenuItem>)}
            </Select>
          </Grid>
        </Grid>
        <PermissionsBlock perms={perms} onChange={handlePermChange} />
        <Typography sx={{ ...FIELD_LABEL_SX, mt: 2 }}>Notes</Typography>
        <TextField fullWidth multiline rows={2} size="small" placeholder="Any notes..." value={localForm.notes || ""} onChange={set("notes")}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: "8px", bgcolor: "#f9fafb", "& fieldset": { borderColor: "#e5e7eb" }, "&:hover fieldset": { borderColor: "#d1d5db" }, "&.Mui-focused fieldset": { borderColor: "#7C3AED" } } }} />
      </DialogContent>
      <Box sx={{ px: "24px", py: "16px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", background: "#fff", flexShrink: 0 }}>
        <Button onClick={onClose}
          sx={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "8px", px: "20px", py: "9px", border: "1px solid #e5e7eb", background: "#fff", "&:hover": { background: "#f9fafb" } }}>
          Cancel
        </Button>
        <Button onClick={handleSave}
          sx={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "none", borderRadius: "8px", px: "20px", py: "9px", background: "#2563eb", boxShadow: "0 2px 8px #2563eb", "&:hover": { background: "#1d4ed8" } }}>
          Save Changes
        </Button>
      </Box>
    </Dialog>
  );
}

function StatCard({ label, count, sub, iconEl, iconBg }) {
  return (
    <Box sx={{ flex: 1, bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 1 }, minWidth: 0, display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
      <Box sx={{ width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 }, borderRadius: "50%", bgcolor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {iconEl}
      </Box>
      <Box>
        <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 11 }, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", mb: { xs: 0.25, sm: 0.375, md: 0.5 } }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: { xs: 0.25, sm: 0.5, md: 0.75 } }}>
          <Typography sx={{ fontSize: { xs: 14, sm: 18, md: 20 }, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{count}</Typography>
          {sub && <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 11 }, fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap" }}>{sub}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function UsersRoles() {
  // ── API state ─────────────────────────────────────────────────────────────
  const [apiUsers,      setApiUsers]      = useState([]);
  const [usersLoading,  setUsersLoading]  = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [roleFilter,      setRoleFilter]      = useState("All Roles");
  const [locFilter,       setLocFilter]       = useState("All Locations");
  const [search,          setSearch]          = useState("");
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editUser,        setEditUser]        = useState(null);
  const [editOpen,        setEditOpen]        = useState(false);
  const [deleteUserState, setDeleteUserState] = useState(null);
  const [deleteOpen,      setDeleteOpen]      = useState(false);
  const [toast,           setToast]           = useState({ open: false, msg: "", severity: "success" });

  const showToast = (msg, severity = "success") => setToast({ open: true, msg, severity });

  // ── Fetch users from API ──────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res  = await userService.getAll();
      const list = res.data?.data || res.data || [];
      setApiUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setApiUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Derived display data ──────────────────────────────────────────────────
  const displayUsers    = apiUsers.map(toDisplayUser);
  const activeCount     = displayUsers.filter((u) => u.status === "Active").length;
  const blockedCount    = displayUsers.filter((u) => u.status === "Blocked").length;
  const adminCount      = displayUsers.filter((u) => u.role === "Admin").length;
  const uniqueRoleCount = [...new Set(displayUsers.map((u) => u.role))].length;

  const filtered = displayUsers.filter((u) => {
    const matchRole   = roleFilter === "All Roles"     || u.role === roleFilter;
    const matchLoc    = locFilter  === "All Locations" || u.locationName === locFilter;
    const matchSearch = !search ||
      (u.name  || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchLoc && matchSearch;
  });

  const statCards = [
    {
      label: "Total Users", count: displayUsers.length,
      sub: `${uniqueRoleCount} role${uniqueRoleCount !== 1 ? "s" : ""} assigned`,
      iconBg: "#3b82f6",
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    },
    {
      label: "Active Users", count: activeCount, sub: "Currently enabled",
      iconBg: "#10b981",
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>),
    },
    {
      label: "Blocked Users", count: blockedCount, sub: "Access restricted",
      iconBg: "#ef4444",
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>),
    },
    {
      label: "Admins", count: adminCount, sub: "Full access",
      iconBg: "#8b5cf6",
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
    },
  ];

  // ── Create ────────────────────────────────────────────────────────────────
  const handleSaveUser = async (form) => {
    if (!form.username || !form.password) {
      showToast("Username and password are required.", "error");
      return;
    }
    try {
      await userService.create({
        username:    form.username,
        password:    form.password,
        full_name:   form.fullName || form.username,
        email:       form.email    || `${form.username.toLowerCase()}@hospital.org`,
        phone:       form.phone    || null,
        department:  form.department || null,
        role:        ROLE_KEY_MAP[form.role] || "nurse",
        location:    form.location || null,
        notes:       form.notes    || null,
        permissions: form.perms   || {},
      });
      await fetchUsers();
      setModalOpen(false);
      showToast(`"${form.fullName || form.username}" created successfully.`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create user.", "error");
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEditSave = async (id, form) => {
    try {
      await userService.update(id, {
        full_name:   form.fullName   || undefined,
        username:    form.username   || undefined,
        email:       form.email      || undefined,
        phone:       form.phone      || undefined,
        department:  form.department || undefined,
        role:        ROLE_KEY_MAP[form.role] || "nurse",
        location:    form.location   || undefined,
        notes:       form.notes,
        permissions: form.perms,
      });
      await fetchUsers();
      showToast("User updated successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update user.", "error");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteUser = async (id) => {
    const user = displayUsers.find((u) => String(u.id) === String(id));
    try {
      await userService.remove(id);
      await fetchUsers();
      showToast(`"${user?.name}" has been deleted.`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user.", "error");
    }
  };

  // ── Block / Unblock ───────────────────────────────────────────────────────
  const toggleBlock = async (id) => {
    const user = displayUsers.find((u) => String(u.id) === String(id));
    if (!user) return;
    const nextStatus = user.status === "Blocked" ? "active" : "blocked";
    try {
      await userService.update(id, { status: nextStatus });
      await fetchUsers();
      showToast(
        `${user.name} ${nextStatus === "blocked" ? "blocked" : "unblocked"}.`,
        nextStatus === "blocked" ? "warning" : "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status.", "error");
    }
  };

  const uniqueRoles = [...new Set(displayUsers.map((u) => u.role))];
  const uniqueLocs  = [...new Set(displayUsers.map((u) => u.locationName).filter(Boolean))];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (usersLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ maxWidth: "1400px", mx: "auto" }}>

        {/* ── Header ── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1.25, sm: 1.5, md: 1.75 }, gap: 1, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, fontWeight: 700, color: "#111827", flexShrink: 0 }}>
            Users &amp; Roles
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
            <TextField
              size="small" placeholder="Search by name or email…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment>) }}
              sx={{ width: { xs: "100%", sm: 220, md: 240 }, "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: "8px", bgcolor: "#fff", height: 36, "& fieldset": { borderColor: "#e5e7eb" }, "&:hover fieldset": { borderColor: "#9ca3af" }, "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" } } }}
            />
            <Box sx={{ minWidth: 148 }}>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} size="small" fullWidth
                sx={{ fontSize: 13, borderRadius: "20px", background: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF" } }}>
                <MenuItem value="All Roles" sx={{ fontSize: 13 }}>All Roles</MenuItem>
                {uniqueRoles.map((r) => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
              </Select>
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <Select value={locFilter} onChange={(e) => setLocFilter(e.target.value)} size="small" fullWidth
                sx={{ fontSize: 13, borderRadius: "20px", background: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF" } }}>
                <MenuItem value="All Locations" sx={{ fontSize: 13 }}>All Locations</MenuItem>
                {uniqueLocs.map((l) => <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>{l}</MenuItem>)}
              </Select>
            </Box>
            <Button startIcon={<Add sx={{ fontSize: 16 }} />} variant="contained" onClick={() => setModalOpen(true)}
              sx={{ background: "#2563eb", color: "#fff", borderRadius: "8px", px: 1.875, height: 36, fontSize: 13, fontWeight: 500, textTransform: "none", boxShadow: "0 1px 4px rgba(37,99,235,0.25)", whiteSpace: "nowrap", "&:hover": { background: "#1d4ed8" } }}>
              Create User
            </Button>
          </Box>
        </Box>

        {/* ── Stat Cards ── */}
        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 0.75, md: 1 }, mb: { xs: 0.875, sm: 1.125, md: 1.375 }, flexWrap: { xs: "wrap", md: "nowrap" } }}>
          {statCards.map((s) => (
            <StatCard key={s.label} label={s.label} count={s.count} sub={s.sub} iconBg={s.iconBg} iconEl={s.icon} />
          ))}
        </Box>

        {/* ── Users Table ── */}
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <TableContainer sx={{ overflowX: { xs: "auto", md: "visible" } }}>
              <Table size="small" sx={{ width: "100%", tableLayout: "auto" }}>
                <TableHead>
                  <TableRow sx={{ background: "#EBF1FE" }}>
                    <TH width={260}>User</TH>
                    <TH width={150}>Role</TH>
                    <TH width={180}>Location</TH>
                    <TH width={160}>Department</TH>
                    <TH width={90}>Status</TH>
                    <TH width={100} align="center">Actions</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5, fontSize: 13, color: C.textSecondary }}>
                        No users match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((u, idx) => (
                    <TableRow key={u.id}
                      sx={{ bgcolor: idx % 2 === 0 ? "#fff" : "#FAFAFA", "&:hover": { bgcolor: "#EFF6FF" }, transition: "background 0.15s", "& td": { borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none" } }}>
                      <TableCell sx={{ px: 1.5, py: 1.2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: u.avatarBg, fontSize: 12, fontWeight: 700 }}>{u.initials}</Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.3 }}>{u.name}</Typography>
                            <Typography sx={{ fontSize: 11, color: C.textSecondary }}>@{u.username?.replace("@", "")} · {u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ px: 1.5, py: 1.2 }}>
                        <Chip label={u.role} size="small" sx={{ bgcolor: u.roleBg, color: u.roleColor, border: `1px solid ${u.roleColor}33`, fontWeight: 600, fontSize: 11, height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ px: 1.5, py: 1.2 }}>
                        <Typography sx={{ fontSize: 12, color: C.textPrimary, fontWeight: 600 }}>{u.locationName}</Typography>
                      </TableCell>
                      <TableCell sx={{ px: 1.5, py: 1.2 }}>
                        <Typography sx={{ fontSize: 12, color: C.textSecondary }}>{u.department}</Typography>
                      </TableCell>
                      <TableCell sx={{ px: 1.5, py: 1.2 }}>
                        <Chip
                          label={u.status === "Active" ? "● Active" : "⊘ Blocked"} size="small"
                          sx={{ bgcolor: u.status === "Active" ? "#F0FDF4" : "#FEF2F2", color: u.status === "Active" ? "#16A34A" : "#DC2626", border: `1px solid ${u.status === "Active" ? "#BBF7D0" : "#FECACA"}`, fontWeight: 700, fontSize: 11, height: 22 }}
                        />
                      </TableCell>
                      <TableCell sx={{ px: 1.5, py: 1.2 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => { setEditUser(u); setEditOpen(true); }}
                              sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", "&:hover": { bgcolor: "#DBEAFE" }, width: 26, height: 26, borderRadius: "6px" }}>
                              <Edit sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={u.status === "Blocked" ? "Unblock" : "Block"}>
                            <IconButton size="small" onClick={() => toggleBlock(u.id)}
                              sx={{ bgcolor: u.status === "Blocked" ? "#F0FDF4" : "#FEF2F2", color: u.status === "Blocked" ? "#16A34A" : "#DC2626", "&:hover": { bgcolor: u.status === "Blocked" ? "#DCFCE7" : "#FEE2E2" }, width: 26, height: 26, borderRadius: "6px" }}>
                              {u.status === "Blocked" ? <CheckCircle sx={{ fontSize: 13 }} /> : <Block sx={{ fontSize: 13 }} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setDeleteUserState(u); setDeleteOpen(true); }}
                              sx={{ bgcolor: "#FEF2F2", color: "#DC2626", "&:hover": { bgcolor: "#FEE2E2" }, width: 26, height: 26, borderRadius: "6px" }}>
                              <DeleteOutline sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CardContent>

        {/* ── Role Permission Matrix ── */}
        <Box sx={{ mb: 1.5, mt: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: C.textPrimary, mb: 0.4 }}>Role Permission Matrix</Typography>
        </Box>
        <Card sx={{ width: "100%", borderRadius: { xs: 2, sm: 3 }, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, "&:last-child": { pb: { xs: 2, sm: 3, md: 4 } } }}>
            <TableContainer component={Paper} elevation={0}
              sx={{ border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "auto", "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 } }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#EBF1FE" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, py: 1.4, px: 1.5, borderBottom: `1px solid ${C.border}`, minWidth: 150, position: "sticky", left: 0, bgcolor: "#EBF1FE", zIndex: 1 }}>ROLE</TableCell>
                    {PERM_COLS.map((c) => (
                      <TableCell key={c.key} align="center" sx={{ fontWeight: 700, fontSize: 9, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.3, py: 1.4, px: 0.5, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap", minWidth: 80 }}>
                        {c.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROLE_PERMISSION_MATRIX.map((r, idx) => (
                    <TableRow key={r.role} sx={{ bgcolor: idx % 2 === 0 ? "#fff" : "#FAFAFA", "&:hover": { bgcolor: "#F9FAFB" } }}>
                      <TableCell sx={{ px: 1.5, py: 1.1, position: "sticky", left: 0, bgcolor: idx % 2 === 0 ? "#fff" : "#FAFAFA", zIndex: 1 }}>
                        <Chip label={r.role} size="small" sx={{ bgcolor: r.bg, color: r.color, border: `1px solid ${r.border}`, fontWeight: 700, fontSize: 11, height: 22 }} />
                      </TableCell>
                      {PERM_COLS.map((c) => (
                        <TableCell key={c.key} align="center" sx={{ px: 0.5, py: 1.1 }}>
                          <Perm v={r[c.key]} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* ── Modals ── */}
        <CreateUser open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveUser} />
        <EditUserDialog open={editOpen} onClose={() => setEditOpen(false)} user={editUser} onSave={handleEditSave} />
        <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} user={deleteUserState} onConfirm={handleDeleteUser} />

        <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={toast.severity} sx={{ borderRadius: "10px", fontWeight: 600, fontSize: 13 }} onClose={() => setToast((t) => ({ ...t, open: false }))}>
            {toast.msg}
          </Alert>
        </Snackbar>

      </Box>
    </Box>
  );
}