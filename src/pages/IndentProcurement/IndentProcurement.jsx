import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  GlobalStyles,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  FormControl,
  MenuItem,
  Select,
  Pagination,
  TextField,
  Grid,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { AccountCircle } from "@mui/icons-material";

import IndentProcurementModal from "./IndentProcurementModel";
import ItemApprovalModal from "./ItemApprovalModal";
import NewPO from "../PurchaseOrder/NewPO";
import { useInventory } from "../../contexts/InventoryContext";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../contexts/Authcontext";
import { useVendorManagement } from "../../contexts/VendorManagementContext";
import { getSupplierNames } from "../../utils/supplierUtils";
import { getUserLocation, locationMatches } from "../../utils/locationUtils";

// -- Helpers ----------------------------------------------------------------

const INDENT_TYPES = [
  "New Acquisition",
  "Stock Issue",
  "Stock Transfer",
 
];


const priorityColor = (p) =>
  ({
    Low:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    Medium:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    High:     { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    Critical: { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
    Emergency: { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
    Urgent:    { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  })[p] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  if (!d) return dateStr;
  return `${d}/${m}/${y}`;
};

const statusStyle = (s) => {
  if (s === "Approved")
    return { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" };
  if (s === "Partial Approved")
    return { bg: "#dbeafe", color: "#2563eb", border: "#93c5fd" };
  if (s === "PO Generated")
    return { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff" };
  if (s === "Partial PO")
    return { bg: "#fdf4ff", color: "#a21caf", border: "#f0abfc" };
  if (s === "Pending Approval")
    return { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" };
  if (s === "Rejected")
    return { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" };
  if (s === "In Transit")
    return { bg: "#dbeafe", color: "#2563eb", border: "#bfdbfe" };
  if (s === "Received")
    return { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" };
  if (s === "Completed")
    return { bg: "#d1d5db", color: "#374151", border: "#9ca3af" };
  if (s === "Partially Received")
    return { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" };
  if (s === "Partial Closed")
    return { bg: "#fed7aa", color: "#92400e", border: "#fdba74" };
  if (s === "Draft")
    return { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" };
};

const calcIndentStatus = (items) => {
  if (!items || items.length === 0) return "Pending Approval";
  const total = items.length;
  const approved = items.filter((i) => i.status === "Approved").length;
  const partialApproved = items.filter(
    (i) => i.status === "Partial Approved",
  ).length;
  const rejected = items.filter((i) => i.status === "Rejected").length;
  const inPO = items.filter((i) => i.status === "PO Generated").length;

  const activeItems = items.filter((i) => i.status !== "Rejected");

  const allFullyReceived = activeItems.every((i) => {
    const orderedQty = Number(i.orderedQty || 0);
    const receivedQty = Number(i.receivedQty || 0);
    return receivedQty >= orderedQty && orderedQty > 0;
  });

  const anyReceived = items.some((i) => Number(i.receivedQty || 0) > 0);

  const someFullyReceived = activeItems.some((i) => {
    const orderedQty = Number(i.orderedQty || 0);
    const receivedQty = Number(i.receivedQty || 0);
    return receivedQty >= orderedQty && orderedQty > 0;
  });

  const somePartiallyReceived = activeItems.some((i) => {
    const orderedQty = Number(i.orderedQty || 0);
    const receivedQty = Number(i.receivedQty || 0);
    return receivedQty > 0 && receivedQty < orderedQty;
  });

  const hasRejected = rejected > 0;
  const hasPartialApproved = partialApproved > 0;

  if (activeItems.length > 0 && allFullyReceived && anyReceived) {
    return "Completed";
  }

  if (anyReceived && !allFullyReceived && (someFullyReceived || somePartiallyReceived)) {
    return "Partially Received";
  }

  if ((hasRejected || hasPartialApproved) && anyReceived) {
    return "Partial Closed";
  }

  if (
    inPO > 0 &&
    approved === 0 &&
    partialApproved === 0 &&
    inPO + rejected === total
  )
    return "PO Generated";
  if (inPO > 0) return "Partial PO";
  if (approved === total) return "Approved";
  if (rejected === total) return "Rejected";
  if (approved + partialApproved > 0) return "Partial Approved";
  return "Pending Approval";
};

const getItemStats = (items = []) => {
  const total = items.length;
  const inPO = items.filter((i) => i.status === "PO Generated").length;
  const approved = items.filter((i) => i.status === "Approved").length;
  const partialApproved = items.filter(
    (i) => i.status === "Partial Approved",
  ).length;
  const rejected = items.filter((i) => i.status === "Rejected").length;
  const pending = total - approved - partialApproved - rejected - inPO;
  const balance = pending + partialApproved;
  return { total, approved, partialApproved, rejected, inPO, pending, balance };
};

const migrateItems = (items = []) =>
  items.map((it) => ({ ...it, status: it.status || "Pending" }));

const itemRowStyle = (s) => {
  if (s === "Approved")
    return {
      bg: "#f0fdf4",
      dot: "#16a34a",
      chip: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
    };
  if (s === "Partial Approved")
    return {
      bg: "#eff6ff",
      dot: "#2563eb",
      chip: { bg: "#dbeafe", color: "#2563eb", border: "#93c5fd" },
    };
  if (s === "Rejected")
    return {
      bg: "#fff5f5",
      dot: "#dc2626",
      chip: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
    };
  if (s === "PO Generated")
    return {
      bg: "#faf5ff",
      dot: "#7c3aed",
      chip: { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff" },
    };
  if (s === "Completed")
    return {
      bg: "#f0fdf4",
      dot: "#10b981",
      chip: { bg: "#d1fae5", color: "#059669", border: "#a7f3d0" },
    };
  return {
    bg: "#fffbeb",
    dot: "#ca8a04",
    chip: { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" },
  };
};

function ItemBreakdownModal({ open, onClose, indent }) {
  if (!indent) return null;
  const items = indent.lineItems || [];
  const stats = {
    total: items.length,
    approved: items.filter((i) => i.status === "Approved").length,
    partialApproved: items.filter((i) => i.status === "Partial Approved").length,
    rejected: items.filter((i) => i.status === "Rejected").length,
    pending: items.filter((i) => !i.status || i.status === "Pending").length,
    inPO: items.filter((i) => i.status === "PO Generated").length,
  };

  const summaryPills = [
    {
      label: `${stats.approved} Approved`,
      bg: "#dcfce7",
      color: "#16a34a",
      border: "#bbf7d0",
      show: stats.approved > 0,
    },
    {
      label: `${stats.partialApproved} Partial`,
      bg: "#dbeafe",
      color: "#2563eb",
      border: "#93c5fd",
      show: stats.partialApproved > 0,
    },
    {
      label: `${stats.rejected} Rejected`,
      bg: "#fee2e2",
      color: "#dc2626",
      border: "#fecaca",
      show: stats.rejected > 0,
    },
    {
      label: `${stats.pending} Pending`,
      bg: "#fef9c3",
      color: "#ca8a04",
      border: "#fde68a",
      show: stats.pending > 0,
    },
    {
      label: `${stats.inPO} PO Generated`,
      bg: "#f3e8ff",
      color: "#7c3aed",
      border: "#e9d5ff",
      show: stats.inPO > 0,
    },
  ].filter((p) => p.show);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth={false}
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
          maxHeight: "80vh",
          width: "auto",
          minWidth: "500px",
          maxWidth: "90vw",
          margin: "16px",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, sm: 2, md: 2.5 },
          pt: { xs: 1.25, sm: 1.5, md: 1.75 },
          pb: { xs: 1, sm: 1.25, md: 1.5 },
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, sm: 1, md: 1.5 },
          }}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 38, md: 38 },
              height: { xs: 36, sm: 38, md: 38 },
              borderRadius: "10px",
              bgcolor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ListAltOutlinedIcon
              sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, color: "#2563eb" }}
            />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 14, sm: 15, md: 16 },
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Item Breakdown — {indent.indentNo}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            width: { xs: 28, sm: 30, md: 30 },
            height: { xs: 28, sm: 30, md: 30 },
            "&:hover": { bgcolor: "#f3f4f6" },
            "&:focus": { outline: "none" },
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: 14, sm: 15, md: 15 } }} />
        </IconButton>
      </Box>

      {summaryPills.length > 0 && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2, md: 2.5 },
            py: { xs: 0.75, sm: 1, md: 1.25 },
            display: "flex",
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            flexWrap: "wrap",
            borderBottom: "1px solid #f3f4f6",
            bgcolor: "#fafafa",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: { xs: 0.25, sm: 0.5, md: 0.75 },
              px: { xs: 0.5, sm: 1, md: 1.25 },
              py: { xs: 0.25, sm: 0.375, md: 0.5 },
              borderRadius: "20px",
              bgcolor: "#f3f4f6",
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 10, sm: 11, md: 11 },
                fontWeight: 700,
                color: "#374151",
              }}
            >
              {stats.total} Total
            </Typography>
          </Box>
          {summaryPills.map((p) => (
            <Box
              key={p.label}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: { xs: 0.25, sm: 0.5, md: 0.75 },
                px: { xs: 0.5, sm: 1, md: 1.25 },
                py: { xs: 0.25, sm: 0.375, md: 0.5 },
                borderRadius: "20px",
                bgcolor: p.bg,
                border: `1px solid ${p.border}`,
              }}
            >
              <Box
                sx={{
                  width: { xs: 4, md: 6 },
                  height: { xs: 4, md: 6 },
                  borderRadius: "50%",
                  bgcolor: p.color,
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: 10, sm: 11, md: 11 },
                  fontWeight: 700,
                  color: p.color,
                }}
              >
                {p.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <DialogContent
        sx={{
          p: 0,
          overflowY: "auto",
          overflowX: "auto",
          maxHeight: "calc(80vh - 120px)",
          "&::-webkit-scrollbar": { width: "6px", height: "6px" },
          "&::-webkit-scrollbar-track": { background: "#f1f1f1", borderRadius: "3px" },
          "&::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
            borderRadius: "3px",
            "&:hover": { background: "#a8a8a8" },
          },
        }}
      >
        {items.length === 0 ? (
          <Box sx={{ py: { xs: 4, md: 6 }, textAlign: "center" }}>
            <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, color: "#9ca3af" }}>
              No items in this indent.
            </Typography>
          </Box>
        ) : (
          <Table size="small" sx={{ width: "100%", tableLayout: "auto" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                {["#", "ITEM NAME", "UOM", "REQ", "APPR", "ORD", "RCV"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontSize: { xs: 9, sm: 10, md: 10 },
                      fontWeight: 700,
                      color: "#9ca3af",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      py: { xs: 0.75, sm: 1, md: 1 },
                      px: { xs: 0.75, sm: 1, md: 1.25 },
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, i) => {
                const rs = itemRowStyle(item.status || "Pending");
                const reqQty = item.qtyReq || item.qty || "—";
                const appQty =
                  item.approvedQty != null
                    ? item.approvedQty
                    : item.status === "Approved"
                      ? reqQty
                      : item.status === "Rejected"
                        ? 0
                        : null;
                const eff = Number(item.approvedQty ?? item.qtyReq ?? item.qty ?? 0);
                const ord = Number(item.orderedQty || 0);
                const rcv = Number(item.receivedQty || 0);

                return (
                  <TableRow
                    key={item.id ?? i}
                    sx={{ bgcolor: rs.bg, "&:hover": { filter: "brightness(0.97)" } }}
                  >
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 }, width: "40px" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6b7280" }}>{i + 1}</Typography>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: rs.dot, flexShrink: 0 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                            {item.itemName || item.item || "—"}
                          </Typography>
                          {item.description && (
                            <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>
                              {item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 } }}>
                      <Typography sx={{ fontSize: 11, color: "#374151" }}>{item.uom || "—"}</Typography>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 }, textAlign: "center" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{reqQty}</Typography>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 }, textAlign: "center" }}>
                      {item.status === "Rejected" ? (
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>0</Typography>
                      ) : appQty == null ? (
                        <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>—</Typography>
                      ) : (
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{appQty}</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 }, textAlign: "center" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: ord > 0 ? "#7c3aed" : "#9ca3af" }}>{ord}</Typography>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 }, textAlign: "center" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: rcv > 0 ? "#16a34a" : "#9ca3af" }}>{rcv}</Typography>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 0.75 } }}>
                      <Chip
                        label={item.status || "Pending"}
                        size="small"
                        sx={{
                          bgcolor: rs.chip.bg,
                          color: rs.chip.color,
                          border: `1px solid ${rs.chip.border}`,
                          fontWeight: 600,
                          fontSize: 9,
                          height: 18,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      <Box
        sx={{
          px: { xs: 1.5, sm: 2, md: 2.5 },
          py: { xs: 1, sm: 1.125, md: 1.25 },
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          justifyContent: "flex-end",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            fontSize: { xs: 12, sm: 13, md: 13 },
            fontWeight: 600,
            color: "#374151",
            textTransform: "none",
            borderRadius: "8px",
            px: { xs: 1.25, sm: 1.5, md: 2.5 },
            py: { xs: 0.5, sm: 0.75, md: 1 },
            border: "1px solid #e5e7eb",
            bgcolor: "#fff",
            "&:hover": { bgcolor: "#f9fafb" },
          }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
}

// -- Stat Card Component ----------------------------------------------------

const StatCard = ({ label, count, sub, iconBg, iconEl }) => {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        px: { xs: 1, sm: 1.5, md: 2 },
        py: { xs: 0.75, sm: 1, md: 0.8 },
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.75, sm: 1, md: 1.5 },
      }}
    >
      <Box
        sx={{
          width: { xs: 36, sm: 40, md: 44 },
          height: { xs: 36, sm: 40, md: 44 },
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
            fontSize: { xs: 10, sm: 11, md: 11 },
            fontWeight: 600,
            color: "#9ca3af",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mb: { xs: 0.25, sm: 0.5, md: 0.75 },
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: { xs: 0.25, sm: 0.5, md: 0.75 } }}>
          <Typography
            sx={{
              fontSize: { xs: 16, sm: 20, md: 22 },
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
                fontSize: { xs: 10, sm: 11, md: 11 },
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
};

// -- Table column definitions --
const HEAD_COLS = [
  { id: "indentNo", label: "Indent # / Type", width: "120px" },
  { id: "location", label: "Location / Department", width: "160px" },
  { id: "priority", label: "Priority & Status", width: "130px" },
  { id: "requestedBy", label: "Requested By", width: "140px" },
  { id: "_actions", label: "Actions", width: "110px" },
];

const thSx = {
  fontSize: { xs: 10, sm: 11, md: 11 },
  fontWeight: 600,
  color: "#373B4D",
  letterSpacing: "0.04em",
  py: { xs: 0.75, sm: 1, md: 1.25 },
  px: { xs: 1, sm: 1.5, md: 2 },
  borderBottom: "1px solid #f3f4f6",
  borderRight: "1px solid #BED3FC",
  "&:last-child": { borderRight: "none" },
  whiteSpace: "nowrap",
};

const tdSx = {
  py: { xs: 0.75, sm: 1, md: 1.25 },
  px: { xs: 1, sm: 1.5, md: 2 },
  verticalAlign: "middle",
};

// -- Sample initial data ----------------------------------------------------

const SAMPLE_INDENTS = [
  {
    indentNo: "IND-2026-0001",
    indentDate: "2026-03-01",
    indentType: "New Acquisition",
    location: "Main Acute Care Hospital",
    department: "Operation Theater",
    requiredBy: "2026-03-10",
    priority: "Medium",
    requestedBy: "Dr. Sarah Ahmed",
    purposeRemarks: "Critical stock replenishment for ICU",
    lineItems: [
      { id: 1, itemName: "Amoxicillin 500mg Capsules", description: "Antibiotics", uom: "Caps", qtyReq: 200, currStock: "200", category: "Medicine", status: "Approved", approvedQty: 200 },
      { id: 2, itemName: "Epinephrine 1mg/mL 10mL Vial", description: "Emergency Drugs", uom: "Vial", qtyReq: 20, currStock: "4", category: "Medicine", status: "Approved", approvedQty: 20 },
    ],
  },
  {
    indentNo: "IND-2026-0002",
    indentDate: "2026-03-05",
    indentType: "New Acquisition",
    location: "Central Warehouse & Stores",
    department: "Pharmacy",
    requiredBy: "2026-03-15",
    priority: "Low",
    requestedBy: "Pharmacist R. Patel",
    purposeRemarks: "Monthly pharmacy restock",
    lineItems: [
      { id: 1, itemName: "Morphine Sulfate 10mg/mL", description: "Analgesics / Pain Management", uom: "Vial", qtyReq: 30, currStock: "18", category: "Medicine", status: "Approved", approvedQty: 30 },
      { id: 2, itemName: "Sodium Chloride 0.9% IV 1L", description: "IV Fluids & Electrolytes", uom: "Bag", qtyReq: 50, currStock: "12", category: "Medicine", status: "Pending" },
    ],
  },
  {
    indentNo: "IND-2026-0003",
    indentDate: "2026-03-08",
    indentType: "Stock Issue",
    location: "Main Acute Care Hospital",
    department: "Ward / Department Store",
    requiredBy: "2026-03-12",
    priority: "High",
    requestedBy: "Nurse T. Williams",
    purposeRemarks: "Emergency PPE restock",
    issueNumber: "ISS-2026-001",
    issueDate: "2026-03-08",
    issueFrom: "Main Acute Care Hospital",
    issueTo: "Main Acute Care Hospital",
    issueType: "Emergency Issue",
    authorisedBy: "Dr. Mehra",
    lineItems: [
      { id: 1, itemName: "Nitrile Exam Gloves (L) 100/bx", description: "Gloves", uom: "Box", qtyReq: 50, currStock: "30", category: "Consumable", status: "Approved", approvedQty: 50 },
      { id: 2, itemName: "Surgical Mask ASTM Level 3", description: "Masks & Respirators", uom: "Pcs", qtyReq: 200, currStock: "450", category: "Consumable", status: "Rejected" },
    ],
  },
  {
    indentNo: "IND-2026-0004",
    indentDate: "2026-03-10",
    indentType: "New Acquisition",
    location: "Main Acute Care Hospital",
    department: "Operation Theater",
    requiredBy: "2026-03-20",
    priority: "Critical",
    requestedBy: "Dr. M. Hassan",
    purposeRemarks: "Surgical supplies for scheduled procedures",
    lineItems: [
      { id: 1, itemName: "4×4 Gauze Pads Sterile 10/pk", description: "Dressings", uom: "Pack", qtyReq: 100, currStock: "200", category: "Consumable", status: "Pending" },
      { id: 2, itemName: "BD Vacutainer EDTA 10mL", description: "Collection Tubes", uom: "Pcs", qtyReq: 300, currStock: "600", category: "Consumable", status: "Pending" },
    ],
  },
  {
    indentNo: "IND-2026-0005",
    indentDate: "2026-03-12",
    indentType: "New Acquisition",
    location: "Central Warehouse & Stores",
    department: "Laboratory",
    requiredBy: "2026-03-22",
    priority: "Low",
    requestedBy: "Lab Tech A. Singh",
    purposeRemarks: "Lab supplies replenishment",
    lineItems: [
      { id: 1, itemName: "BD Vacutainer EDTA 10mL", description: "Collection Tubes", uom: "Pcs", qtyReq: 500, currStock: "600", category: "Consumable", status: "Approved", approvedQty: 500 },
    ],
  },
  {
    indentNo: "IND-2026-0006",
    indentDate: "2026-03-15",
    indentType: "Stock Transfer",
    location: "Central Warehouse & Stores",
    department: "Pharmacy",
    requiredBy: "2026-03-25",
    priority: "High",
    requestedBy: "Ward Manager K. Lee",
    purposeRemarks: "Ward medication restock — running low",
    transferNumber: "TRF-2026-001",
    transferDate: "2026-03-15",
    transferFrom: "Main Acute Care Hospital",
    transferTo: "Central Warehouse & Stores",
    transferAuthorisedBy: "S. Anderson",
    lineItems: [
      { id: 1, itemName: "Amoxicillin 500mg Capsules", description: "Antibiotics", uom: "Caps", qtyReq: 100, currStock: "200", category: "Medicine", status: "Pending" },
      { id: 2, itemName: "Morphine Sulfate 10mg/mL", description: "Analgesics / Pain Management", uom: "Vial", qtyReq: 15, currStock: "18", category: "Medicine", status: "Pending" },
    ],
  },
  {
    indentNo: "IND-2026-0007",
    indentDate: "2026-03-18",
    indentType: "New Acquisition",
    location: "Main Acute Care Hospital",
    department: "Laboratory",
    requiredBy: "2026-03-28",
    priority: "Medium",
    requestedBy: "Radiologist P. Chen",
    purposeRemarks: "Radiology consumables",
    lineItems: [
      { id: 1, itemName: "Nitrile Exam Gloves (L) 100/bx", description: "Gloves", uom: "Box", qtyReq: 20, currStock: "30", category: "Consumable", status: "Approved", approvedQty: 20 },
    ],
  },
  {
    indentNo: "IND-2026-0008",
    indentDate: "2026-03-20",
    indentType: "Stock Issue",
    location: "Central Warehouse & Stores",
    department: "Central Store",
    requiredBy: "2026-03-30",
    priority: "High",
    requestedBy: "ICU Head Dr. B. Okafor",
    purposeRemarks: "Critical IV fluid shortage",
    issueNumber: "ISS-2026-002",
    issueDate: "2026-03-20",
    issueFrom: "Central Warehouse & Stores",
    issueTo: "Central Warehouse & Stores",
    issueType: "Emergency Issue",
    authorisedBy: "Dr. B. Okafor",
    lineItems: [
      { id: 1, itemName: "Sodium Chloride 0.9% IV 1L", description: "IV Fluids & Electrolytes", uom: "Bag", qtyReq: 80, currStock: "12", category: "Medicine", status: "Approved", approvedQty: 80 },
      { id: 2, itemName: "Epinephrine 1mg/mL 10mL Vial", description: "Emergency Drugs", uom: "Vial", qtyReq: 10, currStock: "4", category: "Medicine", status: "Pending" },
    ],
  },
];

const STORAGE_KEY = "indent_procurement_data";
const STORAGE_VERSION = "v6";

function GRNViewModal({ open, onClose, grns, indent, onViewGRNDetails }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" } }}
    >
      <Box sx={{ px: "14px", pt: "6px", pb: "5px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>GRN Details</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af" }}>
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: "12px", py: "10px" }}>
        {!grns || grns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>No GRNs found</Typography>
          </Box>
        ) : (
          <Table size="small" sx={{ width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", py: 0.5, px: 0.75 }}>GRN ID</TableCell>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", py: 0.5, px: 0.75 }}>Supplier</TableCell>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", py: 0.5, px: 0.75 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grns.map((grn) => (
                <TableRow key={grn.id} sx={{ "&:hover": { bgcolor: "#f9fafb" } }}>
                  <TableCell
                    sx={{ fontSize: 10, color: "#2563eb", fontWeight: 600, py: 0.5, px: 0.75, cursor: "pointer", textDecoration: "underline", "&:hover": { color: "#1d4ed8" } }}
                    onClick={() => onViewGRNDetails && onViewGRNDetails(grn.id)}
                  >
                    {grn.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: 10, color: "#374151", py: 0.5, px: 0.75 }}>{grn.supplier || "—"}</TableCell>
                  <TableCell sx={{ fontSize: 10, py: 0.5, px: 0.75 }}>
                    <Chip
                      label={grn.status}
                      size="small"
                      sx={{
                        fontSize: 9, height: 18,
                        bgcolor: grn.status === "Completed" ? "#dcfce7" : grn.status === "Pending" ? "#fef9c3" : "#fee2e2",
                        color: grn.status === "Completed" ? "#16a34a" : grn.status === "Pending" ? "#ca8a04" : "#dc2626",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -- PO View Modal --
function POViewModal({ open, onClose, pos, indent, onViewPODetails }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" } }}
    >
      <Box sx={{ px: "14px", pt: "6px", pb: "5px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>PO Details</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af" }}>
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: "12px", py: "10px" }}>
        {!pos || pos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>No Purchase Orders found</Typography>
          </Box>
        ) : (
          <Table size="small" sx={{ width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", py: 0.5, px: 0.75 }}>PO No.</TableCell>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", py: 0.5, px: 0.75 }}>Supplier</TableCell>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", py: 0.5, px: 0.75 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pos.map((po) => (
                <TableRow key={po.id} sx={{ "&:hover": { bgcolor: "#f9fafb" } }}>
                  <TableCell
                    sx={{ fontSize: 10, color: "#2563eb", fontWeight: 600, py: 0.5, px: 0.75, cursor: "pointer", textDecoration: "underline", "&:hover": { color: "#1d4ed8" } }}
                    onClick={() => onViewPODetails && onViewPODetails(po.id)}
                  >
                    {po.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: 10, color: "#374151", py: 0.5, px: 0.75 }}>{po.supplier || "—"}</TableCell>
                  <TableCell sx={{ fontSize: 10, py: 0.5, px: 0.75 }}>
                    <Chip
                      label={po.status}
                      size="small"
                      sx={{
                        fontSize: 9, height: 18,
                        bgcolor: po.status === "Approved" ? "#dcfce7" : po.status === "Completed" ? "#d1d5db" : po.status === "Pending" ? "#fef9c3" : "#fee2e2",
                        color: po.status === "Approved" ? "#16a34a" : po.status === "Completed" ? "#374151" : po.status === "Pending" ? "#ca8a04" : "#dc2626",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -- Indent View Modal --
function IndentViewModal({ open, onClose, indent, onViewGRN, onViewPO }) {
  if (!indent) return null;

  const items = indent.lineItems || [];
  const stats = getItemStats(items);
  const computedStatus = calcIndentStatus(items);
  const ss = statusStyle(computedStatus);
  const totalApproved = items.reduce((s, it) => {
    if (it.status === "Rejected") return s;
    return s + Number(it.approvedQty ?? it.qtyReq ?? it.qty ?? 0);
  }, 0);
  const totalOrdered = items.reduce((s, it) => s + Number(it.orderedQty || 0), 0);
  const totalReceived = items.reduce((s, it) => s + Number(it.receivedQty || 0), 0);
  const hasPOs = totalOrdered > 0;
  const hasGRNs = totalReceived > 0;
  const pc = priorityColor(indent.priority);

  // Determine display number based on indent type
  const isStockIssue = indent.indentType === "Stock Issue";
  const isStockTransfer = indent.indentType === "Stock Transfer";
  const displayNumber = isStockIssue ? indent.issueNumber : isStockTransfer ? indent.transferNumber : indent.indentNo;
  const displayTitle = isStockIssue ? "Stock Issue" : isStockTransfer ? "Stock Transfer" : "Indent";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: { borderRadius: "12px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden", maxHeight: "85vh" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: "10px", pt: "6px", pb: "5px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6", bgcolor: "#fff", flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#EBF1FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AccountCircle sx={{ color: "#2563eb", fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            {displayTitle} Details — {displayNumber}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px", width: 28, height: 28 }}>
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: "16px", py: "12px", overflowY: "auto", maxHeight: "70vh",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
        }}
      >
        {isStockIssue ? (
          // Stock Issue Details
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Issue Number</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{indent.issueNumber}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Issue Type</Typography>
              <Chip label={indent.issueType || "—"} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "#f3f4f6", height: 22 }} />
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>From</Typography>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{indent.issueFrom || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>To (Department)</Typography>
              <Typography sx={{ fontSize: 12, color: "#7c3aed", fontWeight: 500 }}>{indent.issueTo || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}> Date</Typography>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{fmtDate(indent.issueDate)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Authorised By</Typography>
              <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 500 }}>{indent.authorisedBy || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Requested By</Typography>
              <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 500 }}>{indent.requestedBy || "—"}</Typography>
            </Grid>
          </Grid>
        ) : isStockTransfer ? (
          // Stock Transfer Details
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Transfer Number</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{indent.transferNumber}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Priority</Typography>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: "4px", px: "6px", py: "2px", borderRadius: "16px", bgcolor: pc.bg, border: `1px solid ${pc.border}`, width: "fit-content" }}>
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: pc.color }} />
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: pc.color }}>{indent.priority || "Normal"}</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>From Location</Typography>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{indent.transferFrom || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>To Location</Typography>
              <Typography sx={{ fontSize: 12, color: "#7c3aed", fontWeight: 500 }}>{indent.transferTo || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}> Date</Typography>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{fmtDate(indent.transferDate)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Authorised By</Typography>
              <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 500 }}>{indent.transferAuthorisedBy || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Requested By</Typography>
              <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 500 }}>{indent.requestedBy || "—"}</Typography>
            </Grid>
            <Grid item xs={9}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Purpose / Remarks</Typography>
              <Typography sx={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>{indent.purposeRemarks || indent.remarks || "—"}</Typography>
            </Grid>
          </Grid>
        ) : (
          // Standard Procurement Indent Details
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Indent Number</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{indent.indentNo}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Type</Typography>
              <Chip label={indent.indentType || "—"} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "#f3f4f6", height: 22 }} />
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Location</Typography>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{indent.location || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Department</Typography>
              <Typography sx={{ fontSize: 12, color: "#7c3aed", fontWeight: 500 }}>{indent.department || "—"}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Indent Date</Typography>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{fmtDate(indent.indentDate)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Required By</Typography>
              <Typography sx={{ fontSize: 12, color: "#374151" }}>{fmtDate(indent.requiredBy)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Priority</Typography>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: "4px", px: "6px", py: "2px", borderRadius: "16px", bgcolor: pc.bg, border: `1px solid ${pc.border}`, width: "fit-content" }}>
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: pc.color }} />
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: pc.color }}>{indent.priority || "Normal"}</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Status</Typography>
              <Chip label={computedStatus} size="small" sx={{ bgcolor: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 600, fontSize: 10, height: 22 }} />
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Requested By</Typography>
              <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 500 }}>{indent.requestedBy || "—"}</Typography>
            </Grid>
            <Grid item xs={9}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>Purpose / Remarks</Typography>
              <Typography sx={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>{indent.purposeRemarks || indent.remarks || "—"}</Typography>
            </Grid>
          </Grid>
        )}

        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#374151", mb: 1 }}>Items</Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 650, width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "5%" }}>#</TableCell>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "35%" }}>ITEM NAME</TableCell>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "8%" }}>UOM</TableCell>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "10%" }}>REQ</TableCell>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "10%" }}>APPR</TableCell>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "12%" }}>ORDERED</TableCell>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "12%" }}>RECEIVED</TableCell>
                <TableCell sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", py: 0.75, px: 1, whiteSpace: "nowrap", width: "8%" }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => {
                const rs = itemRowStyle(item.status || "Pending");
                const reqQty = item.qtyReq || item.qty || "—";
                const appQty = item.approvedQty != null ? item.approvedQty : (item.status === "Approved" ? reqQty : item.status === "Rejected" ? 0 : null);
                // ── Don't show "PO Generated" when indent is completed ──
                const displayStatus = indent.status === "Completed" && item.status === "PO Generated" ? "Completed" : (item.status || "Pending");
                const displayRs = itemRowStyle(displayStatus);
                return (
                  <TableRow key={idx} sx={{ bgcolor: displayRs.bg }}>
                    <TableCell sx={{ fontSize: 10, color: "#6b7280", py: 0.5, px: 1 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>{item.itemName || item.item || "—"}</Typography>
                      {item.description && <Typography sx={{ fontSize: 9, color: "#9ca3af" }}>{item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}</Typography>}
                    </TableCell>
                    <TableCell sx={{ fontSize: 10, color: "#374151", py: 0.5, px: 1 }}>{item.uom || "—"}</TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: 11, fontWeight: 500, py: 0.5, px: 1 }}>{reqQty}</TableCell>
                    <TableCell sx={{ textAlign: "center", py: 0.5, px: 1 }}>
                      {item.status === "Rejected" ? <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>0</Typography> : appQty == null ? "—" : <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>{appQty}</Typography>}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: 11, fontWeight: 500, color: item.orderedQty > 0 ? "#7c3aed" : "#9ca3af", py: 0.5, px: 1 }}>{item.orderedQty ?? 0}</TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: 11, fontWeight: 500, color: item.receivedQty > 0 ? "#16a34a" : "#9ca3af", py: 0.5, px: 1 }}>{item.receivedQty ?? 0}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Chip label={displayStatus} size="small" sx={{ bgcolor: displayRs.chip.bg, color: displayRs.chip.color, border: `1px solid ${displayRs.chip.border}`, fontWeight: 600, fontSize: 9, height: 18 }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: "16px", py: "10px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", gap: "8px", bgcolor: "#fff", flexShrink: 0 }}>
        <Box sx={{ display: "flex", gap: "8px" }}>
          {hasPOs && (
            <Button size="small" onClick={() => onViewPO && onViewPO(indent)}
              sx={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textTransform: "none", borderRadius: "6px", px: "12px", py: "5px", border: "1px solid #bfdbfe", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}>
              View PO ({totalOrdered})
            </Button>
          )}
          {hasGRNs && (
            <Button size="small" onClick={() => onViewGRN && onViewGRN(indent)}
              sx={{ fontSize: 12, fontWeight: 600, color: "#059669", textTransform: "none", borderRadius: "6px", px: "12px", py: "5px", border: "1px solid #a7f3d0", bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" } }}>
              View GRN ({totalReceived})
            </Button>
          )}
        </Box>
        <Button onClick={onClose} size="small" sx={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "6px", px: "16px", py: "5px", border: "1px solid #e5e7eb", bgcolor: "#fff" }}>
          Close
        </Button>
      </Box>
    </Dialog>
  );
}

// -- Main page component ----------------------------------------------------

const IndentProcurement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const { items: inventoryItems } = useInventory();
  const { can } = usePermissions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const { currentUser } = useAuth();
  const userLocation = getUserLocation(currentUser);
  const { supplierNames } = useVendorManagement();
  const [approvalModal, setApprovalModal] = useState({ open: false, indent: null, mode: "approve" });
  const [breakdownModal, setBreakdownModal] = useState({ open: false, indent: null });
  const [viewModal, setViewModal] = useState({ open: false, indent: null });
  const [grnViewModal, setGrnViewModal] = useState({ open: false, grns: [] });
  const [poViewModal, setPoViewModal] = useState({ open: false, pos: [] });

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [highlightedIndentId, setHighlightedIndentId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get("highlight");
    if (highlightId) {
      setHighlightedIndentId(highlightId);
      const timer = setTimeout(() => setHighlightedIndentId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  const [indents, setIndents] = useState(() => {
    const storedVersion = localStorage.getItem(STORAGE_KEY + "_version");
    if (storedVersion !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY + "_version", STORAGE_VERSION);
      return SAMPLE_INDENTS;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((r) => ({ ...r, lineItems: migrateItems(r.lineItems || r.items || []) }));
        }
      }
    } catch (e) {
      console.error("Failed to parse localStorage data:", e);
    }
    return SAMPLE_INDENTS;
  });

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(indents));
    localStorage.setItem(STORAGE_KEY + "_version", STORAGE_VERSION);
  }, [indents]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setIndents(parsed.map((r) => ({ ...r, lineItems: migrateItems(r.lineItems || r.items || []) })));
            }
          }
        } catch (e) {
          console.error("Failed to reload indents from localStorage:", e);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const filteredIndents = indents.filter((row) => {
    if (highlightedIndentId && row.indentNo === highlightedIndentId) return true;

    if (userLocation && currentUser?.role !== "admin" && currentUser?.role !== "location_manager_super") {
      const rowLocation = row.location || row.transferFrom || row.transferTo || row.issueTo || row.issueFrom || "";
      if (!locationMatches(userLocation, rowLocation)) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (row.indentNo || "").toLowerCase().includes(q) ||
      (row.department || "").toLowerCase().includes(q) ||
      (row.location || "").toLowerCase().includes(q) ||
      (row.requestedBy || "").toLowerCase().includes(q) ||
      (row.purposeRemarks || "").toLowerCase().includes(q) ||
      (row.indentType || "").toLowerCase().includes(q) ||
      (row.issueFrom || "").toLowerCase().includes(q) ||
      (row.issueTo || "").toLowerCase().includes(q) ||
      (row.transferFrom || "").toLowerCase().includes(q) ||
      (row.transferTo || "").toLowerCase().includes(q);
    const matchesType = typeFilter === "All Types" || row.indentType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredIndents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedIndents = filteredIndents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (event, value) => setCurrentPage(value);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, typeFilter]);

  const totalIndents = filteredIndents.length;
  const pendingApproval = filteredIndents.filter((i) => calcIndentStatus(i.lineItems || []) === "Pending Approval").length;
  const approvedInTransit = filteredIndents.filter((i) => { const s = calcIndentStatus(i.lineItems || []); return s === "Approved" || s === "In Transit"; }).length;
  const received = filteredIndents.filter((i) => calcIndentStatus(i.lineItems || []) === "Completed").length;

  const statCards = [
    {
      label: "Total Indents", count: totalIndents, sub: `${totalIndents} total requests`, iconBg: "#3b82f6",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
    },
    {
      label: "Pending Approval", count: pendingApproval, sub: "Awaiting approval", iconBg: "#f59e0b",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    {
      label: "Approved / In Transit", count: approvedInTransit, sub: "Ready for processing", iconBg: "#10b981",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
    },
    {
      label: "Received", count: received, sub: "Completed indents", iconBg: "#8b5cf6",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>,
    },
  ];

  const handleSave = (data) => {
    if (editData) {
      setIndents((prev) => prev.map((r) => (r.indentNo === editData.indentNo ? { ...data } : r)));
      setToast({ open: true, message: `Indent ${data.indentNo} updated successfully!`, severity: "success" });
    } else {
      setIndents((prev) => [data, ...prev]);

      if (data.indentType === "Stock Issue") {
        try {
          const ISSUE_KEY = "tia_stock_issues";
          const existing = JSON.parse(localStorage.getItem(ISSUE_KEY) || "[]");
          const newIssue = {
            id: data.issueNumber || `ISS-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
            type: data.issueType || "Internal Issue",
            from: data.issueFrom || "—",
            dept: data.issueTo || "—",
            items: (data.issuedItems || data.lineItems || []).length,
            value: (data.issuedItems || data.lineItems || []).reduce((s, it) => s + parseFloat(it.qtyIssued || it.qtyReq || 0) * parseFloat(it.unitCost || 0), 0),
            requestedBy: data.requestedBy || "—",
            date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }),
            status: "Pending",
            indentRef: data.indentNo,
            lineItems: (data.issuedItems || data.lineItems || []).map((it) => ({
              name: it.itemName || it.name || "—",
              quantity: it.qtyIssued || it.qtyReq || 0,
              approvedQty: it.qtyIssued || it.qtyReq || 0,
              approvalStatus: "Pending",
            })),
          };
          localStorage.setItem(ISSUE_KEY, JSON.stringify([newIssue, ...existing]));
        } catch (e) {
          console.error("Failed to write to stock issues:", e);
        }
      }

      if (data.indentType === "Stock Transfer") {
        try {
          const TRANSFER_KEY = "tiatele_transfers";
          const existing = JSON.parse(localStorage.getItem(TRANSFER_KEY) || "[]");
          const transferItems = (data.transferItems || data.lineItems || []).map((it) => ({ item: it.itemName || it.description || "—", qty: it.qtyTransfer || it.qtyReq || 1 }));
          const newTransfer = {
            id: data.transferNumber || `TRF-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
            from: data.transferFrom || "—", fromLabel: data.transferFrom || "—",
            to: data.transferTo || "—", toLabel: data.transferTo || "—",
            items: transferItems,
            itemsLabel: transferItems.map((it) => `${it.item} —${it.qty}`).join(", "),
            priority: data.priority || "Normal",
            notes: data.purposeRemarks || "—",
            by: data.transferAuthorisedBy || data.requestedBy || "—",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status: "Requested",
            indentRef: data.indentNo,
          };
          localStorage.setItem(TRANSFER_KEY, JSON.stringify([newTransfer, ...existing]));
        } catch (e) {
          console.error("Failed to write to transfers:", e);
        }
      }

      setToast({ open: true, message: `Indent ${data.indentNo} saved successfully!`, severity: "success" });
    }
    setEditData(null);
    setModalOpen(false);
  };

  const handleNewIndent = () => { setEditData(null); setModalOpen(true); };
  const handleApprove = (row) => setApprovalModal({ open: true, indent: row, mode: "approve" });
  const handleReject = (row) => setApprovalModal({ open: true, indent: row, mode: "reject" });

  const handleApprovalConfirm = (payload, mode) => {
    const payloadMap = Object.fromEntries(payload.map((p) => [p.id, p]));
    setIndents((prev) =>
      prev.map((r) => {
        if (r.indentNo !== approvalModal.indent.indentNo) return r;
        const updatedItems = (r.lineItems || []).map((it) => {
          const id = it.id ?? it.itemName;
          if (!payloadMap[id]) return it;
          if (mode === "reject") return { ...it, status: "Rejected", approvedQty: 0, reason: payloadMap[id].reason || "" };
          const { approvedQty, reason } = payloadMap[id];
          const reqQty = Number(it.qtyReq || it.qty || 1);
          const totalApproved = Number(approvedQty);
          return { ...it, status: totalApproved >= reqQty ? "Approved" : "Partial Approved", approvedQty: totalApproved, reason: reason || it.reason || "" };
        });
        return { ...r, lineItems: updatedItems };
      }),
    );
    const count = payload.length;
    const label = mode === "approve" ? "approved" : "rejected";
    const partialCount = mode === "approve"
      ? payload.filter((p) => {
          const item = (approvalModal.indent.lineItems || []).find((it) => (it.id ?? it.itemName) === p.id);
          if (!item) return false;
          return Number(p.approvedQty) < Number(item.qtyReq || item.qty || 1);
        }).length
      : 0;
    setToast({
      open: true,
      message: partialCount > 0
        ? `${count} item${count !== 1 ? "s" : ""} ${label} in ${approvalModal.indent.indentNo} (${partialCount} partial — still open).`
        : `${count} item${count !== 1 ? "s" : ""} ${label} in ${approvalModal.indent.indentNo}.`,
      severity: mode === "approve" ? "success" : "error",
    });
    setApprovalModal({ open: false, indent: null, mode: "approve" });
  };

  const handleGeneratePO = (row) => {
    const approvedItems = (row.lineItems || []).filter((it) => it.status === "Approved" || it.status === "Partial Approved");
    if (approvedItems.length === 0) {
      setToast({ open: true, message: "No approved items to generate a PO for.", severity: "warning" });
      return;
    }
    const enrichedItems = approvedItems.map((it) => {
      const invItem = inventoryItems.find((inv) => inv.name?.toLowerCase() === (it.itemName || it.description || "").toLowerCase());
      const approvedQty = it.approvedQty ?? it.qtyReq ?? it.qty ?? 1;
      return { ...it, unitCost: invItem?.cost ?? it.unitCost ?? 0, qty: approvedQty, approvedQty, _approvedQty: approvedQty };
    });
    setSelectedIndent({ ...row, lineItems: enrichedItems });
    setPoModalOpen(true);
  };

  const handleCloseToast = () => setToast((prev) => ({ ...prev, open: false }));
  const handleViewIndent = (row) => setViewModal({ open: true, indent: row });

  const handleViewGRNs = (indent) => {
    try {
      const GRN_KEY = "grn_data";
      const PO_KEYS = ["tiatele_purchase_orders", "purchase_orders_data"];
      let grns = JSON.parse(localStorage.getItem(GRN_KEY) || "[]");
      let allPos = [];
      for (const key of PO_KEYS) {
        const posData = JSON.parse(localStorage.getItem(key) || "[]");
        if (posData.length > 0) allPos = [...allPos, ...posData];
      }
      const linkedPOs = allPos.filter((po) => po.indentId === indent.indentNo || po.indentId === indent.id);
      const linkedGRNs = grns.filter((grn) => linkedPOs.some((po) => po.id === grn.linkedPO));
      setGrnViewModal({ open: true, grns: linkedGRNs, indent });
    } catch (e) {
      console.error("Failed to fetch GRNs:", e);
      setToast({ open: true, message: "Failed to load GRN details", severity: "error" });
    }
  };

  const handleViewPOs = (indent) => {
    try {
      const PO_KEYS = ["tiatele_purchase_orders", "purchase_orders_data"];
      let allPos = [];
      for (const key of PO_KEYS) {
        const posData = JSON.parse(localStorage.getItem(key) || "[]");
        if (posData.length > 0) allPos = [...allPos, ...posData];
      }
      const linkedPOs = allPos.filter((po) => po.indentId === indent.indentNo || po.indentId === indent.id);
      setPoViewModal({ open: true, pos: linkedPOs, indent });
    } catch (e) {
      console.error("Failed to fetch POs:", e);
      setToast({ open: true, message: "Failed to load PO details", severity: "error" });
    }
  };

  const handleViewGRNDetails = (grnId) => { setGrnViewModal({ open: false, grns: [] }); navigate(`/admin/goods-receipt?highlight=${grnId}`); };
  const handleViewPODetails = (poId) => { setPoViewModal({ open: false, pos: [] }); navigate(`/admin/purchase-orders?highlight=${poId}`); };

  const handleStockIssueAction = (indent) => {
    if (indent.issueNumber) {
      navigate(`/admin/stock-issue?highlight=${indent.issueNumber}`);
    } else {
      setToast({ open: true, message: "No issue number found for this indent.", severity: "warning" });
    }
  };

  const handleStockTransferAction = (indent) => {
    if (indent.transferNumber) {
      navigate(`/admin/transfers?highlight=${indent.transferNumber}`);
    } else {
      setToast({ open: true, message: "No transfer number found for this indent.", severity: "warning" });
    }
  };

  return (
    <>
      <GlobalStyles
        styles={{
          "*::-webkit-scrollbar": { width: "6px", height: "6px" },
          "*::-webkit-scrollbar-track": { background: "transparent" },
          "*::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: "4px" },
          "*::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
          "*": { scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" },
        }}
      />

      <Box>
        {/* Page Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "20px", flexWrap: "wrap", gap: "12px" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Indent & Procurement</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Search */}
            <Box
              sx={{
                display: "flex", alignItems: "center", gap: "8px", flex: 1, maxWidth: 380,
                border: "1px solid #e5e7eb", borderRadius: "8px", px: "14px", py: "9px",
                bgcolor: "#fff", transition: "border-color 0.15s", "&:focus-within": { borderColor: "#2563eb" },
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search indent #, department, location..."
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#111827", width: "100%", fontFamily: "inherit" }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0, color: "#9ca3af", "&:hover": { color: "#374151", bgcolor: "transparent" }, "&:focus": { outline: "none" } }}>
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              )}
            </Box>

            {/* Type Filter */}
            <FormControl size="small" sx={{ minWidth: 168 }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{
                  fontSize: 13, borderRadius: "20px", background: "#fff",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb", borderWidth: "1px" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: "1px" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: "1px" },
                }}
              >
                <MenuItem value="All Types" sx={{ fontSize: 13 }}>All Types</MenuItem>
                {INDENT_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t}</MenuItem>)}
              </Select>
            </FormControl>

            {/* New Indent Button */}
            <Tooltip title={!can.createIndent ? "You don't have permission to create indents" : ""}>
              <span>
                <Button
                  onClick={handleNewIndent}
                  disabled={!can.createIndent}
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    background: "#2563eb", color: "#fff", borderRadius: "8px", px: "16px", py: "7px",
                    fontSize: "13px", fontWeight: 500, textTransform: "none",
                    "&:hover": { background: "#1d4ed8" },
                    "&:disabled": { background: "#d1d5db", color: "#9ca3af" },
                  }}
                >
                  New Indent
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Stat Cards */}
        <Box sx={{ display: "flex", gap: "12px", mb: "20px" }}>
          {statCards.map((s) => <StatCard key={s.label} label={s.label} count={s.count} sub={s.sub} iconBg={s.iconBg} iconEl={s.icon} />)}
        </Box>

        {/* Table */}
        <Paper elevation={0} sx={{ mb: "16px", borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <Box sx={{ overflowX: "auto", "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 } }}>
            <Table size="small" sx={{ width: "100%", tableLayout: "fixed", minWidth: 850, "& .MuiTableCell-root": { borderBottom: "1px solid #f3f4f6" } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#EBF1FE" }}>
                  {HEAD_COLS.map((col) => <TableCell key={col.id} sx={{ ...thSx, width: col.width }}>{col.label}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredIndents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 6, textAlign: "center", border: "none" }}>
                      <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
                        {indents.length === 0 ? <>No indents yet. Click <strong>New Indent</strong> to create one.</> : "No indents match your search or filter."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {paginatedIndents.map((row, idx) => {
                  const pc = priorityColor(row.priority);
                  const items = row.lineItems || [];
                  const stats = getItemStats(items);
                  const computedStatus = calcIndentStatus(items);
                  const ss = statusStyle(computedStatus);
                  const canApproveReject = can.approveIndentItems && (stats.pending > 0 || stats.partialApproved > 0);
                  const canGeneratePO = can.createPO && (stats.approved > 0 || stats.partialApproved > 0);

                  // Determine if this is a Stock Issue or Stock Transfer
                  const isStockIssue = row.indentType === "Stock Issue";
                  const isStockTransfer = row.indentType === "Stock Transfer";

                  return (
                    <TableRow
                      key={row.indentNo + idx}
                      onClick={() => {
                        // Click row to navigate based on indent type
                        if (isStockIssue) {
                          handleStockIssueAction(row);
                        } else if (isStockTransfer) {
                          handleStockTransferAction(row);
                        }
                      }}
                      sx={{
                        background: highlightedIndentId === row.indentNo ? "#fef3c7" : "#fff",
                        "&:hover": { 
                          bgcolor: highlightedIndentId === row.indentNo ? "#fef3c7" : "#f8faff",
                          cursor: isStockIssue || isStockTransfer ? "pointer" : "default",
                        },
                        transition: "background 0.3s",
                        boxShadow: highlightedIndentId === row.indentNo ? "inset 0 0 0 2px #f59e0b" : "none",
                      }}
                    >
                      {/* Col 1: Indent # / Type */}
                      <TableCell sx={{ ...tdSx, minWidth: 120 }}>
                        <Tooltip title={`${isStockIssue ? 'Issue' : isStockTransfer ? 'Transfer' : 'Indent'}: ${isStockIssue ? row.issueNumber : isStockTransfer ? row.transferNumber : row.indentNo}`} placement="top" arrow>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{isStockIssue ? row.issueNumber : isStockTransfer ? row.transferNumber : row.indentNo || "—"}</Typography>
                        </Tooltip>
                        <Tooltip title={`Type: ${row.indentType || "—"}`} placement="top" arrow>
                          <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: "4px" }}>{row.indentType || "—"}</Typography>
                        </Tooltip>
                      </TableCell>

                      {/* Col 2: Location / Department */}
                      <TableCell sx={{ ...tdSx, minWidth: 140 }}>
                        {row.indentType === "Stock Issue" ? (
                          <Tooltip title={`From: ${row.issueFrom || "—"} → To: ${row.issueTo || "—"}`} placement="top" arrow>
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", minWidth: 26 }}>From</Typography>
                                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{row.issueFrom || "—"}</Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mt: "2px" }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", minWidth: 26 }}>To</Typography>
                                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#7c3aed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{row.issueTo || "—"}</Typography>
                              </Box>
                            </Box>
                          </Tooltip>
                        ) : row.indentType === "Stock Transfer" ? (
                          <Tooltip title={`From: ${row.transferFrom || "—"} → To: ${row.transferTo || "—"}`} placement="top" arrow>
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", minWidth: 26 }}>From</Typography>
                                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{row.transferFrom || "—"}</Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mt: "2px" }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", minWidth: 26 }}>To</Typography>
                                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#7c3aed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{row.transferTo || "—"}</Typography>
                              </Box>
                            </Box>
                          </Tooltip>
                        ) : (
                          <>
                            <Tooltip title={`Location: ${row.location || "—"}`} placement="top" arrow>
                              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>
                                {row.location || "—"}
                              </Typography>
                            </Tooltip>
                            <Tooltip title={`Department: ${row.department || "—"}`} placement="top" arrow>
                              <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mt: "4px" }}>
                                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#a78bfa", flexShrink: 0 }} />
                                <Typography sx={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>{row.department || "—"}</Typography>
                              </Box>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>

                      {/* Col 3: Priority & Status */}
                      <TableCell sx={{ ...tdSx, minWidth: 130 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                          <Tooltip title={`Priority: ${row.priority || "Normal"}`} placement="top" arrow>
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", px: "8px", py: "3px", borderRadius: "20px", bgcolor: pc.bg, border: `1px solid ${pc.border}`, whiteSpace: "nowrap" }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: pc.color, flexShrink: 0 }} />
                              <Typography sx={{ fontSize: 11, fontWeight: 600, color: pc.color }}>{row.priority || "Normal"}</Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title={`Status: ${computedStatus}`} placement="top" arrow>
                            <Chip label={computedStatus} size="small" sx={{ bgcolor: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 600, fontSize: 11, height: 22, flexShrink: 0 }} />
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {/* Col 4: Requested By */}
                      <TableCell sx={{ ...tdSx, minWidth: 130 }}>
                        <Tooltip title={`Requested By: ${row.requestedBy || "—"}`} placement="top" arrow>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                            {row.requestedBy || "—"}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      {/* Col 5: Actions */}
                      <TableCell sx={{ ...tdSx, minWidth: 100 }}>
                        <Box sx={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {isStockIssue ? (
                            // Stock Issue Actions - View Only
                            <Tooltip title="View Details" placement="top">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewIndent(row); }}
                                sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", color: "#6b7280", "&:hover": { bgcolor: "#f3f4f6", color: "#374151" }, "&:focus": { outline: "none" } }}>
                                <VisibilityIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          ) : isStockTransfer ? (
                            // Stock Transfer Actions - View Only
                            <Tooltip title="View Details" placement="top">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewIndent(row); }}
                                sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", color: "#6b7280", "&:hover": { bgcolor: "#f3f4f6", color: "#374151" }, "&:focus": { outline: "none" } }}>
                                <VisibilityIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            // Standard Procurement Actions
                            <>
                              <Tooltip title={!can.approveIndentItems ? "You don't have permission" : canApproveReject ? "Approve Items" : "No pending items"} placement="top">
                                <span>
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleApprove(row); }} disabled={!canApproveReject}
                                    sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #bbf7d0", bgcolor: "#f0fdf4", color: "#16a34a", "&:hover": { bgcolor: "#dcfce7" }, "&:focus": { outline: "none" }, "&.Mui-disabled": { opacity: 0.35 } }}>
                                    <CheckIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={!can.rejectIndentItems ? "You don't have permission" : canApproveReject ? "Reject Items" : "No pending items"} placement="top">
                                <span>
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleReject(row); }} disabled={!can.rejectIndentItems || !canApproveReject}
                                    sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #fecaca", bgcolor: "#fff", color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" }, "&:focus": { outline: "none" }, "&.Mui-disabled": { opacity: 0.35 } }}>
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={!can.createPO ? "You don't have permission" : canGeneratePO ? `Generate PO (${stats.approved} approved items)` : "No approved items"} placement="top">
                                <span>
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleGeneratePO(row); }} disabled={!canGeneratePO}
                                    sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #bfdbfe", bgcolor: "#eff6ff", color: "#2563eb", "&:hover": { bgcolor: "#dbeafe" }, "&:focus": { outline: "none" }, "&.Mui-disabled": { opacity: 0.35 } }}>
                                    <ReceiptLongOutlinedIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="View Indent Details" placement="top">
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewIndent(row); }}
                                  sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", color: "#6b7280", "&:hover": { bgcolor: "#f3f4f6", color: "#374151" }, "&:focus": { outline: "none" } }}>
                                  <VisibilityIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Paper>

        {/* Pagination */}
        {filteredIndents.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "right", mt: 3, pt: 2, pb: 1, flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
          </Box>
        )}
      </Box>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <IndentProcurementModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSave={handleSave}
        onSaveAsDraft={(data) => handleSave({ ...data, status: "Draft" })}
        initialData={editData}
      />

      {/* Generate PO modal */}
      <NewPO
        open={poModalOpen}
        onClose={() => { setPoModalOpen(false); setSelectedIndent(null); }}
        initialIndentId={selectedIndent?.indentNo}
        indentData={selectedIndent}
        suppliers={supplierNames}
        onSave={(poData) => {
          if (poData.indentId) {
            setIndents((prev) =>
              prev.map((r) => {
                if (r.indentNo !== poData.indentId) return r;
                const poQtyMap = {};
                (poData.lineItems || []).forEach((li) => {
                  const key = (li.description || "").toLowerCase();
                  poQtyMap[key] = (poQtyMap[key] || 0) + Number(li.quantity || 0);
                });
                return {
                  ...r,
                 lineItems: (r.lineItems || []).map((it) => {
                    if (it.status !== "Approved" && it.status !== "Partial Approved") return it;
                    const key = (it.itemName || "").toLowerCase();
                    const addedQty = poQtyMap[key] || 0;
                    const newOrderedQty = (it.orderedQty || 0) + addedQty;
                    const effApproved = Number(it.approvedQty ?? it.qtyReq ?? it.qty ?? 0);
                    const reqQty = Number(it.qtyReq ?? it.qty ?? 0);
                    const fullyDecided = effApproved >= reqQty; // still remainder undecided if false
                    return {
                      ...it,
                      status: fullyDecided ? "PO Generated" : "Partial Approved",
                      orderedQty: newOrderedQty,
                      balanceToOrder: Math.max(0, effApproved - newOrderedQty),
                    };
                  }),
                };
              }),
            );
          }

          try {
            const PO_STORAGE_KEY = "purchase_orders_data";
            const PO_VERSION_KEY = "purchase_orders_version";
            const PO_VERSION = "v4";
            const existing = JSON.parse(localStorage.getItem(PO_STORAGE_KEY) || "[]");
            const newPO = {
              id: poData.poNumber,
              indentId: poData.indentId || "—",
              quotRef: poData.quotationRef || "—",
              supplier: poData.supplier || "—",
              location: poData.deliverTo || "—",
              lines: (poData.lineItems || []).length,
              total: poData.totalAmount || 0,
              createdBy: "Current User",
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              delivery: poData.requiredDelivery ? new Date(poData.requiredDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
              priority: poData.priority || "Normal",
              status: "Pending",
              lineItems: (poData.lineItems || []).map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitCost: Number(item.unitCost),
                total: Number(item.quantity) * Number(item.unitCost),
                indentId: poData.indentId || null,
                indentApprovedQty: item._approvedQty != null ? Number(item._approvedQty) : null,
              })),
            };
            localStorage.setItem(PO_STORAGE_KEY, JSON.stringify([newPO, ...existing]));
            localStorage.setItem(PO_VERSION_KEY, PO_VERSION);
          } catch (e) {
            console.error("Failed to write PO to localStorage:", e);
          }

          setPoModalOpen(false);
          setSelectedIndent(null);
          setToast({ open: true, message: `PO ${poData.poNumber} generated and visible in Purchase Orders!`, severity: "success" });
        }}
        onSaveAsDraft={(poData) => {
          setPoModalOpen(false);
          setSelectedIndent(null);
          setToast({ open: true, message: `PO ${poData.poNumber} saved as draft.`, severity: "info" });
        }}
      />

      <ItemBreakdownModal open={breakdownModal.open} onClose={() => setBreakdownModal({ open: false, indent: null })} indent={breakdownModal.indent} />

      <IndentViewModal
        open={viewModal.open}
        onClose={() => {
          setViewModal({ open: false, indent: null });
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) setIndents(parsed.map((r) => ({ ...r, lineItems: migrateItems(r.lineItems || r.items || []) })));
            }
          } catch (e) { console.error("Failed to reload indents:", e); }
        }}
        indent={viewModal.indent}
        onViewGRN={handleViewGRNs}
        onViewPO={handleViewPOs}
      />

      <GRNViewModal open={grnViewModal.open} onClose={() => setGrnViewModal({ open: false, grns: [] })} grns={grnViewModal.grns} indent={grnViewModal.indent} onViewGRNDetails={handleViewGRNDetails} />
      <POViewModal open={poViewModal.open} onClose={() => setPoViewModal({ open: false, pos: [] })} pos={poViewModal.pos} indent={poViewModal.indent} onViewPODetails={handleViewPODetails} />

      <ItemApprovalModal
        open={approvalModal.open}
        onClose={() => setApprovalModal({ open: false, indent: null, mode: "approve" })}
        indent={approvalModal.indent}
        mode={approvalModal.mode}
        onConfirm={handleApprovalConfirm}
      />
    </>
  );
};

export default IndentProcurement;