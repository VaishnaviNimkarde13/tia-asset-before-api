import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  Divider as MuiDivider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  FormControlLabel,
  Paper,
  Snackbar,
  Alert,
  Tooltip,
  Pagination,
  Stack,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";

import { useInventory } from "../contexts/InventoryContext";
import { usePermissions } from "../hooks/usePermissions";

const btnOutlined = {
  height: 32,
  px: "12px",
  borderRadius: "12px",
  border: "1px solid #015DFF",
  bgcolor: "#fff",
  color: "#015DFF",
  textTransform: "none",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "none",
  gap: "8px",
  minWidth: 0,
  "& .MuiButton-startIcon": { mr: 0 },
  "&:hover": {
    border: "1px solid #015DFF",
    bgcolor: "#EFF4FF",
    boxShadow: "none",
  },
};

const today = new Date();
today.setHours(0, 0, 0, 0);

function calcDaysLeft(expiryRaw) {
  if (!expiryRaw) return null;
  const d = expiryRaw instanceof Date ? expiryRaw : new Date(expiryRaw);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function getStatus(days) {
  if (days === null) return "No Expiry";
  if (days < 0) return "Expired";
  if (days <= 60) return "Expiring Soon";
  return "OK";
}

function formatDate(expiryRaw) {
  if (!expiryRaw) return "—";
  const d = expiryRaw instanceof Date ? expiryRaw : new Date(expiryRaw);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const REPLACEMENT_POS_KEY = "tia_replacement_pos";

function getReplacementPOs() {
  try {
    return JSON.parse(localStorage.getItem(REPLACEMENT_POS_KEY) || "[]");
  } catch {
    return [];
  }
}

function isItemInPO(itemId) {
  const rpos = getReplacementPOs();
  return rpos.some((r) => r.itemId === itemId && r.status !== "Cancelled");
}

function getItemPOId(itemId) {
  const rpos = getReplacementPOs();
  const found = rpos.find(
    (r) => r.itemId === itemId && r.status !== "Cancelled",
  );
  return found ? found.poId : null;
}

const SUPPLIERS = [
  "Select...",
  "MedSupply Co.",
  "PharmaDirect",
  "GlobalMed",
  "HealthCore Ltd.",
  "BioPharm Inc.",
];
const URGENCY_OPTIONS = [
  "Critical — Within 24h",
  "High — Within 48h",
  "Medium — Within 1 week",
  "Low — No rush",
];
const THERAPEUTIC_EQ = [
  "AB-Rated — Bioequivalent",
  "Therapeutically Equivalent",
  "Partial — Physician Approval Required",
  "Emergency Substitute Only",
];

// Updated locations
const LOCATIONS = {
  "Main Acute Care Hospital": "Main Acute Care Hospital",
  "Central Warehouse & Stores": "Central Warehouse & Stores",
  "Ambulatory Surgery Center": "Ambulatory Surgery Center",
  "Urgent Care Center": "Urgent Care Center",
  "Women's & Children's Hospital": "Women's & Children's Hospital",
};

const getLocationName = (locationCode) => {
  if (!locationCode) return "Main Acute Care Hospital";
  if (LOCATIONS[locationCode] === locationCode && locationCode in LOCATIONS) {
    return locationCode;
  }
  return LOCATIONS[locationCode] || "Main Acute Care Hospital";
};

const getLocationColor = (location) => {
  const locationName = getLocationName(location);
  const colorMap = {
    "Main Acute Care Hospital": { bg: "#ede9fe", color: "#6d28d9" },
    "Central Warehouse & Stores": { bg: "#dbeafe", color: "#1e40af" },
    "Ambulatory Surgery Center": { bg: "#dcfce7", color: "#166534" },
    "Urgent Care Center": { bg: "#ffedd5", color: "#c2410c" },
    "Women's & Children's Hospital": { bg: "#fce7f3", color: "#db2777" },
  };
  return colorMap[locationName] || { bg: "#f3f4f6", color: "#374151" };
};

const getLocationTooltip = (location) => {
  const locationName = getLocationName(location);
  return `${locationName}`;
};

const SecLabel = ({ text }) => (
  <Typography
    sx={{
      fontSize: 11,
      fontWeight: 700,
      color: "#2563eb",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      mb: 1.5,
      mt: 0.5,
    }}
  >
    {text}
  </Typography>
);

const FLabel = ({ text }) => (
  <Typography
    component="label"
    sx={{
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      color: "#64748b",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      mb: 0.75,
    }}
  >
    {text}
  </Typography>
);

const inputSx = {
  width: "100%",
  "& .MuiInputBase-root": {
    fontSize: 13,
    borderRadius: "8px",
    bgcolor: "#f8fafc",
    color: "#0f172a",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e2e8f0",
    borderWidth: "1.5px",
  },
  "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#cbd5e1",
  },
};

const autoSx = {
  ...inputSx,
  "& .MuiInputBase-root": {
    fontSize: 13,
    borderRadius: "8px",
    bgcolor: "#f1f5f9",
    color: "#374151",
  },
};

const numericInputSx = {
  ...inputSx,
  "& input[type='number']::-webkit-outer-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "& input[type='number']::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "& input[type='number']": { MozAppearance: "textfield" },
};

function ReplaceModal({ prefill, onClose, onSubmit }) {
  const [form, setForm] = useState({
    item: prefill ? `${prefill.name} — ${prefill.location}` : "",
    ndc: prefill ? prefill.ndc : "",
    location: prefill ? getLocationName(prefill.location) : "",
    totalQty: prefill ? String(prefill.qty) : "",
    expiredQty: prefill && prefill.expired ? String(prefill.qty) : "0",
    reason: "Expired",
    urgency: "Critical — Within 24h",
    disposed: "",
    replaceQty: "",
    useSubstitute: false,
    substitute: "",
    substituteNDC: "",
    therapeuticEq: "AB-Rated — Bioequivalent",
    supplier: "Select...",
    unitCost: "",
    notes: "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = (raisePO) => {
    if (!form.item || !form.replaceQty) {
      alert("Please fill in required fields");
      return;
    }
    onSubmit({ ...form, raisePO, itemId: prefill?.id });
  };

  return (
    <Modal open onClose={onClose}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: 560,
            boxShadow: "0 24px 64px rgba(0,0,0,0.20)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: "20px 24px 16px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SyncAltOutlinedIcon sx={{ fontSize: 18, color: "#2563eb" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}
              >
                Raise Replacement Request
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.1 }}>
                Flag item for replacement and create PO
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                width: 32,
                height: 32,
                color: "#64748b",
              }}
            >
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              p: "20px 24px",
              overflowY: "auto",
              flex: 1,
              "&::-webkit-scrollbar": { width: 5 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "#e2e8f0",
                borderRadius: 99,
              },
            }}
          >
            <SecLabel text="Item Being Replaced" />
            <Box sx={{ mb: 1.75 }}>
              <FLabel text="Select Item *" />
              <TextField
                size="small"
                value={form.item}
                onChange={(e) => set("item", e.target.value)}
                disabled={!!prefill}
                placeholder="Select item..."
                sx={prefill ? autoSx : inputSx}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.75,
                mb: 1.75,
              }}
            >
              <Box>
                <FLabel text="Location (Auto)" />
                <TextField
                  size="small"
                  value={form.location}
                  disabled
                  sx={autoSx}
                />
              </Box>
              <Box>
                <FLabel text="Total Quantity (Auto)" />
                <TextField
                  size="small"
                  value={form.totalQty}
                  disabled
                  sx={autoSx}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.75,
                mb: 1.75,
              }}
            >
              <Box>
                <FLabel text="Expired Quantity (Auto)" />
                <TextField
                  size="small"
                  value={form.expiredQty}
                  disabled
                  sx={autoSx}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.75,
                mb: 1.75,
              }}
            >
              <Box>
                <FLabel text="Replacement Reason *" />
                <FormControl size="small" sx={{ width: "100%" }}>
                  <Select
                    value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                    sx={{
                      fontSize: 13,
                      borderRadius: "8px",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    {["Expired", "Low Stock", "Recalled", "Damaged"].map(
                      (r) => (
                        <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>
                          {r}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FLabel text="Urgency *" />
                <FormControl size="small" sx={{ width: "100%" }}>
                  <Select
                    value={form.urgency}
                    onChange={(e) => set("urgency", e.target.value)}
                    sx={{
                      fontSize: 13,
                      borderRadius: "8px",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    {URGENCY_OPTIONS.map((u) => (
                      <MenuItem key={u} value={u} sx={{ fontSize: 13 }}>
                        {u}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.75,
              }}
            >
              <Box>
                <FLabel text="QTY Disposed / Removed" />
                <TextField
                  size="small"
                  type="number"
                  value={form.disposed}
                  onChange={(e) => set("disposed", e.target.value)}
                  placeholder="0"
                  sx={numericInputSx}
                />
              </Box>
              <Box>
                <FLabel text="QTY to Replace *" />
                <TextField
                  size="small"
                  type="number"
                  value={form.replaceQty}
                  onChange={(e) => set("replaceQty", e.target.value)}
                  placeholder="0"
                  sx={numericInputSx}
                />
              </Box>
            </Box>
            <MuiDivider sx={{ my: 2.25 }} />
            <SecLabel text="Substitute Item (If Different)" />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.useSubstitute}
                  onChange={(e) => set("useSubstitute", e.target.checked)}
                  size="small"
                  sx={{
                    color: "#2563eb",
                    "&.Mui-checked": { color: "#2563eb" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: 13, color: "#374151" }}>
                  Use a substitute / alternative item
                </Typography>
              }
              sx={{ mb: form.useSubstitute ? 1.75 : 0 }}
            />
            {form.useSubstitute && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1.75,
                  }}
                >
                  <Box>
                    <FLabel text="Substitute Name" />
                    <TextField
                      size="small"
                      value={form.substitute}
                      onChange={(e) => set("substitute", e.target.value)}
                      placeholder="e.g. Generic Amox 500mg"
                      sx={inputSx}
                    />
                  </Box>
                  <Box>
                    <FLabel text="Substitute NDC" />
                    <TextField
                      size="small"
                      value={form.substituteNDC}
                      onChange={(e) => set("substituteNDC", e.target.value)}
                      placeholder="0378-0255-01"
                      sx={inputSx}
                    />
                  </Box>
                </Box>
                <Box>
                  <FLabel text="Therapeutic Equivalence" />
                  <FormControl size="small" sx={{ width: "100%" }}>
                    <Select
                      value={form.therapeuticEq}
                      onChange={(e) => set("therapeuticEq", e.target.value)}
                      sx={{
                        fontSize: 13,
                        borderRadius: "8px",
                        bgcolor: "#f8fafc",
                      }}
                    >
                      {THERAPEUTIC_EQ.map((o) => (
                        <MenuItem key={o} value={o} sx={{ fontSize: 13 }}>
                          {o}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}
            <MuiDivider sx={{ my: 2.25 }} />
            <SecLabel text="Procurement" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.75,
                mb: 1.75,
              }}
            >
              <Box>
                <FLabel text="Preferred Supplier" />
                <FormControl size="small" sx={{ width: "100%" }}>
                  <Select
                    value={form.supplier}
                    onChange={(e) => set("supplier", e.target.value)}
                    sx={{
                      fontSize: 13,
                      borderRadius: "8px",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    {SUPPLIERS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FLabel text="Est. Unit Cost" />
                <TextField
                  size="small"
                  type="number"
                  value={form.unitCost}
                  onChange={(e) => set("unitCost", e.target.value)}
                  placeholder="0.00"
                  sx={numericInputSx}
                />
              </Box>
            </Box>
            <FLabel text="Clinical Notes / Justification" />
            <TextField
              multiline
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Reason, approval obtained, protocol followed..."
              sx={{
                ...inputSx,
                "& .MuiInputBase-root": {
                  fontSize: 13,
                  borderRadius: "8px",
                  bgcolor: "#f8fafc",
                  color: "#0f172a",
                  lineHeight: 1.6,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              p: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: 1.25,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                borderColor: "#e2e8f0",
                borderRadius: "8px",
                "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(false)}
              variant="outlined"
              startIcon={
                <SaveOutlinedIcon sx={{ fontSize: "14px !important" }} />
              }
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                borderColor: "#e2e8f0",
                borderRadius: "8px",
                "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
              }}
            >
              Save Request
            </Button>
            <Button
              onClick={() => handleSave(true)}
              variant="contained"
              startIcon={
                <SyncAltOutlinedIcon sx={{ fontSize: "14px !important" }} />
              }
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 700,
                bgcolor: "#2563eb",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              Save &amp; Create PO
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

function DisposeModal({ item, onClose, onConfirm }) {
  return (
    <Modal open onClose={onClose}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
        }}
      >
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 24px 64px rgba(0,0,0,0.20)",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DeleteOutlineOutlinedIcon
                sx={{ fontSize: 18, color: "#ef4444" }}
              />
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}
              >
                Confirm Disposal
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              bgcolor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              p: "12px 14px",
              mb: 2.5,
            }}
          >
            <Typography sx={{ fontSize: 13, color: "#374151" }}>
              Mark <strong>{item.name}</strong> (Lot: {item.lot || "—"}, Qty:{" "}
              {item.qty}) at{" "}
              <strong>{getLocationName(item.location)}</strong> as
              disposed? This will remove the item from inventory.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.25, justifyContent: "flex-end" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                borderColor: "#e2e8f0",
                borderRadius: "8px",
                "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(item.id)}
              variant="contained"
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 700,
                bgcolor: "#ef4444",
                borderRadius: "8px",
                "&:hover": { bgcolor: "#dc2626" },
                boxShadow: "none",
              }}
            >
              Dispose
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

export default function ExpiryTracking() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { items: inventoryItems, deleteItem, updateItem } = useInventory();

  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 7;
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [disposeTarget, setDisposeTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

 const itemsWithExpiry = inventoryItems.filter((item) => {
  const hasExpiry =
    item.expiryRaw !== null &&
    item.expiryRaw !== undefined &&
    item.expiryRaw !== "";
  
  if (!hasExpiry) return false;
  
  // Only include items that are expired or expiring within 60 days
  const days = calcDaysLeft(item.expiryRaw);
  if (days === null) return false;
  return days <= 60; // Include if 60 days or less (expired = negative days, expiring soon = 0-60 days)
});

  const enriched = itemsWithExpiry
    .map((item) => {
      const days = calcDaysLeft(item.expiryRaw);
      const status = getStatus(days);
      const inPO = isItemInPO(item.id);
      const poId = inPO ? getItemPOId(item.id) : null;
      return {
        ...item,
        days,
        status,
        inPO,
        poId,
        expiryFormatted: item.expiry || formatDate(item.expiryRaw),
        displayLocation: getLocationName(item.location),
      };
    })
    .sort((a, b) => {
      const order = { Expired: 0, "Expiring Soon": 1, OK: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  const expired = enriched.filter((i) => i.status === "Expired");
  const expiringSoon = enriched.filter((i) => i.status === "Expiring Soon");
  const ok = enriched.filter((i) => i.status === "OK");
  const inPOCount = enriched.filter((i) => i.inPO).length;

  // Apply filters
  const filteredData = enriched.filter((item) => {
    const matchesStatus =
      statusFilter === "All Statuses" ||
      (statusFilter === "Expired" && item.status === "Expired") ||
      (statusFilter === "Expiring Soon" && item.status === "Expiring Soon") ||
      (statusFilter === "In PO" && item.inPO) ||
      (statusFilter === "OK" && item.status === "OK");

    const matchesSearch =
      !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lot?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.displayLocation?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedRows = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  const handleDispose = (id) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (item) {
      try {
        const disposed = JSON.parse(
          localStorage.getItem("tia_disposed_items") || "[]",
        );
        disposed.unshift({
          ...item,
          disposedAt: new Date().toISOString(),
          disposedDate: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          expiryFormatted: item.expiry || formatDate(item.expiryRaw),
          displayLocation: getLocationName(item.location),
        });
        localStorage.setItem("tia_disposed_items", JSON.stringify(disposed));
      } catch {
        /* ignore */
      }
    }

    deleteItem(id);
    setDisposeTarget(null);
    setSnackbar({
      open: true,
      message: "Item disposed and recorded successfully",
      severity: "success",
    });
  };

  const generatePONumber = () => {
    const existing = JSON.parse(
      localStorage.getItem("purchase_orders_data") || "[]",
    );
    const maxNum = existing.reduce((max, po) => {
      const match = po.id?.match(/PO-\d{4}-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `PO-${new Date().getFullYear()}-${String(maxNum + 1).padStart(4, "0")}`;
  };

  const handleReplaceSubmit = (formData) => {
    const { raisePO, itemId } = formData;

    const replacementRequestId = `REP-${Date.now()}`;
    const poNumber = generatePONumber();
    const disposedQty = parseFloat(formData.disposed) || 0;
    const replaceQty = parseFloat(formData.replaceQty) || 0;

    if (disposedQty > 0 && itemId) {
      const item = inventoryItems.find((i) => i.id === itemId);
      if (item) {
        const newQty = Math.max(0, item.qty - disposedQty);
        updateItem(itemId, { qty: newQty });

        try {
          const disposed = JSON.parse(
            localStorage.getItem("tia_disposed_items") || "[]",
          );
          disposed.unshift({
            ...item,
            disposedQty: disposedQty,
            originalQty: item.qty,
            remainingQty: newQty,
            reason: formData.reason,
            disposedAt: new Date().toISOString(),
            disposedDate: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            expiryFormatted: item.expiry || formatDate(item.expiryRaw),
            displayLocation: getLocationName(item.location),
            disposalReason: `${formData.reason} - Disposed during replacement`,
            replacementRequestId,
          });
          localStorage.setItem("tia_disposed_items", JSON.stringify(disposed));
        } catch {
          /* ignore */
        }
      }
    }

    const replacementRequests = JSON.parse(
      localStorage.getItem("tia_replacement_requests") || "[]",
    );
    const newRequest = {
      id: replacementRequestId,
      itemId,
      itemName: formData.item,
      location: formData.location,
      reason: formData.reason,
      urgency: formData.urgency,
      replaceQty: replaceQty,
      disposedQty: disposedQty,
      remainingQty: disposedQty > 0 ? (inventoryItems.find((i) => i.id === itemId)?.qty || 0) - disposedQty : (inventoryItems.find((i) => i.id === itemId)?.qty || 0),
      substitute: formData.useSubstitute ? formData.substitute : null,
      substituteNDC: formData.useSubstitute ? formData.substituteNDC : null,
      therapeuticEq: formData.useSubstitute ? formData.therapeuticEq : null,
      supplier: formData.supplier,
      unitCost: parseFloat(formData.unitCost) || 0,
      notes: formData.notes,
      status: "Pending",
      createdAt: new Date().toISOString(),
      poId: raisePO ? poNumber : null,
    };
    replacementRequests.push(newRequest);
    localStorage.setItem(
      "tia_replacement_requests",
      JSON.stringify(replacementRequests),
    );

    if (raisePO) {
      const existingPOs = JSON.parse(
        localStorage.getItem("purchase_orders_data") || "[]",
      );

      const itemNameClean = formData.item.split(" — ")[0];
      const unitCost = parseFloat(formData.unitCost) || 0;
      const qty = parseInt(formData.replaceQty, 10) || 1;
      const supplierMap = {
        "MedSupply Co.": "MedSupply Co.",
        PharmaDirect: "PharmaDirect",
        GlobalMed: "GlobalMed",
        "HealthCore Ltd.": "HealthCore Ltd.",
        "BioPharm Inc.": "BioPharm Inc.",
        "Select...": "—",
      };
      const supplierLabel = supplierMap[formData.supplier] || formData.supplier;

      const newPO = {
        id: poNumber,
        indentId: "—",
        quotRef: "—",
        supplier: supplierLabel,
        location: formData.location || "Main Acute Care Hospital",
        lines: 1,
        total: unitCost * qty,
        createdBy: "System (Expiry)",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        delivery: "—",
        priority: formData.urgency.startsWith("Critical") ? "Urgent" : "Normal",
        status: "Pending",
        fromExpiry: true,
        fromExpiryItemId: itemId,
        fromExpiryItemName: itemNameClean,
        fromExpiryReason: formData.reason,
        replacementRequestId,
        lineItems: [
          {
            description:
              formData.useSubstitute && formData.substitute
                ? `${formData.substitute} [Substitute for ${itemNameClean}]`
                : `${itemNameClean} — Replacement (${formData.reason})`,
            quantity: qty,
            unitCost,
            total: unitCost * qty,
          },
        ],
      };

      existingPOs.unshift(newPO);
      localStorage.setItem("purchase_orders_data", JSON.stringify(existingPOs));

      const rpos = getReplacementPOs();
      rpos.push({
        itemId,
        poId: poNumber,
        status: "Active",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(REPLACEMENT_POS_KEY, JSON.stringify(rpos));

      setReplaceTarget(null);
      const disposedQtyMsg = disposedQty > 0 ? `Disposed: ${disposedQty} qty. ` : "";
      setSnackbar({
        open: true,
        message: `${disposedQtyMsg}Replacement request created${raisePO ? `. PO ${poNumber} generated.` : "."}`,
        severity: "success",
      });

      if (raisePO) {
        setTimeout(() => {
          navigate("/admin/purchase-orders", {
            state: { highlightPO: poNumber },
          });
        }, 800);
      }
    } else {
      setReplaceTarget(null);
      const disposedQtyMsg = disposedQty > 0 ? `Disposed: ${disposedQty} qty. ` : "";
      setSnackbar({
        open: true,
        message: `${disposedQtyMsg}Replacement request saved.`,
        severity: "success",
      });
    }
  };

  const handleExport = () => {
    const headers = [
      "Item",
      "Location",
      "Lot #",
      "QTY",
      "Expiry Date",
      "Days Left",
      "Status",
      "In PO",
    ];
    const rows = filteredData.map((r) => [
      r.name,
      r.displayLocation,
      r.lot || "—",
      r.qty,
      r.expiryFormatted,
      r.days === null
        ? "—"
        : r.days < 0
          ? `${Math.abs(r.days)}d ago`
          : `${r.days}d`,
      r.status,
      r.inPO ? r.poId : "No",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "expiry_tracking.csv";
    a.click();
  };

  const daysDisplay = (days) =>
    days === null
      ? { label: "—", color: "#6b7280", bg: "#f3f4f6" }
      : days < 0
        ? { label: `${Math.abs(days)}d ago`, color: "#ef4444", bg: "#fee2e2" }
        : days <= 30
          ? { label: `${days}d`, color: "#ea580c", bg: "#fff7ed" }
          : days <= 60
            ? { label: `${days}d`, color: "#d97706", bg: "#fef3c7" }
            : { label: `${days}d`, color: "#16a34a", bg: "#dcfce7" };

  const statusChip = (status, inPO, poId) => {
    if (inPO)
      return {
        label: `In PO · ${poId}`,
        bg: "#eff6ff",
        color: "#2563eb",
        border: "#bfdbfe",
      };
    return status === "Expired"
      ? { label: "Expired", bg: "#fee2e2", color: "#ef4444", border: "#fecaca" }
      : status === "Expiring Soon"
        ? {
            label: "Expiring Soon",
            bg: "#fef9c3",
            color: "#d97706",
            border: "#fde68a",
          }
        : { label: "OK", bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" };
  };

  const statCards = [
    {
      label: "Expired",
      value: expired.length,
      sub: "Must dispose immediately",
      iconBg: "#ef4444",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      label: "Expiring ≤ 60 Days",
      value: expiringSoon.length,
      sub: "Plan replacement now",
      iconBg: "#f59e0b",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "OK",
      value: ok.length,
      sub: "No immediate concern",
      iconBg: "#10b981",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: "In PO",
      value: inPOCount,
      sub: "Replacement PO raised",
      iconBg: "#2563eb",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
  ];

  return (
    <Box>
      {replaceTarget && (
        <ReplaceModal
          prefill={replaceTarget}
          onClose={() => setReplaceTarget(null)}
          onSubmit={handleReplaceSubmit}
        />
      )}
      {disposeTarget && (
        <DisposeModal
          item={disposeTarget}
          onClose={() => setDisposeTarget(null)}
          onConfirm={handleDispose}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: "8px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "16px",
        }}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
          Expiry Tracking
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Search field — rectangular */}
          <TextField
            size="small"
            placeholder="Search item, lot, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ fontSize: 16, color: "#9ca3af", mr: 0.5 }} />
              ),
            }}
            sx={{
              minWidth: 210,
              "& .MuiOutlinedInput-root": {
                fontSize: 13,
                borderRadius: "8px",
                background: "#fff",
                "& fieldset": { borderColor: "#e5e7eb" },
                "&:hover fieldset": { borderColor: "#015DFF" },
                "&.Mui-focused fieldset": { borderColor: "#015DFF" },
              },
            }}
          />

          {/* Status filter dropdown — pill/rounded like StockIssue */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                fontSize: 13,
                borderRadius: "20px",
                background: "#fff",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb", borderWidth: "1px" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
              }}
            >
              <MenuItem value="All Statuses">All Statuses</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
              <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
              <MenuItem value="In PO">In PO</MenuItem>
              <MenuItem value="OK">OK</MenuItem>
            </Select>
          </FormControl>

          <Button
            onClick={handleExport}
            startIcon={
              <DownloadOutlinedIcon sx={{ fontSize: "14px !important" }} />
            }
            variant="outlined"
            sx={btnOutlined}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Stat Cards — matches PurchaseOrders StatCard exactly */}
      <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 0.75, md: 1 }, mb: { xs: 0.875, sm: 1.125, md: 1.375 }, flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {statCards.map((s) => (
          <Box
            key={s.label}
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
                bgcolor: s.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.icon}
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
                {s.label}
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
                  {s.value}
                </Typography>
                {s.sub && (
                  <Typography
                    sx={{
                      fontSize: { xs: 9, sm: 10, md: 11 },
                      fontWeight: 500,
                      color: "#6b7280",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.sub}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Empty State */}
      {enriched.length === 0 && (
        <Box
          sx={{
            py: "60px",
            textAlign: "center",
            background: "#f9fafb",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
          }}
        >
          <InventoryIcon sx={{ fontSize: 40, color: "#d1d5db", mb: "10px" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            No items with expiry dates
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af", mt: "4px" }}>
            Add inventory items with expiry dates to track them here.
          </Typography>
        </Box>
      )}

      {/* Table */}
      {enriched.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: "1px solid #f0f0f0",
            overflowX: "auto",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <Table sx={{ minWidth: 800, width: "100%" }}>
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <TableHead>
              <TableRow sx={{ background: "#EBF1FE" }}>
                {["Item", "Location", "Lot #", "Qty", "Expiry Date", "Days Left", "Status", "Action"].map((h) => (
                  <TableCell
                    key={h}
                    align={h === "Qty" ? "center" : "left"}
                    sx={{
                      fontWeight: 600,
                      fontSize: 11,
                      color: "#373B4D",
                      letterSpacing: "0.04em",
                      py: "11px",
                      px: "14px",
                      borderBottom: "1px solid #f3f4f6",
                      borderRight: "1px solid #BED3FC",
                      bgcolor: "#EBF1FE",
                      "&:last-child": { borderRight: "none" },
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    No records match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const dl = daysDisplay(row.days);
                  const sc = statusChip(row.status, row.inPO, row.poId);
                  const lc = getLocationColor(row.location);
                  const isExpired = row.status === "Expired";
                  const locationTooltip = getLocationTooltip(row.location);
                  const displayLocation = row.displayLocation;

                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        background: isExpired
                          ? "#fff9f9"
                          : row.status === "Expiring Soon"
                            ? "#fffdf5"
                            : "#fff",
                        "&:hover td": { bgcolor: "#fafafa" },
                        "& td": { borderBottom: "1px solid #f3f4f6", py: "12px", px: "14px" },
                        "&:last-child td": { borderBottom: "none" },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                          {row.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={locationTooltip} arrow placement="top">
                          <Chip
                            label={displayLocation}
                            size="small"
                            sx={{
                              bgcolor: lc.bg,
                              color: lc.color,
                              fontWeight: 600,
                              fontSize: 11,
                              height: 22,
                              borderRadius: "6px",
                              cursor: "pointer",
                              "&:hover": { opacity: 0.85 },
                              "& .MuiChip-label": { px: 1.5 },
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 12, color: "#374151" }}>
                          {row.lot || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                          {row.qty}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isExpired
                              ? "#ef4444"
                              : row.days !== null && row.days <= 60
                                ? "#d97706"
                                : "#374151",
                            textDecoration: isExpired ? "line-through" : "none",
                          }}
                        >
                          {row.expiryFormatted}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={dl.label}
                          size="small"
                          sx={{
                            bgcolor: dl.bg,
                            color: dl.color,
                            fontWeight: 600,
                            fontSize: 11,
                            height: 22,
                            borderRadius: "5px",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sc.label}
                          size="small"
                          variant="outlined"
                          icon={
                            row.inPO ? (
                              <ShoppingCartIcon style={{ fontSize: 12, color: "#2563eb" }} />
                            ) : undefined
                          }
                          sx={{
                            bgcolor: sc.bg,
                            color: sc.color,
                            borderColor: sc.border,
                            fontWeight: 600,
                            fontSize: 11,
                            height: 22,
                            borderRadius: "5px",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.75 }}>
                          {isExpired && (
                            <Button
                              onClick={() => setDisposeTarget(row)}
                              size="small"
                              variant="outlined"
                              sx={{
                                textTransform: "none",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#ef4444",
                                borderColor: "#fecaca",
                                borderRadius: "6px",
                                px: 1.5,
                                py: 0.5,
                                minWidth: 0,
                                "&:hover": {
                                  bgcolor: "#fef2f2",
                                  borderColor: "#ef4444",
                                },
                              }}
                            >
                              Dispose
                            </Button>
                          )}
                          {!row.inPO ? (
                            <Tooltip
                              title={
                                !can.replacementItems
                                  ? "You don't have permission to raise replacements"
                                  : ""
                              }
                            >
                              <span>
                                <Button
                                  onClick={() => setReplaceTarget(row)}
                                  size="small"
                                  disabled={!can.replacementItems}
                                  startIcon={
                                    <SyncAltOutlinedIcon sx={{ fontSize: "12px !important" }} />
                                  }
                                  sx={{
                                    textTransform: "none",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: can.replacementItems ? "#015DFF" : "#9ca3af",
                                    bgcolor: can.replacementItems ? "#EFF4FF" : "#f3f4f6",
                                    border: `1.5px solid ${can.replacementItems ? "#015DFF" : "#d1d5db"}`,
                                    borderRadius: "6px",
                                    px: 1.5,
                                    py: 0.5,
                                    minWidth: 0,
                                    "& .MuiButton-startIcon": { mr: 0.5 },
                                    "&:hover": {
                                      bgcolor: can.replacementItems ? "#dbeafe" : "#f3f4f6",
                                      borderColor: can.replacementItems ? "#015DFF" : "#d1d5db",
                                    },
                                    "&.Mui-disabled": {
                                      color: "#9ca3af",
                                      bgcolor: "#f3f4f6",
                                      borderColor: "#d1d5db",
                                    },
                                  }}
                                >
                                  Replace
                                </Button>
                              </span>
                            </Tooltip>
                          ) : (
                            <Button
                              onClick={() =>
                                navigate("/admin/purchase-orders", {
                                  state: { highlightPO: row.poId },
                                })
                              }
                              size="small"
                              startIcon={<ShoppingCartIcon sx={{ fontSize: "12px !important" }} />}
                              sx={{
                                textTransform: "none",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#2563eb",
                                bgcolor: "#eff6ff",
                                border: "1.5px solid #bfdbfe",
                                borderRadius: "6px",
                                px: 1.5,
                                py: 0.5,
                                minWidth: 0,
                                "& .MuiButton-startIcon": { mr: 0.5 },
                                "&:hover": {
                                  bgcolor: "#dbeafe",
                                  borderColor: "#2563eb",
                                },
                              }}
                            >
                              View PO
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Pagination — outside table, same as StockIssue */}
      {enriched.length > 0 && filteredData.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            px: 2,
            py: 1.5,
            borderTop: "1px solid #f0f0f0",
          }}
        >
         
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            shape="rounded"
            size="small"
            sx={{
              "& .MuiPaginationItem-root": {
                fontSize: "11px",
                fontWeight: 500,
                borderRadius: "6px",
                minWidth: "28px",
                height: "28px",
              },
              "& .Mui-selected": {
                bgcolor: "#015DFF !important",
                color: "#fff !important",
                "&:hover": {
                  bgcolor: "#0147CC !important",
                },
              },
              "& .MuiIconButton-root": {
                minWidth: "28px",
                height: "28px",
                fontSize: "16px",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}