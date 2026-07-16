import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, IconButton, Tooltip,
  useMediaQuery, useTheme, Dialog, DialogContent, TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";

const C = {
  textPrimary:   "#111827",
  textSecondary: "#6B7280",
};

const STORAGE_KEY = "tia_gpo_data";

const INITIAL_GPOS = [
  { id: "g1", name: "Vizient",           contactPerson: "Sarah Mitchell",  phone: "1-800-842-5146", email: "contracts@vizient.com",   city: "Irving, TX",       status: "Active" },
  { id: "g2", name: "Premier",           contactPerson: "James Holloway",  phone: "1-877-777-1552", email: "contracts@premierinc.com", city: "Charlotte, NC",    status: "Active" },
  { id: "g3", name: "HealthTrust (HPG)", contactPerson: "Linda Torres",    phone: "1-800-444-5465", email: "info@healthtrust.com",     city: "Nashville, TN",    status: "Active" },
 ];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, count, sub, iconEl, iconBg }) {
  return (
    <Box sx={{ flex: 1, bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px",
      px: 2, py: 1.5, minWidth: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {iconEl}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af",
          letterSpacing: "0.05em", textTransform: "uppercase", mb: 0.5 }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
            {count}
          </Typography>
          {sub && <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap" }}>{sub}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}

// ── GPO Modal ─────────────────────────────────────────────────────────────────
function GPOModal({ open, onClose, onSave, gpo }) {
  const empty = { name: "", contactPerson: "", phone: "", email: "", city: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(gpo ? { name: gpo.name, contactPerson: gpo.contactPerson, phone: gpo.phone, email: gpo.email, city: gpo.city } : empty);
    setErrors({});
  }, [gpo, open]);

  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: false })); };

  const inputSx = (err) => ({
    "& .MuiOutlinedInput-root": {
      fontSize: 13, borderRadius: "8px", background: err ? "#fff5f5" : "#f9fafb",
      "& fieldset": { borderColor: err ? "#fca5a5" : "#e5e7eb" },
      "&:hover fieldset": { borderColor: err ? "#f87171" : "#d1d5db" },
      "&.Mui-focused fieldset": { borderColor: err ? "#ef4444" : "#2563eb" },
    },
  });

  const handleSave = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.email.trim()) errs.email = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const labelSx = { fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px", display: "block" };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" } }}>
      <Box sx={{ px: "24px", pt: "20px", pb: "16px", display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            {gpo ? "Edit GPO" : "Add GPO"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>
            {gpo ? "Update GPO details" : "Register a new Group Purchasing Organisation"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30,
            "&:hover": { background: "#f3f4f6" } }}>
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "24px", py: "20px", overflowY: "auto", maxHeight: "70vh",
        "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 } }}>

        {/* GPO Name */}
        <Box sx={{ mb: "16px" }}>
          <Typography sx={labelSx}>GPO Name <span style={{ color: "#ef4444" }}>*</span></Typography>
          <TextField fullWidth size="small" placeholder="e.g. Vizient"
            value={form.name} onChange={set("name")} sx={inputSx(errors.name)} />
          {errors.name && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
        </Box>

        {/* Contact Person */}
        <Box sx={{ mb: "16px" }}>
          <Typography sx={labelSx}>GPO Contact Person</Typography>
          <TextField fullWidth size="small" placeholder="e.g. Sarah Mitchell"
            value={form.contactPerson} onChange={set("contactPerson")} sx={inputSx(false)} />
        </Box>

        {/* Phone + Email */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", mb: "16px" }}>
          <Box>
            <Typography sx={labelSx}>Phone (optional)</Typography>
            <TextField fullWidth size="small" placeholder="e.g. 1-800-000-0000"
              value={form.phone} onChange={set("phone")} sx={inputSx(false)} />
          </Box>
          <Box>
            <Typography sx={labelSx}>Email <span style={{ color: "#ef4444" }}>*</span></Typography>
            <TextField fullWidth size="small" placeholder="e.g. contracts@gpo.com"
              value={form.email} onChange={set("email")} sx={inputSx(errors.email)} />
            {errors.email && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
          </Box>
        </Box>

        {/* City, State */}
        <Box>
          <Typography sx={labelSx}>City, State</Typography>
          <TextField fullWidth size="small" placeholder="e.g. Irving, TX"
            value={form.city} onChange={set("city")} sx={inputSx(false)} />
        </Box>
      </DialogContent>

      <Box sx={{ px: "24px", py: "16px", borderTop: "1px solid #f3f4f6", display: "flex",
        alignItems: "center", justifyContent: "flex-end", gap: "10px", background: "#fff", flexShrink: 0 }}>
        <Button onClick={onClose}
          sx={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "8px",
            px: "20px", py: "9px", border: "1px solid #e5e7eb", "&:hover": { background: "#f9fafb" } }}>
          Cancel
        </Button>
        <Button onClick={handleSave}
          sx={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "none", borderRadius: "8px",
            px: "20px", py: "9px", background: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            "&:hover": { background: "#1d4ed8" } }}>
          {gpo ? "Save Changes" : "Add GPO"}
        </Button>
      </Box>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const GPO = () => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  const [gpos, setGpos] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch {}
    return INITIAL_GPOS;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(gpos)); }, [gpos]);

  const active   = gpos.filter((g) => g.status === "Active").length;
  const inactive = gpos.filter((g) => g.status === "Inactive").length;

  const statCards = [
    { label: "Total GPOs",   count: gpos.length, sub: "registered",    iconBg: "#3b82f6",
      iconEl: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: "Active",       count: active,       sub: "GPOs",          iconBg: "#10b981",
      iconEl: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { label: "Inactive",     count: inactive,     sub: "GPOs",          iconBg: "#f59e0b",
      iconEl: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  ];

  const handleSave = (form) => {
    if (selected) {
      setGpos((p) => p.map((g) => g.id === selected.id ? { ...g, ...form } : g));
    } else {
      setGpos((p) => [{ ...form, id: `g${Date.now()}`, status: "Active" }, ...p]);
    }
    setModalOpen(false);
    setSelected(null);
  };

  const handleDownloadDocs = (gpo) => {
    try {
      const all = JSON.parse(localStorage.getItem("tia_vendor_documents") || "[]");
      const docs = all.filter((d) => d.vendorId === gpo.id && d.vendorType === "gpo");
      if (!docs.length) { alert("No documents uploaded for this GPO."); return; }
      docs.forEach((doc) => {
        if (!doc.fileData) return;
        const a = document.createElement("a");
        a.href = doc.fileData;
        a.download = doc.fileName || "document";
        a.click();
      });
    } catch { alert("Failed to download documents."); }
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this GPO?")) setGpos((p) => p.filter((g) => g.id !== id));
  };

  const handleToggleStatus = (id) => {
    setGpos((p) => p.map((g) => g.id === id ? { ...g, status: g.status === "Active" ? "Inactive" : "Active" } : g));
  };

  const columns = [
    { id: "name",          label: "GPO Name",        render: (r) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b" }}>{r.name}</Typography> },
    { id: "contactPerson", label: "Contact Person",   render: (r) => <Typography sx={{ fontSize: "0.75rem", color: "#374151" }}>{r.contactPerson || "—"}</Typography> },
    { id: "phone",         label: "Phone",            render: (r) => <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{r.phone || "—"}</Typography> },
    { id: "email",         label: "Email",            render: (r) => <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{r.email || "—"}</Typography> },
    { id: "city",          label: "City, State",      render: (r) => <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{r.city || "—"}</Typography> },
    { id: "status",        label: "Status",           render: (r) => (
      <Chip label={r.status} size="small" sx={{
        backgroundColor: r.status === "Active" ? "#e8f5e9" : "#ffebee",
        color: r.status === "Active" ? "#2e7d32" : "#d32f2f",
        fontSize: "0.7rem",
      }} />
    )},
    { id: "actions", label: "Actions", align: "right", render: (r) => (
      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
        <Tooltip title="Download Documents">
          <IconButton size="small" onClick={() => handleDownloadDocs(r)} sx={{ color: "#2563eb" }}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => { setSelected(r); setModalOpen(true); }} sx={{ color: "#f59e0b" }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={r.status === "Active" ? "Deactivate" : "Activate"}>
          <IconButton size="small" onClick={() => handleToggleStatus(r.id)}
            sx={{ color: r.status === "Active" ? "#ef4444" : "#10b981" }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )},
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1.5, sm: 0 }, mb: { xs: 2, sm: 3 } }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 22, color: C.textPrimary, letterSpacing: -0.3 }}>
            GPO
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.textSecondary, mt: 0.3 }}>
            {active} active Group Purchasing Organisations registered
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setSelected(null); setModalOpen(true); }}
          sx={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
            background: "#2563eb", color: "#fff", borderRadius: "12px",
            px: "15px", py: "8px", fontSize: "12px", fontWeight: 500, textTransform: "none", lineHeight: 1,
            boxShadow: "0 1px 4px rgba(37,99,235,0.25)",
            "&:hover": { background: "#1d4ed8", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" },
          }}>
          Add GPO
        </Button>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: "flex", gap: "12px", mb: "20px" }}>
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={0}
        sx={{ width: "100%", overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 2,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-track": { background: "#f1f5f9", borderRadius: 3 },
          "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: 3 } }}>
        <Table size="small" sx={{ tableLayout: "auto", width: "100%", minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align || "left"}
                  sx={{ fontWeight: 600, backgroundColor: "#f8fafc", whiteSpace: "nowrap",
                    fontSize: "0.8rem", py: 1.5, px: isTablet ? 1.5 : 2, color: "#475569" }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {gpos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 5, textAlign: "center", color: "#9ca3af", fontSize: 13, border: "none" }}>
                  No GPOs yet. Click "Add GPO" to get started.
                </TableCell>
              </TableRow>
            ) : (
              gpos.map((row) => (
                <TableRow hover key={row.id} sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || "left"}
                      sx={{ whiteSpace: "nowrap", py: 1.5, px: isTablet ? 1.5 : 2, borderBottom: "1px solid #f1f5f9" }}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <GPOModal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); }}
        onSave={handleSave} gpo={selected} />
    </Box>
  );
};

export default GPO;
