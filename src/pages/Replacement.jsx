import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Authcontext";
import { usePermissions } from "../hooks/usePermissions";
import { useInventory } from "../contexts/InventoryContext";
import { getUserLocation, locationMatches } from "../utils/locationUtils";

// ─── localStorage helpers ─────────────────────────────────────────────────────

const REPL_STORAGE_KEY = "replacement_data";

function loadReplacements() {
  try {
    const raw = localStorage.getItem(REPL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return initialData;
}

function saveReplacements(data) {
  try {
    localStorage.setItem(REPL_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

import {
  Box, Typography, Button, Chip, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Paper, Snackbar, Alert, Tooltip,
  Stack, Modal, TextField, Select, MenuItem, FormControl, Checkbox,
  FormControlLabel, Divider, Pagination, Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

// ─── Data ─────────────────────────────────────────────────────────────────────

const initialData = [
  {
    id: "RPL-2026-005", linkedGRN: "GRN-2026-0015",
    item: "Sodium Chloride 0.9% IV 1L", location: "Central Store",
    reason: "Expired", urgency: "Critical", disposed: 12, replaceQty: 40,
    substitute: "Same item", linkedPO: "-", raisedBy: "S. Anderson",
    date: "Mar 18, 2026", status: "Pending",
  },
  {
    id: "RPL-2026-004", linkedGRN: "GRN-2026-0014",
    item: "Epinephrine 1mg/mL 10mL", location: "Central Store",
    reason: "Low Stock", urgency: "Critical", disposed: "-", replaceQty: 20,
    substitute: "Same item", linkedPO: "PO-2026-0004", raisedBy: "T. Williams",
    date: "Mar 17, 2026", status: "Vendor Return Replacement", linkedVR: "VR-2026-0001",
  },
  {
    id: "RPL-2026-003", linkedGRN: "GRN-2026-0013",
    item: "Amoxicillin 500mg Capsules", location: "Central Store",
    reason: "Recalled", urgency: "High", disposed: 50, replaceQty: 50,
    substitute: "Generic Amoxicillin 500mg", linkedPO: "-", raisedBy: "S. Anderson",
    date: "Mar 10, 2026", status: "Pending",
  },
  {
    id: "RPL-2026-002", linkedGRN: "GRN-2026-0012",
    item: "Morphine Sulfate 10mg/mL", location: "Central Store",
    reason: "Expired", urgency: "High", disposed: 5, replaceQty: 10,
    substitute: "Same item", linkedPO: "PO-2026-0002", raisedBy: "P. Chen",
    date: "Mar 5, 2026", status: "Closed",
  },
];

const REASONS = ["All Reasons", "Expired", "Low Stock", "Recalled", "Damaged"];
const STATUSES = ["All Statuses", "Pending", "Vendor Return Replacement", "Closed"];
const SUPPLIERS = ["Select...", "MedSupply Co.", "PharmaDirect", "GlobalMed", "HealthCore Ltd.", "BioPharm Inc."];
const URGENCY_OPTIONS = ["Critical — Within 24h", "High — Within 48h", "Medium — Within 1 week", "Low — No rush"];
const ITEMS_PER_PAGE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const urgencyStyle = (u) => {
  if (u === "Critical") return { bg: "#fff5f5", color: "#e53e3e" };
  if (u === "High") return { bg: "#fffbeb", color: "#d97706" };
  return { bg: "#eff6ff", color: "#3b82f6" };
};

const statusStyle = (s) => {
  const map = {
    Pending: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    "Vendor Return Replacement": { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    Closed: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  };
  return map[s] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
};

// Helper: is there a real, usable linked GRN on this row?
const hasRealGRN = (row) => Boolean(row.linkedGRN) && row.linkedGRN !== "-";

// ─── Shared input sx ──────────────────────────────────────────────────────────

const inputSx = {
  width: "100%",
  "& .MuiInputBase-root": { fontSize: 13, borderRadius: "8px", bgcolor: "#f8fafc", color: "#0f172a" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0", borderWidth: "1.5px" },
  "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
};
const autoSx = {
  ...inputSx,
  "& .MuiInputBase-root": { fontSize: 13, borderRadius: "8px", bgcolor: "#f1f5f9", color: "#94a3b8" },
};
const selectSx = { fontSize: 13, borderRadius: "8px", bgcolor: "#f8fafc" };
const numericInputSx = {
  ...inputSx,
  "& input[type='number']::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
  "& input[type='number']::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
  "& input[type='number']": { MozAppearance: "textfield" },
};

const SecLabel = ({ text }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.5, mt: 0.5 }}>
    {text}
  </Typography>
);
const FLabel = ({ text }) => (
  <Typography sx={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", mb: 0.75 }}>
    {text}
  </Typography>
);

// ─── X Icon ───────────────────────────────────────────────────────────────────

const XIcon = ({ color = "#767676", size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Raise Replacement Modal ──────────────────────────────────────────────────

function RaiseReplacementModal({ onClose, onSubmit }) {
  const { items: inventoryItems } = useInventory();
  const [form, setForm] = useState({
    linkedGRN: "", item: "", location: "", totalQty: "", expiredQty: "",
    reason: "Expired", urgency: "Critical — Within 24h", disposed: "", replaceQty: "",
    useSubstitute: false, substitute: "", substituteNDC: "",
    therapeuticEq: "AB-Rated — Bioequivalent", supplier: "Select...", unitCost: "", notes: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleItemChange = (val) => {
    const parts = val.split(" — ");
    const itemName = parts[0];
    const location = parts[1] || "";
    const item = inventoryItems.find((i) => i.name === itemName && i.location === location);
    if (item) {
      setForm((p) => ({ ...p, item: val, location: item.location, totalQty: String(item.qty || 0), expiredQty: "0" }));
    } else {
      setForm((p) => ({ ...p, item: val, location: "", totalQty: "", expiredQty: "" }));
    }
  };

  const urgencyToShort = (u) => {
    if (u.startsWith("Critical")) return "Critical";
    if (u.startsWith("High")) return "High";
    if (u.startsWith("Medium")) return "Medium";
    return "Low";
  };

  // GRN reference is now OPTIONAL — only item and replace qty are required.
  const handleSave = (raisePO) => {
    if (!form.item || !form.replaceQty) return;
    onSubmit({
      linkedGRN: form.linkedGRN || "-", // fallback when left blank
      item: form.item.split(" — ")[0], location: form.location,
      reason: form.reason, urgency: urgencyToShort(form.urgency), disposed: form.disposed || "-",
      replaceQty: form.replaceQty,
      substitute: form.useSubstitute && form.substitute
        ? `${form.substitute}${form.substituteNDC ? ` (${form.substituteNDC})` : ""}` : "Same item",
      raisePO,
    });
  };

  return (
    <Modal open onClose={onClose}>
      <Box sx={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Box sx={{ bgcolor: "#fff", borderRadius: "16px", width: "100%", maxWidth: 560, boxShadow: "0 24px 64px rgba(0,0,0,0.20)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: "20px 24px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <SyncAltOutlinedIcon sx={{ fontSize: 18, color: "#2563eb" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Raise Replacement Request</Typography>
              <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.1 }}>Flag item for replacement</Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ border: "1.5px solid #e2e8f0", borderRadius: "8px", width: 32, height: 32, color: "#64748b" }}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ p: "20px 24px", overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 99 } }}>
            <SecLabel text="Linked GRN" />
            <Box sx={{ mb: 2.5 }}>
              <FLabel text="GRN Reference" />
              <TextField
                size="small"
                value={form.linkedGRN}
                onChange={(e) => set("linkedGRN", e.target.value)}
                placeholder="e.g. GRN-2026-0001 (optional)"
                sx={inputSx}
              />
            </Box>
            <Divider sx={{ my: 2.25 }} />
            <SecLabel text="Item Being Replaced" />
            <Box sx={{ mb: 1.75 }}>
              <FLabel text="Select Item *" />
              <Autocomplete
                size="small"
                options={inventoryItems}
                getOptionLabel={(i) => (typeof i === "string" ? i : `${i.name} — ${i.location}`)}
                value={inventoryItems.find((i) => `${i.name} — ${i.location}` === form.item) || null}
                onChange={(e, newValue) =>
                  handleItemChange(newValue ? `${newValue.name} — ${newValue.location}` : "")
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id} style={{ fontSize: 13 }}>
                    {option.name} — {option.location}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search item..." sx={inputSx} />
                )}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 13,
                    borderRadius: "8px",
                    bgcolor: "#f8fafc",
                    padding: "2px 8px !important",
                  },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0", borderWidth: "1.5px" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                }}
              />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75, mb: 1.75 }}>
              <Box><FLabel text="Location (Auto)" /><TextField size="small" value={form.location} disabled sx={autoSx} /></Box>
              <Box><FLabel text="Total Quantity (Auto)" /><TextField size="small" value={form.totalQty} disabled sx={autoSx} /></Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75, mb: 1.75 }}>
              <Box>
                <FLabel text="Replacement Reason *" />
                <FormControl size="small" sx={{ width: "100%" }}>
                  <Select value={form.reason} onChange={(e) => set("reason", e.target.value)} sx={selectSx}>
                    {["Expired", "Low Stock", "Recalled", "Damaged"].map((r) => (<MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FLabel text="Urgency *" />
                <FormControl size="small" sx={{ width: "100%" }}>
                  <Select value={form.urgency} onChange={(e) => set("urgency", e.target.value)} sx={selectSx}>
                    {URGENCY_OPTIONS.map((u) => (<MenuItem key={u} value={u} sx={{ fontSize: 13 }}>{u}</MenuItem>))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75 }}>
              <Box><FLabel text="QTY Disposed / Removed" /><TextField size="small" type="number" value={form.disposed} onChange={(e) => set("disposed", e.target.value)} placeholder="0" sx={numericInputSx} /></Box>
              <Box><FLabel text="QTY to Replace *" /><TextField size="small" type="number" value={form.replaceQty} onChange={(e) => set("replaceQty", e.target.value)} placeholder="0" sx={numericInputSx} /></Box>
            </Box>
            <Divider sx={{ my: 2.25 }} />
            <SecLabel text="Substitute Item (If Different)" />
            <FormControlLabel
              control={<Checkbox checked={form.useSubstitute} onChange={(e) => set("useSubstitute", e.target.checked)} size="small" sx={{ color: "#2563eb", "&.Mui-checked": { color: "#2563eb" } }} />}
              label={<Typography sx={{ fontSize: 13, color: "#374151" }}>Use a substitute / alternative item</Typography>}
              sx={{ mb: form.useSubstitute ? 1.75 : 0 }}
            />
            {form.useSubstitute && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75 }}>
                  <Box><FLabel text="Substitute Name" /><TextField size="small" value={form.substitute} onChange={(e) => set("substitute", e.target.value)} placeholder="e.g. Generic Amox 500mg" sx={inputSx} /></Box>
                  <Box><FLabel text="Substitute NDC" /><TextField size="small" value={form.substituteNDC} onChange={(e) => set("substituteNDC", e.target.value)} placeholder="0378-0255-01" sx={inputSx} /></Box>
                </Box>
                <Box>
                  <FLabel text="Therapeutic Equivalence" />
                  <FormControl size="small" sx={{ width: "100%" }}>
                    <Select value={form.therapeuticEq} onChange={(e) => set("therapeuticEq", e.target.value)} sx={selectSx}>
                      {["AB-Rated — Bioequivalent", "Therapeutically Equivalent", "Partial — Physician Approval Required", "Emergency Substitute Only"].map((o) => (<MenuItem key={o} value={o} sx={{ fontSize: 13 }}>{o}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}
            <Divider sx={{ my: 2.25 }} />
            <SecLabel text="Procurement" />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75, mb: 1.75 }}>
              <Box>
                <FLabel text="Preferred Supplier" />
                <FormControl size="small" sx={{ width: "100%" }}>
                  <Select value={form.supplier} onChange={(e) => set("supplier", e.target.value)} sx={selectSx}>
                    {SUPPLIERS.map((s) => (<MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>))}
                  </Select>
                </FormControl>
              </Box>
              <Box><FLabel text="Est. Unit Cost" /><TextField size="small" type="number" value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} placeholder="0.00" sx={numericInputSx} /></Box>
            </Box>
            <FLabel text="Clinical Notes / Justification" />
            <TextField multiline rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Reason, approval obtained, protocol followed..." sx={{ ...inputSx, "& .MuiInputBase-root": { fontSize: 13, borderRadius: "8px", bgcolor: "#f8fafc", color: "#0f172a", lineHeight: 1.6 } }} />
          </Box>
          <Box sx={{ p: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 1.25, justifyContent: "flex-end" }}>
            <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, color: "#374151", borderColor: "#e2e8f0", borderRadius: "8px", "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" } }}>Cancel</Button>
            <Button onClick={() => handleSave(false)} variant="outlined" startIcon={<SaveOutlinedIcon sx={{ fontSize: "14px !important" }} />} sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, color: "#374151", borderColor: "#e2e8f0", borderRadius: "8px", "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" } }}>Save Open</Button>
            <Button onClick={() => handleSave(true)} variant="contained" startIcon={<SyncAltOutlinedIcon sx={{ fontSize: "14px !important" }} />} sx={{ textTransform: "none", fontSize: 13, fontWeight: 700, bgcolor: "#2563eb", borderRadius: "8px", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", "&:hover": { bgcolor: "#1d4ed8" } }}>Save & Raise PO</Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, count, sub, iconEl, iconBg }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        px: { xs: 0.75, sm: 1, md: 1.25 },
        py: { xs: 0.5, sm: 0.75, md: 1 },
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.5, sm: 0.75, md: 1 },
      }}
    >
      <Box
        sx={{
          width: { xs: 32, sm: 36, md: 40 },
          height: { xs: 32, sm: 36, md: 40 },
          borderRadius: "50%",
          bgcolor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {iconEl}
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: { xs: 9, sm: 10, md: 11 },
            fontWeight: 600,
            color: "#9ca3af",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mb: { xs: 0.25, sm: 0.375, md: 0.5 },
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: { xs: 0.25, sm: 0.5, md: 0.75 } }}>
          <Typography
            sx={{
              fontSize: { xs: 14, sm: 18, md: 20 },
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            {count}
          </Typography>
          {sub && (
            <Typography
              sx={{
                fontSize: { xs: 9, sm: 10, md: 11 },
                fontWeight: 500,
                color: "#6b7280",
                whiteSpace: "nowrap",
              }}
            >
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options }) {
  return (
    <FormControl size="small" sx={{ minWidth: 148 }}>
      <Select value={value} onChange={(e) => onChange(e.target.value)} size="small"
        sx={{
          fontSize: 13, borderRadius: "20px", background: "#fff",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb", borderWidth: "1px" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
        }}
      >
        {options.map((opt) => (<MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>{opt}</MenuItem>))}
      </Select>
    </FormControl>
  );
}

// ─── Detail helpers ───────────────────────────────────────────────────────────

function DetailRow({ label, children }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>{label}</Typography>
      {children}
    </Box>
  );
}
function DetailText({ value }) {
  return <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{value || "—"}</Typography>;
}

// ─── Table columns ────────────────────────────────────────────────────────────

const HEADS = ["Request #", "Item", "Reason / Urgency", "Linked PO / GRN", "Status", "Actions"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Replacement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userLocation = getUserLocation(currentUser);
  const { can } = usePermissions();
  const { items: inventoryItems } = useInventory();
  const [data, setData] = useState(() => loadReplacements());
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showModal, setShowModal] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [viewGRNOpen, setViewGRNOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [viewVROpen, setViewVROpen] = useState(false);
  const [selectedVR, setSelectedVR] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { saveReplacements(data); }, [data]);

  useEffect(() => { setCurrentPage(1); }, [reasonFilter, statusFilter]);

  const showToast = (msg, severity = "success") => setToast({ open: true, msg, severity });

  const filtered = data.filter((r) => {
    if (userLocation && currentUser?.role !== "admin" && currentUser?.role !== "location_manager_super") {
      if (!locationMatches(userLocation, r.location || "")) return false;
    }
    return (
      (reasonFilter === "All Reasons" || r.reason === reasonFilter) &&
      (statusFilter === "All Statuses" || r.status === statusFilter)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (_, value) => setCurrentPage(value);
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const counts = {
    open: data.filter((r) => r.status === "Pending").length,
    inProgress: data.filter((r) => r.status === "Vendor Return Replacement").length,
    closed: data.filter((r) => r.status === "Closed").length,
  };

  const handleDelete = (id) => { setData((prev) => prev.filter((r) => r.id !== id)); showToast("Record removed.", "warning"); };

  const handleRaiseOrder = (id) => {
    const replacement = data.find((r) => r.id === id);
    if (!replacement) return;
    const year = new Date().getFullYear();
    const existingPOs = JSON.parse(localStorage.getItem("purchase_orders_data") || "[]");
    const maxNum = existingPOs.reduce((max, po) => { const match = po.id?.match(/PO-\d{4}-(\d+)/); return match ? Math.max(max, parseInt(match[1], 10)) : max; }, 0);
    const poNumber = `PO-${year}-${String(maxNum + 1).padStart(4, "0")}`;
    const qty = parseInt(replacement.replaceQty, 10) || 1;
    const newPO = {
      id: poNumber, indentId: "—", quotRef: "—", supplier: replacement.supplier || "—",
      location: replacement.location || "Main Acute Care Hospital", lines: 1, total: 0,
      createdBy: "System (Replacement)",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      delivery: "—", priority: replacement.urgency === "Critical" ? "Urgent" : "Normal", status: "Pending",
      fromReplacement: true, fromReplacementRequestId: id,
      fromReplacementItemName: replacement.item, fromReplacementReason: replacement.reason,
      fromReplacementOriginalItemId: replacement.originalItemId,
    };
    const updatedPOs = [newPO, ...existingPOs];
    localStorage.setItem("purchase_orders_data", JSON.stringify(updatedPOs));
    setData((prev) => prev.map((r) => r.id === id ? { ...r, status: "Pending", linkedPO: poNumber } : r));
    showToast(`PO ${poNumber} created and linked to this replacement request`);
    setTimeout(() => { navigate("/admin/purchase-orders", { state: { highlightPO: poNumber } }); }, 800);
  };

  const handleRaiseReplacement = (form) => {
    const year = new Date().getFullYear();
    const newId = `RPL-${year}-${String(data.length + 1).padStart(3, "0")}`;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const originalItem = inventoryItems.find((i) => i.name === form.item && i.location === form.location);
    setData((prev) => [{
      id: newId, linkedGRN: form.linkedGRN || "-", item: form.item, location: form.location,
      reason: form.reason, urgency: form.urgency, disposed: form.disposed || "-",
      replaceQty: form.replaceQty, substitute: form.substitute, linkedPO: "-",
      raisedBy: "System Admin", date: today, status: "Pending",
      originalItemId: originalItem?.id || null,
    }, ...prev]);
    setShowModal(false);
    showToast(`${newId} created successfully.`);
  };

  const handleExport = () => {
    const headers = ["Request#", "Item", "Location", "Reason", "Urgency", "Disposed", "Replace QTY", "Substitute", "Linked PO", "Linked GRN", "Raised By", "Date", "Status"];
    const rows = filtered.map((r) => [r.id, r.item, r.location, r.reason, r.urgency, r.disposed, r.replaceQty, r.substitute, r.linkedPO, r.linkedGRN || "—", r.raisedBy, r.date, r.status]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "replacement_tracking.csv";
    a.click();
    showToast("Exported successfully.");
  };

  const handleViewDetails = (replacement) => { setSelectedReplacement(replacement); setViewDetailsOpen(true); };

  const handleViewGRN = (replacement) => {
    if (!hasRealGRN(replacement)) return;
    try {
      const grns = JSON.parse(localStorage.getItem("grn_data") || "[]");
      const grn = grns.find((g) => g.id === replacement.linkedGRN);
      if (grn) { setSelectedGRN(grn); setViewGRNOpen(true); } else { showToast("GRN not found", "error"); }
    } catch (e) { showToast("Error loading GRN", "error"); }
  };

  const handleViewVR = (replacement) => {
    if (!replacement.linkedVR) return;
    try {
      const vendorReturns = JSON.parse(localStorage.getItem("vendor_returns_data") || "[]");
      const vr = vendorReturns.find((v) => v.id === replacement.linkedVR);
      if (vr) { setSelectedVR(vr); setViewVROpen(true); } else { showToast("Vendor Return not found", "error"); }
    } catch (e) { showToast("Error loading Vendor Return", "error"); }
  };

  const handleGenerateVendorReturn = (replacement) => {
    if (!hasRealGRN(replacement)) return;
    const year = new Date().getFullYear();
    const vendorReturns = JSON.parse(localStorage.getItem("vendor_returns_data") || "[]");
    const maxNum = vendorReturns.reduce((max, vr) => { const match = vr.id?.match(/VR-\d{4}-(\d+)/); return match ? Math.max(max, parseInt(match[1], 10)) : max; }, 0);
    const vrNumber = `VR-${year}-${String(maxNum + 1).padStart(4, "0")}`;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const newVR = { id: vrNumber, replacementRequestId: replacement.id, item: replacement.item, location: replacement.location, reason: replacement.reason, quantity: replacement.replaceQty, supplier: replacement.supplier || "—", returnDate: today, status: "Open", notes: `Generated from replacement request ${replacement.id}` };
    vendorReturns.unshift(newVR);
    localStorage.setItem("vendor_returns_data", JSON.stringify(vendorReturns));
    setData((prev) => prev.map((r) => r.id === replacement.id ? { ...r, status: "Vendor Return Replacement", linkedVR: vrNumber } : r));
    showToast(`Vendor Return ${vrNumber} created successfully`);
  };

  const statCards = [
    {
      label: "Pending Requests", count: counts.open, sub: "Awaiting action", iconBg: "#f59e0b",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
    {
      label: "Vendor Return Replacement", count: counts.inProgress, sub: "Vendor returns generated", iconBg: "#3b82f6",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    },
    {
      label: "Closed", count: counts.closed, sub: "Successfully replaced", iconBg: "#10b981",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>,
    },
  ];

  return (
    <Box>
      {showModal && <RaiseReplacementModal onClose={() => setShowModal(false)} onSubmit={handleRaiseReplacement} />}

      {/* ── View Details Modal ────────────────────────────────────────────── */}
      {viewDetailsOpen && selectedReplacement && (
        <Modal open onClose={() => setViewDetailsOpen(false)}>
          <Box sx={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
            <Box sx={{ bgcolor: "#fff", borderRadius: "16px", width: "100%", maxWidth: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.20)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: "20px 24px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Replacement Details</Typography>
                <IconButton onClick={() => setViewDetailsOpen(false)} size="small" sx={{ border: "1.5px solid #e2e8f0", borderRadius: "8px", width: 32, height: 32, color: "#64748b" }}>
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ p: "20px 24px", overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 99 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Request ID"><DetailText value={selectedReplacement.id} /></DetailRow>
                  <DetailRow label="Status">
                    <Chip label={selectedReplacement.status} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, ...statusStyle(selectedReplacement.status) }} />
                  </DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="GRN No.">
                    {selectedReplacement.linkedGRN && selectedReplacement.linkedGRN !== "-" ? (
                      <Chip label={selectedReplacement.linkedGRN} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: "#fdf4ff", color: "#9333ea", border: "1px solid #e9d5ff", borderRadius: "6px", "& .MuiChip-label": { px: "8px" } }} />
                    ) : (
                      <Typography sx={{ fontSize: 13, color: "#d1d5db" }}>—</Typography>
                    )}
                  </DetailRow>
                  <DetailRow label="PO Number">
                    {selectedReplacement.linkedPO && selectedReplacement.linkedPO !== "-" ? (
                      <Typography onClick={() => { setViewDetailsOpen(false); navigate("/admin/purchase-orders", { state: { highlightPO: selectedReplacement.linkedPO } }); }} sx={{ fontSize: 13, fontWeight: 600, color: "#2563eb", cursor: "pointer", textDecoration: "underline", "&:hover": { color: "#1d4ed8" } }}>
                        {selectedReplacement.linkedPO}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: 13, color: "#d1d5db" }}>—</Typography>
                    )}
                  </DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Item"><DetailText value={selectedReplacement.item} /></DetailRow>
                  <DetailRow label="Location"><DetailText value={selectedReplacement.location} /></DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Reason"><DetailText value={selectedReplacement.reason} /></DetailRow>
                  <DetailRow label="Urgency">
                    <Chip label={selectedReplacement.urgency} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, ...urgencyStyle(selectedReplacement.urgency) }} />
                  </DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Replace Qty"><DetailText value={selectedReplacement.replaceQty} /></DetailRow>
                  <DetailRow label="Disposed"><DetailText value={selectedReplacement.disposed} /></DetailRow>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <DetailRow label="Substitute"><DetailText value={selectedReplacement.substitute} /></DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <DetailRow label="Raised By"><DetailText value={selectedReplacement.raisedBy} /></DetailRow>
                  <DetailRow label="Date"><DetailText value={selectedReplacement.date} /></DetailRow>
                </Box>
              </Box>
              <Box sx={{ p: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => setViewDetailsOpen(false)} variant="contained" sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#2563eb", borderRadius: "8px", "&:hover": { bgcolor: "#1d4ed8" } }}>Close</Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}

      {/* ── View GRN Modal ────────────────────────────────────────────────── */}
      {viewGRNOpen && selectedGRN && (
        <Modal open onClose={() => setViewGRNOpen(false)}>
          <Box sx={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
            <Box sx={{ bgcolor: "#fff", borderRadius: "16px", width: "100%", maxWidth: 600, boxShadow: "0 24px 64px rgba(0,0,0,0.20)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: "20px 24px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{selectedGRN.id}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.5 }}>{selectedGRN.supplier} · {selectedGRN.linkedPO}</Typography>
                </Box>
                <IconButton onClick={() => setViewGRNOpen(false)} size="small" sx={{ border: "1.5px solid #e2e8f0", borderRadius: "8px", width: 32, height: 32, color: "#64748b" }}>
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ p: "20px 24px", overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 99 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Location"><DetailText value={selectedGRN.location} /></DetailRow>
                  <DetailRow label="Received By"><DetailText value={selectedGRN.receivedBy} /></DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Date"><DetailText value={selectedGRN.date} /></DetailRow>
                  <DetailRow label="Condition"><Chip label={selectedGRN.condition} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700 }} /></DetailRow>
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em", textTransform: "uppercase", mb: 1 }}>
                 Items ({selectedGRN.lineItems?.length || 0})
                </Typography>
                <Box sx={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                  {(selectedGRN.lineItems || []).map((item, idx) => (
                    <Box key={idx} sx={{ p: "12px 14px", borderBottom: idx < (selectedGRN.lineItems?.length || 0) - 1 ? "1px solid #f3f4f6" : "none", bgcolor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{item.item}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{item.rcvQty} received</Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: 10, color: "#6b7280" }}>Lot: {item.lotNo || "—"}</Typography>
                        <Typography sx={{ fontSize: 10, color: "#6b7280" }}>Expiry: {item.expiry || "—"}</Typography>
                        <Typography sx={{ fontSize: 10, color: "#6b7280" }}>Condition: {item.condition || "—"}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ p: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => setViewGRNOpen(false)} variant="contained" sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#2563eb", borderRadius: "8px", "&:hover": { bgcolor: "#1d4ed8" } }}>Close</Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}

      {/* ── View Vendor Return Modal ──────────────────────────────────────── */}
      {viewVROpen && selectedVR && (
        <Modal open onClose={() => setViewVROpen(false)}>
          <Box sx={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
            <Box sx={{ bgcolor: "#fff", borderRadius: "16px", width: "100%", maxWidth: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.20)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: "20px 24px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{selectedVR.id}</Typography>
                <IconButton onClick={() => setViewVROpen(false)} size="small" sx={{ border: "1.5px solid #e2e8f0", borderRadius: "8px", width: 32, height: 32, color: "#64748b" }}>
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ p: "20px 24px", overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 99 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Item"><DetailText value={selectedVR.item} /></DetailRow>
                  <DetailRow label="Location"><DetailText value={selectedVR.location} /></DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Reason"><DetailText value={selectedVR.reason} /></DetailRow>
                  <DetailRow label="Quantity"><DetailText value={selectedVR.quantity} /></DetailRow>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <DetailRow label="Supplier"><DetailText value={selectedVR.supplier} /></DetailRow>
                  <DetailRow label="Status"><Chip label={selectedVR.status} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: "#fef9c3", color: "#854d0e" }} /></DetailRow>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <DetailRow label="Return Date"><DetailText value={selectedVR.returnDate} /></DetailRow>
                </Box>
                <DetailRow label="Notes">
                  <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{selectedVR.notes}</Typography>
                </DetailRow>
              </Box>
              <Box sx={{ p: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => setViewVROpen(false)} variant="contained" sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#2563eb", borderRadius: "8px", "&:hover": { bgcolor: "#1d4ed8" } }}>Close</Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "20px" }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Replacement Tracking</Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FilterSelect value={reasonFilter} onChange={setReasonFilter} options={REASONS} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUSES} />
          <Button startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: "14px !important" }} />} variant="outlined" onClick={handleExport}
            sx={{ height: 32, px: "12px", borderRadius: "12px", border: "1px solid #015DFF", color: "#015DFF", textTransform: "none", fontWeight: 600, fontSize: 13, bgcolor: "#fff", boxShadow: "none", gap: "8px", minWidth: 0, "& .MuiButton-startIcon": { mr: 0 }, "&:hover": { border: "1px solid #015DFF", bgcolor: "#EFF4FF", boxShadow: "none" } }}>
            Export
          </Button>
          <Tooltip title={!can.replacementItems ? "You don't have permission to add replacement items" : "Add Replacement"}>
            <span>
              <Button startIcon={<AddIcon sx={{ fontSize: "14px !important" }} />} variant="contained" onClick={() => setShowModal(true)} disabled={!can.replacementItems}
                sx={{ height: 32, px: "12px", borderRadius: "12px", bgcolor: "#015DFF", color: "#fff", textTransform: "none", fontWeight: 600, fontSize: 13, boxShadow: "none", gap: "8px", minWidth: 0, "& .MuiButton-startIcon": { mr: 0 }, "&:hover": { bgcolor: "#0147CC", boxShadow: "none" } }}>
                Raise Replacement
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 0.75, md: 1 }, mb: { xs: 0.875, sm: 1.125, md: 1.375 }, flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {statCards.map((s) => (
          <StatCard key={s.label} label={s.label} count={s.count} sub={s.sub} iconBg={s.iconBg} iconEl={s.icon} />
        ))}
      </Box>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <Table size="small" sx={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow sx={{ background: "#EBF1FE" }}>
              {HEADS.map((h, i) => (
                <TableCell key={h} sx={{ py: "11px", px: "14px", fontSize: 11, fontWeight: 600, color: "#373B4D", letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6", borderRight: i < HEADS.length - 1 ? "1px solid #BED3FC" : "none" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={HEADS.length} align="center" sx={{ py: 5, color: "#94a3b8", fontSize: 13, border: "none" }}>No records found.</TableCell>
              </TableRow>
            ) : (
              paginated.map((row, idx) => {
                const us = urgencyStyle(row.urgency);
                const ss = statusStyle(row.status);
                const grnAvailable = hasRealGRN(row);
                return (
                  <TableRow key={row.id} sx={{ background: "#fff", "&:hover": { background: "#fafafa" }, transition: "background 0.15s", "& td": { borderBottom: idx < paginated.length - 1 ? "1px solid #f3f4f6" : "none", py: "12px", px: "14px", verticalAlign: "middle" } }}>

                    {/* Col 1: Request # */}
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>
                        {row.id}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: "2px" }}>
                        {row.date}
                      </Typography>
                    </TableCell>

                    {/* Col 2: Item */}
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.35 }}>
                        {row.item}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#6b7280", mt: "2px" }}>
                        {row.location}
                      </Typography>
                    </TableCell>

                    {/* Col 3: Reason / Urgency */}
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#374151", lineHeight: 1.3 }}>{row.reason}</Typography>
                      <Box sx={{ mt: "6px" }}>
                        <Chip label={row.urgency} size="small" sx={{ bgcolor: us.bg, color: us.color, fontWeight: 700, fontSize: 11, height: 20, borderRadius: "6px", "& .MuiChip-label": { px: "7px" } }} />
                      </Box>
                    </TableCell>

                    {/* Col 4: Linked PO / GRN */}
                    <TableCell>
                      {row.linkedPO !== "-" ? (
                        <Typography onClick={() => navigate("/admin/purchase-orders", { state: { highlightPO: row.linkedPO } })} sx={{ fontSize: 12, fontWeight: 600, color: "#2563eb", lineHeight: 1.3, cursor: "pointer", textDecoration: "underline", "&:hover": { color: "#1d4ed8" }, transition: "color 0.2s" }}>
                          {row.linkedPO}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#d1d5db", lineHeight: 1.3 }}>{row.linkedPO}</Typography>
                      )}
                      {grnAvailable ? (
                        <Box sx={{ mt: "5px" }}>
                          <Chip label={row.linkedGRN} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#fdf4ff", color: "#9333ea", border: "1px solid #e9d5ff", borderRadius: "5px", "& .MuiChip-label": { px: "6px" } }} />
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: 11, color: "#d1d5db", mt: "4px" }}>No GRN</Typography>
                      )}
                    </TableCell>

                    {/* Col 5: Status */}
                    <TableCell>
                      <Chip label={row.status} size="small" variant="outlined" sx={{ bgcolor: ss.bg, color: ss.color, borderColor: ss.border, fontWeight: 700, fontSize: 11, height: 20, borderRadius: "6px", "& .MuiChip-label": { px: "7px" } }} />
                    </TableCell>

                    {/* Col 6: Actions */}
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {/* View Linked GRN — always visible, disabled when no real GRN */}
                        <Tooltip title={grnAvailable ? "View Linked GRN" : "No linked GRN for this request"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleViewGRN(row)}
                              disabled={!grnAvailable}
                              sx={{
                                width: 28, height: 28, borderRadius: "6px",
                                border: `1px solid ${grnAvailable ? "#e5e7eb" : "#d1d5db"}`,
                                bgcolor: "#fff",
                                "&:hover": {
                                  bgcolor: grnAvailable ? "#f0fdf4" : "#fff",
                                  borderColor: grnAvailable ? "#bbf7d0" : "#d1d5db",
                                },
                                "&.Mui-disabled": { opacity: 0.5 },
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={grnAvailable ? "#10b981" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(row)} sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#eff6ff", borderColor: "#bfdbfe" } }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </IconButton>
                        </Tooltip>

                        {row.linkedVR ? (
                          <Tooltip title="View Vendor Return">
                            <IconButton size="small" onClick={() => handleViewVR(row)} sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#fef3c7", borderColor: "#fcd34d" } }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title={
                            !grnAvailable
                              ? "No linked GRN — cannot generate a vendor return"
                              : !can.replacementItems
                                ? "You don't have permission to generate vendor returns"
                                : "Generate Vendor Return"
                          }>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleGenerateVendorReturn(row)}
                                disabled={!can.replacementItems || !grnAvailable}
                                sx={{
                                  width: 28, height: 28, borderRadius: "6px",
                                  border: `1px solid ${can.replacementItems && grnAvailable ? "#e5e7eb" : "#d1d5db"}`,
                                  bgcolor: "#fff",
                                  "&:hover": {
                                    bgcolor: can.replacementItems && grnAvailable ? "#fef3c7" : "#fff",
                                    borderColor: can.replacementItems && grnAvailable ? "#fcd34d" : "#d1d5db",
                                  },
                                  "&.Mui-disabled": { opacity: 0.5 },
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={can.replacementItems && grnAvailable ? "#f59e0b" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        <Tooltip title={!can.replacementItems ? "You don't have permission to remove replacement items" : "Remove"}>
                          <span>
                            <IconButton size="small" onClick={() => handleDelete(row.id)} disabled={!can.replacementItems}
                              sx={{ width: 28, height: 28, borderRadius: "6px", border: `1px solid ${can.replacementItems ? "#e5e7eb" : "#d1d5db"}`, bgcolor: "#fff", "&:hover": { bgcolor: can.replacementItems ? "#fef2f2" : "#fff", borderColor: can.replacementItems ? "#fecaca" : "#d1d5db" }, "&.Mui-disabled": { opacity: 0.5 } }}>
                              <XIcon color={can.replacementItems ? "#767676" : "#9ca3af"} size={14} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "right", mt: 2.5, pt: 1.5, pb: 0.75, flexWrap: "wrap", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button onClick={handlePreviousPage} disabled={currentPage === 1}
              sx={{ minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb", color: currentPage === 1 ? "#d1d5db" : "#374151", "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" }, "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" } }}>
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </Button>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              shape="rounded"
              size="small"
              hidePrevButton
              hideNextButton
              siblingCount={1}
              boundaryCount={1}
              sx={{
                "& .MuiPaginationItem-root": { borderRadius: "5px", fontSize: 11, fontWeight: 500, minWidth: 28, height: 28, border: "1px solid #e5e7eb", color: "#374151", "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" } },
                "& .Mui-selected": { background: "#015DFF !important", color: "#fff", border: "1px solid #015DFF", "&:hover": { background: "#0147CC !important" } },
              }}
            />
            <Button onClick={handleNextPage} disabled={currentPage === totalPages}
              sx={{ minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb", color: currentPage === totalPages ? "#d1d5db" : "#374151", "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" }, "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" } }}>
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} sx={{ borderRadius: "10px", fontWeight: 600, fontSize: 13 }} onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}