import { useState, useRef, useCallback, useEffect } from "react";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogContent,
  Snackbar,
  Alert,
  Tooltip,
  Stack,
  Checkbox,
  TextField,
  Pagination,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  FileDownload,
  Check,
  Close,
  Visibility,
  CheckCircleOutline as CheckCircleOutlineIcon,
  LocalShipping,
  MoveToInbox,
  Search as SearchIcon,
  Clear as ClearIcon,
  Inventory2Outlined,
} from "@mui/icons-material";
import IssuestockModal from "./InventoryItems/Issuestockmodal";
import { usePermissions } from "../hooks/usePermissions";
import { useInventory } from "../contexts/InventoryContext";

// --- Design tokens ------------------------------------------------------------
const btnPrimary = {
  height: 32,
  px: "12px",
  borderRadius: "12px",
  bgcolor: "#015DFF",
  color: "#fff",
  textTransform: "none",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "none",
  gap: "8px",
  minWidth: 0,
  "& .MuiButton-startIcon": { mr: 0 },
  "&:hover": { bgcolor: "#0147CC", boxShadow: "none" },
};
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
const C = {
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
};

// --- Seed data ----------------------------------------------------------------
const INITIAL_ISSUES = [
  {
    id: "ISS-2026-0008",
    type: "Ward Requisition",
    from: "Central Store",
    dept: "ICU",
    items: 1,
    value: 120.0,
    requestedBy: "Head Nurse ICU",
    date: "Mar 19, 2026 09:30",
    status: "Issued",
    lineItems: [
      {
        name: "Sterile Gauze Pads",
        quantity: 50,
        approvedQty: 50,
        approvalStatus: "Approved",
      },
    ],
  },
  {
    id: "ISS-2026-0007",
    type: "Emergency Issue",
    from: "Central Store",
    dept: "Emergency Dept",
    items: 1,
    value: 37.0,
    requestedBy: "Dr. Mehra",
    date: "Mar 18, 2026 22:15",
    status: "Issued",
    lineItems: [
      {
        name: "IV Cannula 20G",
        quantity: 30,
        approvedQty: 30,
        approvalStatus: "Approved",
      },
    ],
  },
  {
    id: "ISS-2026-0006",
    type: "OT Request",
    from: "Central Store",
    dept: "Operation Theater",
    items: 1,
    value: 49.5,
    requestedBy: "Dr. Kapoor",
    date: "Mar 17, 2026 11:00",
    status: "Pending",
    lineItems: [
      {
        name: "Surgical Gloves Size 7",
        quantity: 100,
        approvedQty: 100,
        approvalStatus: "Pending",
      },
    ],
  },
  {
    id: "ISS-2026-0012",
    type: "Ward Requisition",
    from: "Central Store",
    dept: "Emergency Dept",
    items: 1,
    value: 14.8,
    requestedBy: "—",
    date: "Mar 30, 2026 12:00",
    status: "Pending",
    lineItems: [
      {
        name: "Adhesive Tape 1 inch",
        quantity: 20,
        approvedQty: 20,
        approvalStatus: "Pending",
      },
    ],
  },
  {
    id: "ISS-2026-0013",
    type: "Ward Requisition",
    from: "Central Store",
    dept: "Laboratory",
    items: 1,
    value: 57.6,
    requestedBy: "—",
    date: "Mar 30, 2026 12:22",
    status: "Approved",
    lineItems: [
      {
        name: "Saline Solution 500ml",
        quantity: 40,
        approvedQty: 40,
        approvalStatus: "Approved",
      },
    ],
  },
  {
    id: "ISS-2026-0014",
    type: "Patient Dispensing",
    from: "Pharmacy",
    dept: "Clinic / OPD",
    items: 1,
    value: 18.5,
    requestedBy: "—",
    date: "Mar 30, 2026 16:05",
    status: "Issued",
    lineItems: [
      {
        name: "Paracetamol 500mg",
        quantity: 100,
        approvedQty: 100,
        approvalStatus: "Approved",
      },
    ],
  },
  {
    id: "ISS-2026-0015",
    type: "Patient Dispensing",
    from: "Pharmacy",
    dept: "ICU",
    items: 1,
    value: 16.5,
    requestedBy: "—",
    date: "Mar 30, 2026 16:30",
    status: "Received",
    lineItems: [
      {
        name: "Antibiotic Ointment",
        quantity: 50,
        approvedQty: 50,
        approvalStatus: "Approved",
      },
    ],
  },
  {
    id: "ISS-2026-0016",
    type: "Ward Requisition",
    from: "Central Store",
    dept: "General Ward",
    items: 2,
    value: 89.5,
    requestedBy: "Nurse Smith",
    date: "Mar 28, 2026 14:20",
    status: "Pending",
    lineItems: [
      {
        name: "Bandages",
        quantity: 30,
        approvedQty: 30,
        approvalStatus: "Pending",
      },
      {
        name: "Antiseptic Solution",
        quantity: 10,
        approvedQty: 10,
        approvalStatus: "Pending",
      },
    ],
  },
];

const STOCK_ISSUE_STORAGE_KEY = "tia_stock_issues";
const loadIssues = () => {
  try {
    const s = localStorage.getItem(STOCK_ISSUE_STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
};
const saveIssues = (data) => {
  try {
    localStorage.setItem(STOCK_ISSUE_STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const ISSUE_TYPES = [
  "Ward Requisition",
  "Emergency Issue",
  "OT Request",
  "Patient Dispensing",
];

const getNextId = (list) => {
  const nums = list.map((r) => parseInt(r.id.split("-")[2]));
  return `ISS-2026-${String(Math.max(...nums) + 1).padStart(4, "0")}`;
};
const nowStr = () =>
  new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const getShortQty = (row) => {
  if (!row.lineItems) return 0;
  return row.lineItems.reduce((sum, item) => {
    // Only count items that have been approved (not pending or rejected)
    if (
      item.approvalStatus === "Pending" ||
      item.approvalStatus === "Rejected"
    ) {
      return sum;
    }
    const approved = item.approvedQty ?? item.quantity ?? 0;
    const received = item.receivedQty || 0;
    const short = approved - received;
    return sum + (short > 0 ? short : 0);
  }, 0);
};
// --- Chips --------------------------------------------------------------------

function ShortChip({ qty }) {
  if (!qty) return null;
  return (
    <Chip
      icon={
        <Box
          component="span"
          sx={{ display: "flex", alignItems: "center", pl: "4px" }}
        >
          ⚠
        </Box>
      }
      label={`${qty} short`}
      size="small"
      sx={{
        bgcolor: "#fffbeb",
        color: "#d97706",
        border: "1px solid #fde68a",
        fontWeight: 600,
        fontSize: 10,
        height: 20,
        mt: "4px",
        "& .MuiChip-icon": { fontSize: 10, color: "#d97706", ml: "4px" },
      }}
    />
  );
}
function StatusChip({ status }) {
  const map = {
    Pending: { bg: "#fef9c3", color: "#ca8a04" },
    Approved: { bg: "#dbeafe", color: "#0284c7" },
    "Partially Approved": { bg: "#fef3c7", color: "#d97706" },
    Issued: { bg: "#dcfce7", color: "#16a34a" },
    Received: { bg: "#f0fdf4", color: "#15803d" },
    "Partially Received": { bg: "#fef3c7", color: "#d97706" }, // Added this

    Rejected: { bg: "#fee2e2", color: "#dc2626" },
  };
  const s = map[status] || map.Pending;
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: s.bg,
        color: s.color,
        fontWeight: 600,
        fontSize: 11,
        height: 22,
        px: 0.2,
      }}
    />
  );
}
function TypeChip({ type }) {
  return (
    <Chip
      label={type}
      size="small"
      sx={{
        bgcolor: "#eff6ff",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
        fontWeight: 600,
        fontSize: 11,
        height: 22,
      }}
    />
  );
}
function DeptChip({ dept }) {
  const map = {
    ICU: { bg: "#fff7ed", color: "#1d4ed8", border: "#bfdbfe" },
    "OR / Surgery": { bg: "#faf5ff", color: "#DC2626", border: "#e93204" },
  };
  const c = map[dept] || { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
  return (
    <Chip
      label={dept}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
        fontSize: 11,
        height: 22,
      }}
    />
  );
}

// --- Approval Modal -----------------------------------------------------------
function ApprovalModal({ open, onClose, issue, onConfirm }) {
  if (!issue) return null;
  const allItems = issue.lineItems || [{ name: "Item", quantity: 1 }];
  const approvableItems = allItems.filter((item) => item.approvalStatus !== "Rejected");
  
  const [selected, setSelected] = useState(() => approvableItems.map((_, i) => i));
  const [approvedQty, setApprovedQty] = useState(() =>
    Object.fromEntries(
      approvableItems.map((it, i) => [i, it.quantity || it.approvedQty || 1]),
    ),
  );
  const [reason, setReason] = useState(() =>
    Object.fromEntries(approvableItems.map((_, i) => [i, ""])),
  );
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (open && issue) {
      const li = issue.lineItems || [{ name: "Item", quantity: 1 }];
      const nonRejected = li.filter((item) => item.approvalStatus !== "Rejected");
      
      setSelected(nonRejected.map((_, i) => i));
      setApprovedQty(
        Object.fromEntries(
          nonRejected.map((it, i) => [i, it.quantity || it.approvedQty || 1]),
        ),
      );
      setReason(Object.fromEntries(nonRejected.map((_, i) => [i, ""])));
      setSubmitted(false);
    }
  }, [open, issue]);

  const toggle = (idx) =>
    setSelected((p) =>
      p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx],
    );
  const toggleAll = () =>
    setSelected(selected.length === approvableItems.length ? [] : approvableItems.map((_, i) => i));

  const handleConfirm = () => {
    setSubmitted(true);
    const missingReason = selected.some((idx) => {
      const reqQty = approvableItems[idx].quantity;
      const appQty = Number(approvedQty[idx] ?? reqQty);
      return appQty < reqQty && !reason[idx]?.trim();
    });
    if (missingReason) return;

    const updatedItems = allItems.map((item) => {
      // If already rejected, keep it as is
      if (item.approvalStatus === "Rejected") {
        return item;
      }
      
      const appIdx = approvableItems.indexOf(item);
      
      // If not selected = Pending (can be approved later)
      if (!selected.includes(appIdx)) {
        return { ...item, approvalStatus: "Pending", approvedQty: 0 };
      }
      
      const reqQty = item.quantity;
      const appQty = Number(approvedQty[appIdx] ?? reqQty);
      let approvalStatus;
      if (appQty === 0) {
        approvalStatus = "Pending";
      } else if (appQty < reqQty) {
        approvalStatus = "Partially Approved";
      } else {
        approvalStatus = "Approved";
      }
      return {
        ...item,
        approvalStatus: approvalStatus,
        approvedQty: appQty,
        approvalReason: reason[appIdx] || "",
      };
    });

    // Determine overall status
    const statuses = updatedItems.map((item) => item.approvalStatus);
    const allPending = statuses.every((s) => s === "Pending");
    const allApproved = statuses.every((s) => s === "Approved");

    let overallStatus;
    if (allPending) {
      overallStatus = "Pending";
    } else if (allApproved) {
      overallStatus = "Approved";
    } else {
      overallStatus = "Partially Approved";
    }

    onConfirm({ ...issue, lineItems: updatedItems, status: overallStatus });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: "10px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
          overflow: "hidden",
          maxHeight: "78vh",
          width: "600px",
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: "14px",
          pt: "12px",
          pb: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box
            sx={{
              width: 27,
              height: 27,
              borderRadius: "7px",
              bgcolor: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 15, color: "#16a34a" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
              Approve Issue — {issue?.id}
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>
              Select items to approve. Set approved quantity and provide a reason for partial approvals.
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disableRipple
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            width: 24,
            height: 24,
            "&:hover": { bgcolor: "#f3f4f6" },
            "&:focus": { outline: "none" },
          }}
        >
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: "14px",
          py: "10px",
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
          scrollbarWidth: "thin",
          scrollbarColor: "#d1d5db transparent",
        }}
      >
        {/* Meta info */}
        <Box
          sx={{
            mb: "9px",
            pb: "9px",
            borderBottom: "1px solid #f3f4f6",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "7px",
          }}
        >
          {[
            { l: "Issue ID", v: issue?.id },
            { l: "Type", v: issue?.type },
            { l: "Department", v: issue?.dept },
            { l: "Store", v: issue?.from },
          ].map((f) => (
            <Box key={f.l}>
              <Typography
                sx={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: "2px",
                }}
              >
                {f.l}
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
                {f.v}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Select All */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            mb: "7px",
            pb: "7px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <Checkbox
            size="small"
            checked={selected.length === approvableItems.length && approvableItems.length > 0}
            indeterminate={selected.length > 0 && selected.length < approvableItems.length}
            onChange={toggleAll}
            sx={{
              p: 0,
              color: "#16a34a",
              "&.Mui-checked": { color: "#16a34a" },
            }}
          />
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
            Select All ({approvableItems.length} item{approvableItems.length !== 1 ? "s" : ""})
          </Typography>
        </Box>

        {/* Column headers */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "26px 20px 1fr 55px 55px 1fr",
            gap: "5px",
            px: "9px",
            mb: "4px",
            alignItems: "center",
          }}
        >
          <Box />
          <Box />
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Item Name
          </Typography>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Req.
          </Typography>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Appr.
          </Typography>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Reason <span style={{ fontWeight: 400 }}>(if reduced)</span>
          </Typography>
        </Box>

        {/* Item rows */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {allItems.map((item, origIdx) => {
            const isRejected = item.approvalStatus === "Rejected";
            const appIdx = isRejected ? -1 : approvableItems.indexOf(item);
            
            const reqQty = item.quantity;
            const isChecked = !isRejected && selected.includes(appIdx);
            const appQty = isRejected ? 0 : (approvedQty[appIdx] ?? reqQty);
            const isPartial = isChecked && Number(appQty) < reqQty && Number(appQty) > 0;
            const missingReason = submitted && isChecked && isPartial && !reason[appIdx]?.trim();

            return (
              <Box key={origIdx}>
                <Box
                  onClick={() => !isRejected && toggle(appIdx)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "26px 20px 1fr 55px 55px 1fr",
                    gap: "5px",
                    alignItems: "center",
                    p: "6px 9px",
                    borderRadius: "7px",
                    border: `1px solid ${
                      isRejected 
                        ? "#fecaca"
                        : isChecked 
                          ? (isPartial ? "#fde68a" : "#bbf7d0") 
                          : "#e5e7eb"
                    }`,
                    bgcolor: isRejected
                      ? "#fff5f5"
                      : isChecked
                        ? (isPartial ? "#fffbeb" : "#f0fdf4")
                        : "#f9fafb",
                    cursor: isRejected ? "default" : "pointer",
                    opacity: isRejected ? 0.7 : 1,
                    transition: "all 0.12s",
                    "&:hover": {
                      borderColor: isRejected ? "#fecaca" : (isChecked ? (isPartial ? "#f59e0b" : "#bbf7d0") : "#bbf7d0"),
                      bgcolor: isRejected ? "#fff5f5" : (isChecked ? (isPartial ? "#fffbeb" : "#f0fdf4") : "#f0fdf4"),
                    },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isChecked}
                    onChange={() => !isRejected && toggle(appIdx)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isRejected}
                    sx={{
                      p: 0,
                      color: "#16a34a",
                      "&.Mui-checked": { color: "#16a34a" },
                      "&.Mui-disabled": { opacity: 0.5 },
                    }}
                  />

                  <Box
                    sx={{
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      bgcolor: isRejected ? "#fee2e2" : "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: isRejected ? "#dc2626" : "#6b7280" }}>
                      {origIdx + 1}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name || item.description}
                    </Typography>
                    {isRejected && (
                      <Box
                        component="span"
                        sx={{
                          px: "6px",
                          py: "1px",
                          borderRadius: "3px",
                          bgcolor: "#fee2e2",
                          color: "#dc2626",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "inline-block",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        Rejected
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#374151" }}>
                      {reqQty}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                    <TextField
                      size="small"
                      type="number"
                      value={appQty}
                      disabled={!isChecked || isRejected}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(Number(e.target.value) || 0, reqQty),
                        );
                        setApprovedQty((p) => ({ ...p, [appIdx]: val }));
                      }}
                      inputProps={{
                        min: 0,
                        max: reqQty,
                        style: {
                          textAlign: "center",
                          padding: "3px 4px",
                          fontSize: 12,
                          fontWeight: 700,
                        },
                      }}
                      sx={{
                        width: "55px",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          bgcolor: isChecked && !isRejected ? "#fff" : "#f3f4f6",
                          "& fieldset": {
                            borderColor: isPartial
                              ? "#f59e0b"
                              : "#d1d5db",
                          },
                          "&:hover fieldset": {
                            borderColor: isPartial
                              ? "#d97706"
                              : "#9ca3af",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#2563eb",
                            borderWidth: "1.5px",
                          },
                        },
                        "& input[type=number]": { MozAppearance: "textfield" },
                        "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" },
                        "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" },
                      }}
                    />
                  </Box>

                  <Box onClick={(e) => e.stopPropagation()}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={isPartial ? "Reason required *" : "Reason (optional)"}
                      value={isRejected ? "" : (reason[appIdx] || "")}
                      disabled={!isChecked || isRejected}
                      onChange={(e) =>
                        setReason((p) => ({ ...p, [appIdx]: e.target.value }))
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          fontSize: 11,
                          borderRadius: "6px",
                          bgcolor: isChecked && !isRejected ? "#fff" : "#f3f4f6",
                          "& fieldset": {
                            borderColor: missingReason
                              ? "#ef4444"
                              : "#d1d5db",
                          },
                          "&:hover fieldset": { borderColor: "#9ca3af" },
                          "&.Mui-focused fieldset": {
                            borderColor: "#2563eb",
                            borderWidth: "1.5px",
                          },
                        },
                        "& .MuiInputBase-input": { py: "5px", px: "8px" },
                      }}
                    />
                    {missingReason && (
                      <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "1px" }}>
                        Required for reduced approval
                      </Typography>
                    )}
                  </Box>
                </Box>

                {isPartial && (
                  <Box
                    sx={{
                      ml: "50px",
                      mt: "3px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      px: "8px",
                      py: "2px",
                      borderRadius: "5px",
                      bgcolor: "#fffbeb",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        bgcolor: "#f59e0b",
                      }}
                    />
                    <Typography sx={{ fontSize: 10, color: "#92400e", fontWeight: 600 }}>
                      Approving {appQty} of {reqQty} — the remaining {reqQty - appQty} is rejected
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          px: "14px",
          py: "10px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: 11.5, color: "#9ca3af" }}>
          {selected.length} of {approvableItems.length} selected
        </Typography>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Button
            onClick={onClose}
            disableRipple
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "#374151",
              textTransform: "none",
              borderRadius: "6px",
              px: "14px",
              py: "6px",
              border: "1px solid #e5e7eb",
              bgcolor: "#fff",
              outline: "none",
              "&:hover": { bgcolor: "#f9fafb" },
              "&:focus": { outline: "none" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            disableRipple
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "6px",
              px: "14px",
              py: "6px",
              bgcolor: "#16a34a",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
              outline: "none",
              "&:hover": { bgcolor: "#15803d" },
              "&:focus": { outline: "none" },
              "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
            }}
          >
            Approve ({selected.length})
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
// --- Reject Modal (Stock Issue) ------------------------------------------------
function RejectModal({ open, onClose, issue, onConfirm }) {
  const [selected, setSelected] = useState([]);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (open && issue) {
      // Pre-select only items that are still Pending (not Approved/Rejected/Partially Approved)
      const items = issue.lineItems || [];
      const pendingIndices = items
        .map((item, i) => !item.approvalStatus || item.approvalStatus === "Pending" ? i : null)
        .filter((i) => i !== null);
      setSelected(pendingIndices);
      setReason("");
      setSubmitted(false);
    }
  }, [open, issue]);

  if (!issue) return null;
  const lineItems = issue.lineItems || [];
  
  // Only show pending items that can be rejected
  const rejectableItems = lineItems.filter((item) => !item.approvalStatus || item.approvalStatus === "Pending");

  const toggle = (idx) =>
    setSelected((p) =>
      p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx],
    );

  const handleConfirm = () => {
    setSubmitted(true);
    if (!reason.trim()) return;
    if (selected.length === 0) return;

    // Mark selected items as Rejected
    const updatedItems = lineItems.map((item, idx) => {
      if (selected.includes(idx)) {
        return {
          ...item,
          approvalStatus: "Rejected",
          rejectionReason: reason,
        };
      }
      return item;
    });

    onConfirm(issue.id, updatedItems, reason);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: "10px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
          overflow: "hidden",
          width: "520px",
          maxWidth: "520px",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: "14px",
          pt: "12px",
          pb: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box
            sx={{
              width: 27,
              height: 27,
              borderRadius: "7px",
              bgcolor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Close sx={{ fontSize: 14, color: "#dc2626" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
              Reject Items — {issue?.id}
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>
              Select items to reject and provide a reason.
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disableRipple
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            width: 24,
            height: 24,
            p: 0,
            "&:hover": { bgcolor: "#f3f4f6" },
          }}
        >
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: "14px",
          py: "10px",
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: 4,
          },
        }}
      >
        {/* Meta info */}
        <Box
          sx={{
            mb: "9px",
            pb: "9px",
            borderBottom: "1px solid #f3f4f6",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "7px",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: "2px",
              }}
            >
              Issue ID
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
              {issue?.id}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: "2px",
              }}
            >
              From → To
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
              {issue?.from} → {issue?.dept}
            </Typography>
          </Box>
        </Box>

        {/* Item list */}
        {lineItems.length > 0 ? (
          <Box sx={{ mb: "10px" }}>
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: "5px",
              }}
            >
              Select Items to Reject
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "26px 1fr 52px", gap: "7px", px: "8px", mb: "4px" }}>
              <Box />
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Item Name
              </Typography>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>
                QTY
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {lineItems.map((item, idx) => {
                const isPending = !item.approvalStatus || item.approvalStatus === "Pending";
                const isApproved = item.approvalStatus === "Approved" || item.approvalStatus === "Partially Approved";
                const isRejected = item.approvalStatus === "Rejected";
                const isSelected = selected.includes(idx);
                
                return (
                  <Box
                    key={idx}
                    onClick={() => isPending && toggle(idx)}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "26px 1fr 52px",
                      gap: "7px",
                      alignItems: "center",
                      px: "8px",
                      py: "6px",
                      borderRadius: "6px",
                      bgcolor: isRejected ? "#fff5f5" : (isApproved ? "#f0fdf4" : (isSelected ? "#fff5f5" : "#f9fafb")),
                      border: `1px solid ${isRejected ? "#fecaca" : (isApproved ? "#bbf7d0" : (isSelected ? "#fecaca" : "#e5e7eb"))}`,
                      cursor: isPending ? "pointer" : "default",
                      opacity: isPending ? 1 : 0.6,
                      transition: "all 0.12s",
                      "&:hover": {
                        bgcolor: isPending ? (isSelected ? "#fff5f5" : "#f3f4f6") : (isRejected ? "#fff5f5" : "#f0fdf4"),
                        borderColor: isPending ? (isSelected ? "#f87171" : "#d1d5db") : "inherit",
                      },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => isPending && toggle(idx)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={!isPending}
                      sx={{
                        p: 0,
                        color: "#dc2626",
                        "&.Mui-checked": { color: "#dc2626" },
                        "&.Mui-disabled": { opacity: 0.5 },
                      }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          bgcolor: isRejected ? "#fecaca" : (isApproved ? "#bbf7d0" : "#fee2e2"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Typography sx={{ fontSize: 8, fontWeight: 700, color: isRejected ? "#dc2626" : (isApproved ? "#16a34a" : "#dc2626") }}>
                          {idx + 1}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          color: "#374151",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name || item.description || "Unknown Item"}
                      </Typography>
                      {isApproved && (
                        <Box
                          sx={{
                            px: "6px",
                            py: "1px",
                            borderRadius: "3px",
                            bgcolor: "#f0fdf4",
                            color: "#16a34a",
                            fontSize: 9,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          Approved
                        </Box>
                      )}
                      {isRejected && (
                        <Box
                          sx={{
                            px: "6px",
                            py: "1px",
                            borderRadius: "3px",
                            bgcolor: "#fee2e2",
                            color: "#dc2626",
                            fontSize: 9,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          Rejected
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
                        {item.quantity || item.approvedQty || 0}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: "#9ca3af" }}>units</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: "10px", p: "12px", textAlign: "center", borderRadius: "6px", bgcolor: "#f3f4f6" }}>
            <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
              No items available.
            </Typography>
          </Box>
        )}

        {/* Rejection reason */}
        <Typography
          sx={{
            fontSize: 9,
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            mb: "6px",
          }}
        >
          Rejection Reason <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Explain why these items are being rejected..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: 11.5,
              borderRadius: "6px",
              "& fieldset": {
                borderColor: submitted && !reason.trim() ? "#ef4444" : "#d1d5db",
              },
              "&:hover fieldset": { borderColor: "#9ca3af" },
              "&.Mui-focused fieldset": {
                borderColor: "#dc2626",
                borderWidth: "1.5px",
              },
            },
            "& .MuiInputBase-input": { py: "7px", px: "10px" },
          }}
        />
        {submitted && !reason.trim() && (
          <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "3px" }}>
            Reason is required
          </Typography>
        )}
      </DialogContent>

      <Box
        sx={{
          px: "14px",
          py: "10px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: 11.5, color: "#9ca3af" }}>
          {selected.length} of {rejectableItems.length} selected
        </Typography>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Button
            onClick={onClose}
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "#374151",
              textTransform: "none",
              borderRadius: "6px",
              px: "14px",
              py: "6px",
              border: "1px solid #e5e7eb",
              bgcolor: "#fff",
              "&:hover": { bgcolor: "#f9fafb" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.length === 0 || rejectableItems.length === 0}
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "6px",
              px: "14px",
              py: "6px",
              bgcolor: "#dc2626",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
              "&:hover": { bgcolor: "#b91c1c" },
              "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
            }}
          >
            Reject ({selected.length})
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

// --- Confirm Receive Modal ----------------------------------------------------
function ConfirmReceiveModal({ open, onClose, issue, onConfirm }) {
  const [receivedQty, setReceivedQty] = useState({});
  const [remarks, setRemarks] = useState("");
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (open && issue) {
      // Initialize received quantities using original item indices
      setReceivedQty(
        Object.fromEntries(
          (issue.lineItems || []).map((it, i) => [
            i,
            it.approvedQty || it.quantity || 0,
          ]),
        ),
      );
      setRemarks("");
      setSubmitted(false);
    }
  }, [open, issue]);

  if (!issue) return null;
  
  const allItems = issue.lineItems || [];
  // Only process approved items — exclude items that are pending or rejected
  const approvableItems = allItems.filter(
    (it) =>
      !it.approvalStatus ||
      it.approvalStatus === "Approved" ||
      it.approvalStatus === "Partially Approved",
  );

  // Create mapping from original index to approvable item
  const indexMap = allItems
    .map((item, i) =>
      !item.approvalStatus ||
      item.approvalStatus === "Approved" ||
      item.approvalStatus === "Partially Approved"
        ? i
        : null,
    )
    .filter((i) => i !== null);

  const handleConfirm = () => {
    setSubmitted(true);
    if (!remarks.trim()) return;

    const updatedItems = allItems.map((item, origIdx) => {
      const isApprovable = indexMap.includes(origIdx);
      
      if (!isApprovable) {
        // Keep non-approvable items as-is
        return item;
      }
      
      return {
        ...item,
        receivedQty: Number(receivedQty[origIdx] ?? (item.approvedQty || item.quantity || 0)),
      };
    });

    // Check receipt status for approvable items only
    const approvableUpdated = updatedItems.filter((_, idx) => indexMap.includes(idx));
    
    const allFullyReceived = approvableUpdated.every((item) => {
      const approvedQty = item.approvedQty || item.quantity || 0;
      const received = item.receivedQty || 0;
      return received >= approvedQty;
    });

    const hasPartial = approvableUpdated.some((item) => {
      const approvedQty = item.approvedQty || item.quantity || 0;
      const received = item.receivedQty || 0;
      return received > 0 && received < approvedQty;
    });

    const allRejected = approvableUpdated.every((item) => {
      const received = item.receivedQty || 0;
      return received === 0;
    });

    // Determine overall receipt status
    let receiptStatus;
    if (approvableUpdated.length === 0) {
      receiptStatus = "Received"; // No approvable items to receive
    } else if (allRejected) {
      receiptStatus = "Rejected";
    } else if (allFullyReceived) {
      receiptStatus = "Received";
    } else if (hasPartial) {
      receiptStatus = "Partially Received";
    } else {
      receiptStatus = "Received";
    }

    onConfirm({
      ...issue,
      lineItems: updatedItems,
      status: receiptStatus,
      remarks,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: "10px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
          overflow: "hidden",
          width: "540px",
          maxWidth: "540px",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          px: "14px",
          pt: "12px",
          pb: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box
            sx={{
              width: 27,
              height: 27,
              borderRadius: "7px",
              bgcolor: "#ecfeff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoveToInbox sx={{ fontSize: 14, color: "#0891b2" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
              Confirm Receipt — {issue?.id}
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>
              Verify received quantities and add remarks.
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disableRipple
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            width: 24,
            height: 24,
            p: 0,
            "&:hover": { bgcolor: "#f3f4f6" },
          }}
        >
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: "20px",
          py: "14px",
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: 4,
          },
        }}
      >
        <Box
          sx={{
            mb: "12px",
            pb: "12px",
            borderBottom: "1px solid #f3f4f6",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {[
            { l: "Issue ID", v: issue?.id },
            { l: "Type", v: issue?.type },
            { l: "Department", v: issue?.dept },
            { l: "Store", v: issue?.from },
          ].map((f) => (
            <Box key={f.l}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: "3px",
                }}
              >
                {f.l}
              </Typography>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}
              >
                {f.v}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Items table header */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 50px 50px", gap: "6px", px: "8px", mb: "4px" }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Item Name</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Appr.</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Recv.</Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", mb: "10px" }}>
          {approvableItems.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: "#9ca3af", textAlign: "center", py: 1 }}>No items to receive.</Typography>
          ) : approvableItems.map((item, displayIdx) => {
            const origIdx = indexMap[displayIdx];
            const approvedQty = item.approvedQty || item.quantity || 0;
            const recQty = receivedQty[origIdx] ?? approvedQty;
            const isPartial = recQty > 0 && recQty < approvedQty;
            const isFull = recQty === approvedQty;

            return (
              <Box
                key={origIdx}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 50px 50px",
                  gap: "6px",
                  alignItems: "center",
                  px: "8px",
                  py: "7px",
                  borderRadius: "7px",
                  bgcolor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.name || item.description || "Item"}
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>
                  {approvedQty}
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={recQty}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(Number(e.target.value) || 0, approvedQty));
                    setReceivedQty((p) => ({ ...p, [origIdx]: val }));
                  }}
                  inputProps={{
                    min: 0,
                    max: approvedQty,
                    style: { textAlign: "center", padding: "3px 4px", fontSize: 12, fontWeight: 700 },
                  }}
                  sx={{
                    width: "50px",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      bgcolor: "#fff",
                      "& fieldset": { borderColor: "#d1d5db" },
                      "&:hover fieldset": { borderColor: "#9ca3af" },
                      "&.Mui-focused fieldset": { borderColor: "#0891b2", borderWidth: "1.5px" },
                    },
                    "& input[type=number]": { MozAppearance: "textfield" },
                    "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" },
                    "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" },
                  }}
                />
              </Box>
            );
          })}
        </Box>

        <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "6px" }}>
          Remarks <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add remarks..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: 12,
              borderRadius: "6px",
              "& fieldset": {
                borderColor:
                  submitted && !remarks.trim() ? "#ef4444" : "#d1d5db",
              },
              "&:hover fieldset": { borderColor: "#9ca3af" },
              "&.Mui-focused fieldset": {
                borderColor: "#0891b2",
                borderWidth: "1.5px",
              },
            },
            "& .MuiInputBase-input": { py: "8px", px: "10px" },
          }}
        />
        {submitted && !remarks.trim() && (
          <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
            Remarks are required
          </Typography>
        )}
      </DialogContent>

      <Box
        sx={{
          px: "20px",
          py: "12px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "10px",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          disableRipple
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            textTransform: "none",
            borderRadius: "8px",
            px: "20px",
            py: "8px",
            border: "1px solid #e5e7eb",
            bgcolor: "#fff",
            outline: "none",
            "&:hover": { bgcolor: "#f9fafb" },
            "&:focus": { outline: "none" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disableRipple
          sx={{
            fontSize: 13,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            px: "20px",
            py: "8px",
            bgcolor: "#0891b2",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(8,145,178,0.3)",
            outline: "none",
            "&:hover": { bgcolor: "#0e7490" },
            "&:focus": { outline: "none" },
          }}
        >
          Confirm Receipt
        </Button>
      </Box>
    </Dialog>
  );
}

function MarkDamagedModal({ open, onClose, issue, onConfirm }) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setSubmitted(false);
    }
  }, [open]);

  if (!issue) return null;

  const shortItems = (issue.lineItems || [])
    .filter(
      (item) =>
        item.approvalStatus !== "Pending" && item.approvalStatus !== "Rejected",
    )
    .map((item) => {
      const approved = item.approvedQty ?? item.quantity ?? 0;
      const received = item.receivedQty || 0;
      const short = approved - received;
      return { ...item, short };
    })
    .filter((item) => item.short > 0);

  const totalShortUnits = shortItems.reduce((s, i) => s + i.short, 0);

  const handleConfirm = () => {
    setSubmitted(true);
    if (!reason.trim()) return;
    onConfirm(issue, shortItems, reason);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          maxHeight: "85vh",
          maxWidth: "440px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: "20px",
          pt: "16px",
          pb: "12px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              bgcolor: "#fff7ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inventory2Outlined sx={{ fontSize: 18, color: "#d97706" }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}
            >
              Mark as Damaged — {issue?.id}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>
              Log the short-delivered quantity as damaged stock.
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disableRipple
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            width: 30,
            height: 30,
            outline: "none",
            "&:hover": { bgcolor: "#f3f4f6", color: "#374151" },
            "&:focus": { outline: "none" },
          }}
        >
          <Close sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: "20px",
          py: "14px",
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: 4,
          },
        }}
      >
        <Box
          sx={{
            mb: "14px",
            p: "12px",
            borderRadius: "8px",
            bgcolor: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: "#b45309",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              mb: "8px",
            }}
          >
            Short Items ({totalShortUnits} units)
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {shortItems.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                >
                  {item.name || item.description || "Item"}
                </Typography>
                <Chip
                  label={`${item.short} short`}
                  size="small"
                  sx={{
                    bgcolor: "#fef3c7",
                    color: "#b45309",
                    fontWeight: 700,
                    fontSize: 11,
                    height: 22,
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            mb: "8px",
          }}
        >
          Reason <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="e.g. Damaged in transit, broken packaging..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: 12,
              borderRadius: "6px",
              "& fieldset": {
                borderColor:
                  submitted && !reason.trim() ? "#ef4444" : "#d1d5db",
              },
              "&:hover fieldset": { borderColor: "#9ca3af" },
              "&.Mui-focused fieldset": {
                borderColor: "#d97706",
                borderWidth: "1.5px",
              },
            },
            "& .MuiInputBase-input": { py: "8px", px: "10px" },
          }}
        />
        {submitted && !reason.trim() && (
          <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "4px" }}>
            Reason is required
          </Typography>
        )}
      </DialogContent>

      <Box
        sx={{
          px: "20px",
          py: "12px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "10px",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          disableRipple
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            textTransform: "none",
            borderRadius: "8px",
            px: "20px",
            py: "8px",
            border: "1px solid #e5e7eb",
            bgcolor: "#fff",
            outline: "none",
            "&:hover": { bgcolor: "#f9fafb" },
            "&:focus": { outline: "none" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disableRipple
          sx={{
            fontSize: 13,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            px: "20px",
            py: "8px",
            bgcolor: "#d97706",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(217,119,6,0.3)",
            outline: "none",
            "&:hover": { bgcolor: "#b45309" },
            "&:focus": { outline: "none" },
          }}
        >
          Mark as Damaged
        </Button>
      </Box>
    </Dialog>
  );
}
// --- View Dialog (Stock Issue Modal) -------------------------------------------
function ViewDialog({ open, onClose, row }) {
  if (!row) return null;
  const allItems = row.lineItems || [];

  // Show all items (including pending/rejected) for complete visibility
  const lineItems = allItems;

  // Show received column if issue has been issued
  const showReceivedColumn =
    row.status === "Issued" ||
    row.status === "Received" ||
    row.status === "Partially Received";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: "10px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
          overflow: "hidden",
          width: "540px",
          maxWidth: "540px",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: "14px",
          pt: "12px",
          pb: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box
            sx={{
              width: 27,
              height: 27,
              borderRadius: "7px",
              bgcolor: "#ecfeff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoveToInbox sx={{ fontSize: 14, color: "#0891b2" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
              Issue Details — {row?.id}
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>
              View requisition details and items.
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disableRipple
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            width: 24,
            height: 24,
            p: 0,
            "&:hover": { bgcolor: "#f3f4f6" },
          }}
        >
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: "20px",
          py: "14px",
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: 4,
          },
        }}
      >
        {/* Metadata Section */}
        <Box
          sx={{
            mb: "12px",
            pb: "12px",
            borderBottom: "1px solid #f3f4f6",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {[
            { l: "From (Store)", v: row?.from },
            { l: "To (Department)", v: row?.dept },
          ].map((f) => (
            <Box key={f.l}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: "2px",
                }}
              >
                {f.l}
              </Typography>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}
              >
                {f.v}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Items table header */}
        <Box sx={{ display: "grid", gridTemplateColumns: showReceivedColumn ? "1fr 50px 50px 50px 60px" : "1fr 50px 50px 60px", gap: "6px", px: "8px", mb: "4px" }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Item Name</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Req.</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Appr.</Typography>
          {showReceivedColumn && (
            <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Recv.</Typography>
          )}
          {showReceivedColumn && (
            <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Status</Typography>
          )}
          {!showReceivedColumn && (
            <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Status</Typography>
          )}
        </Box>

        {/* Items rows */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", mb: "10px" }}>
          {lineItems.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: "#9ca3af", textAlign: "center", py: 1 }}>No items.</Typography>
          ) : lineItems.map((item, idx) => {
            const reqQty = item.quantity || 0;
            const appQty = item.approvedQty ?? "—";
            const recQty = item.receivedQty ?? "—";
            
            // Determine status: if issue has been received, show receipt status; otherwise show approval status
            let displayStatus, statusColor;
            if (showReceivedColumn) {
              // Issue is Received/Partially Received - show receipt status
              const approvedQty = item.approvedQty || item.quantity || 0;
              const receivedQty = item.receivedQty || 0;
              if (receivedQty === 0) {
                displayStatus = "Not Received";
                statusColor = "#9ca3af";
              } else if (receivedQty >= approvedQty) {
                displayStatus = "Received";
                statusColor = "#0891b2";
              } else {
                displayStatus = "Partially Received";
                statusColor = "#d97706";
              }
            } else {
              // Issue is Pending/Approved - show approval status
              displayStatus = item.approvalStatus || "Pending";
              statusColor =
                displayStatus === "Approved"
                  ? "#16a34a"
                  : displayStatus === "Partially Approved"
                    ? "#d97706"
                    : displayStatus === "Rejected"
                      ? "#dc2626"
                      : "#ca8a04";
            }

            return (
              <Box
                key={idx}
                sx={{
                  display: "grid",
                  gridTemplateColumns: showReceivedColumn ? "1fr 50px 50px 50px 60px" : "1fr 50px 50px 60px",
                  gap: "6px",
                  alignItems: "center",
                  px: "8px",
                  py: "7px",
                  borderRadius: "7px",
                  bgcolor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name || item.description || "Item"}
                  </Typography>
                  {item.approvalStatus === "Rejected" && (
                    <Box
                      sx={{
                        px: "6px",
                        py: "1px",
                        borderRadius: "3px",
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        fontSize: 10,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      Rejected
                    </Box>
                  )}
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "center" }}>
                  {reqQty}
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>
                  {appQty}
                </Typography>
                {showReceivedColumn && (
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0891b2", textAlign: "center" }}>
                    {recQty}
                  </Typography>
                )}
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: statusColor, textAlign: "center" }}>
                  {displayStatus}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          px: "20px",
          py: "12px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "10px",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          disableRipple
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            textTransform: "none",
            borderRadius: "8px",
            px: "20px",
            py: "8px",
            border: "1px solid #e5e7eb",
            bgcolor: "#fff",
            outline: "none",
            "&:hover": { bgcolor: "#f9fafb" },
            "&:focus": { outline: "none" },
          }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
}
// --- Main Component -----------------------------------------------------------
export default function StockIssue() {
  const { can } = usePermissions();
  const { inventoryItems, updateItem, addItem } = useInventory();
  const location = useLocation();

  const navigate = useNavigate();
  const [damagedRow, setDamagedRow] = useState(null);
  const [damagedOpen, setDamagedOpen] = useState(false);

  const [issues, setIssues] = useState(() => loadIssues() ?? INITIAL_ISSUES);
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [approvalRow, setApprovalRow] = useState(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [rejectRow, setRejectRow] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirmReceiveRow, setConfirmReceiveRow] = useState(null);
  const [confirmReceiveOpen, setConfirmReceiveOpen] = useState(false);
  const [remainingRow, setRemainingRow] = useState(null);
  const [remainingOpen, setRemainingOpen] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [highlightId, setHighlightId] = useState(null);
  const highlightTimer = useRef(null);
  const rowRefs = useRef({});
  const issuesRef = useRef(issues);
  issuesRef.current = issues;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightIssueId = params.get("highlight");
    if (highlightIssueId) {
      setHighlightId(highlightIssueId);
      const timer = setTimeout(() => setHighlightId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  useEffect(() => {
    saveIssues(issues);
  }, [issues]);

  const showToast = (msg, severity = "success") =>
    setToast({ open: true, msg, severity });

  // -- Stats ------------------------------------------------------------------
  const issued = issues.filter((i) => i.status === "Issued");
  const pending = issues.filter((i) => i.status === "Pending");
  const issuedVal = issued.reduce((s, i) => s + i.value, 0);
  const deptCount = issued.reduce((acc, i) => {
    acc[i.dept] = (acc[i.dept] || 0) + 1;
    return acc;
  }, {});
  const mostActive =
    Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const statCards = [
    {
      label: "Total Issues",
      value: issues.length,
      sub: "All issues",
      iconBg: "#f59e0b",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 17H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-4" />
          <rect x="9" y="3" width="6" height="14" rx="1" />
        </svg>
      ),
    },
    {
      label: "Issued",
      value: issued.length,
      sub: `$${issuedVal.toFixed(0)} total value`,
      iconBg: "#10b981",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: "Pending",
      value: pending.length,
      sub: "Awaiting approval",
      iconBg: "#8b5cf6",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Most Active Dept",
      value: mostActive,
      sub: "Highest issue volume",
      iconBg: "#f59e0b",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  const filtered = issues.filter((i) => {
    const matchType = typeFilter === "All Types" || i.type === typeFilter;
    const matchStatus =
      statusFilter === "All Statuses" || i.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      i.id.toLowerCase().includes(q) ||
      i.dept.toLowerCase().includes(q) ||
      i.requestedBy.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedRows = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, searchTerm]);

  // -- Handlers ---------------------------------------------------------------
  const approve = (id) => {
    const issue = issues.find((i) => i.id === id);
    if (issue) {
      setApprovalRow(issue);
      setApprovalOpen(true);
    }
  };

  const handleApprovalConfirm = (approvedIssue) => {
    setIssues((p) =>
      p.map((i) => (i.id === approvedIssue.id ? approvedIssue : i)),
    );
    showToast(
      `${approvedIssue.id} ${approvedIssue.status === "Partially Approved" ? "partially approved" : "approved"}.`,
    );
  };

  // Open approval modal for only the remaining Pending items
  const approveRemaining = (id) => {
    const issue = issues.find((i) => i.id === id);
    if (!issue) return;
    const pendingItems = (issue.lineItems || []).filter(
      (it) => it.approvalStatus === "Pending" || !it.approvalStatus,
    );
    if (!pendingItems.length) return;
    setRemainingRow({ ...issue, lineItems: pendingItems });
    setRemainingOpen(true);
  };

  const handleRemainingConfirm = (result) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== result.id) return issue;
        // Replace pending items with newly approved ones, keep all other items intact
        const nonPending = (issue.lineItems || []).filter(
          (it) => it.approvalStatus !== "Pending" && it.approvalStatus,
        );
        const merged = [...nonPending, ...result.lineItems];

        // Check status of all items
        const hasPending = merged.some((it) => it.approvalStatus === "Pending");
        const hasApproved = merged.some(
          (it) =>
            it.approvalStatus === "Approved" ||
            it.approvalStatus === "Partially Approved",
        );

        // Determine overall status
        let newStatus;
        if (hasPending && hasApproved) {
          newStatus = "Partially Approved";
        } else if (hasPending && !hasApproved) {
          newStatus = "Pending";
        } else {
          // No pending items, all are approved
          newStatus = "Approved";
        }

        return { ...issue, lineItems: merged, status: newStatus };
      }),
    );
    showToast(`Remaining items approved for ${result.id}.`);
  };
  const reject = (id) => {
    const issue = issues.find((i) => i.id === id);
    if (issue) {
      setRejectRow(issue);
      setRejectOpen(true);
    }
  };

  const handleReject = (id, updatedItems, reason) => {
    setIssues((p) =>
      p.map((i) => {
        if (i.id === id) {
          // Merge rejected items with existing lineItems
          const mergedItems = (i.lineItems || []).map((item, idx) => {
            const updatedItem = updatedItems.find((u) => 
              u.name === item.name && u.quantity === item.quantity
            );
            return updatedItem || item;
          });
          return { ...i, lineItems: mergedItems };
        }
        return i;
      }),
    );
    showToast(`Items rejected.`, "warning");
  };

  const issueApproved = (id) => {
    setIssues((p) =>
      p.map((i) => {
        if (i.id === id) {
          // Check if there are any approved items to issue
          const hasApprovedItems = (i.lineItems || []).some(
            (it) =>
              it.approvalStatus === "Approved" ||
              it.approvalStatus === "Partially Approved",
          );
          if (hasApprovedItems) {
            return { ...i, status: "Issued" };
          }
          return i;
        }
        return i;
      }),
    );
    showToast(`${id} issued.`);
  };

  const confirmReceive = (id) => {
    const issue = issues.find((i) => i.id === id);
    if (issue) {
      setConfirmReceiveRow(issue);
      setConfirmReceiveOpen(true);
    }
  };

  const handleConfirmReceive = (receivedIssue) => {
    setIssues((p) =>
      p.map((i) =>
        i.id === receivedIssue.id
          ? { ...receivedIssue, status: receivedIssue.status }
          : i,
      ),
    );

    // Update inventory based on received items
    // Only proceed if inventoryItems is available
    if (!inventoryItems || !Array.isArray(inventoryItems)) {
      showToast("Inventory data not available. Please try again.", "error");
      return;
    }

    const toLocation = (receivedIssue.dept || "").trim(); // "TO" location (destination department)
    const fromLocation = (receivedIssue.from || "").trim(); // "FROM" location (source store)

    (receivedIssue.lineItems || []).forEach((item) => {
      const receivedQty = item.receivedQty || 0;
      if (receivedQty <= 0) return;

      // Decrease quantity at FROM location
      const fromItem = inventoryItems.find(
        (inv) => inv.name && inv.name.toLowerCase() === (item.name || "").toLowerCase() && (inv.location || "").trim() === fromLocation
      );
      if (fromItem) {
        const newFromQty = Math.max(0, (fromItem.qty || 0) - receivedQty);
        updateItem(fromItem.id, { qty: newFromQty });
      }

      // Increase quantity at TO location (destination department)
      const toItem = inventoryItems.find(
        (inv) => inv.name && inv.name.toLowerCase() === (item.name || "").toLowerCase() && (inv.location || "").trim() === toLocation
      );
      if (toItem) {
        const newToQty = (toItem.qty || 0) + receivedQty;
        updateItem(toItem.id, { qty: newToQty });
      } else if (fromItem) {
        // Create new inventory entry at TO location if it doesn't exist
        addItem({
          name: fromItem.name,
          ndc: fromItem.ndc,
          category: fromItem.category,
          subcategory: fromItem.subcategory,
          location: toLocation,
          department: fromItem.department,
          qty: receivedQty,
          par: fromItem.par || 0,
          cost: fromItem.cost,
          lot: fromItem.lot,
          uom: fromItem.uom,
          expiry: fromItem.expiry,
          expiryRaw: fromItem.expiryRaw,
          supplier: fromItem.supplier,
          gpo: fromItem.gpo,
          status: [{ label: "In Stock", color: "success" }],
        });
      }
    });

    // Show appropriate toast message based on status
    const statusMessages = {
      Received: "received",
      "Partially Received": "partially received",
      Rejected: "rejected",
    };
    const statusMsg = statusMessages[receivedIssue.status] || "received";
    showToast(`${receivedIssue.id} ${statusMsg}.`);
  };

  const markDamaged = (id) => {
    const issue = issues.find((i) => i.id === id);
    if (issue) {
      setDamagedRow(issue);
      setDamagedOpen(true);
    }
  };

  const CONSUMPTION_STORAGE_KEY = "tia_consumption_records";

  const handleMarkDamaged = (issue, shortItems, reason) => {
    const updatedIssues = issues.map((i) =>
      i.id === issue.id ? { ...i, damagedLogged: true } : i,
    );
    setIssues(updatedIssues);
    saveIssues(updatedIssues); // persist immediately, don't wait for the effect

    // Load existing damaged/consumption records
    let existingRecords = [];
    try {
      const s = localStorage.getItem(CONSUMPTION_STORAGE_KEY);
      if (s) existingRecords = JSON.parse(s);
    } catch {}

    const newRecords = shortItems.map((item) => ({
      id: Date.now() + Math.random(),
      itemId: item.itemId || item.id || "",
      itemName: item.name || item.description || "Item",
      lotNo: item.lot || "",
      quantity: String(item.short),
      type: "damaged",
      reason: reason,
      date: new Date().toISOString().split("T")[0],
      createdBy: "System Administrator",
      department: issue.dept || "—",
      location: issue.from || "—",
      createdDate: new Date().toLocaleString(),
      fromIssueId: issue.id,
    }));

    const updatedRecords = [...existingRecords, ...newRecords];
    try {
      localStorage.setItem(
        CONSUMPTION_STORAGE_KEY,
        JSON.stringify(updatedRecords),
      );
    } catch {}

    showToast(`${issue.id} short items logged as damaged.`, "warning");
    navigate("/admin/consumption-damaged-items");
  };
  const addAndHighlight = (newRow) => {
    setIssues((p) => [newRow, ...p]);
    setTypeFilter("All Types");
    setStatusFilter("All Statuses");
    setSearchTerm("");
    setPage(1);
    clearTimeout(highlightTimer.current);
    setHighlightId(newRow.id);
    setTimeout(
      () =>
        rowRefs.current[newRow.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      80,
    );
    highlightTimer.current = setTimeout(() => setHighlightId(null), 3000);
  };

  const handlePending = useCallback((payload) => {
    setIssueModalOpen(false);
    setTimeout(() => {
      const n = {
        id: payload.issueNumber || getNextId(issuesRef.current),
        type: payload.issueType || "Ward Requisition",
        from: payload.issueFrom || "Main Acute Care Hospital",
        dept: payload.issueTo || "—",
        items: payload.items?.length || 1,
        value: payload.totalValue || 0,
        requestedBy: payload.requestedBy || "—",
        date: nowStr(),
        status: "Pending",
        lineItems: (payload.items || []).map((item) => ({
          name: item.name || item.item || "Item",
          quantity: item.qty || 0,
          approvedQty: 0, // <-- Set to 0 for new requests
          approvalStatus: "Pending",
          unitCost: item.unitCost || 0,
          lot: item.lot || "",
          receivedQty: 0, // <-- Also set receivedQty to 0
        })),
      };
      addAndHighlight(n);
      showToast(`${n.id} submitted for approval.`, "warning");
    }, 0);
  }, []);

  const handleModalClose = useCallback(() => setIssueModalOpen(false), []);

  const exportCSV = () => {
    const header =
      "Issue #,Type,From,To (Dept),Items,Total Value,Requested By,Date & Time,Status";
    const rows = issues.map(
      (i) =>
        `${i.id},${i.type},${i.from},${i.dept},${i.items},$${i.value.toFixed(2)},${i.requestedBy},${i.date},${i.status}`,
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([[header, ...rows].join("\n")], { type: "text/csv" }),
    );
    a.download = "stock-issues.csv";
    a.click();
    showToast("Exported successfully.");
  };

  const HEADS = [
    { label: "Issue # / Type", width: "22%" },
    { label: "From", width: "13%" },
    { label: "To (Dept)", width: "13%" },
    { label: "Requested By", width: "17%" },
    { label: "Status", width: "11%" },
    { label: "Actions", width: "10%" },
  ];

  return (
    <>
      <style>{`
        @keyframes rowFlash {
          0%   { background-color: #dbeafe; }
          40%  { background-color: #bfdbfe; }
          100% { background-color: transparent; }
        }
        .row-highlight { animation: rowFlash 3s ease-out forwards; }
      `}</style>

      <Box sx={{ width: "100%", boxSizing: "border-box" }}>
        {/* -- Header -- */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: "16px",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}
            >
              Stock Issue
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search by ID, dept, type…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm("")}
                      disableRipple
                      sx={{
                        p: 0.5,
                        color: "#9ca3af",
                        "&:hover": { color: "#374151" },
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: 220,
                "& .MuiOutlinedInput-root": {
                  fontSize: 13,
                  borderRadius: "8px",
                  bgcolor: "#fff",
                  height: 36,
                  "& fieldset": { borderColor: "#e5e7eb" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563eb",
                    borderWidth: "1.5px",
                  },
                },
              }}
            />

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 148 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  fontSize: 13,
                  borderRadius: "20px",
                  background: "#fff",
                  minWidth: 148,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                    borderWidth: "1px",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#015DFF",
                    borderWidth: "1px",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#015DFF",
                    borderWidth: "1px",
                  },
                }}
              >
                {[
                  "All Statuses",
                  "Pending",
                  "Approved",
                  "Partially Approved",
                  "Issued",
                  "Received",
                  "Partially Received",
                  "Rejected",
                ].map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Export */}
            <Button
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              variant="outlined"
              onClick={exportCSV}
              sx={btnOutlined}
            >
              Export
            </Button>

            {/* Issue Request */}
            <Tooltip
              title={
                !can.stockIssueRequest
                  ? "You don't have permission to request stock issues"
                  : ""
              }
            >
              <span>
                <Button
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  variant="contained"
                  onClick={() => setIssueModalOpen(true)}
                  disabled={!can.stockIssueRequest}
                  sx={{
                    ...btnPrimary,
                    "&:disabled": { bgcolor: "#d1d5db", color: "#9ca3af" },
                  }}
                >
                  Issue Request
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* -- Stat Cards -- */}
        <Box sx={{ display: "flex", gap: "12px", mb: "16px" }}>
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
                gap: 1,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
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
              <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#9ca3af",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    mb: 0.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize:
                      typeof s.value === "string" && s.value.length > 6
                        ? 12
                        : 16,
                    fontWeight: 700,
                    color: "#111827",
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "#6b7280",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.sub}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* -- Table -- */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{ width: "100%", tableLayout: "fixed", minWidth: 0 }}
            >
              <TableHead>
                <TableRow sx={{ background: "#EBF1FE" }}>
                  {HEADS.map((h) => (
                    <TableCell
                      key={h.label}
                      sx={{
                        width: h.width,
                        fontWeight: 600,
                        fontSize: 11,
                        color: "#373B4D",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                        py: "11px",
                        px: "14px",
                        borderBottom: "1px solid #f3f4f6",
                        borderRight: "1px solid #BED3FC",
                        bgcolor: "#EBF1FE",
                        "&:last-child": { borderRight: "none" },
                      }}
                    >
                      {h.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 5, color: C.textSecondary, fontSize: 13 }}
                    >
                      No records match the current filters.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedRows.map((row, idx) => {
                  const isHighlighted = row.id === highlightId;
                  return (
                    <TableRow
                      key={row.id}
                      ref={(el) => {
                        if (el) rowRefs.current[row.id] = el;
                      }}
                      className={isHighlighted ? "row-highlight" : ""}
                      sx={{
                        background: "#fff",
                        "&:hover": {
                          background: isHighlighted ? "transparent" : "#fafafa",
                        },
                        transition: isHighlighted ? "none" : "background 0.15s",
                        "& td": {
                          borderBottom:
                            idx < paginatedRows.length - 1
                              ? "1px solid #f3f4f6"
                              : "none",
                          py: "14px",
                          px: "16px",
                        },
                        ...(isHighlighted && {
                          "& td:first-of-type": {
                            borderLeft: "3px solid #015DFF",
                          },
                        }),
                      }}
                    >
                      {/* Issue # / Type */}
                      <TableCell
                        sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}
                      >
                        <Tooltip
                          title={`Issue: ${row.id} - ${row.type}`}
                          arrow
                          placement="top"
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#111827",
                                lineHeight: 1.3,
                              }}
                            >
                              {row.id}
                            </Typography>
                            <Box sx={{ mt: "5px" }}>
                              <TypeChip type={row.type} />
                            </Box>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* ---- CHANGED: From (separate column) ---- */}
                      <TableCell
                        sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}
                      >
                        <Tooltip
                          title={`From: ${row.from}`}
                          arrow
                          placement="top"
                        >
                          <Chip
                            label={row.from}
                            size="small"
                            sx={{
                              bgcolor: "#F5F3FF",
                              color: "#6D28D9",
                              border: "1px solid #DDD6FE",
                              fontWeight: 600,
                              fontSize: 11,
                              height: 20,
                              "& .MuiChip-label": { px: "7px" },
                              maxWidth: "100%",
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* ---- CHANGED: To (Dept) (separate column) ---- */}
                      <TableCell
                        sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}
                      >
                        <Tooltip
                          title={`To: ${row.dept}`}
                          arrow
                          placement="top"
                        >
                          <Box sx={{ display: "inline-block" }}>
                            <DeptChip dept={row.dept} />
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* ---- CHANGED: Requested By (narrower, ellipsis) ---- */}
                      <TableCell
                        sx={{
                          py: "12px",
                          px: "14px",
                          verticalAlign: "middle",
                          maxWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        <Tooltip
                          title={`Requested By: ${row.requestedBy}`}
                          arrow
                          placement="top"
                        >
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#374151",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.requestedBy}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      {/* Status */}
                      <TableCell
                        sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}
                      >
                        <Tooltip
                          title={`Status: ${row.status}`}
                          arrow
                          placement="top"
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              alignItems: "flex-start",
                            }}
                          >
                            <StatusChip status={row.status} />
                            {row.status === "Partially Received" && (
                              <ShortChip qty={getShortQty(row)} />
                            )}
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          {row.status === "Pending" && (
                            <>
                              <Tooltip
                                title={
                                  !can.approveStockIssue
                                    ? "You don't have permission to approve stock issues"
                                    : "Approve"
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => approve(row.id)}
                                    disabled={!can.approveStockIssue}
                                    sx={{
                                      bgcolor: "#F0FDF4",
                                      color: "#16A34A",
                                      "&:hover": {
                                        bgcolor: !can.approveStockIssue
                                          ? "#F0FDF4"
                                          : "#DCFCE7",
                                      },
                                      "&:disabled": {
                                        opacity: 0.5,
                                        bgcolor: "#F0FDF4",
                                        color: "#16A34A",
                                        cursor: "not-allowed",
                                      },
                                      width: 28,
                                      height: 28,
                                      borderRadius: "6px",
                                      border: "1px solid #BBF7D0",
                                    }}
                                  >
                                    <Check sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  !can.rejectStockIssue
                                    ? "You don't have permission to reject stock issues"
                                    : "Reject"
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => reject(row.id)}
                                    disabled={!can.rejectStockIssue}
                                    sx={{
                                      bgcolor: "#FEF2F2",
                                      color: "#DC2626",
                                      "&:hover": {
                                        bgcolor: !can.rejectStockIssue
                                          ? "#FEF2F2"
                                          : "#FEE2E2",
                                      },
                                      "&:disabled": {
                                        opacity: 0.5,
                                        bgcolor: "#FEF2F2",
                                        color: "#DC2626",
                                        cursor: "not-allowed",
                                      },
                                      width: 28,
                                      height: 28,
                                      borderRadius: "6px",
                                      border: "1px solid #FECACA",
                                    }}
                                  >
                                    <Close sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}

                          {/* Issue Stock - Available for both Approved and Partially Approved */}
                          {(row.status === "Approved" ||
                            row.status === "Partially Approved") && (
                            <Tooltip
                              title={
                                !can.issueStock
                                  ? "You don't have permission to issue stock"
                                  : `Issue Stock${row.status === "Partially Approved" ? " (Partial)" : ""}`
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => issueApproved(row.id)}
                                  disabled={!can.issueStock}
                                  sx={{
                                    bgcolor:
                                      row.status === "Partially Approved"
                                        ? "#fffbeb"
                                        : "#eff6ff",
                                    color:
                                      row.status === "Partially Approved"
                                        ? "#d97706"
                                        : "#2563eb",
                                    "&:hover": {
                                      bgcolor:
                                        row.status === "Partially Approved"
                                          ? "#fef3c7"
                                          : "#dbeafe",
                                    },
                                    "&:disabled": {
                                      opacity: 0.5,
                                      bgcolor:
                                        row.status === "Partially Approved"
                                          ? "#fffbeb"
                                          : "#eff6ff",
                                      color:
                                        row.status === "Partially Approved"
                                          ? "#d97706"
                                          : "#2563eb",
                                    },
                                    width: 28,
                                    height: 28,
                                    borderRadius: "6px",
                                    border:
                                      row.status === "Partially Approved"
                                        ? "1px solid #fde68a"
                                        : "1px solid #bfdbfe",
                                  }}
                                >
                                  <LocalShipping sx={{ fontSize: 14 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {/* Approve remaining pending items - Show for any status that has pending items */}
                          {(row.lineItems || []).some(
                            (it) => it.approvalStatus === "Pending",
                          ) &&
                            row.status !== "Pending" && (
                              <Tooltip
                                title={
                                  !can.approveStockIssue
                                    ? "You don't have permission"
                                    : "Approve Remaining Items"
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => approveRemaining(row.id)}
                                    disabled={!can.approveStockIssue}
                                    sx={{
                                      bgcolor: "#f0fdf4",
                                      color: "#16a34a",
                                      "&:hover": { bgcolor: "#dcfce7" },
                                      "&:disabled": { opacity: 0.5 },
                                      width: 28,
                                      height: 28,
                                      borderRadius: "6px",
                                      border: "1px solid #bbf7d0",
                                    }}
                                  >
                                    <Check sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                          {row.status === "Issued" && (
                            <Tooltip
                              title={
                                !can.acknowledgementReceipt
                                  ? "You don't have permission to confirm receipt"
                                  : "Confirm Receipt"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => confirmReceive(row.id)}
                                  disabled={!can.acknowledgementReceipt}
                                  sx={{
                                    bgcolor: "#ecfeff",
                                    color: "#0891b2",
                                    "&:hover": {
                                      bgcolor: !can.acknowledgementReceipt
                                        ? "#ecfeff"
                                        : "#cffafe",
                                    },
                                    "&:disabled": {
                                      opacity: 0.5,
                                      bgcolor: "#ecfeff",
                                      color: "#0891b2",
                                      cursor: "not-allowed",
                                    },
                                    width: 28,
                                    height: 28,
                                    borderRadius: "6px",
                                    border: "1px solid #a5f3fc",
                                  }}
                                >
                                  <MoveToInbox sx={{ fontSize: 14 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {row.status === "Partially Received" &&
                            getShortQty(row) > 0 &&
                            !row.damagedLogged && (
                              <Tooltip title="Mark as Damaged">
                                <IconButton
                                  size="small"
                                  onClick={() => markDamaged(row.id)}
                                  sx={{
                                    bgcolor: "#fff7ed",
                                    color: "#d97706",
                                    "&:hover": { bgcolor: "#fef3c7" },
                                    width: 28,
                                    height: 28,
                                    borderRadius: "6px",
                                    border: "1px solid #fde68a",
                                  }}
                                >
                                  <Inventory2Outlined sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setViewRow(row);
                                setViewOpen(true);
                              }}
                              sx={{
                                bgcolor: "#EFF6FF",
                                color: "#1D4ED8",
                                "&:hover": { bgcolor: "#DBEAFE" },
                                width: 28,
                                height: 28,
                                borderRadius: "6px",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              <Visibility sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* -- Pagination outside table -- */}
        {filtered.length > 0 && (
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
                  "&:hover": { bgcolor: "#0147CC !important" },
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

      {/* -- Modals -- */}
      <IssuestockModal
        open={issueModalOpen}
        onClose={handleModalClose}
        onPending={handlePending}
      />

      <ApprovalModal
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        issue={approvalRow}
        onConfirm={handleApprovalConfirm}
        onReject={reject}
      />

      {/* Modal for approving remaining Pending items */}
      <ApprovalModal
        open={remainingOpen}
        onClose={() => {
          setRemainingOpen(false);
          setRemainingRow(null);
        }}
        issue={remainingRow}
        onConfirm={handleRemainingConfirm}
        onReject={() => {
          setRemainingOpen(false);
          setRemainingRow(null);
        }}
      />

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        issue={rejectRow}
        onConfirm={handleReject}
      />

      <ConfirmReceiveModal
        open={confirmReceiveOpen}
        onClose={() => setConfirmReceiveOpen(false)}
        issue={confirmReceiveRow}
        onConfirm={handleConfirmReceive}
      />

      <ViewDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        row={viewRow}
      />

      <MarkDamagedModal
        open={damagedOpen}
        onClose={() => setDamagedOpen(false)}
        issue={damagedRow}
        onConfirm={handleMarkDamaged}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          sx={{ borderRadius: "10px", fontWeight: 600, fontSize: 13 }}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
