import { useState, useEffect } from "react";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CreateTransferModal from "./InventoryItems/Createtransfermodal";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/Authcontext";
import { useInventory } from "../contexts/InventoryContext";
import {
  Box, Typography, Button, IconButton, Paper,
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip as MuiChip, Snackbar, Alert, Modal,
  Dialog, DialogContent, DialogActions, TextField, Checkbox, Tooltip,
  InputAdornment, Select, MenuItem, Pagination,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import Close from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

const STORAGE_KEY = "tiatele_transfers";
const ITEMS_PER_PAGE = 5;


const CONSUMPTION_STORAGE_KEY = "tia_consumption_records";

const loadTransfers = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

const saveTransfers = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const seedTransfers = [];


const isItemPending = (item) =>
  !item.status ||
  item.status === "Pending" ||
  (item.status === "Partial Approved" && Number(item.approvedQty || 0) <= 0);

const isItemDecided = (item) =>
  !isItemPending(item) && (item.status === "Approved" || item.status === "Partial Approved");

const computeOverallStatus = (lineItems) => {
  if (!lineItems || lineItems.length === 0) return "Requested";
  const total = lineItems.length;
  const pendingCount = lineItems.filter(isItemPending).length;
  const rejectedCount = lineItems.filter((it) => it.status === "Rejected").length;
  const decided = lineItems.filter(isItemDecided);

  if (pendingCount === total) return "Requested";
  if (pendingCount > 0) return "Partially Approved";
  if (rejectedCount === total) return "Rejected";
  if (decided.length === 0) return "Rejected";

  const anyDispatched = decided.some((it) => it.dispatched);
  const allFullyReceived = decided.every(
    (it) => it.dispatched && it.receivedQty !== undefined && Number(it.receivedQty) >= Number(it.approvedQty || 0)
  );
  const anyReceiptRecorded = decided.some((it) => it.dispatched && it.receivedQty !== undefined);
  const anyShort = decided.some(
    (it) => it.dispatched && it.receivedQty !== undefined && Number(it.receivedQty) < Number(it.approvedQty || 0)
  );

  // Scenario 1 (reduced quantity): any item whose own status is
  // "Partial Approved" means less than the requested quantity was
  // approved for it — that alone makes the transfer Partially Approved,
  // even if every item has a final decision and rejectedCount is 0.
  const anyPartialItem = decided.some((it) => it.status === "Partial Approved");

  if (allFullyReceived) return "Received";
  if (anyReceiptRecorded && anyShort) return "Partially Received";
  if (anyDispatched) return "Dispatched";
  // Scenario 2 (multiple items, some rejected) or Scenario 1 (reduced qty)
  if (rejectedCount > 0 || anyPartialItem) return "Partially Approved";
  return "Approved";
};


const getDisplayStatus = (row) =>
  row?.lineItems && row.lineItems.length > 0 ? computeOverallStatus(row.lineItems) : row?.status || "Requested";


const getItemStage = (item) => {
  if (isItemPending(item)) return "Pending";
  if (item.status === "Rejected") return "Rejected";
  if (!item.dispatched) return item.status; // "Approved" or "Partial Approved"
  if (item.receivedQty === undefined) return "Dispatched";
  const approvedQty = Number(item.approvedQty || 0);
  const receivedQty = Number(item.receivedQty || 0);
  if (approvedQty > 0 && receivedQty >= approvedQty) return "Received";
  if (receivedQty > 0) return "Partially Received";
  return "Not Received";
};

const itemStageColor = (stage) => {
  if (stage === "Approved") return { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" };
  if (stage === "Partial Approved") return { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" };
  if (stage === "Rejected" || stage === "Not Received") return { color: "#dc2626", bg: "#fee2e2", border: "#fecaca" };
  if (stage === "Dispatched") return { color: "#4f46e5", bg: "#e0e7ff", border: "#c7d2fe" };
  if (stage === "Received") return { color: "#059669", bg: "#d1fae5", border: "#a7f3d0" };
  if (stage === "Partially Received") return { color: "#d97706", bg: "#fef3c7", border: "#fde68a" };
  return { color: "#ca8a04", bg: "#fef9c3", border: "#fde68a" }; // Pending
};

const locColor = (code) => {
  const map = {
    "CS-01":  { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
    "PH-01":  { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    "IC-01":  { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    "ICU-01": { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    "OR-01":  { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
    "WA-01":  { bg: "#fce7f3", color: "#9d174d", border: "#fbcfe8" },
    "WA-02":  { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" },
    "EM-01":  { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    "SU-01":  { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
    "LA-01":  { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    "OP-01":  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    "MA-01":  { bg: "#fdf4ff", color: "#86198f", border: "#f0abfc" },
    "MACH-01": { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    "CWS-01":  { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    "ASC-01":  { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    "UCC-01":  { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    "WCH-01":  { bg: "#fce7f3", color: "#9d174d", border: "#fbcfe8" },
    "CLAB-01": { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    "OIC-01":  { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
    "BB-01":   { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
    "RDP-01":  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    "SP-01":   { bg: "#fdf4ff", color: "#86198f", border: "#f0abfc" },
  };
  return map[code] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
};

const priorityStyle = (p) => {
  if (p === "Urgent")   return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
  if (p === "Critical") return { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
  return { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
};

const statusStyle = (s) => {
  if (s === "Requested")              return { bg: "#fef3c7", color: "#d97706", border: "#fde68a" };
  if (s === "Approved")               return { bg: "#dbeafe", color: "#0284c7", border: "#93c5fd" };
  if (s === "Partially Approved")     return { bg: "#fef3c7", color: "#d97706", border: "#fde68a" };
  if (s === "Awaiting Dispatch")      return { bg: "#fef3c7", color: "#d97706", border: "#fde68a" };
  if (s === "Dispatched")             return { bg: "#e0e7ff", color: "#4f46e5", border: "#c7d2fe" };
  if (s === "Awaiting Receipt")       return { bg: "#e0e7ff", color: "#4f46e5", border: "#c7d2fe" };
  if (s === "Received")               return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" };
  if (s === "Partially Received")     return { bg: "#fef3c7", color: "#d97706", border: "#fde68a" };
  if (s === "Rejected")               return { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
  return { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
};

const StyledChip = ({ label, style }) => (
  <MuiChip
    label={label}
    size="small"
    variant="outlined"
    sx={{
      bgcolor: style.bg, color: style.color, borderColor: style.border,
      fontWeight: 700, fontSize: 12, height: 24, borderRadius: "99px",
      borderWidth: "1.5px",
    }}
  />
);


const getShortfallItems = (row) => {
  const items = row?.lineItems && row.lineItems.length > 0 ? row.lineItems : [];
  return items
    .filter((it) => it.dispatched && it.receivedQty !== undefined)
    .map((it) => {
      const issued = it.approvedQty ?? it.quantity ?? 0;
      const received = it.receivedQty ?? issued;
      const shortQty = Math.max(0, Number(issued) - Number(received));
      return {
        name: it.name || it.item || it.description || "Unknown Item",
        lotNo: it.lotNo || it.lot || "",
        shortQty,
      };
    })
    .filter((it) => it.shortQty > 0);
};

const getTotalShortfall = (row) =>
  getShortfallItems(row).reduce((sum, it) => sum + it.shortQty, 0);

// ─── TO Location Approval Modal ────────────────────────────────────────────────
function ToLocationApprovalModal({ open, onClose, transfer, onConfirm, onReject }) {
  if (!transfer) return null;

  const resolveItems = (t) => {
    if (t.lineItems && t.lineItems.length > 0) return t.lineItems;
    if (t.items && t.items.length > 0) {
      return t.items.map(i => ({
        name: i.item || i.name || i.description || "Unknown Item",
        quantity: i.qty || i.quantity || 1,
        approvedQty: 0,
        approvalStatus: "Pending",
      }));
    }
    return [];
  };

  const items = resolveItems(transfer);
  const [selected, setSelected] = React.useState(() => items.map((_, i) => i));
  const [reason, setReason] = React.useState(() =>
    Object.fromEntries(items.map((_, i) => [i, ""]))
  );
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (open && transfer) {
      const lineItems = resolveItems(transfer);
      setSelected(lineItems.map((_, i) => i));
      setReason(Object.fromEntries(lineItems.map((_, i) => [i, ""])));
      setSubmitted(false);
    }
  }, [open, transfer]);

  const toggle = (idx) =>
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
    );
  const toggleAll = () =>
    setSelected(selected.length === items.length ? [] : items.map((_, i) => i));

  const handleApprove = () => {
    setSubmitted(true);
    const missingReason = selected.some((idx) => !reason[idx]?.trim());
    if (missingReason) return;
    const updatedItems = items.map((item, idx) => {
      if (!selected.includes(idx)) return { ...item, approvalStatus: "Rejected", approvedQty: 0 };
      return { ...item, approvalStatus: "Approved", approvedQty: item.quantity, approvalReason: reason[idx] || "" };
    });
    onConfirm({ ...transfer, lineItems: updatedItems });
    onClose();
  };

  const handleReject = () => {
    setSubmitted(true);
    const reason_text = reason[0] || "";
    if (!reason_text?.trim()) {
      setReason(prev => ({ ...prev, 0: "Rejection reason required" }));
      return;
    }
    onReject(transfer.id, reason_text);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} disableRestoreFocus disableScrollLock
      PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", maxHeight: "78vh", width: "580px", maxWidth: "580px", display: "flex", flexDirection: "column" } }}>
      {/* Header */}
      <Box sx={{ px: "14px", pt: "12px", pb: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box sx={{ width: 27, height: 27, borderRadius: "7px", bgcolor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 15, color: "#16a34a" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Approve Transfer — {transfer?.id}</Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>Review and approve before sending to FROM location.</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disableRipple sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px", width: 24, height: 24, "&:hover": { bgcolor: "#f3f4f6" }, "&:focus": { outline: "none" } }}>
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "14px", py: "10px", flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 }, scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
        {/* Meta info */}
        <Box sx={{ mb: "9px", pb: "9px", borderBottom: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
          {[{ l: "Transfer ID", v: transfer?.id }, { l: "From", v: transfer?.fromLabel }, { l: "To", v: transfer?.toLabel }, { l: "Priority", v: transfer?.priority }].map((f) => (
            <Box key={f.l}>
              <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>{f.l}</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{f.v}</Typography>
            </Box>
          ))}
        </Box>

        {/* Select all */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mb: "7px", pb: "7px", borderBottom: "1px solid #f3f4f6" }}>
          <Checkbox size="small"
            checked={selected.length === items.length && items.length > 0}
            indeterminate={selected.length > 0 && selected.length < items.length}
            onChange={toggleAll}
            sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 14 }, color: "#16a34a", "&.Mui-checked": { color: "#16a34a" } }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Select All ({items.length}  items)</Typography>
        </Box>

        {/* Column headers */}
        <Box sx={{ display: "grid", gridTemplateColumns: "26px 18px 1fr 58px 1fr", gap: "5px", px: "9px", mb: "4px", alignItems: "center" }}>
          <Box /><Box />
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>Item Name</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>QTY</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>Remarks</Typography>
        </Box>

        {/* Items */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {items.map((item, idx) => {
            const reqQty = item.quantity;
            const isChecked = selected.includes(idx);
            return (
              <Box key={idx} onClick={() => toggle(idx)} sx={{ display: "grid", gridTemplateColumns: "26px 18px 1fr 58px 1fr", gap: "5px", alignItems: "center", p: "6px 9px", borderRadius: "7px", border: `1px solid ${isChecked ? "#bbf7d0" : "#e5e7eb"}`, bgcolor: isChecked ? "#f0fdf4" : "#f9fafb", cursor: "pointer", transition: "all 0.12s", "&:hover": { borderColor: "#bbf7d0", bgcolor: "#f0fdf4" } }}>
                <Checkbox size="small" checked={isChecked} onChange={() => toggle(idx)} onClick={(e) => e.stopPropagation()}
                  sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: 14 }, color: "#16a34a", "&.Mui-checked": { color: "#16a34a" } }} />
                <Box sx={{ width: 17, height: 17, borderRadius: "50%", bgcolor: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#6b7280" }}>{idx + 1}</Typography>
                </Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name || item.item || item.description || "Unknown Item"}</Typography>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: 8, color: "#7c3aed", fontWeight: 600 }}>Qty</Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#7c3aed" }}>{reqQty}</Typography>
                </Box>
                <Box onClick={(e) => e.stopPropagation()}>
                  <TextField size="small" fullWidth placeholder="Remarks *" value={reason[idx] || ""} disabled={!isChecked}
                    onChange={(e) => setReason((prev) => ({ ...prev, [idx]: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { fontSize: 11, borderRadius: "6px", bgcolor: isChecked ? "#fff" : "#f3f4f6", "& fieldset": { borderColor: submitted && isChecked && !reason[idx]?.trim() ? "#ef4444" : "#d1d5db" } }, "& .MuiInputBase-input": { py: "5px", px: "8px" } }} />
                  {submitted && isChecked && !reason[idx]?.trim() && (
                    <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "1px" }}>Required</Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <Box sx={{ px: "14px", py: "10px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Typography sx={{ fontSize: 11.5, color: "#9ca3af" }}>{selected.length} of {items.length} selected</Typography>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Button onClick={onClose} disableRipple sx={{ fontSize: 11.5, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>Cancel</Button>
          <Button onClick={handleApprove} disabled={selected.length === 0} disableRipple
            sx={{ fontSize: 11.5, fontWeight: 600, textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", bgcolor: "#16a34a", color: "#fff", boxShadow: "0 2px 8px rgba(22,163,74,0.25)", "&:hover": { bgcolor: "#15803d" }, "&.Mui-disabled": { opacity: 0.5, color: "#fff" } }}>
            Approve ({selected.length})
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}


function ApprovalModal({ open, onClose, transfer, mode, onConfirm }) {
  if (!transfer) return null;

  const resolveItems = (t) => {
    if (t.lineItems && t.lineItems.length > 0) return t.lineItems;
    if (t.items && t.items.length > 0) {
      return t.items.map((i) => ({
        name: i.item || i.name || i.description || "Unknown Item",
        quantity: i.qty || i.quantity || 1,
        status: "Pending",
      }));
    }
    return [];
  };

  const allItems = resolveItems(transfer);
  const actionableItems = allItems.filter(isItemPending);

  const isApprove = mode === "approve";
  const actionLabel = isApprove ? "Approve" : "Reject";
  const actionColor = isApprove ? "#16a34a" : "#dc2626";
  const actionBg = isApprove ? "#f0fdf4" : "#fef2f2";
  const actionBorder = isApprove ? "#bbf7d0" : "#fecaca";

  const [selected, setSelected] = React.useState(() => actionableItems.map((_, i) => i));
  const [approvedQty, setApprovedQty] = React.useState(() => {
    const init = {};
    actionableItems.forEach((it, i) => { init[i] = Number(it.quantity || 1); });
    return init;
  });
  const [reason, setReason] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (open && transfer) {
      const items = resolveItems(transfer).filter(isItemPending);
      setSelected(items.map((_, i) => i));
      const init = {};
      items.forEach((it, i) => { init[i] = Number(it.quantity || 1); });
      setApprovedQty(init);
      setReason({});
      setSubmitted(false);
    }
  }, [open, transfer, mode]);

  const toggle = (idx) =>
    setSelected((prev) => (prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]));

  const toggleAll = () =>
    setSelected(selected.length === actionableItems.length ? [] : actionableItems.map((_, i) => i));

  const handleConfirm = () => {
    setSubmitted(true);

    if (isApprove) {
      // Zero is not a valid approved quantity — approving nothing isn't a
      // "reduced approval", it's either a rejection or no decision at all.
      const zeroQty = selected.some((idx) => Number(approvedQty[idx] ?? 0) <= 0);
      if (zeroQty) return;

      const missingReason = selected.some((idx) => {
        const item = actionableItems[idx];
        if (!item) return false;
        const reqQty = Number(item.quantity || 1);
        const appQty = Number(approvedQty[idx] ?? reqQty);
        return appQty < reqQty && !reason[idx]?.trim();
      });
      if (missingReason) return;
    } else {
      const missingReason = selected.some((idx) => !reason[idx]?.trim());
      if (missingReason) return;
    }

    // Items not selected this round stay exactly as they are (Pending items
    // remain Pending and open for a future approval round).
    const updatedItems = allItems.map((item) => {
      const actionableIdx = actionableItems.indexOf(item);
      if (actionableIdx === -1 || !selected.includes(actionableIdx)) return item;

      if (!isApprove) {
        return {
          ...item,
          status: "Rejected",
          approvedQty: 0,
          reason: reason[actionableIdx] || "",
        };
      }

      const reqQty = Number(item.quantity || 1);
      const appQty = Number(approvedQty[actionableIdx] ?? reqQty);
      const isPartial = appQty < reqQty;

      // Terminal outcome: the unapproved remainder is implicitly rejected
      // and cannot be re-approved later.
      return {
        ...item,
        status: isPartial ? "Partial Approved" : "Approved",
        approvedQty: appQty,
        rejectedQty: isPartial ? reqQty - appQty : 0,
        reason: reason[actionableIdx] || "",
      };
    });

    onConfirm({ ...transfer, lineItems: updatedItems }, mode);
    onClose();
  };

  const headerIcon = isApprove
    ? <CheckCircleOutlineIcon sx={{ fontSize: 15, color: "#16a34a" }} />
    : <CloseOutlinedIcon sx={{ fontSize: 15, color: "#dc2626" }} />;

  const headerSubtitle =
    actionableItems.length === 0
      ? `No pending items to ${actionLabel.toLowerCase()}.`
      : isApprove
      ? "Reducing a quantity finalizes that item — the remainder is rejected. Enter at least 1 to approve."
      : "Select items and provide a reason to reject.";

  return (
    <Dialog open={open} onClose={onClose} disableRestoreFocus disableScrollLock
      PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", maxHeight: "78vh", width: "600px", maxWidth: "600px", display: "flex", flexDirection: "column" } }}>

      {/* Header */}
      <Box sx={{ px: "14px", pt: "12px", pb: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box sx={{ width: 27, height: 27, borderRadius: "7px", bgcolor: actionBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {headerIcon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
              {actionLabel} Items — {transfer?.id}
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>{headerSubtitle}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disableRipple
          sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px", width: 24, height: 24, "&:hover": { bgcolor: "#f3f4f6" }, "&:focus": { outline: "none" } }}>
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "14px", py: "10px", flex: 1, overflowY: "auto",
        "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
        scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>

        {/* Meta info */}
        <Box sx={{ mb: "9px", pb: "9px", borderBottom: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
          {[{ l: "Transfer ID", v: transfer?.id }, { l: "From", v: transfer?.fromLabel }, { l: "To", v: transfer?.toLabel }, { l: "Priority", v: transfer?.priority }].map((f) => (
            <Box key={f.l}>
              <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>{f.l}</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{f.v}</Typography>
            </Box>
          ))}
        </Box>

        {actionableItems.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
              No pending items to {actionLabel.toLowerCase()}.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Show previously rejected items */}
            {allItems.filter(it => it.status === "Rejected").length > 0 && (
              <Box sx={{ mb: "10px", pb: "10px", borderBottom: "1px solid #f3f4f6" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "26px 20px 1fr 55px", gap: "5px", px: "9px", mb: "4px", alignItems: "center" }}>
                  <Box /><Box />
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>Rejected Item</Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>Req.</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {allItems.filter(it => it.status === "Rejected").map((item, idx) => (
                    <Box key={idx} sx={{ display: "grid", gridTemplateColumns: "26px 20px 1fr 55px", gap: "5px", alignItems: "center", p: "6px 9px", borderRadius: "7px", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
                      <Box /><Box sx={{ width: 17, height: 17, borderRadius: "50%", bgcolor: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>✕</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name || item.item || item.description || "Unknown Item"}
                      </Typography>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#dc2626" }}>{item.quantity || 1}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Select All */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "7px", pb: "7px", borderBottom: "1px solid #f3f4f6" }}>
              <Checkbox size="small"
                checked={selected.length === actionableItems.length && actionableItems.length > 0}
                indeterminate={selected.length > 0 && selected.length < actionableItems.length}
                onChange={toggleAll}
                sx={{ p: 0, color: actionColor, "&.Mui-checked": { color: actionColor } }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                Select All ({actionableItems.length} item{actionableItems.length !== 1 ? "s" : ""})
              </Typography>
            </Box>

            {/* Column headers */}
            <Box sx={{ display: "grid", gridTemplateColumns: isApprove ? "26px 20px 1fr 55px 55px 1fr" : "26px 20px 1fr 55px 1fr", gap: "5px", px: "9px", mb: "4px", alignItems: "center" }}>
              <Box /><Box />
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>Item</Typography>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>Req.</Typography>
              {isApprove && (
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>Appr.</Typography>
              )}
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {isApprove ? <>Reason <span style={{ fontWeight: 400 }}>(if reduced)</span></> : "Reason"}
              </Typography>
            </Box>

            {/* Item rows */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {actionableItems.map((item, idx) => {
                const reqQty = Number(item.quantity || 1);
                const isChecked = selected.includes(idx);
                const appQty = approvedQty[idx] ?? reqQty;
                const isPartial = isApprove && isChecked && Number(appQty) < reqQty && Number(appQty) > 0;
                const isZero = isApprove && isChecked && Number(appQty) <= 0;
                const missingReason = submitted && isChecked && !isApprove && !reason[idx]?.trim();

                return (
                  <Box key={idx}>
                    <Box onClick={() => toggle(idx)}
                      sx={{ display: "grid", gridTemplateColumns: isApprove ? "26px 20px 1fr 55px 55px 1fr" : "26px 20px 1fr 55px 1fr",
                        gap: "5px", alignItems: "center", p: "6px 9px", borderRadius: "7px",
                        border: `1px solid ${isChecked ? actionBorder : "#e5e7eb"}`,
                        bgcolor: isChecked ? actionBg : "#f9fafb", cursor: "pointer", transition: "all 0.12s",
                        "&:hover": { borderColor: actionBorder, bgcolor: actionBg } }}>
                      <Checkbox size="small" checked={isChecked} onChange={() => toggle(idx)} onClick={(e) => e.stopPropagation()}
                        sx={{ p: 0, color: actionColor, "&.Mui-checked": { color: actionColor } }} />
                      <Box sx={{ width: 17, height: 17, borderRadius: "50%", bgcolor: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#6b7280" }}>{idx + 1}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name || item.item || item.description || "Unknown Item"}
                      </Typography>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#374151" }}>{reqQty}</Typography>
                      </Box>
                      {isApprove && (
                        <Box sx={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <TextField size="small" type="number" value={appQty} disabled={!isChecked}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(Number(e.target.value) || 0, reqQty));
                              setApprovedQty((prev) => ({ ...prev, [idx]: val }));
                            }}
                            inputProps={{ min: 0, max: reqQty, style: { textAlign: "center", padding: "3px 4px", fontSize: 12, fontWeight: 700 } }}
                            sx={{ width: "55px", "& .MuiOutlinedInput-root": { borderRadius: "6px", bgcolor: isChecked ? "#fff" : "#f3f4f6", "& fieldset": { borderColor: isZero ? "#ef4444" : (isPartial ? "#f59e0b" : "#d1d5db") } },
                              "& input[type=number]": { MozAppearance: "textfield" },
                              "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" },
                              "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" } }} />
                        </Box>
                      )}
                      <Box onClick={(e) => e.stopPropagation()}>
                        <TextField size="small" fullWidth
                          placeholder={isApprove ? (isPartial ? "Reason required *" : "Reason (optional)") : "Reason *"}
                          value={reason[idx] || ""} disabled={!isChecked}
                          onChange={(e) => setReason((prev) => ({ ...prev, [idx]: e.target.value }))}
                          sx={{ "& .MuiOutlinedInput-root": { fontSize: 11, borderRadius: "6px", bgcolor: isChecked ? "#fff" : "#f3f4f6",
                            "& fieldset": { borderColor: (missingReason || (submitted && isChecked && isPartial && !reason[idx]?.trim())) ? "#ef4444" : "#d1d5db" } },
                            "& .MuiInputBase-input": { py: "5px", px: "8px" } }} />
                        {((isApprove && submitted && isChecked && isPartial && !reason[idx]?.trim()) || missingReason) && (
                          <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "1px" }}>
                            {isApprove ? "Required for reduced approval" : "Required"}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {isZero && (
                      <Box sx={{ ml: "50px", mt: "3px", display: "inline-flex", alignItems: "center", gap: "5px", px: "8px", py: "2px", borderRadius: "5px", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#dc2626" }} />
                        <Typography sx={{ fontSize: 10, color: "#991b1b", fontWeight: 600 }}>
                          Enter a quantity of at least 1 to approve, or use Reject / unselect this item instead
                        </Typography>
                      </Box>
                    )}
                    {isPartial && (
                      <Box sx={{ ml: "50px", mt: "3px", display: "inline-flex", alignItems: "center", gap: "5px", px: "8px", py: "2px", borderRadius: "5px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#f59e0b" }} />
                        <Typography sx={{ fontSize: 10, color: "#92400e", fontWeight: 600 }}>
                          Approving {appQty} of {reqQty} — remaining {reqQty - appQty} will be rejected, not reopened
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: "14px", py: "10px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Typography sx={{ fontSize: 11.5, color: "#9ca3af" }}>{selected.length} of {actionableItems.length} selected</Typography>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Button onClick={onClose} disableRipple sx={{ fontSize: 11.5, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.length === 0} disableRipple
            sx={{ fontSize: 11.5, fontWeight: 600, textTransform: "none", borderRadius: "6px", px: "14px", py: "6px",
              bgcolor: isApprove ? "#16a34a" : "#dc2626", color: "#fff",
              boxShadow: `0 2px 8px ${isApprove ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}`,
              "&:hover": { bgcolor: isApprove ? "#15803d" : "#b91c1c" }, "&.Mui-disabled": { opacity: 0.5, color: "#fff" } }}>
            {actionLabel} ({selected.length})
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}


function DispatchModal({ open, onClose, transfer, onConfirm }) {
  const [remarks, setRemarks] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  React.useEffect(() => { if (open) { setRemarks(""); setSubmitted(false); } }, [open]);
  if (!transfer) return null;

  const resolveItems = (t) =>
    (t.lineItems || []).filter((it) => isItemDecided(it) && !it.dispatched && Number(it.approvedQty || 0) > 0);

  const items = resolveItems(transfer);
  const totalQty = items.reduce((sum, it) => sum + Number(it.approvedQty ?? it.quantity ?? 0), 0);

  const handleConfirm = () => {
    setSubmitted(true);
    if (!remarks.trim()) return;
    onConfirm(transfer.id, remarks);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} disableRestoreFocus disableScrollLock
      PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", width: "520px", maxWidth: "520px", maxHeight: "78vh", display: "flex", flexDirection: "column" } }}>
      <Box sx={{ px: "14px", pt: "12px", pb: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box sx={{ width: 27, height: 27, borderRadius: "7px", bgcolor: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 14, color: "#4f46e5" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Dispatch — {transfer?.id}</Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>Only newly-approved, not-yet-dispatched items are shown.</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px", width: 24, height: 24, p: 0, "&:hover": { bgcolor: "#f3f4f6" } }}>
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: "14px", py: "10px", flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 }, scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
        {/* Meta */}
        <Box sx={{ mb: "9px", pb: "9px", borderBottom: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>From</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.fromLabel} ({transfer?.from})</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>To</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.toLabel} ({transfer?.to})</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>Priority</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.priority}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>Total Qty</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{totalQty} units · {items.length} item{items.length !== 1 ? "s" : ""}</Typography>
          </Box>
        </Box>

        {/* Items table header */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 50px", gap: "6px", px: "8px", mb: "4px" }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Item Name</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Req.</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Appr.</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Disp.</Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", mb: "10px" }}>
          {items.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: "#9ca3af", textAlign: "center", py: 1 }}>No approved items to dispatch.</Typography>
          ) : items.map((item, idx) => {
            const reqQty = item.quantity ?? 0;
            const appQty = item.approvedQty ?? 0;
            const dispQty = item.approvedQty ?? item.quantity ?? 0;
            return (
              <Box key={idx} sx={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 50px", gap: "6px", alignItems: "center", px: "8px", py: "7px", borderRadius: "7px", bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name || item.item || item.description || "Unknown Item"}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "center" }}>{reqQty}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>{appQty}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0891b2", textAlign: "center" }}>{dispQty}</Typography>
              </Box>
            );
          })}
        </Box>

        <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "6px" }}>
          Remarks <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <TextField fullWidth multiline rows={2} placeholder="Tracking, handling details..." value={remarks} onChange={(e) => setRemarks(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 11.5, borderRadius: "6px", "& fieldset": { borderColor: submitted && !remarks.trim() ? "#ef4444" : "#d1d5db" }, "&:hover fieldset": { borderColor: "#9ca3af" }, "&.Mui-focused fieldset": { borderColor: "#4f46e5", borderWidth: "1.5px" } }, "& .MuiInputBase-input": { py: "7px", px: "10px" } }} />
        {submitted && !remarks.trim() && <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "3px" }}>Required</Typography>}
      </DialogContent>
      <Box sx={{ px: "14px", py: "10px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
        <Button onClick={onClose} sx={{ fontSize: 11.5, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={items.length === 0} sx={{ fontSize: 11.5, fontWeight: 600, textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", bgcolor: "#4f46e5", color: "#fff", boxShadow: "0 2px 6px rgba(79,70,229,0.25)", "&:hover": { bgcolor: "#4338ca" }, "&.Mui-disabled": { opacity: 0.5, color: "#fff" } }}>Dispatch</Button>
      </Box>
    </Dialog>
  );
}


function ConfirmReceiptModal({ open, onClose, transfer, onConfirm }) {
  const [remarks, setRemarks] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [receivedQty, setReceivedQty] = React.useState({});

  const resolveItems = (t) => {
    if (!t) return [];
    return (t.lineItems || []).filter((it) => it.dispatched && it.receivedQty === undefined);
  };

  React.useEffect(() => {
    if (open && transfer) {
      const lineItems = resolveItems(transfer);
      setRemarks("");
      setSubmitted(false);
      setReceivedQty(
        Object.fromEntries(
          lineItems.map((it, i) => [i, it.approvedQty ?? it.quantity ?? 0])
        )
      );
    }
  }, [open, transfer]);

  if (!transfer) return null;
  const items = resolveItems(transfer);

  const handleConfirm = () => {
    setSubmitted(true);
    if (!remarks.trim()) return;
    onConfirm(transfer.id, remarks, receivedQty);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} disableRestoreFocus disableScrollLock
      PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", width: "520px", maxWidth: "520px" } }}>
      <Box sx={{ px: "14px", pt: "12px", pb: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box sx={{ width: 27, height: 27, borderRadius: "7px", bgcolor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#16a34a" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Confirm Receipt — {transfer?.id}</Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>Verify received quantities and add remarks.</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px", width: 24, height: 24, p: 0, "&:hover": { bgcolor: "#f3f4f6" } }}>
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: "14px", py: "10px" }}>
        {/* Meta */}
        <Box sx={{ mb: "9px", pb: "9px", borderBottom: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>Issue ID</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.id}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>Type</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.type || "Transfer"}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>Department</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.toLabel}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>Store</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.from}</Typography>
          </Box>
        </Box>

        {/* Items table header */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 60px 80px", gap: "7px", px: "8px", mb: "5px" }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Item</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Issued</Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Received</Typography>
        </Box>

        {/* Items */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", mb: "10px" }}>
          {items.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: "#9ca3af", textAlign: "center", py: 1 }}>No dispatched items awaiting receipt.</Typography>
          ) : items.map((item, idx) => {
            const issuedQty = item.approvedQty ?? item.quantity ?? 0;
            const recvQty = receivedQty[idx] ?? issuedQty;
            const isShort = Number(recvQty) < issuedQty;
            return (
              <Box key={idx}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 60px 80px", gap: "7px", alignItems: "center", px: "8px", py: "7px", borderRadius: "7px", bgcolor: "#f9fafb", border: `1px solid ${isShort ? "#fde68a" : "#e5e7eb"}` }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{item.name || item.item || item.description || "Unknown Item"}</Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>{issuedQty}</Typography>
                  <TextField size="small" type="number" value={recvQty}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(Number(e.target.value) || 0, issuedQty));
                      setReceivedQty((prev) => ({ ...prev, [idx]: val }));
                    }}
                    inputProps={{ min: 0, max: issuedQty, style: { textAlign: "center", padding: "4px 6px", fontSize: 12, fontWeight: 700, color: "#0891b2" } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", bgcolor: "#fff", "& fieldset": { borderColor: isShort ? "#f59e0b" : "#a5f3fc" } }, "& input[type=number]": { MozAppearance: "textfield" }, "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" }, "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" } }} />
                </Box>
                {isShort && (
                  <Box sx={{ mt: "3px", display: "inline-flex", alignItems: "center", gap: "4px", px: "6px", py: "2px", borderRadius: "4px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
                    <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#f59e0b" }} />
                    <Typography sx={{ fontSize: 9, color: "#92400e", fontWeight: 600 }}>Short: {recvQty} of {issuedQty} received</Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Remarks */}
        <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "6px" }}>
          Remarks <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <TextField fullWidth multiline rows={2} placeholder="Confirm receipt, note any discrepancies..." value={remarks} onChange={(e) => setRemarks(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 11.5, borderRadius: "6px", "& fieldset": { borderColor: submitted && !remarks.trim() ? "#ef4444" : "#d1d5db" }, "&:hover fieldset": { borderColor: "#9ca3af" }, "&.Mui-focused fieldset": { borderColor: "#16a34a", borderWidth: "1.5px" } }, "& .MuiInputBase-input": { py: "7px", px: "10px" } }} />
        {submitted && !remarks.trim() && <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "3px" }}>Required</Typography>}
      </DialogContent>
      <Box sx={{ px: "14px", py: "10px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
        <Button onClick={onClose} sx={{ fontSize: 11.5, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={items.length === 0} sx={{ fontSize: 11.5, fontWeight: 600, textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", bgcolor: "#0891b2", color: "#fff", boxShadow: "0 2px 6px rgba(8,145,178,0.25)", "&:hover": { bgcolor: "#0e7490" }, "&.Mui-disabled": { opacity: 0.5, color: "#fff" } }}>Confirm Receipt</Button>
      </Box>
    </Dialog>
  );
}

// ─── Mark As Damaged Modal ─────────────────────────────────────────────────────
function MarkShortageModal({ open, onClose, transfer, onConfirm }) {
  const [reason, setReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (open) { setReason(""); setSubmitted(false); }
  }, [open]);

  if (!transfer) return null;
  const shortfallItems = getShortfallItems(transfer);
  const totalShort = shortfallItems.reduce((s, it) => s + it.shortQty, 0);

  const handleConfirm = () => {
    setSubmitted(true);
    if (!reason.trim()) return;
    onConfirm(transfer, "damaged", reason);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} disableRestoreFocus disableScrollLock
      PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", width: "480px", maxWidth: "480px" } }}>
      <Box sx={{ px: "14px", pt: "12px", pb: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box sx={{ width: 27, height: 27, borderRadius: "7px", bgcolor: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 14, color: "#d97706" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Mark as Damaged — {transfer?.id}</Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>Log the short-delivered quantity as damaged stock.</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px", width: 24, height: 24, p: 0, "&:hover": { bgcolor: "#f3f4f6" } }}>
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "14px", py: "10px" }}>
        {/* Shortfall summary */}
        <Box sx={{ mb: "10px", p: "8px 10px", borderRadius: "7px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
          <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", mb: "5px" }}>
            Short Items ({totalShort} unit{totalShort !== 1 ? "s" : ""})
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {shortfallItems.map((it, idx) => (
              <Box key={idx} sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{it.name}</Typography>
                <Typography sx={{ fontSize: 12, color: "#d97706", fontWeight: 700 }}>{it.shortQty} short</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Reason */}
        <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "6px" }}>
          Reason <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <TextField fullWidth multiline rows={2} placeholder="e.g. Damaged in transit, broken packaging..." value={reason} onChange={(e) => setReason(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 11.5, borderRadius: "6px", "& fieldset": { borderColor: submitted && !reason.trim() ? "#ef4444" : "#d1d5db" }, "&:hover fieldset": { borderColor: "#9ca3af" }, "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1.5px" } }, "& .MuiInputBase-input": { py: "7px", px: "10px" } }} />
        {submitted && !reason.trim() && <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "3px" }}>Required</Typography>}
      </DialogContent>

      <Box sx={{ px: "14px", py: "10px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
        <Button onClick={onClose} sx={{ fontSize: 11.5, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>Cancel</Button>
        <Button onClick={handleConfirm}
          sx={{ fontSize: 11.5, fontWeight: 600, textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", bgcolor: "#d97706", color: "#fff", boxShadow: "0 2px 8px rgba(217,119,6,0.25)", "&:hover": { bgcolor: "#b45309" } }}>
          Mark as Damaged
        </Button>
      </Box>
    </Dialog>
  );
}


function RejectModal({ open, onClose, transfer, onConfirm }) {
  const [reason, setReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  React.useEffect(() => { if (open) { setReason(""); setSubmitted(false); } }, [open]);
  if (!transfer) return null;

  const resolveItems = (t) => {
    if (t.lineItems && t.lineItems.length > 0) return t.lineItems;
    if (t.items && t.items.length > 0) {
      return t.items.map(i => ({
        name: i.item || i.name || i.description || "Unknown Item",
        quantity: i.qty || i.quantity || 1,
      }));
    }
    return [];
  };

  const items = resolveItems(transfer);

  const handleConfirm = () => {
    setSubmitted(true);
    if (!reason.trim()) return;
    onConfirm(transfer.id, reason);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} disableRestoreFocus disableScrollLock
      PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", width: "480px", maxWidth: "480px" } }}>
      {/* Header */}
      <Box sx={{ px: "14px", pt: "12px", pb: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box sx={{ width: 27, height: 27, borderRadius: "7px", bgcolor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Close sx={{ fontSize: 14, color: "#dc2626" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Reject Transfer — {transfer?.id}</Typography>
            <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>Provide a reason for rejection.</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px", width: 24, height: 24, p: 0, "&:hover": { bgcolor: "#f3f4f6" }, "&:focus": { outline: "none" } }}>
          <Close sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "14px", py: "10px" }}>
        {/* Meta info */}
        <Box sx={{ mb: "9px", pb: "9px", borderBottom: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>Transfer ID</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.id}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>From → To</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{transfer?.fromLabel} → {transfer?.toLabel}</Typography>
          </Box>
        </Box>

        {/* Item list */}
        {items.length > 0 && (
          <Box sx={{ mb: "10px" }}>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "5px" }}>Items Being Rejected</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 52px", gap: "7px", px: "8px", mb: "4px" }}>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Item Name</Typography>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>QTY</Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {items.map((item, idx) => (
                <Box key={idx} sx={{ display: "grid", gridTemplateColumns: "1fr 52px", gap: "7px", alignItems: "center", px: "8px", py: "6px", borderRadius: "6px", bgcolor: "#fff5f5", border: "1px solid #fecaca" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Typography sx={{ fontSize: 8, fontWeight: 700, color: "#dc2626" }}>{idx + 1}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name || item.item || item.description || "Unknown Item"}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>{item.quantity || item.qty || 0}</Typography>
                    <Typography sx={{ fontSize: 9, color: "#9ca3af" }}>units</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Rejection reason */}
        <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "6px" }}>
          Rejection Reason <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <TextField fullWidth multiline rows={2} placeholder="Explain why this transfer is being rejected..." value={reason} onChange={(e) => setReason(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 11.5, borderRadius: "6px", "& fieldset": { borderColor: submitted && !reason.trim() ? "#ef4444" : "#d1d5db" }, "&:hover fieldset": { borderColor: "#9ca3af" }, "&.Mui-focused fieldset": { borderColor: "#dc2626", borderWidth: "1.5px" } }, "& .MuiInputBase-input": { py: "7px", px: "10px" } }} />
        {submitted && !reason.trim() && <Typography sx={{ fontSize: 9, color: "#ef4444", mt: "3px" }}>Reason is required</Typography>}
      </DialogContent>

      <Box sx={{ px: "14px", py: "10px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
        <Button onClick={onClose} sx={{ fontSize: 11.5, fontWeight: 600, color: "#374151", textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>Cancel</Button>
        <Button onClick={handleConfirm} sx={{ fontSize: 11.5, fontWeight: 600, textTransform: "none", borderRadius: "6px", px: "14px", py: "6px", bgcolor: "#dc2626", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.25)", "&:hover": { bgcolor: "#b91c1c" } }}>Reject Transfer</Button>
      </Box>
    </Dialog>
  );
}

// ─── View Transfer Modal ──────────────────────────────────────────────────────
function ViewTransferModal({ transfer, onClose, inventoryItems = [] }) {
  if (!transfer) return null;
  const lf = locColor(transfer.from);
  const lt = locColor(transfer.to);
  const ps = priorityStyle(transfer.priority);
  const displayStatus = getDisplayStatus(transfer);
  const ss = statusStyle(displayStatus);


  const resolveCost = (itemName, lotNo) => {
    if (!itemName) return null;
    const fromLocation = (transfer.fromLabel || transfer.from || "").trim();
    const candidates = inventoryItems.filter(
      (inv) => inv.name && inv.name.toLowerCase() === itemName.toLowerCase()
    );
    if (candidates.length === 0) return null;
    let match =
      (lotNo && candidates.find((inv) => (inv.lot || "").toLowerCase() === lotNo.toLowerCase())) ||
      candidates.find((inv) => (inv.location || "").trim() === fromLocation) ||
      candidates[0];
    return match?.cost !== undefined && match?.cost !== null && match?.cost !== ""
      ? Number(match.cost)
      : null;
  };

  const resolveItems = (t) => {
    if (t.lineItems && t.lineItems.length > 0) return t.lineItems;
    if (t.items && t.items.length > 0) {
      return t.items.map((it) => ({
        name: it.item || it.name,
        quantity: it.qty || it.quantity,
      }));
    }
    return [];
  };

  const rows = resolveItems(transfer).map((it) => {
    const name = it.name || it.item;
    const lotNo = it.lotNo || it.lot || "";
    const cost = resolveCost(name, lotNo);
    return { ...it, cost, stage: getItemStage(it) };
  });
  const showApproved = rows.some((r) => r.approvedQty !== undefined && r.approvedQty !== null);
  const showReceived = rows.some((r) => r.receivedQty !== undefined && r.receivedQty !== null);
  const showCost = rows.some((r) => r.cost !== undefined && r.cost !== null);

  const formatCurrency = (n) =>
    `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <Modal open onClose={onClose}>
      <Box sx={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Box sx={{ bgcolor: "#fff", borderRadius: "18px", width: "100%", maxWidth: 520, boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}>
          <Box sx={{ p: "20px 24px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{transfer.id}</Typography>
              <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.25 }}>{transfer.date} · by {transfer.by}</Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ border: "2px solid #cbd5e1", borderRadius: "8px", width: 36, height: 36, bgcolor: "#f8fafc", color: "#0f172a" }}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ p: "20px 24px" }}>
            {/* From and To */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
              {[{ heading: "From", code: transfer.from, label: transfer.fromLabel, lc: lf }, { heading: "To", code: transfer.to, label: transfer.toLabel, lc: lt }].map(({ heading, code, label, lc }) => (
                <Box key={heading}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>{heading}</Typography>
                  <MuiChip label={code} size="small" variant="outlined" sx={{ bgcolor: lc.bg, color: lc.color, borderColor: lc.border, fontWeight: 700, fontSize: 12, height: 24, borderRadius: "6px", borderWidth: "1.5px" }} />
                  <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.25 }}>{label}</Typography>
                </Box>
              ))}
            </Box>

            {/* Items Section */}
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>Items</Typography>
              {/* Column headers */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 50px 70px", gap: 0.75, px: 1, mb: 0.5 }}>
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Item</Typography>
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Req.</Typography>
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Appr.</Typography>
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Recd.</Typography>
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Status</Typography>
              </Box>
              {rows.map((it, i) => {
                const reqQty = it.quantity ?? it.qty ?? 0;
                const appQty = it.approvedQty ?? "—";
                const recQty = it.receivedQty ?? "—";
                const sc = itemStageColor(it.stage);
                return (
                  <Box key={i} sx={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 50px 70px", gap: 0.75, p: "8px 8px", bgcolor: "#f8fafc", borderRadius: "6px", mb: 0.5, alignItems: "center", border: "1px solid #e2e8f0" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name || it.item}</Typography>
                      {it.itemCode && <Typography sx={{ fontSize: 9, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.itemCode}</Typography>}
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700, textAlign: "center" }}>{reqQty}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, textAlign: "center" }}>{appQty}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#0891b2", fontWeight: 700, textAlign: "center" }}>{recQty}</Typography>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <MuiChip 
                        label={it.stage} 
                        size="small" 
                        sx={{ 
                          bgcolor: sc.bg, 
                          color: sc.color, 
                          border: `1px solid ${sc.border}`, 
                          fontWeight: 700, 
                          fontSize: 9, 
                          height: 20 
                        }} 
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {displayStatus === "Partially Received" && getTotalShortfall(transfer) > 0 && (
              <Box sx={{ mt: 1, p: "8px 12px", bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                <ReportProblemOutlinedIcon sx={{ fontSize: 14, color: "#d97706", mt: "2px", flexShrink: 0 }} />
                <Typography sx={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>
                  {getTotalShortfall(transfer)} unit{getTotalShortfall(transfer) !== 1 ? "s" : ""} short on this delivery
                  {transfer.shortageMarkedDamaged
                    ? ` — already logged as ${transfer.shortageMarkType === "consumption" ? "consumed" : "damaged"}.`
                    : ". Use the shortage action in the list to log it as Damaged."}
                </Typography>
              </Box>
            )}
            {transfer.notes && transfer.notes !== "—" && (
              <Box sx={{ mt: 1, p: "8px 12px", bgcolor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontSize: 12, color: "#374151" }}>
                  <Box component="span" sx={{ fontWeight: 600, color: "#64748b" }}>Notes: </Box>
                  {transfer.notes}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ p: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, color: "#374151", borderColor: "#e2e8f0", borderRadius: "8px", "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" } }}>Close</Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Transfers() {
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { currentUser } = useAuth();
  const { items: inventoryItems, updateItem, addItem } = useInventory();
  const [transfers, setTransfers] = useState(() => loadTransfers() ?? []);
  const [showCreate, setShowCreate] = useState(false);
  const [viewItem,   setViewItem]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const [toLocationApprovalModal, setToLocationApprovalModal] = useState({ open: false, transfer: null });
  const [approvalModal, setApprovalModal] = useState({ open: false, transfer: null, mode: "approve" });
  const [rejectModal,   setRejectModal]   = useState({ open: false, transfer: null });
  const [dispatchModal, setDispatchModal] = useState({ open: false, transfer: null });
  const [receiptModal,  setReceiptModal]  = useState({ open: false, transfer: null });
  const [markShortageModal, setMarkShortageModal] = useState({ open: false, transfer: null });
  const [highlightId, setHighlightId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightTransferId = params.get("highlight");
    if (highlightTransferId) {
      setHighlightId(highlightTransferId);
      const timer = setTimeout(() => setHighlightId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  useEffect(() => { saveTransfers(transfers); }, [transfers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPriority]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const isAdminRole = currentUser?.role === "admin" || currentUser?.role === "location_manager_super";

  const locationNameToCode = {
    "Central Store":              "CS-01",
    "ICU":                        "ICU-01",
    "Pharmacy":                   "PH-01",
    "OR / Surgery":               "OR-01",
    "Emergency":                  "EM-01",
    "Clinic / OPD":               "OP-01",
    "Intensive Care":             "IC-01",
    "Ward A":                     "WA-01",
    "Ward B":                     "WA-02",
    "Surgery":                    "SU-01",
    "Laboratory":                 "LA-01",
    "Main Acute Care Hospital":   "MACH-01",
    "Central Warehouse & Stores": "CWS-01",
    "Ambulatory Surgery Center":  "ASC-01",
    "Urgent Care Center":         "UCC-01",
    "Women's & Children's Hospital": "WCH-01",
    "Core Laboratory":            "CLAB-01",
    "Outpatient Imaging Center":  "OIC-01",
    "Blood Bank":                 "BB-01",
    "Retail / Discharge Pharmacy": "RDP-01",
    "Specialty Pharmacy":         "SP-01",
    "Maintenance":                "MA-01",
  };

  const myLocationCodes = new Set(
    [
      currentUser?.locationCode,
      locationNameToCode[currentUser?.department],
      locationNameToCode[currentUser?.locationName],
      isAdminRole ? "MACH-01" : null,
    ].filter(Boolean)
  );

  const isMyLocation = (code) => {
    if (isAdminRole) return true;
    return myLocationCodes.has(code);
  };

  const visibleTransfers = transfers.filter((t) => {
    if (isAdminRole) return true;
    const fromMyLocation = isMyLocation(t.from);
    const toMyLocation = isMyLocation(t.to);
    if (fromMyLocation) return true;
    if (toMyLocation) return true;
    return false;
  });

  const filteredTransfers = visibleTransfers.filter((t) => {
    const displayStatus = getDisplayStatus(t);
    if (filterStatus !== "all" && displayStatus !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = [
        t.id, t.from, t.to,
        t.fromLabel, t.toLabel,
        t.itemsLabel, t.by, t.notes,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    const tableContainer = document.querySelector(".MuiTableContainer-root");
    if (tableContainer) tableContainer.scrollTop = 0;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      const tableContainer = document.querySelector(".MuiTableContainer-root");
      if (tableContainer) tableContainer.scrollTop = 0;
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      const tableContainer = document.querySelector(".MuiTableContainer-root");
      if (tableContainer) tableContainer.scrollTop = 0;
    }
  };

  const hasActiveFilters = searchQuery.trim() || filterStatus !== "all" || filterPriority !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterPriority("all");
  };

  const canToLocationApproveRow = (row) => {
    if (isAdminRole) return false; // Admin doesn't use this modal
    if (row.status === "Requested" && isMyLocation(row.to) && !row.toLocationApproved) return true;
    return false;
  };
  const canToLocationRejectRow = (row) => {
    if (isAdminRole) return false; // Admin doesn't use this modal
    if (row.status === "Requested" && isMyLocation(row.to) && !row.toLocationApproved) return true;
    return false;
  };


  const hasActionableApprovalItems = (row) =>
    getDisplayStatus(row) !== "Rejected" && (row.lineItems || []).some(isItemPending);

  const hasDispatchableItems = (row) =>
    (row.lineItems || []).some((it) => isItemDecided(it) && !it.dispatched && Number(it.approvedQty || 0) > 0);

  const hasReceivableItems = (row) =>
    (row.lineItems || []).some((it) => it.dispatched && it.receivedQty === undefined);

  const canFromLocationApproveRow = (row) => isMyLocation(row.from) && hasActionableApprovalItems(row);
  const canFromLocationRejectRow  = (row) => isMyLocation(row.from) && hasActionableApprovalItems(row);
  const canDispatchRow = (row) => isMyLocation(row.from) && hasDispatchableItems(row);
  const canReceiveRow  = (row) => isMyLocation(row.to) && hasReceivableItems(row);

  const handleToLocationApprovalConfirm = (updatedTransfer) => {
    setTransfers((prev) => prev.map((t) =>
      t.id === updatedTransfer.id
        ? { ...t, lineItems: updatedTransfer.lineItems, toLocationApproved: true }
        : t
    ));
    setToLocationApprovalModal({ open: false, transfer: null });
    showToast(`${updatedTransfer.id} approved by TO location. Awaiting FROM location approval.`);
  };

  const handleToLocationRejectConfirm = (id, reason) => {
    setTransfers((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: "Rejected", rejectionReason: reason, rejectedBy: "TO Location" } : t
    ));
    setToLocationApprovalModal({ open: false, transfer: null });
    showToast(`${id} rejected by TO location.`, "error");
  };

  const handleApprovalConfirm = (updatedTransfer, mode) => {
    const newStatus = computeOverallStatus(updatedTransfer.lineItems);

    setTransfers((prev) => prev.map((t) => {
      if (t.id !== updatedTransfer.id) return t;
      return { ...t, lineItems: updatedTransfer.lineItems, status: newStatus };
    }));

    setApprovalModal({ open: false, transfer: null, mode: "approve" });

    const acted = mode === "approve"
      ? (updatedTransfer.lineItems || []).filter((i) => i.status === "Approved" || i.status === "Partial Approved").length
      : (updatedTransfer.lineItems || []).filter((i) => i.status === "Rejected").length;
    const partialCount = (updatedTransfer.lineItems || []).filter((i) => i.status === "Partial Approved").length;

    const message = mode === "approve"
      ? (partialCount > 0
          ? `${acted} item${acted !== 1 ? "s" : ""} approved in ${updatedTransfer.id} (${partialCount} reduced — remainder rejected).`
          : `${acted} item${acted !== 1 ? "s" : ""} approved in ${updatedTransfer.id}.`)
      : `${acted} item${acted !== 1 ? "s" : ""} rejected in ${updatedTransfer.id}.`;

    showToast(message, mode === "approve" ? "success" : "error");
  };

  const handleDispatchConfirm = (id, remarks) => {
    setTransfers((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const updatedLineItems = (t.lineItems || []).map((it) => {
        const dispatchable = isItemDecided(it) && !it.dispatched && Number(it.approvedQty || 0) > 0;
        if (!dispatchable) return it;
        return { ...it, dispatched: true };
      });
      const newStatus = computeOverallStatus(updatedLineItems);
      return { ...t, lineItems: updatedLineItems, status: newStatus, dispatchRemarks: remarks };
    }));
    setDispatchModal({ open: false, transfer: null });
    showToast(`${id} dispatched. Awaiting receipt at destination.`);
  };

  const handleReceiptConfirm = (id, remarks, receivedQtyMap) => {
    const transfer = transfers.find((t) => t.id === id);
    if (!transfer) return;

    const justReceived = [];
    let filteredIdx = 0;
    const updatedLineItems = (transfer.lineItems || []).map((it) => {
      const isReceivable = it.dispatched && it.receivedQty === undefined;
      if (!isReceivable) return it;
      const issuedQty = Number(it.approvedQty ?? it.quantity ?? 0);
      const recvQty = Math.max(0, Math.min(Number(receivedQtyMap[filteredIdx] ?? issuedQty), issuedQty));
      filteredIdx += 1;
      justReceived.push({ name: it.name, qty: recvQty });
      return { ...it, receivedQty: recvQty };
    });

    // Sync inventory for items received this round.
    justReceived.forEach(({ name, qty: recvQty }) => {
      if (recvQty <= 0) return;
      const fromLocation = (transfer.fromLabel || transfer.from)?.trim();
      const toLocation = (transfer.toLabel || transfer.to)?.trim();

      const fromItem = inventoryItems.find(
        (inv) => inv.name && inv.name.toLowerCase() === name.toLowerCase() && (inv.location || "").trim() === fromLocation
      );
      if (fromItem) {
        const newFromQty = Math.max(0, (fromItem.qty || 0) - recvQty);
        updateItem(fromItem.id, { qty: newFromQty });
      }

      const toItem = inventoryItems.find(
        (inv) => inv.name && inv.name.toLowerCase() === name.toLowerCase() && (inv.location || "").trim() === toLocation
      );
      if (toItem) {
        const newToQty = (toItem.qty || 0) + recvQty;
        updateItem(toItem.id, { qty: newToQty });
      } else if (fromItem) {
        addItem({
          name: fromItem.name,
          ndc: fromItem.ndc,
          category: fromItem.category,
          subcategory: fromItem.subcategory,
          location: toLocation,
          department: fromItem.department,
          qty: recvQty,
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

    const newStatus = computeOverallStatus(updatedLineItems);
    setTransfers((prev) => prev.map((t) =>
      t.id === id ? { ...t, lineItems: updatedLineItems, status: newStatus, receiptRemarks: remarks } : t
    ));
    setReceiptModal({ open: false, transfer: null });

    const anyShortThisRound = updatedLineItems.some(
      (it) => it.receivedQty !== undefined && Number(it.receivedQty) < Number(it.approvedQty || 0) && justReceived.some((jr) => jr.name === it.name)
    );
    showToast(
      anyShortThisRound
        ? `${id} marked Partially Received — some quantities were short.`
        : `${id} received. Inventory updated at destination.`,
      anyShortThisRound ? "warning" : "success"
    );
  };

  const handleRejectConfirm = (id, reason) => {
    setTransfers((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: "Rejected", rejectionReason: reason } : t
    ));
    setRejectModal({ open: false, transfer: null });
    showToast(`${id} rejected.`, "error");
  };

  const handleCreate = (newTransfer) => {
    const stamped = { ...newTransfer, createdById: currentUser?.id };
    setTransfers((prev) => [stamped, ...prev]);
    showToast(`${newTransfer.id} created successfully.`);
  };

  const handleMarkShortageConfirm = (row, markType, reason) => {
    const shortfallItems = getShortfallItems(row);
    if (shortfallItems.length === 0) return;

    let existing = [];
    try {
      const saved = localStorage.getItem(CONSUMPTION_STORAGE_KEY);
      if (saved) existing = JSON.parse(saved);
    } catch {}

    const newRecords = shortfallItems.map((it) => ({
      id: Date.now() + Math.random(),
      itemId: "",
      itemName: it.name,
      lotNo: it.lotNo || "",
      quantity: String(it.shortQty),
      type: markType,
      reason: reason?.trim() || `Short delivery on transfer ${row.id} (${row.fromLabel || row.from} → ${row.toLabel || row.to})`,
      date: new Date().toISOString().split("T")[0],
      createdBy: currentUser?.name || "Unknown",
      department: currentUser?.department || "—",
      location: row.toLabel || row.to || "—",
      createdDate: new Date().toLocaleString(),
    }));

    const updated = [...existing, ...newRecords];
    try {
      localStorage.setItem(CONSUMPTION_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setTransfers((prev) =>
      prev.map((t) => (t.id === row.id ? { ...t, shortageMarkedDamaged: true, shortageMarkType: markType } : t))
    );
    setMarkShortageModal({ open: false, transfer: null });

    const totalShort = shortfallItems.reduce((s, it) => s + it.shortQty, 0);
    const typeLabel = markType === "damaged" ? "damaged" : "consumed";
    showToast(`${totalShort} short unit${totalShort !== 1 ? "s" : ""} logged as ${typeLabel}. Redirecting…`);

    setTimeout(() => navigate("/admin/consumption-damaged-items"), 800);
  };

  const total    = visibleTransfers.length;
  const pending  = visibleTransfers.filter((t) => getDisplayStatus(t) === "Requested").length;
  const approved = visibleTransfers.filter((t) => ["Approved", "Partially Approved"].includes(getDisplayStatus(t))).length;
  const received = visibleTransfers.filter((t) => ["Received", "Partially Received"].includes(getDisplayStatus(t))).length;

  const statCards = [
    { label: "Total Transfers", value: total,    sub: "All transfers",     iconBg: "#f59e0b",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> },
    { label: "Pending",         value: pending,  sub: "Awaiting approval", iconBg: "#8b5cf6",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: "Approved",        value: approved, sub: "Ready to dispatch", iconBg: "#10b981",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { label: "Received",        value: received, sub: "Completed",         iconBg: "#06b6d4",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg> },
  ];

  const TABLE_HEADS = ["Transfer # / Priority", "From", "To", "By", "Status", "Actions"];

  return (
    <Box>
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast?.type === "error" ? "error" : toast?.type === "warning" ? "warning" : "success"} variant="filled"
          sx={{ fontSize: 13, fontWeight: 600, borderRadius: "10px", minWidth: 320, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
          onClose={() => setToast(null)}>
          {toast?.msg}
        </Alert>
      </Snackbar>

      <CreateTransferModal open={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate} prefillItem={null} />
      {viewItem && <ViewTransferModal transfer={viewItem} onClose={() => setViewItem(null)} inventoryItems={inventoryItems} />}
      <ToLocationApprovalModal open={toLocationApprovalModal.open} onClose={() => setToLocationApprovalModal({ open: false, transfer: null })} transfer={toLocationApprovalModal.transfer} onConfirm={handleToLocationApprovalConfirm} onReject={handleToLocationRejectConfirm} />
      <ApprovalModal
        open={approvalModal.open}
        onClose={() => setApprovalModal({ open: false, transfer: null, mode: "approve" })}
        transfer={approvalModal.transfer}
        mode={approvalModal.mode}
        onConfirm={handleApprovalConfirm}
      />
      <DispatchModal open={dispatchModal.open} onClose={() => setDispatchModal({ open: false, transfer: null })} transfer={dispatchModal.transfer} onConfirm={handleDispatchConfirm} />
      <RejectModal open={rejectModal.open} onClose={() => setRejectModal({ open: false, transfer: null })} transfer={rejectModal.transfer} onConfirm={handleRejectConfirm} />
      <ConfirmReceiptModal open={receiptModal.open} onClose={() => setReceiptModal({ open: false, transfer: null })} transfer={receiptModal.transfer} onConfirm={handleReceiptConfirm} />
      <MarkShortageModal open={markShortageModal.open} onClose={() => setMarkShortageModal({ open: false, transfer: null })} transfer={markShortageModal.transfer} onConfirm={handleMarkShortageConfirm} />

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3.25, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Stock Transfer</Typography>
          <Typography sx={{ fontSize: 13, color: "#94a3b8", mt: 0.5 }}>
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search by ID, location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")} disableRipple
                    sx={{ p: "3px", color: "#9ca3af", "&:hover": { color: "#374151" } }}>
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              minWidth: 280,
              "& .MuiOutlinedInput-root": {
                fontSize: 13, borderRadius: "8px", bgcolor: "#fff", height: 36,
                "& fieldset": { borderColor: "#e5e7eb" },
                "&:hover fieldset": { borderColor: "#9ca3af" },
                "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
              },
            }}
          />

          <Select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{
              fontSize: 13,
              borderRadius: "20px",
              background: "#fff",
              minWidth: 148,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb", borderWidth: "1px" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
            }}
          >
            <MenuItem value="all" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
            <MenuItem value="Requested"          sx={{ fontSize: 13 }}>Requested</MenuItem>
            <MenuItem value="Approved"           sx={{ fontSize: 13 }}>Approved</MenuItem>
            <MenuItem value="Partially Approved" sx={{ fontSize: 13 }}>Partially Approved</MenuItem>
            <MenuItem value="Dispatched"         sx={{ fontSize: 13 }}>Dispatched</MenuItem>
            <MenuItem value="Received"           sx={{ fontSize: 13 }}>Received</MenuItem>
            <MenuItem value="Partially Received" sx={{ fontSize: 13 }}>Partially Received</MenuItem>
            <MenuItem value="Rejected"           sx={{ fontSize: 13 }}>Rejected</MenuItem>
          </Select>

          <Select
            size="small"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            sx={{
              fontSize: 13,
              borderRadius: "20px",
              background: "#fff",
              minWidth: 148,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb", borderWidth: "1px" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
            }}
          >
            <MenuItem value="all"      sx={{ fontSize: 13 }}>All Priorities</MenuItem>
            <MenuItem value="Low"   sx={{ fontSize: 13 }}>Low</MenuItem>
            <MenuItem value="Medium"   sx={{ fontSize: 13 }}>Medium</MenuItem>
            <MenuItem value="High"   sx={{ fontSize: 13 }}>High</MenuItem>
            <MenuItem value="Critical" sx={{ fontSize: 13 }}>Critical</MenuItem>
          </Select>

          {can.createTransfer && (
            <Button
              onClick={() => setShowCreate(true)}
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: "15px !important" }} />}
              sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "#2563eb", color: "#fff", borderRadius: "12px", px: "15px", py: "8px", fontSize: "12px", fontWeight: 500, textTransform: "none", lineHeight: 1, boxShadow: "0 1px 4px rgba(37,99,235,0.25)", "&:hover": { background: "#1d4ed8", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" } }}>
              New Transfer
            </Button>
          )}
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: "flex", gap: "12px", mb: 3 }}>
        {statCards.map((s) => (
          <Box key={s.label} sx={{ flex: 1, bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 1 }, minWidth: 0, display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
            <Box sx={{ width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 }, borderRadius: "50%", bgcolor: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</Box>
            <Box>
              <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 11 }, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", mb: { xs: 0.25, sm: 0.375, md: 0.5 } }}>{s.label}</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: { xs: 0.25, sm: 0.5, md: 0.75 } }}>
                <Typography sx={{ fontSize: { xs: 18, sm: 20, md: 22 }, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 11 }, fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap" }}>{s.sub}</Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <TableContainer>
          <Table sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ background: "#EBF1FE" }}>
                {TABLE_HEADS.map((h) => (
                  <TableCell key={h} sx={{ py: "11px", px: "14px", fontSize: 11, fontWeight: 600, color: "#373B4D", letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6", borderRight: "1px solid #BED3FC", "&:last-child": { borderRight: "none" } }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: "center", border: "none" }}>
                    <Typography sx={{ fontSize: 14, color: "#94a3b8", mb: "6px" }}>
                      {hasActiveFilters ? "No transfers match your filters." : "No transfers found."}
                    </Typography>
                    {hasActiveFilters && (
                      <Button onClick={clearFilters} size="small" disableRipple
                        sx={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textTransform: "none", "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransfers.map((row, i) => {
                  const lf = locColor(row.from);
                  const lt = locColor(row.to);
                  const ps = priorityStyle(row.priority);
                  const displayStatus = getDisplayStatus(row);
                  const ss = statusStyle(displayStatus);
                  const isHighlighted = row.id === highlightId;

                  const rowCanToApprove    = canToLocationApproveRow(row);
                  const rowCanToReject     = canToLocationRejectRow(row);
                  const rowCanFromApprove  = canFromLocationApproveRow(row);
                  const rowCanFromReject   = canFromLocationRejectRow(row);
                  const rowCanDispatch     = canDispatchRow(row);
                  const rowCanReceive      = canReceiveRow(row);
                  const rowShortfall       = displayStatus === "Partially Received" ? getTotalShortfall(row) : 0;

                  return (
                    <TableRow key={row.id} sx={{ background: isHighlighted ? "#fef3c7" : "#fff", "&:hover": { background: isHighlighted ? "#fef3c7" : "#fafafa" }, transition: "background 0.15s", "& td": { borderBottom: i < paginatedTransfers.length - 1 ? "1px solid #f3f4f6" : "none" }, ...(isHighlighted && { "& td:first-of-type": { borderLeft: "3px solid #015DFF" } }) }}>

                      {/* Transfer # / Priority */}
                      <TableCell sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}>
                        <Tooltip title={`Transfer: ${row.id}`} placement="top" arrow>
                          <Typography onClick={() => setViewItem(row)} sx={{ fontSize: 13, fontWeight: 600, color: "#111827", cursor: "pointer", lineHeight: 1.3, "&:hover": { textDecoration: "underline" } }}>{row.id}</Typography>
                        </Tooltip>
                        <Tooltip title={`Priority: ${row.priority}`} placement="top" arrow>
                          <Box sx={{ mt: "6px" }}><StyledChip label={row.priority} style={ps} /></Box>
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}>
                        <Tooltip title={`From: ${row.fromLabel || row.from}`} placement="top" arrow>
                          <Box>
                            <MuiChip label={row.from} size="small" variant="outlined" sx={{ bgcolor: lf.bg, color: lf.color, borderColor: lf.border, fontWeight: 700, fontSize: 11, height: 20, borderRadius: "6px", borderWidth: "1.5px", "& .MuiChip-label": { px: "7px" } }} />
                            <Typography sx={{ fontSize: 10, color: "#94a3b8", mt: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.fromLabel}</Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}>
                        <Tooltip title={`To: ${row.toLabel || row.to}`} placement="top" arrow>
                          <Box>
                            <MuiChip label={row.to} size="small" variant="outlined" sx={{ bgcolor: lt.bg, color: lt.color, borderColor: lt.border, fontWeight: 700, fontSize: 11, height: 20, borderRadius: "6px", borderWidth: "1.5px", "& .MuiChip-label": { px: "7px" } }} />
                            <Typography sx={{ fontSize: 10, color: "#94a3b8", mt: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.toLabel}</Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* By */}
                      <TableCell sx={{ py: "12px", px: "14px", verticalAlign: "middle", maxWidth: 0, overflow: "hidden" }}>
                        <Tooltip title={`By: ${row.by}`} placement="top" arrow>
                          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#374151", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.by}</Typography>
                        </Tooltip>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}>
                        <Tooltip title={`Status: ${displayStatus}`} placement="top" arrow>
                          <Box><StyledChip label={displayStatus} style={ss} /></Box>
                        </Tooltip>
                        {displayStatus === "Partially Received" && rowShortfall > 0 && (
                          <Tooltip title={`${rowShortfall} unit${rowShortfall !== 1 ? "s" : ""} short on this delivery`} placement="top" arrow>
                            <Box
                              sx={{
                                mt: "6px", display: "inline-flex", alignItems: "center", gap: "4px",
                                px: "6px", py: "3px", borderRadius: "6px",
                                bgcolor: "#fffbeb", border: "1px solid #fde68a", maxWidth: 160,
                              }}
                            >
                              <ReportProblemOutlinedIcon sx={{ fontSize: 12, color: "#d97706", flexShrink: 0 }} />
                              <Typography sx={{ fontSize: 10, color: "#92400e", fontWeight: 600, lineHeight: 1.3, whiteSpace: "nowrap" }}>
                                {rowShortfall} short
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}>
                        <Box sx={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>

                          {row.status === "Requested" && rowCanToApprove && (
                            <>
                              <Tooltip title="Approve (TO Location)">
                                <span>
                                  <IconButton onClick={() => setToLocationApprovalModal({ open: true, transfer: row })} size="small"
                                    sx={{ width: 28, height: 28, border: "1px solid #bbf7d0", borderRadius: "6px", bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7", borderColor: "#86efac" } }}>
                                    <CheckOutlinedIcon sx={{ fontSize: 14, color: "#16a34a" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Reject (TO Location)">
                                <span>
                                  <IconButton onClick={() => setRejectModal({ open: true, transfer: row, isToLocation: true })} size="small"
                                    sx={{ width: 28, height: 28, border: "1px solid #fecaca", borderRadius: "6px", bgcolor: "#fff", "&:hover": { bgcolor: "#fef2f2", borderColor: "#fca5a5" } }}>
                                    <CloseOutlinedIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}

                          {rowCanFromApprove && (
                            <>
                              <Tooltip title="Approve Items (FROM Location)">
                                <span>
                                  <IconButton onClick={() => setApprovalModal({ open: true, transfer: row, mode: "approve" })} size="small"
                                    sx={{ width: 28, height: 28, border: "1px solid #bfdbfe", borderRadius: "6px", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" } }}>
                                    <CheckOutlinedIcon sx={{ fontSize: 14, color: "#2563eb" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Reject Items (FROM Location)">
                                <span>
                                  <IconButton onClick={() => setApprovalModal({ open: true, transfer: row, mode: "reject" })} size="small"
                                    sx={{ width: 28, height: 28, border: "1px solid #fecaca", borderRadius: "6px", bgcolor: "#fff", "&:hover": { bgcolor: "#fef2f2", borderColor: "#fca5a5" } }}>
                                    <CloseOutlinedIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}

                          {rowCanDispatch && (
                            <Tooltip title="Dispatch">
                              <span>
                                <IconButton onClick={() => setDispatchModal({ open: true, transfer: row })} size="small"
                                  sx={{ width: 28, height: 28, border: "1px solid #c7d2fe", borderRadius: "6px", bgcolor: "#e0e7ff", "&:hover": { bgcolor: "#c7d2fe", borderColor: "#a5b4fc" } }}>
                                  <LocalShippingOutlinedIcon sx={{ fontSize: 14, color: "#4f46e5" }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {rowCanReceive && (
                            <Tooltip title="Confirm Receipt">
                              <span>
                                <IconButton onClick={() => setReceiptModal({ open: true, transfer: row })} size="small"
                                  sx={{ width: 28, height: 28, border: "1px solid #a5f3fc", borderRadius: "6px", bgcolor: "#ecfeff", "&:hover": { bgcolor: "#cffafe", borderColor: "#67e8f9" } }}>
                                  <MoveToInboxIcon sx={{ fontSize: 14, color: "#0891b2" }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {displayStatus === "Partially Received" && rowShortfall > 0 && !row.shortageMarkedDamaged && (
                            <Tooltip title={`Mark ${rowShortfall} short unit${rowShortfall !== 1 ? "s" : ""} as Damaged`}>
                              <span>
                                <IconButton onClick={() => setMarkShortageModal({ open: true, transfer: row })} size="small"
                                  sx={{ width: 28, height: 28, border: "1px solid #fde68a", borderRadius: "6px", bgcolor: "#fffbeb", "&:hover": { bgcolor: "#fef3c7", borderColor: "#fcd34d" } }}>
                                  <Inventory2OutlinedIcon sx={{ fontSize: 14, color: "#d97706" }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          <Tooltip title="View details">
                            <IconButton onClick={() => setViewItem(row)} size="small"
                              sx={{ width: 28, height: 28, border: "1px solid #bfdbfe", borderRadius: "6px", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" } }}>
                              <VisibilityOutlinedIcon sx={{ fontSize: 14, color: "#2563eb" }} />
                            </IconButton>
                          </Tooltip>

                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination Section */}
      {filteredTransfers.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            mt: 3,
            pt: 2,
            pb: 1,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              sx={{
                minWidth: 28, height: 28, p: 0, borderRadius: "6px", border: "1px solid #e5e7eb",
                color: currentPage === 1 ? "#d1d5db" : "#374151",
                "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </Button>

            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              shape="rounded"
              size="small"
              hidePrevButton={true}
              hideNextButton={true}
              showFirstButton={false}
              showLastButton={false}
              siblingCount={1}
              boundaryCount={1}
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: "6px", fontSize: "11px", fontWeight: 500, minWidth: "28px", height: "28px",
                  border: "1px solid #e5e7eb", color: "#374151",
                  "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                },
                "& .Mui-selected": {
                  background: "#015DFF !important", color: "#fff", border: "1px solid #015DFF",
                  "&:hover": { background: "#0147CC !important" },
                },
              }}
            />

            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              sx={{
                minWidth: 28, height: 28, p: 0, borderRadius: "6px", border: "1px solid #e5e7eb",
                color: currentPage === totalPages ? "#d1d5db" : "#374151",
                "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}