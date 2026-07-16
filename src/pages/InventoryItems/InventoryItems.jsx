import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/Authcontext";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Tooltip,
  Dialog,
  DialogContent,
  Snackbar,
  Alert,
  Divider,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MedicationIcon from "@mui/icons-material/Medication";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import ScienceIcon from "@mui/icons-material/Science";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import BiotechIcon from "@mui/icons-material/Biotech";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import HealingIcon from "@mui/icons-material/Healing";
import DevicesIcon from "@mui/icons-material/Devices";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import PsychologyIcon from "@mui/icons-material/Psychology";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InventoryIcon from "@mui/icons-material/Inventory";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BadgeIcon from "@mui/icons-material/Badge";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DownloadIcon from "@mui/icons-material/Download";

import IssuestockModal from "./Issuestockmodal";
import { useInventory } from "../../contexts/InventoryContext";
import { usePermissions } from "../../hooks/usePermissions";
import { getLocations, getDepartments } from "../../utils/locationUtils";

import CreateTransferModal from "./Createtransfermodal";

const EXPIRY_SOON_DAYS = 30;
const ITEMS_PER_PAGE = 6;

const ITEM_TYPE_CATALOG = {
  "Pharmaceuticals (Drugs)": {
    code: "IT-PHAR",
    icon: <MedicationIcon sx={{ fontSize: 17 }} />,
    bg: "#ede9fe",
    color: "#7c3aed",
  },
  Consumables: {
    code: "IT-CONS",
    icon: <HealthAndSafetyIcon sx={{ fontSize: 17 }} />,
    bg: "#dcfce7",
    color: "#16a34a",
  },
  "Medical Devices": {
    code: "IT-MDEV",
    icon: <MedicalServicesIcon sx={{ fontSize: 17 }} />,
    bg: "#fef3c7",
    color: "#d97706",
  },
  "Assets (Equipment/Machines)": {
    code: "IT-ASST",
    icon: <DevicesIcon sx={{ fontSize: 17 }} />,
    bg: "#f1f5f9",
    color: "#475569",
  },
  "Lab Reagents & Diagnostics": {
    code: "IT-LABS",
    icon: <ScienceIcon sx={{ fontSize: 17 }} />,
    bg: "#e0f2fe",
    color: "#0284c7",
  },
  "Housekeeping & Sanitation": {
    code: "IT-HSKP",
    icon: <HealthAndSafetyIcon sx={{ fontSize: 17 }} />,
    bg: "#dcfce7",
    color: "#16a34a",
  },
  "Maintenance Spares (MRO)": {
    code: "IT-MRO",
    icon: <BiotechIcon sx={{ fontSize: 17 }} />,
    bg: "#e0f2fe",
    color: "#0284c7",
  },
  "Stationery / Office Supplies": {
    code: "IT-STAT",
    icon: <InventoryIcon sx={{ fontSize: 17 }} />,
    bg: "#f3f4f6",
    color: "#6b7280",
  },
};

const STATUS_STYLES = {
  success: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  warning: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  error: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  info: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
};

const MANUFACTURERS = [
  "Roche Diagnostics",
  "B. Braun",
  "GE HealthCare",
  "Philips",
  "Cardinal Health",
  "Siemens Healthineers",
  "Baxter",
  "McKesson",
  "BD",
];

function getDaysLeft(expiryRaw) {
  if (!expiryRaw) return null;
  const d = expiryRaw instanceof Date ? expiryRaw : new Date(expiryRaw);
  return Math.round((d - new Date()) / 86400000);
}

function isExpiringSoon(expiryRaw) {
  const days = getDaysLeft(expiryRaw);
  return days !== null && days >= 0 && days <= EXPIRY_SOON_DAYS;
}


function deduplicateItems(items) {
  const map = new Map();

  for (const item of items) {
    const key = (item.name || "").toLowerCase().trim();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        totalQty: item.qty ?? 0,
        totalPar: item.par ?? 0,
        nearestExpiryRaw: item.expiryRaw || null,
        nearestExpiry: item.expiry || null,
        allRows: [item],
        locationCount: item.location ? 1 : 0,
        departmentCount: item.department ? 1 : 0,
        _seenLocations: new Set(item.location ? [item.location] : []),
        _seenDepartments: new Set(item.department ? [item.department] : []),
      });
    } else {
      const existing = map.get(key);

      existing.totalQty += item.qty ?? 0;
      existing.totalPar += item.par ?? 0;

      if (item.expiryRaw) {
        const d =
          item.expiryRaw instanceof Date ? item.expiryRaw : new Date(item.expiryRaw);
        if (!existing.nearestExpiryRaw) {
          existing.nearestExpiryRaw = d;
          existing.nearestExpiry = item.expiry;
        } else {
          const ed =
            existing.nearestExpiryRaw instanceof Date
              ? existing.nearestExpiryRaw
              : new Date(existing.nearestExpiryRaw);
          if (d < ed) {
            existing.nearestExpiryRaw = d;
            existing.nearestExpiry = item.expiry;
          }
        }
      }

      if (item.location && !existing._seenLocations.has(item.location)) {
        existing._seenLocations.add(item.location);
        existing.locationCount += 1;
      }
      if (item.department && !existing._seenDepartments.has(item.department)) {
        existing._seenDepartments.add(item.department);
        existing.departmentCount += 1;
      }

      existing.allRows.push(item);
    }
  }

  return Array.from(map.values()).map(
    ({ _seenLocations, _seenDepartments, ...rest }) => rest
  );
}

function ItemTypeTile({ itemType, size = 34 }) {
  const cfg = ITEM_TYPE_CATALOG[itemType] || {
    icon: <MedicationIcon sx={{ fontSize: 17 }} />,
    bg: "#f3f4f6",
    color: "#6b7280",
  };
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "8px",
        background: cfg.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: cfg.color,
        flexShrink: 0,
      }}
    >
      {cfg.icon}
    </Box>
  );
}

function StatusChip({ label, color }) {
  const s = STATUS_STYLES[color] || STATUS_STYLES.info;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: "8px",
        py: "2px",
        borderRadius: "6px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        fontSize: 11,
        fontWeight: 600,
        color: s.color,
        whiteSpace: "nowrap",
        lineHeight: "18px",
      }}
    >
      {label}
    </Box>
  );
}

function InfoCard({ label, value, mono = false, chip = false, chipColor, chipBg, chipBorder }) {
  return (
    <Box sx={{ background: "#f9fafb", borderRadius: "8px", p: "9px 12px", border: "1px solid #f0f0f0" }}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", mb: "3px" }}>
        {label}
      </Typography>
      {chip ? (
        <Box sx={{ display: "inline-block", px: "7px", py: "1px", borderRadius: "5px", background: chipBg, border: `1px solid ${chipBorder}`, fontSize: 12, fontWeight: 600, color: chipColor }}>
          {value}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: mono ? "monospace" : "inherit" }}>
          {value || "—"}
        </Typography>
      )}
    </Box>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#6366f1", letterSpacing: "0.07em", textTransform: "uppercase", mb: "10px" }}>
      {children}
    </Typography>
  );
}


function ViewItemModal({ open, item, onClose }) {
  const { getItemGrnHistory } = useInventory();
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (open) {
      setLocations(getLocations());
      setDepartments(getDepartments());
    }
  }, [open]);

  useEffect(() => {
    const onL = () => { if (open) setLocations(getLocations()); };
    const onD = () => { if (open) setDepartments(getDepartments()); };
    window.addEventListener("locationsUpdated", onL);
    window.addEventListener("departmentsUpdated", onD);
    return () => {
      window.removeEventListener("locationsUpdated", onL);
      window.removeEventListener("departmentsUpdated", onD);
    };
  }, [open]);

  if (!item) return null;

  // allRows is guaranteed by deduplicateItems; fall back gracefully for safety
  const allRows = item.allRows && item.allRows.length > 0 ? item.allRows : [item];
  const grnReceipts = getItemGrnHistory ? getItemGrnHistory(item.name) : [];
  const today = new Date();

  const expiryColor = (raw) => {
    if (!raw) return "#374151";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (d < today) return "#dc2626";
    return (d - today) / 86400000 <= 90 ? "#d97706" : "#16a34a";
  };

  const resolveLocation = (loc) => (loc && locations.includes(loc) ? loc : loc || (locations[0] || "Main Acute Care Hospital"));
  const resolveDepartment = (dept) => (dept && departments.includes(dept) ? dept : dept || (departments[0] || "Central Store"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      BackdropProps={{ sx: { backgroundColor: "transparent" } }}
      PaperProps={{
        sx: {
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          overflow: "hidden",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: "16px", pt: "12px", pb: "10px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <ItemTypeTile itemType={item.itemType || item.category} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{item.name}</Typography>
          <Typography sx={{ fontSize: 11, color: "#6b7280", mt: "1px" }}>
            Total stock:{" "}
            <strong style={{ color: "#111827" }}>{item.totalQty ?? item.qty ?? 0}</strong>
            {" "}across{" "}
            <strong style={{ color: "#111827" }}>{allRows.length}</strong>{" "}
            {allRows.length === 1 ? "entry" : "entries"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 28, height: 28, "&:hover": { background: "#f3f4f6" } }}>
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: "14px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "#f3f4f6", borderRadius: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: "4px", "&:hover": { background: "#9ca3af" } },
          scrollbarWidth: "thin",
          scrollbarColor: "#d1d5db #f3f4f6",
        }}
      >
        {/* Item Details */}
        <Box>
          <SectionLabel>Item Details</SectionLabel>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", mb: "8px" }}>
            <Box sx={{ background: "#f3f4f6", borderRadius: "8px", p: "9px 12px", border: "1px solid #e5e7eb", display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <BadgeIcon sx={{ fontSize: 16, color: "#6b7280", mt: "1px", flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", mb: "2px" }}>Item Code (NDC)</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{item.ndc || "—"}</Typography>
              </Box>
            </Box>
            <InfoCard label="Item Type" value={item.itemType || item.category || "—"} />
            <InfoCard label="Category" value={item.category || "—"} />
            <InfoCard label="Sub-category" value={item.subcategory || "—"} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            <InfoCard label="Lot no." value={item.lot || "—"} mono />
            <InfoCard label="Unit cost" value={`$${item.cost?.toFixed(2) || "0.00"}`} />
            <InfoCard label="Par level" value={String(item.par ?? "—")} />
            <InfoCard label="Manufacturer" value={item.manufacturer || "—"} />
          </Box>
        </Box>

        <Box>
          <SectionLabel>Stock Across Locations</SectionLabel>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", mb: "10px" }}>
            {allRows.map((locItem, idx) => {
              const soonFlag = isExpiringSoon(locItem.expiryRaw);
              const daysLeft = getDaysLeft(locItem.expiryRaw);
              return (
                <Box
                  key={locItem.id || idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    p: "12px",
                    borderRadius: "8px",
                    border: soonFlag ? "1px solid #fde68a" : "1px solid #f0f0f0",
                    background: soonFlag ? "#fffbeb" : "#fff",
                    "&:hover": { background: soonFlag ? "#fff3e0" : "#fafafa" },
                  }}
                >
                  <Box sx={{ px: "8px", py: "4px", borderRadius: "5px", fontSize: 11, fontWeight: 600, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ede9fe", whiteSpace: "nowrap", flexShrink: 0, minWidth: 140, textAlign: "center" }}>
                    {resolveLocation(locItem.location)}
                  </Box>
                  <Box sx={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280", background: "#f9fafb", px: "6px", py: "2px", borderRadius: "4px", border: "1px solid #e5e7eb", whiteSpace: "nowrap", flexShrink: 0, minWidth: 100 }}>
                    Lot: {locItem.lot || "—"}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "4px", px: "8px", py: "4px", borderRadius: "5px", background: locItem.qty < locItem.par ? "#fef2f2" : "#f0fdf4", border: `1px solid ${locItem.qty < locItem.par ? "#fecaca" : "#bbf7d0"}`, flexShrink: 0, whiteSpace: "nowrap" }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Qty:</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: locItem.qty < locItem.par ? "#dc2626" : "#16a34a" }}>{locItem.qty ?? "—"}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 100, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: soonFlag || locItem.expired ? 600 : 400, color: locItem.expired ? "#dc2626" : soonFlag ? "#d97706" : expiryColor(locItem.expiryRaw), textDecoration: locItem.expired ? "line-through" : "none", whiteSpace: "nowrap" }}>
                      {locItem.expiry || "—"}
                    </Typography>
                    {soonFlag && !locItem.expired && (
                      <Box sx={{ fontSize: 10, color: "#ea580c", mt: "2px" }}>{daysLeft} days left</Box>
                    )}
                  </Box>
                  <Box sx={{ flexShrink: 0, minWidth: 80 }}>
                    {locItem.status?.slice(0, 2).map((s) => (
                      <StatusChip key={s.label} label={s.label} color={s.color} />
                    ))}
                    {soonFlag && !locItem.expired && <StatusChip label="Expiring Soon" color="warning" />}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Stock Across Departments — same allRows source */}
        <Box>
          <SectionLabel>Stock Across Departments</SectionLabel>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", mb: "10px" }}>
            {allRows.map((deptItem, idx) => {
              const soonFlag = isExpiringSoon(deptItem.expiryRaw);
              const daysLeft = getDaysLeft(deptItem.expiryRaw);
              return (
                <Box
                  key={`dept-${deptItem.id || idx}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    p: "12px",
                    borderRadius: "8px",
                    border: soonFlag ? "1px solid #fde68a" : "1px solid #f0f0f0",
                    background: soonFlag ? "#fffbeb" : "#fff",
                    "&:hover": { background: soonFlag ? "#fff3e0" : "#fafafa" },
                  }}
                >
                  <Box sx={{ px: "8px", py: "4px", borderRadius: "5px", fontSize: 11, fontWeight: 600, background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", whiteSpace: "nowrap", flexShrink: 0, minWidth: 140, textAlign: "center" }}>
                    {resolveDepartment(deptItem.department)}
                  </Box>
                  <Box sx={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280", background: "#f9fafb", px: "6px", py: "2px", borderRadius: "4px", border: "1px solid #e5e7eb", whiteSpace: "nowrap", flexShrink: 0, minWidth: 100 }}>
                    Location: {deptItem.location || "—"}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "4px", px: "8px", py: "4px", borderRadius: "5px", background: deptItem.qty < deptItem.par ? "#fef2f2" : "#f0fdf4", border: `1px solid ${deptItem.qty < deptItem.par ? "#fecaca" : "#bbf7d0"}`, flexShrink: 0, whiteSpace: "nowrap" }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Qty:</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: deptItem.qty < deptItem.par ? "#dc2626" : "#16a34a" }}>{deptItem.qty ?? "—"}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 100, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: soonFlag || deptItem.expired ? 600 : 400, color: deptItem.expired ? "#dc2626" : soonFlag ? "#d97706" : expiryColor(deptItem.expiryRaw), textDecoration: deptItem.expired ? "line-through" : "none", whiteSpace: "nowrap" }}>
                      {deptItem.expiry || "—"}
                    </Typography>
                    {soonFlag && !deptItem.expired && (
                      <Box sx={{ fontSize: 10, color: "#ea580c", mt: "2px" }}>{daysLeft} days left</Box>
                    )}
                  </Box>
                  <Box sx={{ flexShrink: 0, minWidth: 80 }}>
                    {deptItem.status?.slice(0, 2).map((s) => (
                      <StatusChip key={s.label} label={s.label} color={s.color} />
                    ))}
                    {soonFlag && !deptItem.expired && <StatusChip label="Expiring Soon" color="warning" />}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* GRN History */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "10px" }}>
            <SectionLabel>GRN History</SectionLabel>
            {grnReceipts.length > 0 && (
              <Box sx={{ px: "7px", py: "1px", borderRadius: "5px", fontSize: 11, fontWeight: 600, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                {grnReceipts.length} receipt{grnReceipts.length !== 1 ? "s" : ""}
              </Box>
            )}
          </Box>
          {grnReceipts.length === 0 ? (
            <Box sx={{ py: "24px", textAlign: "center", background: "#f9fafb", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
              <InventoryIcon sx={{ fontSize: 28, color: "#d1d5db", mb: "6px" }} />
              <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>No GRN receipts recorded for this item yet.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {grnReceipts.slice(0, 5).map((grn) => {
                const isPartial = grn.qtyOrdered && grn.qtyReceived < grn.qtyOrdered;
                return (
                  <Box key={grn.id} sx={{ border: "1px solid #f0f0f0", borderRadius: "10px", overflow: "hidden" }}>
                    <Box sx={{ px: "12px", py: "8px", background: "#f9fafb", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <LocalShippingIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{grn.grnNo}</Typography>
                        <Box sx={{ px: "7px", py: "1px", borderRadius: "5px", fontSize: 11, fontWeight: 600, background: isPartial ? "#fffbeb" : "#f0fdf4", color: isPartial ? "#d97706" : "#16a34a", border: `1px solid ${isPartial ? "#fde68a" : "#bbf7d0"}` }}>
                          {isPartial ? "Partial" : "Received"}
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{grn.date}</Typography>
                    </Box>
                    <Box sx={{ px: "12px", py: "10px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
                      <Box>
                        <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Lot no.</Typography>
                        <Box sx={{ fontFamily: "monospace", fontSize: 11, color: "#374151", background: "#f3f4f6", px: "6px", py: "2px", borderRadius: "4px", border: "1px solid #e5e7eb", display: "inline-block", mt: "3px" }}>
                          {grn.lotNo || "—"}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Qty received</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mt: "3px" }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{grn.qtyReceived} {grn.uom || ""}</Typography>
                          {isPartial && <Typography sx={{ fontSize: 10, color: "#dc2626" }}>(ord. {grn.qtyOrdered})</Typography>}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Unit cost</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", mt: "3px" }}>${Number(grn.unitCost || 0).toFixed(2)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              {grnReceipts.length > 5 && (
                <Typography sx={{ fontSize: 11, color: "#9ca3af", textAlign: "center", mt: 1 }}>
                  + {grnReceipts.length - 5} more receipts
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({ open, item, onCancel, onConfirm, deleting }) {
  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" } }}
    >
      <Box sx={{ px: "24px", pt: "20px", pb: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DeleteOutlineIcon sx={{ fontSize: 20, color: "#dc2626" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Delete Item</Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>This action cannot be undone</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onCancel} disabled={deleting} sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30 }}>
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: "24px", py: "20px" }}>
        <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
          Are you sure you want to delete{" "}
          <span style={{ fontWeight: 700, color: "#111827" }}>{item?.name}</span>
          {item?.ndc && <span style={{ color: "#9ca3af" }}> ({item.ndc})</span>}? All associated records will be permanently removed.
        </Typography>
        {item && (
          <Box sx={{ mt: "16px", p: "12px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "10px" }}>
            <ItemTypeTile itemType={item.itemType || item.category} />
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{item.name}</Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                Total Qty: {item.totalQty ?? item.qty} · {item.itemType || item.category}
                {item.allRows?.length > 1 && ` · ${item.allRows.length} entries`}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ px: "24px", py: "16px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#fff" }}>
        <Button onClick={onCancel} disabled={deleting} sx={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "8px", px: "20px", py: "9px", border: "1px solid #e5e7eb", background: "#fff", "&:hover": { background: "#f9fafb" } }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={deleting}
          startIcon={
            deleting ? (
              <Box component="span" sx={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }} />
            ) : (
              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
            )
          }
          sx={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "none", borderRadius: "8px", px: "20px", py: "9px", background: "#dc2626", "&:hover": { background: "#b91c1c" }, "&.Mui-disabled": { opacity: 0.6, color: "#fff" } }}
        >
          {deleting ? "Deleting…" : "Delete Item"}
        </Button>
      </Box>
    </Dialog>
  );
}

const pillSelectSx = {
  fontSize: 13,
  fontWeight: 500,
  color: "#111827",
  height: 34,
  borderRadius: "17px",
  background: "#fff",
  "& .MuiSelect-select": {
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    height: "34px !important",
    minHeight: "unset !important",
  },
};

function ExpirySoonBadge({ daysLeft }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        px: "8px",
        py: "3px",
        borderRadius: "6px",
        background: "#fff7ed",
        border: "1.5px solid #fb923c",
        fontSize: 11,
        fontWeight: 700,
        color: "#ea580c",
        width: "fit-content",
        whiteSpace: "nowrap",
        userSelect: "none",
        pointerEvents: "none",
        animation: "expirySoonPulse 1.8s ease-in-out infinite",
        "@keyframes expirySoonPulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
      }}
    >
      <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: "#ea580c", flexShrink: 0 }} />
      {daysLeft}d left
    </Box>
  );
}

export default function InventoryItems() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { items: contextItems, deleteItem: contextDeleteItem } = useInventory();
  const { can } = usePermissions();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [allItemTypes, setAllItemTypes] = useState(() => {
    try {
      const saved = localStorage.getItem("tia_itypes_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((t) => t.label || t);
      }
    } catch {}
    return Object.keys(ITEM_TYPE_CATALOG);
  });

  useEffect(() => {
    const onStorage = () => {
      try {
        const s = localStorage.getItem("tia_itypes_v1");
        if (s) {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) setAllItemTypes(parsed.map((t) => t.label || t));
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("categoriesUpdated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("categoriesUpdated", onStorage);
    };
  }, []);

  useEffect(() => {
    if (contextItems) setInventoryItems(contextItems);
    setIsLoading(false);
  }, [contextItems]);

  useEffect(() => {
    const handleInventoryUpdate = (e) => {
      if (e.detail && e.detail.items) setInventoryItems(e.detail.items);
    };
    const handleStorageChange = (e) => {
      if (e.key === "tia_inventory") {
        try {
          const newItems = JSON.parse(e.newValue);
          if (newItems && Array.isArray(newItems)) {
            setInventoryItems(
              newItems.map((item) => ({
                ...item,
                expiryRaw: item.expiryRaw ? new Date(item.expiryRaw) : null,
              }))
            );
          }
        } catch (err) {
          console.error("Error parsing storage change", err);
        }
      }
    };
    window.addEventListener("inventoryUpdated", handleInventoryUpdate);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const getManufacturer = () => MANUFACTURERS[Math.floor(Math.random() * MANUFACTURERS.length)];

  const enhancedInventoryItems = inventoryItems.map((item) => ({
    ...item,
    manufacturer: item.manufacturer || getManufacturer(),
  }));

  const deduplicatedItems = deduplicateItems(enhancedInventoryItems);

 
  const handleLocalDeleteItem = (dedupRow) => {
    const idsToDelete = dedupRow.allRows
      ? dedupRow.allRows.map((r) => r.id)
      : [dedupRow.id];

    if (contextDeleteItem) {
      idsToDelete.forEach((id) => contextDeleteItem(id));
    }

    const remaining = deduplicatedItems.filter((d) => d.id !== dedupRow.id);
    const newTotalPages = Math.ceil(remaining.length / ITEMS_PER_PAGE);
    if (currentPage > newTotalPages && newTotalPages > 0) setCurrentPage(newTotalPages);
    else if (newTotalPages === 0) setCurrentPage(1);
  };

  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("All Item Types");
  const [filter, setFilter] = useState("All");

  const LOCATIONS = [
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

  const [issueModal, setIssueModal] = useState({ open: false, item: null });
  const [transferModal, setTransferModal] = useState({ open: false, item: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [viewModal, setViewModal] = useState({ open: false, item: null });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const today = new Date();

  const expiringSoonCount = deduplicatedItems.filter((item) =>
    isExpiringSoon(item.nearestExpiryRaw ?? item.expiryRaw)
  ).length;

  const getLocationDisplay = (loc) => {
    if (LOCATIONS.includes(loc)) return loc;
    return "Main Acute Care Hospital";
  };

  const filtered = deduplicatedItems.filter((item) => {
    const isAdminOrSuper =
      currentUser?.role === "admin" || currentUser?.role === "location_manager_super";

    let matchesLocation = true;
    if (!isAdminOrSuper && currentUser) {
      const { locationName: uln, locationCode: ulc } = currentUser;
      // Match if ANY of the underlying rows belong to this user's location
      matchesLocation = (item.allRows || [item]).some((r) => {
        const loc = r.locationName || r.location || r.locationCode;
        return loc === uln || loc === ulc || r.location === uln || r.locationCode === ulc;
      });
    }

    if (!matchesLocation) return false;

    const matchSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      (item.ndc && item.ndc.toLowerCase().includes(search.toLowerCase()));

    const matchItemType =
      itemType === "All Item Types" ||
      (item.itemType || item.category) === itemType;

    const nearestExpiry = item.nearestExpiryRaw ?? item.expiryRaw;

    const matchFilter =
      filter === "All" ||
      (filter === "Low Stock" && (item.totalQty ?? item.qty) < (item.totalPar ?? item.par)) ||
      (filter === "Expiring Soon" && isExpiringSoon(nearestExpiry)) ||
      (filter === "Expiring" &&
        nearestExpiry &&
        (item.expired || (nearestExpiry - today) / 86400000 <= 60));

    return matchSearch && matchItemType && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
    document.querySelector(".MuiTableContainer-root")?.scrollTo({ top: 0 });
  };

  useEffect(() => { setCurrentPage(1); }, [search, itemType, filter, deduplicatedItems.length]);

  const openDeleteDialog = (item) => setDeleteDialog({ open: true, item });
  const closeDeleteDialog = () => { if (!deleting) setDeleteDialog({ open: false, item: null }); };

  const handleIssued = () => { setIssueModal({ open: false, item: null }); navigate("/admin/stock-issue"); };
  const handleIssuePending = () => { setIssueModal({ open: false, item: null }); navigate("/admin/stock-issue"); };
  const handleTransferSubmitted = () => { setTransferModal({ open: false, item: null }); navigate("/admin/transfers"); };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await new Promise((res) => setTimeout(res, 900));
      const name = deleteDialog.item.name;
      handleLocalDeleteItem(deleteDialog.item);
      setDeleteDialog({ open: false, item: null });
      setToast({ open: true, message: `"${name}" has been deleted.`, severity: "success" });
    } catch {
      setToast({ open: true, message: "Failed to delete item. Please try again.", severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const COLS = [
    "Item",
    "Item Code (NDC)",
    "Item Type",
    "Expiry",
    "Status",
    "Base UOM",
    "Total Qty",
    "Cost",
    "Manufacturer",
    "Actions",
  ];

  const handleExportToCSV = () => {
    const exportColumns = [
      "Item Name", "Item Code (NDC)", "Item Type", "Category", "Sub-category",
      "Lot No.", "UOM", "Total Quantity", "Par Level", "Unit Cost",
      "Manufacturer", "Location", "Department", "Nearest Expiry", "Status",
    ];
    const exportData = filtered.map((item) => ({
      "Item Name": item.name || "",
      "Item Code (NDC)": item.ndc || "",
      "Item Type": item.itemType || item.category || "",
      "Category": item.category || "",
      "Sub-category": item.subcategory || "",
      "Lot No.": item.lot || "",
      "UOM": item.uom || "",
      "Total Quantity": item.totalQty ?? item.qty ?? 0,
      "Par Level": item.par || "",
      "Unit Cost": `$${item.cost?.toFixed(2) || "0.00"}`,
      "Manufacturer": item.manufacturer || "",
      "Location": getLocationDisplay(item.location),
      "Department": item.department || "",
      "Nearest Expiry": item.nearestExpiry || item.expiry || "",
      "Status":
        item.status?.map((s) => s.label).join(", ") ||
        (isExpiringSoon(item.nearestExpiryRaw ?? item.expiryRaw) ? "Expiring Soon" : "Active"),
    }));

    const headers = exportColumns.join(",");
    const rows = exportData.map((row) =>
      exportColumns
        .map((col) => {
          let value = row[col];
          if (typeof value === "string" && (value.includes(",") || value.includes("\n") || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ open: true, message: `Exported ${filtered.length} items to CSV`, severity: "success" });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Typography>Loading inventory...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: { xs: 1.5, sm: 2, md: 2.25 }, flexShrink: 0, flexWrap: { xs: "wrap", sm: "nowrap" }, gap: { xs: 1, sm: 1.5 } }}>
        <Typography sx={{ fontSize: { xs: 18, sm: 20, md: 22 }, fontWeight: 700, color: "#111827" }}>
          Inventory Items
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            startIcon={<DownloadIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
            onClick={handleExportToCSV}
            disabled={filtered.length === 0}
            sx={{ background: "#fff", color: "#015DFF", borderRadius: "12px", height: { xs: 40, sm: 36, md: 34 }, px: { xs: 1.5, sm: 2 }, fontSize: { xs: 12, sm: 13 }, fontWeight: 600, textTransform: "none", border: "1px solid #015DFF", "&:hover": { background: "#f0f7ff" }, "&.Mui-disabled": { background: "#f5f5f5", color: "#bdbdbd", border: "1px solid #e0e0e0" } }}
          >
            Export
          </Button>
          <Button
            disabled={!can.addItem}
            startIcon={<AddIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
            onClick={() => navigate("/admin/inventory/add")}
            sx={{ background: "#015DFF", color: "#fff", borderRadius: "12px", height: { xs: 40, sm: 36, md: 34 }, px: { xs: 1.5, sm: 2 }, fontSize: { xs: 12, sm: 13 }, fontWeight: 600, textTransform: "none", boxShadow: "0 2px 8px rgba(1,93,255,0.22)", "&:hover": { background: !can.addItem ? "#015DFF" : "#0147CC" }, "&:disabled": { background: "#d1d5db", color: "#9ca3af", boxShadow: "none" } }}
            title={!can.addItem ? "You don't have permission to add items" : ""}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: { xs: 0.75, sm: 1, md: 1.25 }, alignItems: "center", flexWrap: "wrap", mb: { xs: 1, sm: 1.5, md: 2 }, flexShrink: 0 }}>
        <FormControl size="small">
          <Select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            sx={{ ...pillSelectSx, minWidth: { xs: 160, sm: 180, md: 200 }, fontSize: { xs: 12, sm: 13 } }}
          >
            <MenuItem value="All Item Types">All Item Types</MenuItem>
            {allItemTypes.map((type) => {
              const cfg = ITEM_TYPE_CATALOG[type];
              return (
                <MenuItem key={type} value={type}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {cfg && <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>}
                    {type}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="Search items or NDC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 }, color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": { fontSize: { xs: 12, sm: 13 }, height: { xs: 36, sm: 34 }, borderRadius: "17px", background: "#fff" },
            minWidth: { xs: 160, sm: 200, md: 220 },
          }}
        />
        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 0.75, md: 1 }, ml: { xs: 0, sm: "auto" }, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
          {[
            { label: "All", icon: null },
            { label: "Low Stock", icon: <WarningAmberIcon sx={{ fontSize: { xs: 12, sm: 13 } }} /> },
            { label: "Expiring Soon", icon: <AccessTimeIcon sx={{ fontSize: { xs: 12, sm: 13 } }} /> },
            { label: "Expiring", icon: <AccessTimeIcon sx={{ fontSize: { xs: 12, sm: 13 } }} /> },
          ].map(({ label, icon }) => (
            <Button
              key={label}
              size="small"
              onClick={() => setFilter(label)}
              startIcon={icon}
              sx={{
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "17px",
                height: { xs: 32, sm: 34 },
                px: { xs: 1, sm: 1.75 },
                background:
                  filter === label
                    ? label === "Low Stock" ? "#fff7ed"
                    : label === "Expiring Soon" ? "#fff7ed"
                    : label === "Expiring" ? "#eff6ff"
                    : "#015DFF"
                    : "#fff",
                color:
                  filter === label
                    ? label === "Low Stock" ? "#f97316"
                    : label === "Expiring Soon" ? "#ea580c"
                    : label === "Expiring" ? "#015DFF"
                    : "#fff"
                    : "#6b7280",
                border: "1px solid",
                borderColor:
                  filter === label
                    ? label === "Low Stock" ? "#fed7aa"
                    : label === "Expiring Soon" ? "#fb923c"
                    : label === "Expiring" ? "#bfdbfe"
                    : "transparent"
                    : "#e5e7eb",
              }}
            >
              {label}
              {label === "Expiring Soon" && expiringSoonCount > 0 && (
                <Box sx={{ ml: { xs: 0.25, sm: 0.5 }, display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: { xs: 16, sm: 18 }, height: { xs: 16, sm: 18 }, borderRadius: "9px", background: filter === label ? "#ea580c" : "#fb923c", color: "#fff", fontSize: { xs: 9, sm: 10 }, fontWeight: 700, px: "4px" }}>
                  {expiringSoonCount}
                </Box>
              )}
            </Button>
          ))}
        </Box>
      </Box>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden", position: "relative" }}>
        <TableContainer
          sx={{
            overflowX: "auto",
            maxWidth: "100%",
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-track": { background: "#f3f4f6", borderRadius: "4px" },
            "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: "4px", "&:hover": { background: "#9ca3af" } },
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db #f3f4f6",
          }}
        >
          <Table stickyHeader sx={{ minWidth: { xs: 1100, md: "100%" } }}>
            <TableHead>
              <TableRow>
                {COLS.map((col, i) => (
                  <TableCell
                    key={col}
                    sx={{
                      fontSize: { xs: 10, sm: 11 },
                      fontWeight: 700,
                      color: "#374151",
                      background: "#EBF1FE",
                      borderBottom: "1px solid #BED3FC",
                      borderRight: i < COLS.length - 1 ? "1px solid #BED3FC" : "none",
                      py: { xs: 1, sm: 1.25 },
                      px: { xs: 1, sm: 1.5 },
                      whiteSpace: "nowrap",
                      ...(col === "Item" && { position: "sticky", left: 0, zIndex: 3, background: "#EBF1FE", boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)" }),
                    }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.map((item, idx) => {
                const nearestExpiry = item.nearestExpiryRaw ?? item.expiryRaw;
                const daysLeft = getDaysLeft(nearestExpiry);
                const soonFlag = isExpiringSoon(nearestExpiry);
                const totalQty = item.totalQty ?? item.qty ?? 0;
                const totalPar = item.totalPar ?? item.par ?? 0;
                const isLowStock = totalQty < totalPar;
                const hasMultiple = (item.allRows?.length ?? 1) > 1;
                const rowBg = soonFlag ? "#fffbeb" : "#fff";
                const rowHoverBg = soonFlag ? "#fff3e0" : "#f8faff";
                const rowBorder = soonFlag
                  ? "1px solid #fde68a"
                  : idx < paginatedItems.length - 1
                  ? "1px solid #f3f4f6"
                  : "none";
                const displayItemType = item.itemType || item.category || "—";

                return (
                  <TableRow
                    key={item.id}
                    onClick={soonFlag ? () => navigate("/admin/expiry-tracking") : undefined}
                    sx={{
                      background: rowBg,
                      cursor: soonFlag ? "pointer" : "default",
                      "&:hover": { background: rowHoverBg },
                      "& td": {
                        borderBottom: rowBorder,
                        borderRight: "1px solid #f3f4f6",
                        py: { xs: 1, sm: 1.25 },
                        px: { xs: 1, sm: 1.5 },
                        fontSize: { xs: 11, sm: 12 },
                        "&:last-child": { borderRight: "none" },
                      },
                    }}
                  >
                    <TableCell sx={{ minWidth: 160, position: "sticky", left: 0, zIndex: 2, background: rowBg, boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <ItemTypeTile itemType={displayItemType} size={30} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                            {item.name}
                          </Typography>
                        
                        </Box>
                      </Box>
                    </TableCell>

                    {/* NDC */}
                    <TableCell sx={{ minWidth: 140 }}>
                      {item.ndc ? (
                        <Box sx={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", px: "7px", py: "2px", borderRadius: "5px", border: "1px solid #bbf7d0", display: "inline-block" }}>
                          {item.ndc}
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: "#d1d5db" }}>—</Typography>
                      )}
                    </TableCell>

                    {/* Item Type */}
                    <TableCell sx={{ minWidth: 160 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ItemTypeTile itemType={displayItemType} size={28} />
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{displayItemType}</Typography>
                          {item.category && item.category !== displayItemType && (
                            <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>{item.category}</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Expiry — nearest across all rows */}
                    <TableCell sx={{ minWidth: 140 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: item.expired || soonFlag ? 700 : 400,
                            color: item.expired ? "#dc2626" : soonFlag ? "#d97706" : "#374151",
                            textDecoration: item.expired ? "line-through" : "none",
                          }}
                        >
                          {item.nearestExpiry || item.expiry || "—"}
                        </Typography>
                        {soonFlag && <ExpirySoonBadge daysLeft={daysLeft} />}
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {soonFlag && (
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: "4px", px: "8px", py: "2px", borderRadius: "6px", background: "#fff7ed", border: "1.5px solid #fb923c", fontSize: 11, fontWeight: 600, color: "#ea580c" }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#ea580c" }} />
                            Expiring Soon
                          </Box>
                        )}
                        {item.status?.map((s) => (
                          <StatusChip key={s.label} label={s.label} color={s.color} />
                        ))}
                      </Box>
                    </TableCell>

                    {/* UOM */}
                    <TableCell sx={{ minWidth: 70 }}>
                      {item.uom ? (
                        <Chip label={item.uom} size="small" sx={{ fontSize: 10, fontWeight: 600, color: "#0284c7", background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: "5px", height: 18, "& .MuiChip-label": { px: "6px" } }} />
                      ) : (
                        <Typography sx={{ fontSize: 12, color: "#d1d5db" }}>—</Typography>
                      )}
                    </TableCell>

                    {/* Total Qty — summed across all rows */}
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: isLowStock ? "#dc2626" : "#111827" }}>
                          {totalQty}
                        </Typography>
                       
                      </Box>
                    </TableCell>

                    {/* Cost */}
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
                        ${item.cost?.toFixed(2)}
                      </Typography>
                    </TableCell>

                    {/* Manufacturer */}
                    <TableCell sx={{ minWidth: 130 }}>
                      {item.manufacturer ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <BusinessIcon sx={{ fontSize: 13, color: "#6b7280" }} />
                          <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
                            {item.manufacturer}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: "#d1d5db" }}>—</Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Box sx={{ display: "flex", gap: "3px" }}>
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, item }); }}
                            sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: 26, height: 26 }}
                          >
                            <VisibilityIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={!can.editItem ? "You don't have permission to edit items" : "Edit"}>
                          <span>
                            <IconButton
                              disabled={!can.editItem}
                              size="small"
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/inventory/add?id=${item.id}&edit=true`); }}
                              sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: 26, height: 26, "&.Mui-disabled": { opacity: 0.5 } }}
                            >
                              <EditIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={!can.createTransfer ? "You don't have permission to create transfers" : "Transfer"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setTransferModal({ open: true, item: item.name }); }}
                              disabled={!can.createTransfer}
                              sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: 26, height: 26, "&.Mui-disabled": { opacity: 0.5 } }}
                            >
                              <SwapHorizIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={!can.stockIssueRequest ? "You don't have permission to issue stock" : "Issue Stock"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setIssueModal({ open: true, item: item.name }); }}
                              disabled={!can.stockIssueRequest}
                              sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: 26, height: 26, "&.Mui-disabled": { opacity: 0.5 } }}
                            >
                              <AssignmentIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={!can.deleteItem ? "You don't have permission to delete items" : "Delete"}>
                          <span>
                            <IconButton
                              disabled={!can.deleteItem}
                              size="small"
                              onClick={(e) => { e.stopPropagation(); openDeleteDialog(item); }}
                              sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: 26, height: 26, "&.Mui-disabled": { opacity: 0.5 } }}
                            >
                              <DeleteIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}

              {paginatedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLS.length} align="center" sx={{ py: 7, color: "#9ca3af", fontSize: 13 }}>
                    No items found. Click "Add Item" to add your first inventory item.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {filtered.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "right", mt: 3, pt: 2, pb: 1 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            shape="rounded"
            size="small"
            siblingCount={1}
            boundaryCount={1}
            sx={{
              "& .MuiPaginationItem-root": { borderRadius: "5px", fontSize: 11, fontWeight: 500, minWidth: 28, height: 28, border: "1px solid #e5e7eb", color: "#374151", "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" } },
              "& .Mui-selected": { background: "#015DFF !important", color: "#fff", border: "1px solid #015DFF", "&:hover": { background: "#0147CC !important" } },
            }}
          />
        </Box>
      )}

      <ViewItemModal open={viewModal.open} item={viewModal.item} onClose={() => setViewModal({ open: false, item: null })} />
      <IssuestockModal open={issueModal.open} onClose={() => setIssueModal({ open: false, item: null })} prefillItem={issueModal.item} onIssued={handleIssued} onPending={handleIssuePending} />
      <CreateTransferModal open={transferModal.open} onClose={() => setTransferModal({ open: false, item: null })} prefillItem={transferModal.item} onSubmitted={handleTransferSubmitted} />
      <DeleteConfirmDialog open={deleteDialog.open} item={deleteDialog.item} onCancel={closeDeleteDialog} onConfirm={handleConfirmDelete} deleting={deleting} />

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} variant="filled" sx={{ fontSize: 13, borderRadius: "10px", minWidth: 280 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}