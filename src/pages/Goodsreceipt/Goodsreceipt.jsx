import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  Divider,
  Tooltip,
  TextField,
  Checkbox,
  InputAdornment,
  Pagination,
  Select,
  MenuItem,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import NewGRNDialog from "./newgrnmodal";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import UploadInvoice from "../Goodsreceipt/UploadInvoice";
import { useGRN } from "../../contexts/GRNContext";
import { useInventory } from "../../contexts/InventoryContext";
import { usePermissions } from "../../hooks/usePermissions";

const ITEMS_PER_PAGE = 5;

function GRNItemApprovalModal({ open, onClose, receipt, onConfirm }) {
  const items = receipt?.lineItems || [];
  const todayModal = new Date();
  todayModal.setHours(0, 0, 0, 0);
  const isItemExpired = (expiryStr) => {
    if (!expiryStr) return false;
    const d = new Date(expiryStr);
    d.setHours(0, 0, 0, 0);
    return d <= todayModal;
  };
  // ── Remaining-balance helpers (like indent orderedQty/receivedQty/balanceToReceive) ──
  const getPriorApproved = (item) => item.itemApprovedQty || 0;
  const getRemaining = (item) => Math.max(0, (item.rcvQty ?? 0) - getPriorApproved(item));
  const isFullyApproved = (item) => item.itemApprovalStatus === "Approved" && getRemaining(item) <= 0;
  const isActionable = (item) => !isItemExpired(item.expiry) && !isFullyApproved(item);

  const [selected, setSelected] = useState(() =>
    items.map((it, i) => ({ it, i })).filter(({ it }) => isActionable(it)).map(({ i }) => i),
  );
  const [approvedQty, setApprovedQty] = useState(() =>
    Object.fromEntries(items.map((it, i) => [i, getRemaining(it)])),
  );
  const [reason, setReason] = useState(() =>
    Object.fromEntries(items.map((_, i) => [i, ""])),
  );
  const [submitted, setSubmitted] = useState(false);

  useState(() => {
    if (open && receipt) {
      setSelected(items.map((it, i) => ({ it, i })).filter(({ it }) => isActionable(it)).map(({ i }) => i));
      setApprovedQty(Object.fromEntries(items.map((it, i) => [i, getRemaining(it)])));
      setReason(Object.fromEntries(items.map((_, i) => [i, ""])));
      setSubmitted(false);
    }
  });

  if (!receipt) return null;

  const actionableIdxs = items.map((it, i) => ({ it, i })).filter(({ it }) => isActionable(it)).map(({ i }) => i);

  const toggle = (idx) =>
    setSelected((prev) => prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]);
  const toggleAll = () =>
    setSelected(selected.length === actionableIdxs.length ? [] : actionableIdxs);

  const handleConfirm = () => {
    setSubmitted(true);
    const missingReason = selected.some((idx) => {
      const remaining = getRemaining(items[idx]);
      const appQty = Number(approvedQty[idx] ?? remaining);
      return appQty < remaining && !reason[idx]?.trim();
    });
    if (missingReason) return;
    const updatedLines = items.map((item, idx) => {
      // Already fully approved in an earlier round — leave untouched
      if (isFullyApproved(item)) return item;

      const priorApproved = getPriorApproved(item);
      const rcvQty = item.rcvQty ?? 0;
      const remaining = getRemaining(item);

      if (!selected.includes(idx)) {
        // Item not selected — keep its current status if it was previously set, otherwise leave as undefined (Pending)
        // Only update the reason if provided
        return { ...item, itemApprovalReason: reason[idx] || item.itemApprovalReason || "" };
      }

      const appQtyThisRound = Math.max(0, Math.min(Number(approvedQty[idx] ?? remaining), remaining));
      const newApprovedQty = priorApproved + appQtyThisRound;
      const isPartial = newApprovedQty < rcvQty;
      return { ...item, itemApprovalStatus: isPartial ? "Partial" : "Approved", itemApprovedQty: newApprovedQty, itemApprovalReason: reason[idx] || item.itemApprovalReason || "" };
    });
    const allApproved = updatedLines.every((l) => l.itemApprovalStatus === "Approved");
    const allRejected = updatedLines.every((l) => l.itemApprovalStatus === "Rejected");
    const hasPartial = updatedLines.some((l) => l.itemApprovalStatus === "Partial");
    const hasRejected = updatedLines.some((l) => l.itemApprovalStatus === "Rejected");
    const newGRNStatus = allRejected ? "Rejected" : allApproved ? "Completed" : hasPartial || hasRejected ? "Partial" : "Completed";
    const newTotal = updatedLines.filter((l) => l.itemApprovalStatus !== "Rejected").reduce((s, l) => s + (l.itemApprovedQty || 0) * (l.unitCost || 0), 0);
    onConfirm({
      lineItems: updatedLines,
      status: newGRNStatus,
      totalValue: `$${newTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      receivedQty: updatedLines.reduce((s, l) => s + (l.itemApprovedQty || 0), 0),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableRestoreFocus disableScrollLock
      PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" } }}>
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 2.5 }, pt: { xs: 1.25, sm: 1.5, md: 1.75 }, pb: { xs: 1, sm: 1.25, md: 1.5 }, display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", bgcolor: "#fff" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1, md: 1.5 } }}>
          <Box sx={{ width: { xs: 36, sm: 38, md: 38 }, height: { xs: 36, sm: 38, md: 38 }, borderRadius: "10px", bgcolor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChecklistOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, color: "#16a34a" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: 14, sm: 15, md: 16 }, fontWeight: 700, color: "#111827" }}>Approve Items — {receipt?.id}</Typography>
            <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 12 }, color: "#9ca3af", mt: { xs: 0.25, sm: 0.5, md: 0.5 } }}>Select items to approve · set approved qty · provide reason for partial approvals</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disableRipple sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: { xs: 28, sm: 30, md: 30 }, height: { xs: 28, sm: 30, md: 30 }, "&:hover": { bgcolor: "#f3f4f6" }, "&:focus": { outline: "none" } }}>
          <CloseIcon sx={{ fontSize: { xs: 14, sm: 15, md: 15 } }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 1.5, sm: 2, md: 2.5 }, py: { xs: 1.25, sm: 1.5, md: 1.75 }, overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 }, scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 }, mb: { xs: 0.75, sm: 1, md: 1.5 }, pb: { xs: 0.75, sm: 1, md: 1.5 }, borderBottom: "1px solid #f3f4f6" }}>
          <Checkbox size="small" checked={selected.length === items.length && items.length > 0} indeterminate={selected.length > 0 && selected.length < items.length} onChange={toggleAll} sx={{ p: 0, color: "#16a34a", "&.Mui-checked": { color: "#16a34a" }, "&.MuiCheckbox-indeterminate": { color: "#16a34a" } }} />
          <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 13 }, fontWeight: 600, color: "#374151" }}>Select All ({actionableIdxs.length} of {items.length} items{actionableIdxs.length < items.length ? " — rest already fully approved" : ""})</Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "32px 24px minmax(0,3fr) 80px 80px 1fr", gap: { xs: 0.5, sm: 0.75, md: 1 }, px: { xs: 1, sm: 1.5, md: 1.75 }, mb: { xs: 0.5, sm: 0.75, md: 1 }, alignItems: "center" }}>
          <Box /><Box />
          {["Item", "Purchase Qty", "Approve", "Reason (partial only)"].map((h, i) => (
            <Typography key={h} sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, fontWeight: 700, color: i === 1 ? "#0284c7" : "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: i === 1 || i === 2 ? "center" : "left" }}>{h}</Typography>
          ))}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
          {items.map((item, idx) => {
            const rcvQty = item.rcvQty ?? 0;
            const priorApproved = getPriorApproved(item);
            const remaining = getRemaining(item);
            const itemExpired = isItemExpired(item.expiry);
            const locked = isFullyApproved(item);

            // ── Locked row: item already fully approved in a prior round ──
            if (locked) {
              return (
                <Box key={idx} sx={{ display: "grid", gridTemplateColumns: "32px 24px minmax(0,3fr) 80px 80px 1fr", gap: { xs: 0.5, sm: 0.75, md: 1 }, alignItems: "center", p: { xs: 0.75, sm: 1, md: 1.25 }, borderRadius: "8px", border: "1px solid #bbf7d0", bgcolor: "#f0fdf4", opacity: 0.85 }}>
                  <Box />
                  <Box sx={{ width: { xs: 20, md: 22 }, height: { xs: 20, md: 22 }, borderRadius: "50%", bgcolor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, fontWeight: 700, color: "#16a34a" }}>✓</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 }, overflow: "hidden" }}>
                      <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item}</Typography>
                      <Chip label="Fully Approved" size="small" sx={{ height: { xs: 16, md: 18 }, fontSize: { xs: 9, sm: 10, md: 10 }, fontWeight: 700, bgcolor: "#dcfce7", color: "#16a34a", flexShrink: 0, "& .MuiChip-label": { px: { xs: 0.5, sm: 0.75, md: 1 } } }} />
                    </Box>
                    {(item.itemCode || item.category) && <Typography sx={{ fontSize: { xs: 10, sm: 11, md: 11 }, color: "#9ca3af" }}>{item.itemCode}{item.category ? ` · ${item.category}` : ""}</Typography>}
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, color: "#0284c7", mb: { xs: 0.25, sm: 0.5, md: 0.5 }, fontWeight: 600 }}>Received</Typography>
                    <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 14 }, fontWeight: 700, color: "#0284c7" }}>{rcvQty}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, color: "#9ca3af", mb: { xs: 0.25, sm: 0.5, md: 0.5 } }}>Approved</Typography>
                    <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 14 }, fontWeight: 700, color: "#16a34a" }}>{priorApproved}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: { xs: 10, sm: 11, md: 11 }, color: "#9ca3af" }}>Nothing left to approve</Typography>
                </Box>
              );
            }

            const isChecked = selected.includes(idx);
            const appQty = approvedQty[idx] ?? remaining;
            const isPartial = isChecked && Number(appQty) < remaining;
            const missingReason = submitted && isChecked && isPartial && !reason[idx]?.trim();
            return (
              <Box key={idx}>
                <Box onClick={() => !itemExpired && toggle(idx)} sx={{ display: "grid", gridTemplateColumns: "32px 24px minmax(0,3fr) 80px 80px 1fr", gap: { xs: 0.5, sm: 0.75, md: 1 }, alignItems: "center", p: { xs: 0.75, sm: 1, md: 1.25 }, borderRadius: "8px", border: `1px solid ${itemExpired ? "#fecaca" : isChecked ? "#bbf7d0" : "#e5e7eb"}`, bgcolor: itemExpired ? "#fef2f2" : isChecked ? "#f0fdf4" : "#f9fafb", cursor: itemExpired ? "not-allowed" : "pointer", transition: "all 0.12s", "&:hover": itemExpired ? {} : { borderColor: "#bbf7d0", bgcolor: "#f0fdf4" } }}>
                  <Checkbox size="small" checked={isChecked} disabled={itemExpired} onChange={() => !itemExpired && toggle(idx)} onClick={(e) => e.stopPropagation()} sx={{ p: 0, color: "#16a34a", "&.Mui-checked": { color: "#16a34a" } }} />
                  <Box sx={{ width: { xs: 20, md: 22 }, height: { xs: 20, md: 22 }, borderRadius: "50%", bgcolor: itemExpired ? "#fecaca" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, fontWeight: 700, color: itemExpired ? "#dc2626" : "#6b7280" }}>{idx + 1}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 }, overflow: "hidden" }}>
                      <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 600, color: itemExpired ? "#dc2626" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item}</Typography>
                      {itemExpired && <Chip label="Expired" size="small" sx={{ height: { xs: 16, md: 18 }, fontSize: { xs: 9, sm: 10, md: 10 }, fontWeight: 700, bgcolor: "#fecaca", color: "#dc2626", flexShrink: 0, "& .MuiChip-label": { px: { xs: 0.5, sm: 0.75, md: 1 } } }} />}
                      {priorApproved > 0 && <Chip label={`${priorApproved} already approved`} size="small" sx={{ height: { xs: 16, md: 18 }, fontSize: { xs: 9, sm: 10, md: 10 }, fontWeight: 700, bgcolor: "#dcfce7", color: "#16a34a", flexShrink: 0, "& .MuiChip-label": { px: { xs: 0.5, sm: 0.75, md: 1 } } }} />}
                    </Box>
                    {(item.itemCode || item.category) && <Typography sx={{ fontSize: { xs: 10, sm: 11, md: 11 }, color: "#9ca3af" }}>{item.itemCode}{item.category ? ` · ${item.category}` : ""}{item.unitCost ? ` · $${item.unitCost.toFixed(2)}/unit` : ""}</Typography>}
                    {itemExpired && item.expiry && <Typography sx={{ fontSize: { xs: 10, sm: 11, md: 11 }, color: "#dc2626", fontWeight: 500 }}>Expired: {item.expiry}</Typography>}
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, color: "#0284c7", mb: { xs: 0.25, sm: 0.5, md: 0.5 }, fontWeight: 600 }}>Remaining</Typography>
                    <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 14 }, fontWeight: 700, color: "#0284c7" }}>{remaining}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                    <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, color: "#9ca3af", mb: { xs: 0.25, sm: 0.5, md: 0.5 } }}>Approve</Typography>
                    <TextField size="small" type="number" value={appQty} disabled={!isChecked}
                      onChange={(e) => { const val = Math.max(0, Math.min(Number(e.target.value) || 0, remaining)); setApprovedQty((prev) => ({ ...prev, [idx]: val })); }}
                      inputProps={{ min: 0, max: remaining, style: { textAlign: "center", padding: "4px 6px", fontSize: 13, fontWeight: 700 } }}
                      sx={{ width: "68px", "& .MuiOutlinedInput-root": { borderRadius: "6px", bgcolor: isChecked ? "#fff" : "#f3f4f6", "& fieldset": { borderColor: isPartial ? "#f59e0b" : "#d1d5db" }, "&:hover fieldset": { borderColor: isPartial ? "#d97706" : "#9ca3af" }, "&.Mui-focused fieldset": { borderColor: "#16a34a", borderWidth: "1.5px" } }, "& input[type=number]": { MozAppearance: "textfield" }, "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" }, "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" } }} />
                  </Box>
                  <Box onClick={(e) => e.stopPropagation()}>
                    <TextField size="small" fullWidth placeholder={isPartial ? "Reason required *" : "Reason (optional)"} value={reason[idx] || ""} disabled={!isChecked}
                      onChange={(e) => setReason((prev) => ({ ...prev, [idx]: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { fontSize: { xs: 11, sm: 12, md: 12 }, borderRadius: "6px", bgcolor: isChecked ? "#fff" : "#f3f4f6", "& fieldset": { borderColor: missingReason ? "#ef4444" : "#d1d5db" }, "&:hover fieldset": { borderColor: "#9ca3af" }, "&.Mui-focused fieldset": { borderColor: "#16a34a", borderWidth: "1.5px" } }, "& .MuiInputBase-input": { py: { xs: 0.5, sm: 0.75, md: 1 }, px: { xs: 0.75, sm: 1, md: 1.25 } } }} />
                    {missingReason && <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 10 }, color: "#ef4444", mt: { xs: 0.25, sm: 0.5, md: 0.5 } }}>Required for partial approval</Typography>}
                  </Box>
                </Box>
                {isPartial && (
                  <Box sx={{ ml: { xs: 4, sm: 4.5, md: 4.5 }, mt: { xs: 0.25, sm: 0.5, md: 0.75 }, display: "inline-flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 }, px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.25, sm: 0.375, md: 0.5 }, borderRadius: "6px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
                    <Box sx={{ width: { xs: 4, md: 6 }, height: { xs: 4, md: 6 }, borderRadius: "50%", bgcolor: "#f59e0b" }} />
                    <Typography sx={{ fontSize: { xs: 10, sm: 11, md: 11 }, color: "#92400e", fontWeight: 600 }}>Partial: approving {appQty} of {remaining} remaining unit{remaining === 1 ? "" : "s"}{priorApproved > 0 ? ` (${priorApproved} already approved earlier)` : ""}</Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 2.5 }, py: { xs: 1, sm: 1.25, md: 1.5 }, borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fff" }}>
        <Box>
          <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 12 }, color: "#9ca3af" }}>{selected.length} of {items.length} items selected</Typography>
          {submitted && selected.some((idx) => { const rcvQty = items[idx].rcvQty ?? 0; return Number(approvedQty[idx] ?? rcvQty) < rcvQty && !reason[idx]?.trim(); }) && (
            <Typography sx={{ fontSize: { xs: 10, sm: 11, md: 11 }, color: "#ef4444", mt: { xs: 0.25, sm: 0.5, md: 0.5 } }}>Reason is required for all partial approvals</Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: { xs: 0.75, sm: 1, md: 1.25 } }}>
          <Button onClick={onClose} disableRipple sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 600, textTransform: "none", borderRadius: "8px", px: { xs: 1.25, sm: 1.5, md: 2.5 }, py: { xs: 0.5, sm: 0.75, md: 1 }, height: { xs: 44, sm: 40, md: 36 }, color: "#374151", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" }, "&:focus": { outline: "none" } }}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={selected.length === 0} disableRipple sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: { xs: 1.25, sm: 1.5, md: 2.5 }, py: { xs: 0.5, sm: 0.75, md: 1 }, height: { xs: 44, sm: 40, md: 36 }, color: "#fff", bgcolor: "#16a34a", boxShadow: "0 2px 8px rgba(22,163,74,0.3)", "&:hover": { bgcolor: "#15803d" }, "&.Mui-disabled": { opacity: 0.5, color: "#fff" }, "&:focus": { outline: "none" } }}>Confirm Approval ({selected.length})</Button>
        </Box>
      </Box>
    </Dialog>
  );
}

function GRNViewModal({ receipt, onClose, onApprove, onRejectConfirm, onDiscrepancyConfirm, onItemApprovalConfirm, viewAction, setViewAction, actionNote, setActionNote, getStatusStyle, getConditionStyle, updateGRN, can }) {
  const [editMode, setEditMode] = useState(false);
  const [draftLines, setDraftLines] = useState([]);
  const [itemApprovalOpen, setItemApprovalOpen] = useState(false);
  const navigate = useNavigate();

  const enterEdit = () => {
    setDraftLines((receipt.lineItems || []).map((it) => ({ ...it, rcvQtyDraft: String(it.rcvQty ?? "") })));
    setEditMode(true);
  };
  const cancelEdit = () => { setEditMode(false); setDraftLines([]); };
  const saveEdit = () => {
    const updatedLines = draftLines.map((l) => ({ ...l, rcvQty: parseFloat(l.rcvQtyDraft) || 0 }));
    const newTotal = updatedLines.reduce((s, l) => s + (parseFloat(l.rcvQty) || 0) * (l.unitCost || 0), 0);
    updateGRN(receipt.id, { lineItems: updatedLines, items: updatedLines.length, totalValue: `$${newTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, receivedQty: updatedLines.reduce((s, l) => s + (parseFloat(l.rcvQty) || 0), 0) });
    setEditMode(false); setDraftLines([]);
  };

  const ss = getStatusStyle(receipt.status);
  const cs = getConditionStyle(receipt.condition);
  const lineItems = receipt.lineItems || [];
  const canEdit = receipt.status === "Pending";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isExpired = (expiryStr) => { if (!expiryStr) return false; const d = new Date(expiryStr); d.setHours(0, 0, 0, 0); return d <= today; };
  const expiredLines = lineItems.filter((l) => isExpired(l.expiry));
  const hasExpiredItems = expiredLines.length > 0;

  const infoRows = [
    { label: "Linked PO", value: receipt.linkedPO },
    { label: "Supplier", value: receipt.supplier },
    { label: "Location", value: receipt.location },
    { label: "Received By", value: receipt.receivedBy },
    { label: "Date", value: receipt.date },
    { label: "Condition", value: receipt.condition, valueColor: cs.color },
    ...(receipt.deliveryNote ? [{ label: "Delivery Note", value: receipt.deliveryNote }] : []),
    ...(receipt.supplierInvoice ? [{ label: "Supplier Invoice", value: receipt.supplierInvoice }] : []),
    ...(receipt.remarks ? [{ label: "Remarks", value: receipt.remarks }] : []),
    ...(receipt.rejectReason ? [{ label: "Reject Reason", value: receipt.rejectReason, valueColor: "#dc2626" }] : []),
    ...(receipt.discrepancyNote ? [{ label: "Discrepancy Note", value: receipt.discrepancyNote, valueColor: "#ca8a04" }] : []),
  ];

  const hasItemApprovals = lineItems.some((l) => l.itemApprovalStatus);
  const approvedCount = lineItems.filter((l) => l.itemApprovalStatus === "Approved").length;
  const partialCount = lineItems.filter((l) => l.itemApprovalStatus === "Partial").length;
  const rejectedCount = lineItems.filter((l) => l.itemApprovalStatus === "Rejected").length;
  const isShortDelivery = receipt.condition === "Short Delivery";
  const isShortClose = Boolean(
    receipt.isShortClose ||
    receipt.status === "Short Close" ||
    receipt.status === "short close" ||
    receipt.condition === "Short Close"
  );
  const showDiscrepancyReplace = Boolean(receipt.condition && receipt.condition !== "Good" && !isShortDelivery);
  // ── FIXED: hide all action buttons when Short Close ──
  const showActionButtons = !editMode && viewAction === null && !isShortClose;
  const showApproveActions = showActionButtons && (receipt.status === "Pending" || receipt.status === "Short Delivery");

  return (
    <>
      <GRNItemApprovalModal open={itemApprovalOpen} onClose={() => setItemApprovalOpen(false)} receipt={receipt} onConfirm={(updates) => { onItemApprovalConfirm(updates); setItemApprovalOpen(false); }} />
      <Box sx={{ px: "24px", pt: "20px", pb: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0, bgcolor: "#fff" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 20, color: "#2563eb" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{receipt.id}</Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>{receipt.supplier} · {receipt.linkedPO || "No PO linked"}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Chip label={receipt.status} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: ss.bg, color: ss.color }} />
          {canEdit && !editMode && (
            <Tooltip title="Edit received quantities">
              <IconButton size="small" onClick={enterEdit} disableRipple sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30, "&:hover": { bgcolor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }, "&:focus": { outline: "none" } }}>
                <EditOutlinedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose} disableRipple sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30, "&:hover": { background: "#f3f4f6", color: "#374151" }, "&:focus": { outline: "none" } }}>
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>
      </Box>
      {editMode && (
        <Box sx={{ px: "24px", py: "8px", bgcolor: "#fffbeb", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <EditOutlinedIcon sx={{ fontSize: 13, color: "#d97706" }} />
          <Typography sx={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>Edit mode — adjust received quantities only</Typography>
        </Box>
      )}
      <DialogContent sx={{ px: "24px", py: "20px", overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 }, scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", mb: "20px", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
          {infoRows.map((row, i) => (
            <Box key={row.label} sx={{ display: "flex", flexDirection: "column", px: "14px", py: "10px", borderBottom: i < infoRows.length - 2 ? "1px solid #f3f4f6" : "none", borderRight: i % 2 === 0 ? "1px solid #f3f4f6" : "none", bgcolor: i % 4 < 2 ? "#fff" : "#fafafa" }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>{row.label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: row.valueColor || "#111827" }}>{row.value || "—"}</Typography>
            </Box>
          ))}
        </Box>
        {hasExpiredItems && (
          <Box sx={{ mb: "16px", p: "12px 16px", borderRadius: "10px", border: "1px solid #fecaca", bgcolor: "#fef2f2", display: "flex", alignItems: "center", gap: "12px" }}>
            <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: "#dc2626", flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>{expiredLines.length} item{expiredLines.length > 1 ? "s" : ""} expired — GRN will be flagged as Discrepancy</Typography>
              <Typography sx={{ fontSize: 11, color: "#ef4444", mt: "2px" }}>{expiredLines.map((l) => l.item).join(", ")}</Typography>
            </Box>
          </Box>
        )}
        {hasItemApprovals && (
          <Box sx={{ mb: "16px", p: "12px 16px", borderRadius: "10px", border: "1px solid #bbf7d0", bgcolor: "#f0fdf4", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Item Approval Summary</Typography>
            {approvedCount > 0 && <Chip label={`✓ ${approvedCount} Approved`} size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: 11, height: 22 }} />}
            {partialCount > 0 && <Chip label={`~ ${partialCount} Partial`} size="small" sx={{ bgcolor: "#fef9c3", color: "#ca8a04", fontWeight: 700, fontSize: 11, height: 22 }} />}
            {rejectedCount > 0 && <Chip label={`✕ ${rejectedCount} Rejected`} size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 11, height: 22 }} />}
          </Box>
        )}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "10px" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em", textTransform: "uppercase" }}>Items Received ({lineItems.length})</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Total: {receipt.totalValue}</Typography>
          </Box>
          {lineItems.length === 0 ? (
            <Box sx={{ p: "24px", textAlign: "center", borderRadius: "10px", border: "1px dashed #e5e7eb", bgcolor: "#f9fafb" }}>
              <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>No  items recorded for this GRN</Typography>
            </Box>
          ) : (
            <Box sx={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: hasItemApprovals ? "minmax(0,3fr) 60px 70px 70px 70px 80px 80px" : "minmax(0,3fr) 60px 70px 70px 80px 80px", gap: "8px", px: "14px", py: "8px", bgcolor: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                {["Item", "PO Qty", editMode ? "Rcv Qty*" : "Rcv Qty", ...(hasItemApprovals ? ["Appr. Qty"] : []), "Unit Cost", "Lot #", "Expiry"].map((h) => (
                  <Typography key={h} sx={{ fontSize: 10, fontWeight: 700, color: h === "Appr. Qty" ? "#16a34a" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h !== "Item" ? "center" : "left" }}>{h}</Typography>
                ))}
              </Box>
              {(editMode ? draftLines : lineItems).map((line, idx) => {
                const isShort = editMode ? parseFloat(line.rcvQtyDraft) < line.poQty : line.rcvQty < line.poQty;
                const lineExpired = isExpired(line.expiry);
                const itemStatus = line.itemApprovalStatus;
                const rowBg = lineExpired ? "#fef2f2" : itemStatus === "Rejected" ? "#fef2f2" : itemStatus === "Partial" ? "#fffbf5" : isShort ? "#fffbf5" : "#fff";
                return (
                  <Box key={idx} sx={{ display: "grid", gridTemplateColumns: hasItemApprovals ? "minmax(0,3fr) 60px 70px 70px 70px 80px 80px" : "minmax(0,3fr) 60px 70px 70px 80px 80px", gap: "8px", px: "14px", py: "10px", alignItems: "center", borderBottom: idx < lineItems.length - 1 ? "1px solid #f3f4f6" : "none", bgcolor: rowBg, "&:hover": { bgcolor: itemStatus === "Rejected" ? "#fee2e2" : isShort ? "#fff7ed" : "#fafafa" } }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: itemStatus === "Rejected" ? "line-through" : "none" }}>{line.item}</Typography>
                        {itemStatus && <Chip label={itemStatus} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, flexShrink: 0, bgcolor: itemStatus === "Approved" ? "#dcfce7" : itemStatus === "Partial" ? "#fef9c3" : "#fef2f2", color: itemStatus === "Approved" ? "#16a34a" : itemStatus === "Partial" ? "#ca8a04" : "#dc2626" }} />}
                      </Box>
                      {line.itemCode && <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>{line.itemCode}{line.category ? ` · ${line.category}` : ""}</Typography>}
                      {line.itemApprovalReason && <Typography sx={{ fontSize: 10, color: "#ca8a04", mt: "1px", fontStyle: "italic" }}>"{line.itemApprovalReason}"</Typography>}
                    </Box>
                    <Typography sx={{ fontSize: 13, color: "#6b7280", textAlign: "center" }}>{line.poQty || "—"}</Typography>
                    {editMode ? (
                      <TextField size="small" type="number" value={line.rcvQtyDraft} onChange={(e) => { const val = Math.max(0, Number(e.target.value) || 0); setDraftLines((prev) => prev.map((l, i) => i === idx ? { ...l, rcvQtyDraft: String(val) } : l)); }} inputProps={{ min: 0, style: { textAlign: "center", padding: "4px 6px", fontSize: 13, fontWeight: 700 } }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", bgcolor: isShort ? "#fff7ed" : "#fff", "& fieldset": { borderColor: isShort ? "#f97316" : "#d1d5db" }, "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" } }, "& input[type=number]": { MozAppearance: "textfield" }, "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" }, "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" } }} />
                    ) : (
                      <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: isShort ? "#ea580c" : "#111827" }}>{line.rcvQty ?? "—"}</Typography>
                        {isShort && <Typography sx={{ fontSize: 9, color: "#ea580c" }}>{line.poQty - line.rcvQty} short</Typography>}
                      </Box>
                    )}
                    {hasItemApprovals && <Box sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13, fontWeight: 700, color: itemStatus === "Approved" ? "#16a34a" : itemStatus === "Partial" ? "#ca8a04" : itemStatus === "Rejected" ? "#dc2626" : "#9ca3af" }}>{line.itemApprovedQty != null ? line.itemApprovedQty : "—"}</Typography></Box>}
                    <Typography sx={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{line.unitCost ? `${line.unitCost.toFixed(2)}` : "—"}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#374151", textAlign: "center" }}>{line.lotNo || "—"}</Typography>
                    <Box sx={{ textAlign: "center" }}>
                      {line.expiry ? (
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: lineExpired ? 700 : 400, color: lineExpired ? "#dc2626" : "#374151", textDecoration: lineExpired ? "line-through" : "none" }}>{line.expiry}</Typography>
                          {lineExpired && <Chip label="Expired" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, mt: "2px", bgcolor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", "& .MuiChip-label": { px: "5px" } }} />}
                        </Box>
                      ) : <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>—</Typography>}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
        {viewAction === "reject" && (
          <Box sx={{ mt: "16px" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#dc2626", letterSpacing: "0.05em", textTransform: "uppercase", mb: "6px" }}>Reject Reason *</Typography>
            <TextField fullWidth multiline rows={2} size="small" autoFocus placeholder="e.g. Wrong items, damaged goods, supplier error..." value={actionNote} onChange={(e) => setActionNote(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: "8px", "& fieldset": { borderColor: "#fca5a5" }, "&.Mui-focused fieldset": { borderColor: "#ef4444" } } }} />
          </Box>
        )}
        {viewAction === "discrepancy" && (
          <Box sx={{ mt: "16px" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#ca8a04", letterSpacing: "0.05em", textTransform: "uppercase", mb: "6px" }}>Discrepancy Note *</Typography>
            <TextField fullWidth multiline rows={2} size="small" autoFocus placeholder="e.g. Short delivery — 10 received instead of 20, damaged packaging..." value={actionNote} onChange={(e) => setActionNote(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: "8px", "& fieldset": { borderColor: "#fde68a" }, "&.Mui-focused fieldset": { borderColor: "#ca8a04" } } }} />
          </Box>
        )}
      </DialogContent>
      <Divider />
      <Box sx={{ px: "24px", py: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#fff", gap: "8px", flexWrap: "wrap", flexShrink: 0 }}>
        <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {editMode && (
            <>
              <Button onClick={saveEdit} disableRipple startIcon={<SaveOutlinedIcon sx={{ fontSize: 15 }} />} sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#fff", bgcolor: "#2563eb", boxShadow: "0 2px 6px rgba(37,99,235,0.3)", "&:hover": { bgcolor: "#1d4ed8" }, "&:focus": { outline: "none" } }}>Save Changes</Button>
              <Button onClick={cancelEdit} disableRipple sx={{ fontSize: 12, fontWeight: 600, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#6b7280", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" }, "&:focus": { outline: "none" } }}>Cancel Edit</Button>
            </>
          )}
          {showApproveActions && (
            <>
              <Button onClick={() => setItemApprovalOpen(true)} disableRipple startIcon={<ChecklistOutlinedIcon sx={{ fontSize: 15 }} />} sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#fff", bgcolor: "#16a34a", boxShadow: "0 2px 6px rgba(22,163,74,0.3)", "&:hover": { bgcolor: "#15803d" }, "&:focus": { outline: "none" } }}>Approve Items</Button>
              {(() => {
                const cond = receipt.condition || "";
                const isGood = cond === "Good"; const isShort = cond === "Short Delivery"; const needsReplacement = !isGood && !isShort;
                const label = isGood ? "Approve All" : isShort ? "Mark Discrepancy" : "Discrepancy + Replacement";
                const bg = isGood ? "#10b981" : isShort ? "#ca8a04" : "#dc2626";
                const hover = isGood ? "#059669" : isShort ? "#a16207" : "#b91c1c";
                const shadow = isGood ? "0 2px 6px rgba(16,185,129,0.3)" : "0 2px 6px rgba(220,38,38,0.3)";
                const tip = isGood ? "Mark Completed and add all items to inventory" : isShort ? "Short Delivery — mark Discrepancy (GRN list only, no replacement)" : `${cond} — mark Discrepancy and auto-create Replacement entries for all  items`;
                const canApprove = isGood ? can.approveGRNItems : isShort ? can.shortDeliveryApprove : can.approveGRNItems;
                const permissionDeniedMsg = isGood ? "You don't have permission to approve GRNs" : isShort ? "You don't have permission to approve short deliveries" : "You don't have permission to approve GRNs";
                // Allow department_approvers to confirm receipt
                const canConfirmReceipt = can.acknowledgementReceipt || canApprove;
                return (
                  <Tooltip title={!canConfirmReceipt ? permissionDeniedMsg : tip} arrow>
                    <span>
                      <Button onClick={onApprove} disabled={!canConfirmReceipt} disableRipple startIcon={needsReplacement ? <WarningAmberOutlinedIcon sx={{ fontSize: 15 }} /> : <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />} sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#fff", bgcolor: bg, boxShadow: shadow, "&:hover": { bgcolor: hover }, "&:disabled": { bgcolor: "#d1d5db", color: "#9ca3af", boxShadow: "none" }, "&:focus": { outline: "none" } }}>{label}</Button>
                    </span>
                  </Tooltip>
                );
              })()}
              <Tooltip title={!can.rejectGRNItems ? "You don't have permission to reject GRNs" : "Reject"}>
                <span>
                  <Button onClick={() => { setViewAction("reject"); setActionNote(""); }} disabled={!can.rejectGRNItems} disableRipple startIcon={<CancelOutlinedIcon sx={{ fontSize: 15 }} />} sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: !can.rejectGRNItems ? "#d1d5db" : "#dc2626", border: `1px solid ${!can.rejectGRNItems ? "#e5e7eb" : "#fecaca"}`, bgcolor: !can.rejectGRNItems ? "#f3f4f6" : "#fef2f2", "&:hover": { bgcolor: !can.rejectGRNItems ? "#f3f4f6" : "#fee2e2" }, "&:focus": { outline: "none" }, "&:disabled": { opacity: 0.5, cursor: "not-allowed" } }}>Reject</Button>
                </span>
              </Tooltip>
            </>
          )}

          {showActionButtons && receipt.status === "Partial" && (
            <Button onClick={() => setItemApprovalOpen(true)} disableRipple startIcon={<ChecklistOutlinedIcon sx={{ fontSize: 15 }} />} sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#fff", bgcolor: "#2563eb", boxShadow: "0 2px 6px rgba(37,99,235,0.3)", "&:hover": { bgcolor: "#1d4ed8" }, "&:focus": { outline: "none" } }}>Re-approve Items</Button>
          )}
          {viewAction === "reject" && (
            <>
              <Button onClick={onRejectConfirm} disabled={!actionNote.trim()} disableRipple sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#fff", bgcolor: actionNote.trim() ? "#dc2626" : "#fca5a5", "&:hover": { bgcolor: actionNote.trim() ? "#b91c1c" : "#fca5a5" }, "&:focus": { outline: "none" } }}>Confirm Reject</Button>
              <Button onClick={() => { setViewAction(null); setActionNote(""); }} disableRipple sx={{ fontSize: 12, fontWeight: 600, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#6b7280", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" }, "&:focus": { outline: "none" } }}>Cancel</Button>
            </>
          )}
          {viewAction === "discrepancy" && (
            <>
              <Button onClick={onDiscrepancyConfirm} disabled={!actionNote.trim()} disableRipple sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#fff", bgcolor: actionNote.trim() ? "#ca8a04" : "#fde68a", "&:hover": { bgcolor: actionNote.trim() ? "#a16207" : "#fde68a" }, "&:focus": { outline: "none" } }}>Flag Discrepancy</Button>
              <Button onClick={() => { setViewAction(null); setActionNote(""); }} disableRipple sx={{ fontSize: 12, fontWeight: 600, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#6b7280", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" }, "&:focus": { outline: "none" } }}>Cancel</Button>
            </>
          )}
          {showActionButtons && showDiscrepancyReplace && !receipt.hasReplacement && (
            <Tooltip title={receipt.hasReplacement ? "Replacement already created for this GRN" : "Flag Discrepancy & Create Replacement Request"} arrow>
              <Button
                size="small"
                disableRipple
                disabled={receipt.hasReplacement}
                startIcon={<SyncAltOutlinedIcon sx={{ fontSize: 14 }} />}
                onClick={() => {
                  updateGRN(receipt.id, { status: "Discrepancy", hasReplacement: true });
                  try {
                    const REPL_KEY = "replacement_data";
                    const existing = JSON.parse(localStorage.getItem(REPL_KEY) || "[]");
                    const year = new Date().getFullYear();
                    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    const condition = receipt.condition || "";
                    const conditionToReason = { Damaged: "Damaged", "Wrong Item": "Damaged", "Cold Chain Breach": "Damaged" };
                    const conditionToUrgency = { "Cold Chain Breach": "Critical", Damaged: "High", "Wrong Item": "High" };
                    const reason = conditionToReason[condition] || "Damaged";
                    const urgency = conditionToUrgency[condition] || "High";
                    const newEntries = (receipt.lineItems || []).filter((line) => line.item).map((line, i) => {
                      const rcvQty = parseFloat(line.rcvQty) || 0;
                      return {
                        id: `RPL-${year}-${String(existing.length + i + 1).padStart(3, "0")}`,
                        item: line.item,
                        location: receipt.location || "—",
                        reason,
                        urgency,
                        disposed: rcvQty > 0 ? rcvQty : "-",
                        replaceQty: rcvQty > 0 ? rcvQty : 0,
                        substitute: "Same item",
                        linkedPO: receipt.linkedPO || "-",
                        linkedGRN: receipt.id,
                        raisedBy: receipt.receivedBy || "System",
                        date: today,
                        status: "Open"
                      };
                    });
                    localStorage.setItem(REPL_KEY, JSON.stringify([...newEntries, ...existing]));
                  } catch (e) {
                    console.error("Failed to create replacement entries:", e);
                  }
                  setTimeout(() => navigate("/admin/replacement"), 300);
                  onClose();
                }}
                sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: "14px", py: "7px", color: "#fff", bgcolor: receipt.hasReplacement ? "#d1d5db" : "#dc2626", boxShadow: receipt.hasReplacement ? "none" : "0 2px 6px rgba(220,38,38,0.3)", "&:hover": { bgcolor: receipt.hasReplacement ? "#d1d5db" : "#b91c1c" }, "&:focus": { outline: "none" }, "&:disabled": { opacity: 0.6, cursor: "not-allowed" } }}>
                {receipt.hasReplacement ? "Replacement Created ✓" : "Discrepancy + Replace"}
              </Button>
            </Tooltip>
          )}
        </Box>
        <Button onClick={onClose} disableRipple sx={{ fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none", border: "1px solid #e5e7eb", borderRadius: "8px", px: "20px", py: "8px", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" }, "&:focus": { outline: "none" } }}>Close</Button>
      </Box>
    </>
  );
}

export default function GoodsReceipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedGRNId, setHighlightedGRNId] = useState(null);
  const [highlightedIndentId, setHighlightedIndentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { grns: receipts, addGRN, updateGRN, updateGRNInvoice, nextGRNId } = useGRN();
  const { receiveFromGRN, replaceItem, items: inventoryItems } = useInventory();
  const { can } = usePermissions();

  // Extract highlight ID from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get("highlight");
    if (highlightId) {
      // Check if it's an Indent ID (starts with IND-) or GRN ID
      if (highlightId.startsWith("IND-")) {
        setHighlightedIndentId(highlightId);
        const timer = setTimeout(() => setHighlightedIndentId(null), 5000);
        return () => clearTimeout(timer);
      } else {
        setHighlightedGRNId(highlightId);
        const timer = setTimeout(() => setHighlightedGRNId(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [location.search]);

  const [newGRNOpen, setNewGRNOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [uploadInvoiceOpen, setUploadInvoiceOpen] = useState(false);
  const [updatePdfOpen, setUpdatePdfOpen] = useState(false);
  const [viewInvoiceModalOpen, setViewInvoiceModalOpen] = useState(false);
  const [selectedPOForInvoice, setSelectedPOForInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewAction, setViewAction] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [indentFilter, setIndentFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All Conditions");

  const filteredReceipts = (() => {
    const q = indentFilter.trim().toLowerCase();
    let results = receipts;

    if (conditionFilter !== "All Conditions") {
      results = results.filter((r) => r.condition === conditionFilter);
    }

    if (!q) return results;
    let poIdsForIndent = [];
    try {
      const pos = JSON.parse(localStorage.getItem("purchase_orders_data") || "[]");
      poIdsForIndent = pos.filter((po) => po.indentId?.toLowerCase().includes(q)).map((po) => po.id);
    } catch { /* ignore */ }
    return results.filter((r) => {
      if (poIdsForIndent.length > 0 && poIdsForIndent.includes(r.linkedPO)) return true;
      return r.id?.toLowerCase().includes(q) || r.linkedPO?.toLowerCase().includes(q) || r.supplier?.toLowerCase().includes(q);
    });
  })();

  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    const tableContainer = document.querySelector(".MuiTableContainer-root");
    if (tableContainer) tableContainer.scrollTop = 0;
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) { setCurrentPage(currentPage - 1); const tc = document.querySelector(".MuiTableContainer-root"); if (tc) tc.scrollTop = 0; }
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) { setCurrentPage(currentPage + 1); const tc = document.querySelector(".MuiTableContainer-root"); if (tc) tc.scrollTop = 0; }
  };

  useEffect(() => { setCurrentPage(1); }, [indentFilter, conditionFilter]);

  const handleNewGRNSave = (grn) => addGRN(grn);
  const closeView = () => { setViewReceipt(null); setViewAction(null); setActionNote(""); };

  const handleApprove = () => {
    const condition = viewReceipt.condition || "";
    const isGood = condition === "Good"; const isShortDelivery = condition === "Short Delivery"; const needsReplacement = !isGood && !isShortDelivery;
    const newStatus = isGood ? "Completed" : "Discrepancy";
    updateGRN(viewReceipt.id, { status: newStatus, ...(needsReplacement ? { hasReplacement: true } : {}) });
    if (isGood && viewReceipt.lineItems?.length) {
      receiveFromGRN(viewReceipt.lineItems, viewReceipt.location, { grnNo: viewReceipt.id, date: viewReceipt.date, supplier: viewReceipt.supplier, gpo: viewReceipt.gpo || "" });
    }
    if (needsReplacement && viewReceipt.lineItems?.length) {
      try {
        const REPL_KEY = "replacement_data";
        const existing = JSON.parse(localStorage.getItem(REPL_KEY) || "[]");
        const year = new Date().getFullYear();
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const conditionToReason = { Damaged: "Damaged", "Wrong Item": "Damaged", "Cold Chain Breach": "Damaged" };
        const conditionToUrgency = { "Cold Chain Breach": "Critical", Damaged: "High", "Wrong Item": "High" };
        const reason = conditionToReason[condition] || "Damaged";
        const urgency = conditionToUrgency[condition] || "High";
        const newEntries = viewReceipt.lineItems.filter((line) => line.item).map((line, i) => {
          const rcvQty = parseFloat(line.rcvQty) || 0;
          return { id: `RPL-${year}-${String(existing.length + i + 1).padStart(3, "0")}`, item: line.item, location: viewReceipt.location || "—", reason, urgency, disposed: rcvQty > 0 ? rcvQty : "-", replaceQty: rcvQty > 0 ? rcvQty : 0, substitute: "Same item", linkedPO: viewReceipt.linkedPO || "-", linkedGRN: viewReceipt.id, raisedBy: viewReceipt.receivedBy || "System", date: today, status: "Open" };
        });
        localStorage.setItem(REPL_KEY, JSON.stringify([...newEntries, ...existing]));
      } catch (e) { console.error("Failed to create replacement entries:", e); }
    }
    if (isGood && viewReceipt.linkedPO && viewReceipt.lineItems?.length) {
      try {
        const INDENT_KEY = "indent_procurement_data"; const PO_KEY = "purchase_orders_data";
        const pos = JSON.parse(localStorage.getItem(PO_KEY) || "[]");
        const po = pos.find((p) => p.id === viewReceipt.linkedPO);
        if (po?.indentId && po.indentId !== "—") {
          const indents = JSON.parse(localStorage.getItem(INDENT_KEY) || "[]");
          const rcvMap = {};
          viewReceipt.lineItems.forEach((li) => { const key = (li.item || "").toLowerCase(); rcvMap[key] = (rcvMap[key] || 0) + (parseFloat(li.rcvQty) || 0); });
          const updated = indents.map((indent) => {
            if (indent.indentNo !== po.indentId) return indent;
            return { ...indent, lineItems: (indent.lineItems || []).map((it) => { const key = (it.itemName || "").toLowerCase(); if (!rcvMap[key]) return it; const newReceived = (it.receivedQty || 0) + rcvMap[key]; const ordered = Number(it.orderedQty || 0); return { ...it, receivedQty: newReceived, balanceToReceive: Math.max(0, ordered - newReceived) }; }) };
          });
          localStorage.setItem(INDENT_KEY, JSON.stringify(updated));
        }
      } catch (e) { console.error("Failed to update indent receivedQty:", e); }
    }
    
    // ── Update PO status to "Completed" when GRN is approved ──
    if (isGood && viewReceipt.linkedPO) {
      try {
        const PO_KEY_1 = "purchase_orders_data";
        const PO_KEY_2 = "tiatele_purchase_orders";
        const updatePOStatus = (key) => {
          const pos = JSON.parse(localStorage.getItem(key) || "[]");
          const poIndex = pos.findIndex((p) => p.id === viewReceipt.linkedPO);
          if (poIndex !== -1) {
            const po = pos[poIndex];
            const totalOrdered = (po.lineItems || []).reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);
            const allGRNs = JSON.parse(localStorage.getItem("grn_data") || "[]");
            const linkedGRNs = allGRNs.filter((g) => g.linkedPO === viewReceipt.linkedPO);
            const totalReceived = linkedGRNs
              .filter((g) => g.grnType === "submitted" || g.status === "Approved" || g.status === "Completed")
              .reduce((s, g) => s + (parseFloat(g.receivedQty) || 0), 0);
            if (totalReceived >= totalOrdered && totalOrdered > 0) {
              pos[poIndex] = { ...po, status: "Completed" };
              localStorage.setItem(key, JSON.stringify(pos));
            }
          }
        };
        updatePOStatus(PO_KEY_1);
        updatePOStatus(PO_KEY_2);
      } catch (e) { console.error("Failed to update PO status:", e); }
    }
    
    closeView();
  };

  const handleItemApprovalConfirm = (updates) => {
    const todayCheck = new Date(); todayCheck.setHours(0, 0, 0, 0);
    const hasExpired = (updates.lineItems || []).some((l) => { if (l.itemApprovalStatus === "Rejected") return false; if (!l.expiry) return false; const d = new Date(l.expiry); d.setHours(0, 0, 0, 0); return d <= todayCheck; });
    const finalUpdates = hasExpired ? { ...updates, status: "Discrepancy", condition: "Expired Goods", discrepancyNote: `Expired item(s) received: ${(updates.lineItems || []).filter((l) => { if (l.itemApprovalStatus === "Rejected" || !l.expiry) return false; const d = new Date(l.expiry); d.setHours(0, 0, 0, 0); return d <= todayCheck; }).map((l) => `${l.item} (exp. ${l.expiry})`).join(", ")}` } : updates;
    updateGRN(viewReceipt.id, finalUpdates);
    setViewReceipt((prev) => (prev ? { ...prev, ...finalUpdates } : prev));
    const approvedLines = (finalUpdates.lineItems || []).filter((l) => { if (l.itemApprovalStatus === "Rejected" || (l.itemApprovedQty || 0) <= 0) return false; if (l.expiry) { const d = new Date(l.expiry); d.setHours(0, 0, 0, 0); if (d <= todayCheck) return false; } return true; }).map((l) => ({ ...l, rcvQty: l.itemApprovedQty }));
    if (approvedLines.length > 0) {
      try {
        const pos = JSON.parse(localStorage.getItem("purchase_orders_data") || "[]");
        const po = pos.find((p) => p.id === viewReceipt.linkedPO);
        if (po?.fromReplacement && po?.fromReplacementOriginalItemId) {
          approvedLines.forEach((line) => {
            if (line.item && line.rcvQty > 0) {
              let expiryDate = null; let expiryFormatted = "—";
              if (line.expiry) { expiryDate = new Date(line.expiry); if (!isNaN(expiryDate.getTime())) { expiryFormatted = expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } }
              replaceItem(po.fromReplacementOriginalItemId, { qty: line.rcvQty, expiry: expiryFormatted, expiryRaw: expiryDate, lot: line.lotNo || "", ndc: line.itemCode || "", cost: line.unitCost || 0, status: [{ label: "In Stock", color: "success" }] });
            }
          });
        } else {
          receiveFromGRN(approvedLines, viewReceipt.location, { grnNo: viewReceipt.id, date: viewReceipt.date, supplier: viewReceipt.supplier, gpo: viewReceipt.gpo || "" });
        }
      } catch (e) {
        console.error("Error checking if GRN is from replacement:", e);
        receiveFromGRN(approvedLines, viewReceipt.location, { grnNo: viewReceipt.id, date: viewReceipt.date, supplier: viewReceipt.supplier, gpo: viewReceipt.gpo || "" });
      }
    }
  };

  const handleRejectConfirm = () => { updateGRN(viewReceipt.id, { status: "Rejected", rejectReason: actionNote }); closeView(); };
  const handleDiscrepancyConfirm = () => { updateGRN(viewReceipt.id, { status: "Discrepancy", discrepancyNote: actionNote }); closeView(); };
  const handleUploadInvoice = (receipt) => { setSelectedPOForInvoice({ id: receipt.linkedPO }); setUploadInvoiceOpen(true); };
  const handleViewInvoice = (receipt) => {
    if (receipt.invoice && receipt.invoice.status === "verified") {
      setSelectedPOForInvoice({ id: receipt.linkedPO, supplier: receipt.supplier, total: parseFloat(receipt.totalValue.replace("$", "")) });
      setSelectedInvoice(receipt.invoice); setViewInvoiceModalOpen(true);
    }
  };
  const handleSaveInvoice = (invoiceData) => {
    updateGRNInvoice(invoiceData.poNumber, invoiceData);
    if (!invoiceData.pdfOnly) alert(`Invoice ${invoiceData.invoiceNumber} uploaded successfully for ${invoiceData.poNumber}!`);
    setUploadInvoiceOpen(false); setUpdatePdfOpen(false);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed": return { bg: "#dcfce7", color: "#16a34a" };
      case "Discrepancy": return { bg: "#fef9c3", color: "#ca8a04" };
      case "Pending": return { bg: "#e0f2fe", color: "#0284c7" };
      case "Rejected": return { bg: "#fef2f2", color: "#dc2626" };
      case "Partial": return { bg: "#dbeafe", color: "#2563eb" };
      case "Short Close": return { bg: "#fff7ed", color: "#ea580c" };
      default: return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };
  const getGRNDisplayStatus = (receipt) => {
    if (receipt.isShortClose && receipt.grnType === "submitted") return "Short Close";
    return receipt.status;
  };
  const grnHasReplacement = (receipt) => receipt.status === "Discrepancy" && receipt.hasReplacement === true;
  const getConditionStyle = (condition) => {
    if (condition === "Good") return { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" };
    if (condition === "Short Delivery" || condition === "Damaged") return { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" };
    return { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };
  };

  const thSx = { fontSize: 11, fontWeight: 500, color: "#373B4D", letterSpacing: "0.05em", whiteSpace: "nowrap", py: "12px", px: "16px", borderBottom: "1px solid #f3f4f6", borderRight: "1px solid #BED3FC", "&:last-child": { borderRight: "none" } };
  const tdSx = { py: "12px", px: "14px", verticalAlign: "middle" };

  const ViewInvoiceModal = ({ open, onClose, po, invoice }) => {
    if (!po || !invoice) return null;
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: { xs: "90vh", md: "88vh" }, display: "flex", flexDirection: "column", overflow: "hidden" } }}>
        <Box sx={{ px: "24px", pt: "20px", pb: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", flexShrink: 0, bgcolor: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧾</Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{invoice.number}</Typography>
              <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>{po.id} — {po.supplier}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} disableRipple sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30, "&:hover": { background: "#f3f4f6", color: "#374151" }, "&:focus": { outline: "none" } }}>
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: "24px", py: "20px", overflowY: "auto", flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "12px 16px", borderRadius: "10px", border: "1px solid #bbf7d0", bgcolor: "#f0fdf4", mb: "16px" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>✅ Verified</Typography>
            <Chip label="Verified" size="small" sx={{ bgcolor: "#10b981", color: "#fff", fontWeight: 700, fontSize: 11, height: 22 }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px", p: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", bgcolor: "#f9fafb", mb: "16px" }}>
            <Typography sx={{ fontSize: 20 }}>📕</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{invoice.fileName}</Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: "2px" }}>{invoice.fileSize} · Upload original for download</Typography>
            </Box>
          </Box>
          <Box sx={{ p: "16px", borderRadius: "10px", border: "1px solid #e5e7eb", bgcolor: "#f9fafb", mb: "16px" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827", mb: "4px" }}>{invoice.number}</Typography>
            <Typography sx={{ fontSize: 11, color: "#9ca3af", mb: "12px" }}>Invoice Date: {invoice.date}</Typography>
            <Divider sx={{ mb: "12px" }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[{ label: "PO Reference", value: po.id, valueColor: "#14b8a6" }, { label: "Supplier", value: po.supplier }, { label: "Payment Terms", value: invoice.paymentTerms }, { label: "Due Date", value: invoice.dueDate }, { label: "Invoice Amount", value: `$${invoice.amount?.toLocaleString()}` }].map(({ label, value, valueColor }) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{label}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: valueColor || "#111827" }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: "14px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", bgcolor: "#fff", mb: "16px" }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Grand Total</Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: "2px" }}>PO Total: ${po.total?.toLocaleString()} · ✓ Matches PO</Typography>
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>${invoice.amount?.toLocaleString()}</Typography>
          </Box>
          {invoice.notes && (
            <Box sx={{ p: "12px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", bgcolor: "#f9fafb", mb: "16px" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase", mb: 0.5, display: "block" }}>Notes</Typography>
              <Typography sx={{ fontSize: 13, color: "#374151" }}>{invoice.notes}</Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: "2px" }}>
            <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Uploaded by: <strong style={{ color: "#374151" }}>{invoice.verifiedBy}</strong></Typography>
            <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{invoice.uploadedAt}</Typography>
          </Box>
        </DialogContent>
        <Box sx={{ px: "24px", py: "16px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: "10px", bgcolor: "#fff", flexShrink: 0 }}>
          <Button onClick={onClose} disableRipple sx={{ fontSize: 13, fontWeight: 600, textTransform: "none", borderRadius: "8px", px: "20px", py: "9px", color: "#374151", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>Close</Button>
          <Button onClick={() => { onClose(); setSelectedPOForInvoice({ id: po.id, supplier: po.supplier, total: po.total }); setUpdatePdfOpen(true); }} disableRipple sx={{ fontSize: 13, fontWeight: 600, textTransform: "none", borderRadius: "8px", px: "20px", py: "9px", color: "#fff", bgcolor: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", "&:hover": { bgcolor: "#1d4ed8" } }}>Update PDF</Button>
        </Box>
      </Dialog>
    );
  };

  // ── STAT CARDS ──
  const statCards = [
    { label: "Total GRNs", value: receipts.length, sub: "All receipts", iconBg: "#f59e0b", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-4" /><rect x="9" y="3" width="6" height="14" rx="1" /></svg> },
    { label: "Pending GRN", value: receipts.filter((r) => r.status === "Pending").length, sub: "Awaiting action", iconBg: "#8b5cf6", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
    { label: "Discrepancies", value: receipts.filter((r) => r.status === "Discrepancy").length, sub: "Needs review", iconBg: "#ef4444", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> },
    { label: "Completed", value: receipts.filter((r) => r.status === "Completed").length, sub: "Successfully received", iconBg: "#10b981", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> },
  ];

  return (
    <Box>
      <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Goods Receipt (GRN)</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              size="small"
              placeholder="Search GRN, PO, supplier…"
              value={indentFilter}
              onChange={(e) => setIndentFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  </InputAdornment>
                ),
                endAdornment: indentFilter ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setIndentFilter("")} disableRipple sx={{ p: 0.25, color: "#9ca3af", "&:hover": { color: "#374151" } }}>
                      <ClearIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: 220,
                "& .MuiOutlinedInput-root": {
                  fontSize: 13,
                  borderRadius: "20px",
                  bgcolor: "#fff",
                  "& fieldset": { borderColor: "#e5e7eb" },
                  "&:hover fieldset": { borderColor: "#015DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#015DFF", borderWidth: "1.5px" },
                },
              }}
            />
            <Select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              size="small"
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
              {["All Conditions", "Good", "Short Delivery", "Damaged", "Wrong Item", "Cold Chain Breach"].map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Tooltip title={!can.createGRN ? "You don't have permission to create GRNs" : ""}>
              <span>
                <Button
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setNewGRNOpen(true)}
                  disabled={!can.createGRN}
                  disableRipple
                  sx={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    gap: "6px", background: "#2563eb", color: "#fff", borderRadius: "12px",
                    px: "15px", py: "8px", fontSize: "12px", fontWeight: 500,
                    textTransform: "none", lineHeight: 1,
                    boxShadow: "0 1px 4px rgba(37,99,235,0.25)",
                    "&:hover": { background: "#1d4ed8", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" },
                    "&:disabled": { background: "#d1d5db", color: "#9ca3af", boxShadow: "none" },
                  }}
                >
                  New GRN
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Active search badge */}
        {indentFilter.trim() && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.75, borderRadius: "8px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#2563eb", flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>{filteredReceipts.length} GRN{filteredReceipts.length !== 1 ? "s" : ""} for "{indentFilter.trim()}"</Typography>
              <IconButton size="small" onClick={() => setIndentFilter("")} disableRipple sx={{ p: 0.25, color: "#9ca3af", ml: "2px", "&:hover": { color: "#374151" } }}>
                <ClearIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Stat Cards */}
        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 0.75, md: 1 }, mb: { xs: 0.875, sm: 1.125, md: 1.375 }, flexWrap: { xs: "wrap", md: "nowrap" } }}>
          {statCards.map((s) => (
            <Box key={s.label} sx={{ flex: 1, bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", px: { xs: 0.75, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75, md: 1 }, minWidth: 0, display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
              <Box sx={{ width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 }, borderRadius: "50%", bgcolor: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</Box>
              <Box>
                <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 11 }, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", mb: { xs: 0.25, sm: 0.375, md: 0.5 } }}>{s.label}</Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: { xs: 0.25, sm: 0.5, md: 0.75 } }}>
                  <Typography sx={{ fontSize: { xs: 14, sm: 18, md: 20 }, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: { xs: 9, sm: 10, md: 11 }, fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap" }}>{s.sub}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#EBF1FE" }}>
                  {["GRN / Indent / Supplier", "PO / Location", "Condition & Status", "Invoice", "Actions"].map((col) => (
                    <TableCell key={col} sx={thSx}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedReceipts.length > 0 ? (
                  paginatedReceipts.map((receipt, idx) => {
                    const displayStatus = getGRNDisplayStatus(receipt);
                    const ss = getStatusStyle(displayStatus);
                    const cs = getConditionStyle(receipt.condition);
                    const hasInvoice = receipt.invoice && receipt.invoice.status === "verified";
                    let indentId = null;
                    try { const pos = JSON.parse(localStorage.getItem("purchase_orders_data") || "[]"); const linkedPO = pos.find((p) => p.id === receipt.linkedPO); if (linkedPO?.indentId && linkedPO.indentId !== "—") { indentId = linkedPO.indentId; } } catch { /* ignore */ }
                    const shouldHighlight = highlightedGRNId === receipt.id || (highlightedIndentId && indentId === highlightedIndentId);
                    return (
                      <TableRow key={receipt.id} sx={{ 
                        background: shouldHighlight ? "#fef3c7" : "#fff", 
                        "&:hover": { background: shouldHighlight ? "#fef3c7" : "#fafafa" },
                        transition: "background 0.3s",
                        "& td": { borderBottom: idx < paginatedReceipts.length - 1 ? "1px solid #f3f4f6" : "none" },
                        boxShadow: shouldHighlight ? "inset 0 0 0 2px #f59e0b" : "none"
                      }}>
                        {/* Col 1 */}
                        <TableCell sx={{ ...tdSx, minWidth: 160 }}>
                          <Tooltip title={`Request: ${receipt.id}`} placement="top" arrow>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{receipt.id}</Typography>
                          </Tooltip>
                          {(() => {
                            let indentId = null;
                            try { const pos = JSON.parse(localStorage.getItem("purchase_orders_data") || "[]"); const linkedPO = pos.find((p) => p.id === receipt.linkedPO); if (linkedPO?.indentId && linkedPO.indentId !== "—") { indentId = linkedPO.indentId; } } catch { /* ignore */ }
                            return indentId ? (
                              <Tooltip title={`Click to view Indent: ${indentId}`} placement="top" arrow>
                                <Chip label={indentId} size="small" sx={{ mt: "4px", bgcolor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontWeight: 600, fontSize: 10, height: 18, cursor: "pointer", "& .MuiChip-label": { px: "6px" }, "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" } }} onClick={() => navigate(`/admin/inventory/indent?highlight=${indentId}`)} />
                              </Tooltip>
                            ) : null;
                          })()}
                          <Tooltip title={`Supplier: ${receipt.supplier}`} placement="top" arrow>
                            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6b7280", mt: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{receipt.supplier}</Typography>
                          </Tooltip>
                        </TableCell>

                        {/* Col 2 */}
                        <TableCell sx={{ ...tdSx, minWidth: 140 }}>
                          {receipt.linkedPO ? (
                            <Tooltip title={`Filter GRNs for ${receipt.linkedPO}`}>
                              <Box onClick={() => setIndentFilter(receipt.linkedPO)} sx={{ display: "inline-flex", alignItems: "center", cursor: "pointer", px: "6px", py: "2px", borderRadius: "5px", fontSize: 12, color: "#2563eb", fontWeight: 600, "&:hover": { bgcolor: "#eff6ff" }, transition: "all 0.12s", mb: "4px" }}>{receipt.linkedPO}</Box>
                            </Tooltip>
                          ) : (
                            <Typography sx={{ fontSize: 12, color: "#d1d5db", mb: "4px" }}>No PO</Typography>
                          )}
                          <Tooltip title={`Location: ${receipt.location}`} placement="top" arrow>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#a78bfa", flexShrink: 0 }} />
                              <Typography sx={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>{receipt.location || "—"}</Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* Col 3 */}
                        <TableCell sx={{ ...tdSx, minWidth: 140 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                            <Tooltip title={`Condition: ${receipt.condition}`} placement="top" arrow>
                              <Box sx={{ flexShrink: 0 }}>
                                <Chip label={receipt.condition} size="small" sx={{ bgcolor: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, fontWeight: 600, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" } }} />
                              </Box>
                            </Tooltip>
                            <Tooltip title={`Status: ${displayStatus}`} placement="top" arrow>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                <Chip label={displayStatus} size="small" sx={{ bgcolor: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 600, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" }, flexShrink: 0 }} />
                                {grnHasReplacement(receipt) && <Chip label="↗ Replacement" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, bgcolor: "#fdf4ff", color: "#9333ea", border: "1px solid #e9d5ff", borderRadius: "5px", "& .MuiChip-label": { px: "5px" } }} />}
                              </Box>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Col 4 */}
                        <TableCell sx={{ ...tdSx, minWidth: 110 }}>
                          {hasInvoice ? (
                            <Box>
                              <Chip label="✓ Verified" size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 600, fontSize: 11, height: 20 }} />
                              <Tooltip title={`Invoice: ${receipt.invoice.number}`} placement="top" arrow>
                                <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "3px" }}>{receipt.invoice.number}</Typography>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Chip label={receipt.status === "Pending" || receipt.status === "Rejected" ? "Locked" : "No Invoice"} size="small" sx={{ bgcolor: receipt.status === "Pending" || receipt.status === "Rejected" ? "#f3f4f6" : "#fff7ed", color: receipt.status === "Pending" || receipt.status === "Rejected" ? "#9ca3af" : "#ea580c", border: `1px solid ${receipt.status === "Pending" || receipt.status === "Rejected" ? "#e5e7eb" : "#fed7aa"}`, fontWeight: 600, fontSize: 11, height: 20 }} />
                          )}
                        </TableCell>

                        <TableCell sx={{ ...tdSx, minWidth: 100 }}>
                          <Box sx={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {receipt.status !== "Discrepancy" && (
                              <Tooltip title={hasInvoice ? "View Invoice" : receipt.status === "Pending" || receipt.status === "Rejected" ? "Available after approval" : "Upload Invoice"}>
                                <span>
                                  <IconButton size="small" disabled={!hasInvoice && (receipt.status === "Pending" || receipt.status === "Rejected")} onClick={() => hasInvoice ? handleViewInvoice(receipt) : handleUploadInvoice(receipt)} sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: 28, height: 28, "&:hover": { background: "#f0fdfa", color: "#0d9488", borderColor: "#99f6e4" }, "&.Mui-disabled": { opacity: 0.35 } }}>
                                    <ReceiptIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            <Tooltip title="View GRN">
                              <IconButton size="small" onClick={() => { setViewReceipt(receipt); setViewAction(null); setActionNote(""); }} sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: 28, height: 28, "&:hover": { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" } }}>
                                <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#9ca3af", fontSize: 13 }}>No receipts found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pagination */}
        {filteredReceipts.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mt: 2.5, pt: 1.5, pb: 0.75, flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button onClick={handlePreviousPage} disabled={currentPage === 1} sx={{ minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb", color: currentPage === 1 ? "#d1d5db" : "#374151", "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" }, "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" } }}>
                <ChevronLeftIcon sx={{ fontSize: 16 }} />
              </Button>
              <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} shape="rounded" size="small" hidePrevButton={true} hideNextButton={true} showFirstButton={false} showLastButton={false} siblingCount={1} boundaryCount={1}
                sx={{ "& .MuiPaginationItem-root": { borderRadius: "5px", fontSize: 11, fontWeight: 500, minWidth: 28, height: 28, border: "1px solid #e5e7eb", color: "#374151", "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" } }, "& .Mui-selected": { background: "#015DFF !important", color: "#fff", border: "1px solid #015DFF", "&:hover": { background: "#0147CC !important" } } }} />
              <Button onClick={handleNextPage} disabled={currentPage === totalPages} sx={{ minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb", color: currentPage === totalPages ? "#d1d5db" : "#374151", "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" }, "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" } }}>
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      <NewGRNDialog open={newGRNOpen} onClose={() => setNewGRNOpen(false)} onSave={handleNewGRNSave} nextId={nextGRNId()} existingGRNs={receipts} />
      <UploadInvoice open={uploadInvoiceOpen} onClose={() => setUploadInvoiceOpen(false)} onSave={handleSaveInvoice} poData={selectedPOForInvoice} />
      <UploadInvoice open={updatePdfOpen} onClose={() => setUpdatePdfOpen(false)} onSave={handleSaveInvoice} poData={selectedPOForInvoice} updatePdfOnly />
      <ViewInvoiceModal open={viewInvoiceModalOpen} onClose={() => setViewInvoiceModalOpen(false)} po={selectedPOForInvoice} invoice={selectedInvoice} />

      <Dialog open={Boolean(viewReceipt)} onClose={closeView} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: { xs: "90vh", md: "88vh" }, display: "flex", flexDirection: "column", overflow: "hidden" } }}>
        {viewReceipt && (
          <GRNViewModal receipt={viewReceipt} onClose={closeView} onApprove={handleApprove} onRejectConfirm={handleRejectConfirm} onDiscrepancyConfirm={handleDiscrepancyConfirm} onItemApprovalConfirm={handleItemApprovalConfirm} viewAction={viewAction} setViewAction={setViewAction} actionNote={actionNote} setActionNote={setActionNote} getStatusStyle={getStatusStyle} getConditionStyle={getConditionStyle} updateGRN={updateGRN} can={can} />
        )}
      </Dialog>
    </Box>
  );
}