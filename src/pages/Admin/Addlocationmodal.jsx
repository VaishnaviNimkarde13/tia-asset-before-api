import { useState, useEffect } from "react";
import {
  Dialog, DialogContent,
  Box, Typography, Button, TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";

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
    fontSize: 13, borderRadius: "8px", background: "#f9fafb",
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#e5e7eb" },
    "&.Mui-focused fieldset": { borderColor: "#e5e7eb" },
  },
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.04em", mb: "6px", textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </Typography>
  );
}

function generateCode(name) {
  const cleaned = name.trim().replace(/\s+/g, "");
  if (!cleaned) return "";
  const prefix = cleaned.substring(0, 4).toUpperCase();
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}${num}`;
}

export default function AddLocationModal({ open, onClose, onSave }) {
  const empty = { name: "", code: "", inCharge: "", phone: "", address: "", notes: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm((p) => ({ ...p, code: generateCode(form.name) }));
  }, [form.name]);

  const set = (k) => (e) => {
    let value = e.target.value;
    if (k === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setForm((p) => ({ ...p, [k]: value }));
    setErrors((p) => ({ ...p, [k]: false }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = true;
    if (!form.code) errs.code = true;
    if (form.phone && form.phone.length !== 10) errs.phone = "Phone number must be exactly 10 digits";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form });
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
      ...inputSx["& .MuiOutlinedInput-root"],
      background: "#fff5f5",
      "& fieldset": { borderColor: "#fca5a5" },
      "&:hover fieldset": { borderColor: "#f87171" },
    },
  } : inputSx;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" } }}>

      {/* Header */}
      <Box sx={{ px: "24px", pt: "20px", pb: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LocationOnIcon sx={{ fontSize: 20, color: "#e11d48" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Add Location</Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>Register a new facility location</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClose}
          sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30, "&:hover": { background: "#f3f4f6", color: "#374151" } }}>
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* Body */}
      <DialogContent sx={{
        px: "24px", py: "20px", overflowY: "auto", maxHeight: "70vh",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
        "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
      }}>

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em", textTransform: "uppercase", mb: "12px" }}>
          Location Details
        </Typography>

        {/* Name full width */}
        <Box sx={{ mb: "16px" }}>
          <FieldLabel required>Location Name</FieldLabel>
          <TextField fullWidth size="small" placeholder="e.g. ICU Ward B"
            value={form.name} onChange={set("name")} sx={errInputSx("name")} />
          {errors.name && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", mb: "16px" }}>
          <Box>
            <FieldLabel required>Location Code</FieldLabel>
            <TextField fullWidth size="small" placeholder=""
              value={form.code}
              InputProps={{ readOnly: true }}
              sx={errors.code ? errInputSx("code") : inputReadonlySx}
            />
            {errors.code && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
          </Box>
          <Box>
            <FieldLabel>In-Charge</FieldLabel>
            <TextField fullWidth size="small" placeholder="e.g. Dr. Jones"
              value={form.inCharge} onChange={set("inCharge")} sx={inputSx} />
          </Box>
        </Box>

        {/* Phone */}
        <Box sx={{ mb: "16px" }}>
          <FieldLabel>Phone</FieldLabel>
          <TextField fullWidth size="small" placeholder="10-digit number" type="tel"
            value={form.phone} onChange={set("phone")} sx={errInputSx("phone")} />
          {errors.phone && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>{errors.phone}</Typography>}
        </Box>

        {/* Address */}
        <Box sx={{ mb: "16px" }}>
          <FieldLabel>Address / Wing / Floor</FieldLabel>
          <TextField fullWidth size="small" placeholder="e.g. 3rd Floor, East Wing"
            value={form.address} onChange={set("address")} sx={inputSx} />
        </Box>

        {/* Notes */}
        <Box>
          <FieldLabel>Notes</FieldLabel>
          <TextField fullWidth multiline rows={3} placeholder="Storage conditions, access restrictions..."
            value={form.notes} onChange={set("notes")}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: "8px", background: "#f9fafb",
              "& fieldset": { borderColor: "#e5e7eb" }, "&:hover fieldset": { borderColor: "#d1d5db" },
              "&.Mui-focused fieldset": { borderColor: "#2563eb" } } }} />
        </Box>

      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: "24px", py: "16px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", background: "#fff", flexShrink: 0 }}>
        <Button onClick={handleClose}
          sx={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "8px", px: "20px", py: "9px",
            border: "1px solid #e5e7eb", background: "#fff", "&:hover": { background: "#f9fafb" } }}>
          Cancel
        </Button>
        <Button onClick={handleSave} startIcon={<LocationOnIcon sx={{ fontSize: 15 }} />}
          sx={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "none", borderRadius: "8px", px: "20px", py: "9px",
            background: "#e11d48", boxShadow: "0 2px 8px rgba(225,29,72,0.25)", "&:hover": { background: "#be123c" } }}>
          Save Location
        </Button>
      </Box>

    </Dialog>
  );
}