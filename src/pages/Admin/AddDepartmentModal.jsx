import { useState, useEffect } from "react";
import {
  Dialog, DialogContent,
  Box, Typography, Button, TextField,
  Select, MenuItem, FormControl, IconButton, Checkbox, FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13, borderRadius: "8px", background: "#f9fafb",
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb" },
  },
};

const inputReadonlySx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13, borderRadius: "8px", background: "#eff6ff",
    "& fieldset": { borderColor: "#bfdbfe" },
    "&:hover fieldset": { borderColor: "#bfdbfe" },
    "&.Mui-focused fieldset": { borderColor: "#bfdbfe" },
  },
};

const selectSx = {
  fontSize: 13, borderRadius: "8px", background: "#f9fafb",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
};

const selectErrSx = {
  fontSize: 13, borderRadius: "8px", background: "#fff5f5",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fca5a5" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#f87171" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#ef4444" },
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.04em", mb: "6px", textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </Typography>
  );
}

const DEPT_TYPES = [
  "Clinical", "Surgical", "Diagnostic", "Pharmacy",
  "Administrative", "Support Services", "Emergency", "Outpatient",
];

const SEED_LOCATION_NAMES = [
  "Main Acute Care Hospital",
  "Central Warehouse & Stores",
  "Ambulatory Surgery Center",
  "Urgent Care Center",
  "Women's & Children's Hospital",
  "Core Laboratory",
  "Outpatient Imaging Center",
  "Blood Bank",
  "Retail / Discharge Pharmacy",
  "Specialty Pharmacy",
];

// Generates code from name: first 4 chars of name (uppercased) + 3-digit number
// e.g. "Cardiology" → "CARD001", "ICU" → "ICU001"
function generateCode(name) {
  const cleaned = name.trim().replace(/\s+/g, "");
  if (!cleaned) return "";
  const prefix = cleaned.substring(0, 4).toUpperCase();
  const num = String(Math.floor(Math.random() * 900) + 100); // 100–999
  return `${prefix}${num}`;
}

export default function AddDepartmentModal({ open, onClose, onSave, locations = [] }) {
  const empty = {
    name: "", code: "", type: "Clinical", inCharge: "",
    phone: "", locationId: "", notes: "", isStore: false, isDefaultStore: false,
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm((p) => ({ ...p, code: generateCode(form.name) }));
  }, [form.name]);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: false }));
  };

  const validate = () => {
    const errs = {};
    if (!form.locationId) errs.locationId = true;
    if (!form.name.trim()) errs.name = true;
    if (!form.code.trim()) errs.code = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const selectedLocation = allLocationOptions.find((l) => l.id === form.locationId) || null;
    onSave({ ...form, location: selectedLocation ? selectedLocation.name : "" });
    setForm(empty);
    setErrors({});
  };

  const handleClose = () => {
    setForm(empty);
    setErrors({});
    onClose();
  };

  const errInputSx = (key) => errors[key] ? {
    "& .MuiOutlinedInput-root": {
      fontSize: 13, borderRadius: "8px", background: "#fff5f5",
      "& fieldset": { borderColor: "#fca5a5" },
      "&:hover fieldset": { borderColor: "#f87171" },
      "&.Mui-focused fieldset": { borderColor: "#ef4444" },
    },
  } : inputSx;

  const addedNames = new Set(locations.map(l => l.name));
  const seedOptions = SEED_LOCATION_NAMES
    .filter(n => !addedNames.has(n))
    .map(n => ({ id: `seed-${n}`, name: n, code: "", address: "" }));
  const allLocationOptions = [...locations, ...seedOptions];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" } }}>

      {/* Header */}
      <Box sx={{ px: "24px", pt: "20px", pb: "16px", display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BusinessIcon sx={{ fontSize: 20, color: "#2563eb" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Add Department</Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>Register a new department</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClose}
          sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30,
            "&:hover": { background: "#f3f4f6", color: "#374151" } }}>
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* Body */}
      <DialogContent sx={{
        px: "24px", py: "20px", overflowY: "auto", maxHeight: "72vh",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
        "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
      }}>

        {/* Location */}
        <Box sx={{ mb: "16px" }}>
          <FieldLabel required>Location</FieldLabel>
          <FormControl fullWidth size="small">
            <Select
              value={form.locationId}
              onChange={set("locationId")}
              displayEmpty
              sx={errors.locationId ? selectErrSx : selectSx}
              renderValue={(val) => {
                if (!val) return <span style={{ color: "#9ca3af", fontSize: 13 }}>Select</span>;
                const loc = allLocationOptions.find(l => l.id === val);
                return <span style={{ fontSize: 13 }}>{loc ? loc.name : val}</span>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300, borderRadius: "10px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb",
                    "&::-webkit-scrollbar": { width: 4 },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
                  },
                },
                MenuListProps: { sx: { py: "6px" } },
              }}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id} sx={{ fontSize: 13, py: "8px", px: "12px" }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>{loc.name}</Typography>
                    {loc.code && <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{loc.code}{loc.address ? ` · ${loc.address}` : ""}</Typography>}
                  </Box>
                </MenuItem>
              ))}
              {locations.length > 0 && seedOptions.length > 0 && (
                <Box sx={{ borderTop: "1px solid #f3f4f6", mx: "8px", my: "4px" }} />
              )}
              {seedOptions.length > 0 && (
                <Box sx={{ px: "12px", pt: "6px", pb: "2px", pointerEvents: "none" }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Default Locations
                  </Typography>
                </Box>
              )}
              {seedOptions.map((loc) => (
                <MenuItem key={loc.id} value={loc.id} sx={{ fontSize: 13, py: "8px", px: "12px" }}>
                  <Typography sx={{ fontSize: 13, color: "#374151" }}>{loc.name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {errors.locationId && (
            <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Please select a location</Typography>
          )}
        </Box>

        <Box sx={{ borderTop: "1px dashed #e5e7eb", mb: "20px" }} />

        {/* Department Details */}
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#2563eb",
          letterSpacing: "0.05em", textTransform: "uppercase", mb: "12px" }}>
          Department Details
        </Typography>

        <Box sx={{ mb: "16px" }}>
          <FieldLabel required>Department Name</FieldLabel>
          <TextField fullWidth size="small" placeholder="e.g. Cardiology"
            value={form.name} onChange={set("name")} sx={errInputSx("name")} />
          {errors.name && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", mb: "16px" }}>
          <Box>
            <FieldLabel required>Department Code</FieldLabel>
            <TextField
              fullWidth size="small"
              placeholder=""
              value={form.code}
              InputProps={{ readOnly: true }}
              sx={errors.code ? errInputSx("code") : inputSx}
              inputProps={{ style: {} }}
            />
            {errors.code && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
          </Box>
          <Box>
            <FieldLabel>Type</FieldLabel>
            <FormControl fullWidth size="small">
              <Select value={form.type} onChange={set("type")} sx={selectSx}>
                {DEPT_TYPES.map((t) => (
                  <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", mb: "16px" }}>
          <Box>
            <FieldLabel>Head / In-Charge</FieldLabel>
            <TextField fullWidth size="small" placeholder="e.g. Dr. Smith"
              value={form.inCharge} onChange={set("inCharge")} sx={inputSx} />
          </Box>
          <Box>
            <FieldLabel>Phone</FieldLabel>
            <TextField fullWidth size="small" placeholder="Ext 0000"
              value={form.phone} onChange={set("phone")} sx={inputSx} />
          </Box>
        </Box>

        <Box sx={{ mb: "16px" }}>
          <FieldLabel>Notes</FieldLabel>
          <TextField fullWidth multiline rows={2} placeholder="Specialisation, bed count, operating hours..."
            value={form.notes} onChange={set("notes")}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: "8px", background: "#f9fafb",
              "& fieldset": { borderColor: "#e5e7eb" }, "&:hover fieldset": { borderColor: "#d1d5db" },
              "&.Mui-focused fieldset": { borderColor: "#2563eb" } } }} />
        </Box>

        <Box sx={{ borderTop: "1px dashed #e5e7eb", mb: "16px" }} />

        {/* Is Store */}
        <FormControlLabel
          control={
            <Checkbox
              checked={form.isStore}
              onChange={(e) => setForm(p => ({
                ...p,
                isStore: e.target.checked,
                isDefaultStore: e.target.checked ? p.isDefaultStore : false,
              }))}
              size="small"
              sx={{ color: "#d1d5db", "&.Mui-checked": { color: "#16a34a" }, p: "4px" }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>Is Store</Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>This department acts as a store</Typography>
            </Box>
          }
          sx={{ ml: 0, alignItems: "flex-start", gap: "4px", mb: "10px" }}
        />

        {/* Is Default Store */}
        <FormControlLabel
          control={
            <Checkbox
              checked={form.isDefaultStore}
              onChange={(e) => setForm(p => ({ ...p, isDefaultStore: e.target.checked }))}
              size="small"
              sx={{ color: "#d1d5db", "&.Mui-checked": { color: "#2563eb" }, p: "4px" }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>Is Default Store</Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Set as the default store for this location</Typography>
            </Box>
          }
          sx={{ ml: 0, alignItems: "flex-start", gap: "4px" }}
        />

      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: "24px", py: "16px", borderTop: "1px solid #f3f4f6", display: "flex",
        alignItems: "center", justifyContent: "flex-end", gap: "10px", background: "#fff", flexShrink: 0 }}>
        <Button onClick={handleClose}
          sx={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "8px",
            px: "20px", py: "9px", border: "1px solid #e5e7eb", background: "#fff",
            "&:hover": { background: "#f9fafb" } }}>
          Cancel
        </Button>
        <Button onClick={handleSave} startIcon={<BusinessIcon sx={{ fontSize: 15 }} />}
          sx={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "none", borderRadius: "8px",
            px: "20px", py: "9px", background: "#2563eb",
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)", "&:hover": { background: "#1d4ed8" } }}>
          Save Department
        </Button>
      </Box>

    </Dialog>
  );
}