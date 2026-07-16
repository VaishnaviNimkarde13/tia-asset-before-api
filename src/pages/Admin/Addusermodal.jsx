import { useState } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import {
  Box, Typography, Button, IconButton, TextField, MenuItem,
  Select, Dialog, DialogContent, Grid, Checkbox, FormControlLabel,
} from "@mui/material";
import { AccountCircle, Close } from "@mui/icons-material";


const ROLES = [
  "Location Manager(Super)", "Location Manager", "Pharmacist",
  "Department Approver", "Nurse", "Store Manager", "Admin",
];

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
  "Location Manager(Super)": { addItem:1, editItem:1, deleteItem:1, createIndent:1, approveIndentItems:1, rejectIndentItems:1, createPO:1, approvePOItems:1, rejectPOItems:1, createGRN:1, approveGRNItems:1, rejectGRNItems:1, shortDeliveryApprove:1, markGRNDiscrepancy:1, stockIssueRequest:1, approveStockIssue:1, rejectStockIssue:1, issueStock:1, createTransfer:1, approveTransfer:1, rejectTransfer:1, dispatchTransfer:1, acknowledgementReceipt:1, transferRequest:1, transferItemsApprove:1, dispatch:1, disposeItems:1, replacementItems:1 },
  "Location Manager":        { addItem:1, editItem:1, deleteItem:0, createIndent:1, approveIndentItems:1, rejectIndentItems:1, createPO:1, approvePOItems:1, rejectPOItems:1, createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0, markGRNDiscrepancy:0, stockIssueRequest:1, approveStockIssue:0, rejectStockIssue:0, issueStock:0, createTransfer:1, approveTransfer:1, rejectTransfer:1, dispatchTransfer:1, acknowledgementReceipt:0, transferRequest:1, transferItemsApprove:1, dispatch:1, disposeItems:0, replacementItems:0 },
  "Pharmacist":              { addItem:1, editItem:1, deleteItem:0, createIndent:1, approveIndentItems:0, rejectIndentItems:0, createPO:0, approvePOItems:0, rejectPOItems:0, createGRN:1, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0, markGRNDiscrepancy:0, stockIssueRequest:1, approveStockIssue:0, rejectStockIssue:0, issueStock:1, createTransfer:0, approveTransfer:0, rejectTransfer:0, dispatchTransfer:0, acknowledgementReceipt:1, transferRequest:0, transferItemsApprove:0, dispatch:0, disposeItems:0, replacementItems:0 },
  "Department Approver":     { addItem:0, editItem:0, deleteItem:0, createIndent:1, approveIndentItems:1, rejectIndentItems:0, createPO:0, approvePOItems:0, rejectPOItems:0, createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0, markGRNDiscrepancy:0, stockIssueRequest:1, approveStockIssue:0, rejectStockIssue:0, issueStock:0, createTransfer:0, approveTransfer:0, rejectTransfer:0, dispatchTransfer:0, acknowledgementReceipt:1, transferRequest:0, transferItemsApprove:0, dispatch:0, disposeItems:0, replacementItems:0 },
  "Nurse":                   { addItem:0, editItem:0, deleteItem:0, createIndent:1, approveIndentItems:0, rejectIndentItems:0, createPO:0, approvePOItems:0, rejectPOItems:0, createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0, markGRNDiscrepancy:0, stockIssueRequest:1, approveStockIssue:0, rejectStockIssue:0, issueStock:0, createTransfer:0, approveTransfer:0, rejectTransfer:0, dispatchTransfer:0, acknowledgementReceipt:0, transferRequest:0, transferItemsApprove:0, dispatch:0, disposeItems:0, replacementItems:0 },
  "Store Manager":           { addItem:1, editItem:1, deleteItem:0, createIndent:1, approveIndentItems:1, rejectIndentItems:1, createPO:0, approvePOItems:0, rejectPOItems:0, createGRN:1, approveGRNItems:1, rejectGRNItems:1, shortDeliveryApprove:0, markGRNDiscrepancy:1, stockIssueRequest:1, approveStockIssue:1, rejectStockIssue:1, issueStock:1, createTransfer:1, approveTransfer:0, rejectTransfer:0, dispatchTransfer:1, acknowledgementReceipt:1, transferRequest:1, transferItemsApprove:1, dispatch:1, disposeItems:1, replacementItems:1 },
  "Admin":                   { addItem:1, editItem:1, deleteItem:1, createIndent:1, approveIndentItems:1, rejectIndentItems:1, createPO:1, approvePOItems:1, rejectPOItems:1, createGRN:1, approveGRNItems:1, rejectGRNItems:1, shortDeliveryApprove:1, markGRNDiscrepancy:1, stockIssueRequest:1, approveStockIssue:1, rejectStockIssue:1, issueStock:1, createTransfer:1, approveTransfer:1, rejectTransfer:1, dispatchTransfer:1, acknowledgementReceipt:1, transferRequest:1, transferItemsApprove:1, dispatch:1, disposeItems:1, replacementItems:1 },
};

const EMPTY_PERMS = {
  addItem:0, editItem:0, deleteItem:0, createIndent:0, approveIndentItems:0,
  rejectIndentItems:0, createPO:0, approvePOItems:0, rejectPOItems:0,
  createGRN:0, approveGRNItems:0, rejectGRNItems:0, shortDeliveryApprove:0,
  markGRNDiscrepancy:0, stockIssueRequest:0, approveStockIssue:0,
  rejectStockIssue:0, issueStock:0, createTransfer:0, approveTransfer:0,
  rejectTransfer:0, dispatchTransfer:0, acknowledgementReceipt:0,
  transferRequest:0, transferItemsApprove:0, dispatch:0, disposeItems:0,
  replacementItems:0,
};

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px", fontSize: 13, bgcolor: "#F9FAFB",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#9CA3AF" },
    "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
  },
};

const SECTION_LABEL_SX = {
  fontSize: 11, fontWeight: 700, color: "#7C3AED",
  letterSpacing: 0.8, textTransform: "uppercase", mb: 1.5, mt: 1,
};

const FIELD_LABEL_SX = {
  fontSize: 11, fontWeight: 700, color: "#6B7280",
  letterSpacing: 0.5, textTransform: "uppercase", mb: 0.5,
};

const SELECT_SX = {
  borderRadius: "8px", fontSize: 13, bgcolor: "#F9FAFB",
  "& fieldset": { borderColor: "#E5E7EB" },
  "&:hover fieldset": { borderColor: "#9CA3AF" },
  "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
};

function PermissionsBlock({ perms, onChange, error }) {
  return (
    <Box>
      <Typography sx={{ ...SECTION_LABEL_SX, mt: 2 }}>
        Permissions <span style={{ color: "#ef4444" }}>*</span>
      </Typography>
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
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", minWidth: 16 }}>
                    {i + 1}.
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
                    {p.label}
                  </Typography>
                </Box>
              }
              sx={{ m: 0, alignItems: "center" }}
            />
          </Grid>
        ))}
      </Grid>
      {error && (
        <Typography sx={{ fontSize: 10, color: "#ef4444", mt: 1 }}>
          {error}
        </Typography>
      )}
      {!error && (
        <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: 0.5 }}>
          Select at least one permission for this user
        </Typography>
      )}
    </Box>
  );
}


const EMPTY_FORM = {
  fullName: "", username: "", password: "", email: "",
  phone: "", department: "", role: "Location Manager", location: "", notes: "",
};

export default function CreateUserDialog({ open, onClose, onSave }) {
  const { can } = usePermissions();
  const [form, setForm]   = useState(EMPTY_FORM);
  const [perms, setPerms] = useState({ ...EMPTY_PERMS });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    let value = e.target.value;
    
    if (k === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    
    setForm((prev) => ({ ...prev, [k]: value }));
    setErrors((prev) => ({ ...prev, [k]: false }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setForm((prev) => ({ ...prev, role }));
    setPerms(
      role === "Location Manager"
        ? { ...EMPTY_PERMS }
        : { ...(ROLE_DEFAULT_PERMS[role] || ROLE_DEFAULT_PERMS["Nurse"]) }
    );
    setErrors((prev) => ({ ...prev, permissions: false }));
  };

  const handlePermChange = (key, checked) => {
    setPerms((prev) => ({ ...prev, [key]: checked ? 1 : 0 }));
    setErrors((prev) => ({ ...prev, permissions: false }));
  };

  const validate = () => {
    const errs = {};
    
    if (!form.fullName.trim()) errs.fullName = "Full Name is required";
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.password.trim()) errs.password = "Password is required";
    if (!form.location) errs.location = "Location is required";
    
    const hasAnyPermission = Object.values(perms).some(v => v === 1);
    if (!hasAnyPermission) errs.permissions = "At least one permission is required";
    
    if (form.phone && form.phone.length !== 10) {
      errs.phone = "Phone number must be exactly 10 digits";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetState = () => {
    setForm({ ...EMPTY_FORM });
    setPerms({ ...EMPTY_PERMS });
    setErrors({});
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, perms });
    resetState();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const errInputSx = (key) => errors[key] ? {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px", fontSize: 13, bgcolor: "#fff5f5",
      "& fieldset": { borderColor: "#fca5a5" },
      "&:hover fieldset": { borderColor: "#f87171" },
      "&.Mui-focused fieldset": { borderColor: "#ef4444" },
    },
  } : FIELD_SX;

  const errSelectSx = (key) => errors[key] ? {
    borderRadius: "8px", fontSize: 13, bgcolor: "#fff5f5",
    "& fieldset": { borderColor: "#fca5a5" },
    "&:hover fieldset": { borderColor: "#f87171" },
    "&.Mui-focused fieldset": { borderColor: "#ef4444" },
  } : SELECT_SX;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: "24px", pt: "20px", pb: "16px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6", flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: "10px", bgcolor: "#EDE9FE",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AccountCircle sx={{ color: "#7C3AED", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Create User
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>
              Set credentials, role, location &amp; permissions
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px",
            width: 30, height: 30, "&:hover": { background: "#f3f4f6", color: "#374151" },
          }}
        >
          <Close sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* ── Body ── */}
      <DialogContent
        sx={{
          px: "24px", py: "20px", overflowY: "auto", maxHeight: "72vh",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
        }}
      >
        {/* Account section */}
        <Typography sx={SECTION_LABEL_SX}>Account</Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Full Name *</Typography>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="e.g. Sarah Anderson" 
              value={form.fullName} 
              onChange={set("fullName")} 
              sx={errInputSx("fullName")}
              helperText={errors.fullName || "Enter the user's full name"}
              error={!!errors.fullName}
              FormHelperTextProps={{ sx: { color: errors.fullName ? "#ef4444" : "#9ca3af", fontSize: 10, ml: 0 } }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Username *</Typography>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="e.g. sarah.a" 
              value={form.username} 
              onChange={set("username")} 
              sx={errInputSx("username")}
              helperText={errors.username || "Unique username for login"}
              error={!!errors.username}
              FormHelperTextProps={{ sx: { color: errors.username ? "#ef4444" : "#9ca3af", fontSize: 10, ml: 0 } }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Password *</Typography>
            <TextField 
              fullWidth 
              size="small" 
              type="password" 
              placeholder="Enter password" 
              value={form.password} 
              onChange={set("password")} 
              sx={errInputSx("password")}
              helperText={errors.password || "Minimum 6 characters recommended"}
              error={!!errors.password}
              FormHelperTextProps={{ sx: { color: errors.password ? "#ef4444" : "#9ca3af", fontSize: 10, ml: 0 } }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Email</Typography>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="user@org.com" 
              value={form.email} 
              onChange={set("email")} 
              sx={FIELD_SX}
              helperText="Optional: User's email address"
              FormHelperTextProps={{ sx: { color: "#9ca3af", fontSize: 10, ml: 0 } }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Phone</Typography>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="10-digit number" 
              type="tel"
              value={form.phone} 
              onChange={set("phone")} 
              sx={errInputSx("phone")}
              helperText={errors.phone || "Optional: 10-digit mobile number"}
              error={!!errors.phone}
              FormHelperTextProps={{ sx: { color: errors.phone ? "#ef4444" : "#9ca3af", fontSize: 10, ml: 0 } }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Department</Typography>
            <Select 
              fullWidth 
              size="small" 
              value={form.department} 
              onChange={set("department")} 
              displayEmpty 
              sx={SELECT_SX}
            >
              <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>Select department...</MenuItem>
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>{d}</MenuItem>
              ))}
            </Select>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: 0.5, ml: 0 }}>
              Optional: Select user's department
            </Typography>
          </Grid>
        </Grid>

        {/* Role & Location section */}
        <Typography sx={SECTION_LABEL_SX}>Role &amp; Location</Typography>
        <Grid container spacing={1.5} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Role</Typography>
            <Select 
              fullWidth 
              size="small" 
              value={form.role} 
              onChange={handleRoleChange} 
              sx={SELECT_SX}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>
              ))}
            </Select>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: 0.5, ml: 0 }}>
              Default: Location Manager
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Assigned Location *</Typography>
            <Select 
              fullWidth 
              size="small" 
              value={form.location} 
              onChange={set("location")} 
              displayEmpty 
              sx={errSelectSx("location")}
              error={!!errors.location}
            >
              <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>Select location...</MenuItem>
              {HOSPITAL_LOCATIONS.map((l) => (
                <MenuItem key={l.id} value={l.name} sx={{ fontSize: 13 }}>{l.name}</MenuItem>
              ))}
            </Select>
            {errors.location && (
              <Typography sx={{ fontSize: 10, color: "#ef4444", mt: 0.5, ml: 0 }}>
                {errors.location}
              </Typography>
            )}
            {!errors.location && (
              <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: 0.5, ml: 0 }}>
                Select where this user works
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Permissions */}
        <PermissionsBlock 
          perms={perms} 
          onChange={handlePermChange} 
          error={errors.permissions}
        />

        {/* Notes */}
        <Typography sx={{ ...FIELD_LABEL_SX, mt: 2 }}>Notes</Typography>
        <TextField
          fullWidth multiline rows={2} size="small"
          placeholder="Any notes about this user..."
          value={form.notes}
          onChange={set("notes")}
          helperText="Optional: Add any additional information"
          FormHelperTextProps={{ sx: { color: "#9ca3af", fontSize: 10, ml: 0 } }}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: 13, borderRadius: "8px", bgcolor: "#f9fafb",
              "& fieldset": { borderColor: "#e5e7eb" },
              "&:hover fieldset": { borderColor: "#d1d5db" },
              "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
            },
          }}
        />
      </DialogContent>

      {/* ── Footer ── */}
      <Box
        sx={{
          px: "24px", py: "16px", borderTop: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: "10px", background: "#fff", flexShrink: 0,
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none",
            borderRadius: "8px", px: "20px", py: "9px",
            border: "1px solid #e5e7eb", background: "#fff",
            "&:hover": { background: "#f9fafb" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ fontWeight: 700, borderRadius: "8px", px: 3, py: 1.2, fontSize: 14 }}
        >
          Save User
        </Button>
      </Box>
    </Dialog>
  );
}