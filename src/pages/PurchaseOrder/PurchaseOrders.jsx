import React, { useState, useEffect, useCallback } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
  import {
    Box,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogContent,
    Divider,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Snackbar,
    Alert,
    TextField,
    Checkbox,
    InputAdornment,
    Pagination,
    Select,
    MenuItem,
  } from "@mui/material";
  import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
  import ChevronRightIcon from "@mui/icons-material/ChevronRight";
  import AddIcon from "@mui/icons-material/Add";
  import CheckIcon from "@mui/icons-material/Check";
  import CloseIcon from "@mui/icons-material/Close";
  import VisibilityIcon from "@mui/icons-material/Visibility";
  import InventoryIcon from "@mui/icons-material/Inventory";
  import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
  import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
  import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
  import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
  import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
  import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
  import SearchIcon from "@mui/icons-material/Search";
  import ClearIcon from "@mui/icons-material/Clear";
  import EmailIcon from "@mui/icons-material/Email";
  import NewPO from "./NewPO";
  import NewGRNDialog from "../Goodsreceipt/newgrnmodal";
  import ViewGRNModal from "./ViewGRNModal";
  import { useGRN } from "../../contexts/GRNContext";
  import { usePermissions } from "../../hooks/usePermissions";
  import { useAuth } from "../../contexts/Authcontext";
  import { getLocations, getUserLocation, locationMatches } from "../../utils/locationUtils";
  import { getSupplierByName } from "../../utils/supplierUtils";
  import { useVendorManagement } from "../../contexts/VendorManagementContext";
  import { getManufacturerByName } from "../../utils/manufacturerUtils";

  const ITEMS_PER_PAGE = 5;

  const labelSx = {
    fontSize: { xs: 10, sm: 11, md: 12 },
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    mb: { xs: 0.5, sm: 0.5, md: 0.75 },
    display: "block",
  };

  const btnBase = {
    fontSize: { xs: 12, sm: 13, md: 14 },
    fontWeight: 600,
    textTransform: "none",
    borderRadius: "8px",
    px: { xs: 1.5, sm: 2, md: 2.5 },
    py: { xs: 1, sm: 1.125, md: 1.25 },
    height: { xs: 44, sm: 40, md: 36 },
    outline: "none",
    "&:focus": { outline: "none" },
  };

  const thSx = {
    fontSize: { xs: 10, sm: 11, md: 12 },
    fontWeight: 600,
    color: "#373B4D",
    letterSpacing: "0.04em",
    py: { xs: 1, sm: 1.375, md: 1.5 },
    px: { xs: 1, sm: 1.75, md: 2 },
    borderBottom: "1px solid #f3f4f6",
    borderRight: "1px solid #BED3FC",
    "&:last-child": { borderRight: "none" },
    whiteSpace: "nowrap",
  };

  const tdSx = {
    py: { xs: 1, sm: 1.5, md: 1.75 },
    px: { xs: 1, sm: 1.75, md: 2 },
    fontSize: { xs: 11, sm: 12, md: 13 },
    verticalAlign: "middle",
  };

  const hasRealIndentId = (indentId) => {
    if (indentId === null || indentId === undefined) return false;
    const str = String(indentId).trim();
    return str !== "" && str !== "—";
  };


  const getLineBalance = (item) => {
    const qty = Number(item?.quantity) || 0;
    const approved = Number(item?.approvedQty) || 0;
    const rejected = Number(item?.rejectedQty) || 0;
    return Math.max(0, qty - approved - rejected);
  };

  const getLineStatus = (item) => {
    const qty = Number(item?.quantity) || 0;
    const approved = Number(item?.approvedQty) || 0;
    const rejected = Number(item?.rejectedQty) || 0;
    const balance = getLineBalance(item);
    if (balance > 0) return approved > 0 || rejected > 0 ? "Partial" : undefined;
    if (approved >= qty && qty > 0) return "Approved";
    if (approved === 0) return "Rejected";
    return "Partial";
  };

  // Mirrors calcIndentStatus in IndentProcurement.jsx: "Partial Approved"
  // covers every in-between state (one item approved while another is still
  // untouched, a partially-approved item with balance left, etc.) so the
  // Approve/Reject actions keep showing until every line's balance is zero.
  const computePOStatus = (lineItems = []) => {
    if (!lineItems.length) return "Pending";
    const allUntouched = lineItems.every(
      (it) => !(Number(it.approvedQty) > 0) && !(Number(it.rejectedQty) > 0),
    );
    if (allUntouched) return "Pending";
    const allRejected = lineItems.every(
      (it) => getLineBalance(it) === 0 && !(Number(it.approvedQty) > 0),
    );
    if (allRejected) return "Rejected";
    const allFullyApproved = lineItems.every(
      (it) => getLineBalance(it) === 0 && Number(it.approvedQty) >= Number(it.quantity),
    );
    if (allFullyApproved) return "Approved";
    return "Partial Approved";
  };

  // ── Priority helpers ───────────────────────────────────────────────────────

  const getPriorityStyle = (priority) =>
    ({
      Low:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
      Medium:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
      High:     { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
      Critical: { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
    })[priority] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

  // ── StatCard ───────────────────────────────────────────────────────────────

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
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: { xs: 0.25, sm: 0.5, md: 0.75 },
            }}
          >
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

 

  function POApprovalModal({ open, onClose, po, onConfirm, mode = "approve" }) {
    const allItems = po?.lineItems || [];
    const actionableIndices = allItems
      .map((_, i) => i)
      .filter((i) => getLineBalance(allItems[i]) > 0);
    const resolvedCount = allItems.length - actionableIndices.length;
    const isApprove = mode === "approve";
    // First approval/rejection round on this PO — nothing has been
    // approved or rejected on any line yet. In this state we show the
    // Indent Approved quantity (what the indent stage cleared) rather than
    // "Remaining Qty", since before any action the two are identical and
    // "Indent Approved" is the more meaningful label. Once any line has
    // been touched, later rounds switch to showing the true remaining
    // (open) balance instead.
    const isFirstRound = allItems.every(
      (it) => !(Number(it.approvedQty) > 0) && !(Number(it.rejectedQty) > 0),
    );

    const initialSelected = () => [...actionableIndices];
    const initialQty = () =>
      Object.fromEntries(actionableIndices.map((i) => [i, getLineBalance(allItems[i])]));

    const [selected, setSelected] = useState(initialSelected);
    const [qty, setQty] = useState(initialQty);
    const [reason, setReason] = useState({});
    const [submitted, setSubmitted] = useState(false);

    React.useEffect(() => {
      if (open && po) {
        setSelected(initialSelected());
        setQty(initialQty());
        setReason({});
        setSubmitted(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, po, mode]);

    if (!po) return null;

    const toggle = (idx) =>
      setSelected((prev) => (prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]));
    const toggleAll = () =>
      setSelected(selected.length === actionableIndices.length ? [] : [...actionableIndices]);

    const handleConfirm = () => {
      setSubmitted(true);
      const missingReason = selected.some((idx) => {
        const balance = getLineBalance(allItems[idx]);
        const amt = Number(qty[idx] ?? balance);
        // Reason required whenever this round doesn't fully close out the
        // line's balance (partial approval), or whenever rejecting at all.
        return (!isApprove || amt < balance) && !reason[idx]?.trim();
      });
      if (missingReason) return;

      const updatedItems = allItems.map((item, idx) => {
        if (!selected.includes(idx)) return item; // untouched — left exactly as-is
        const balance = getLineBalance(item);
        const amt = Math.max(0, Math.min(Number(qty[idx] ?? balance), balance));
        const next = isApprove
          ? {
              ...item,
              approvedQty: Number(item.approvedQty || 0) + amt,
              approvalReason: reason[idx] || item.approvalReason || "",
            }
          : {
              ...item,
              rejectedQty: Number(item.rejectedQty || 0) + amt,
              rejectionReason: reason[idx] || item.rejectionReason || "",
            };
        return { ...next, approvalStatus: getLineStatus(next) };
      });

      const newStatus = computePOStatus(updatedItems);
      const newTotal = updatedItems.reduce(
        (s, it) => s + Number(it.approvedQty || 0) * it.unitCost,
        0,
      );

      onConfirm({ ...po, lineItems: updatedItems, status: newStatus, total: newTotal }, mode);
      onClose();
    };

    const headerColor = isApprove ? "#16a34a" : "#dc2626";
    const headerBg = isApprove ? "#f0fdf4" : "#fef2f2";
    const confirmBg = isApprove ? "#16a34a" : "#dc2626";
    const confirmBgHover = isApprove ? "#15803d" : "#b91c1c";

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: "10px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
            maxHeight: "78vh",
            width: "580px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: "14px",
            pt: "12px",
            pb: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
            bgcolor: "#fff",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Box
              sx={{
                width: 27,
                height: 27,
                borderRadius: "7px",
                bgcolor: headerBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isApprove ? (
                <CheckCircleOutlineIcon sx={{ fontSize: 15, color: headerColor }} />
              ) : (
                <CancelOutlinedIcon sx={{ fontSize: 15, color: headerColor }} />
              )}
            </Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
              {isApprove ? "Approve" : "Reject"} PO Items — {po?.id}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
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
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>

        {/* ── Scrollable body ── */}
        <DialogContent
          sx={{
            px: "14px",
            py: "10px",
            overflowY: "auto",
            flex: 1,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
          }}
        >
      

          {actionableIndices.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                Nothing left to {isApprove ? "approve" : "reject"} on this PO.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Select All */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  mb: "7px",
                  pb: "7px",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <Checkbox
                  size="small"
                  checked={selected.length === actionableIndices.length && actionableIndices.length > 0}
                  indeterminate={selected.length > 0 && selected.length < actionableIndices.length}
                  onChange={toggleAll}
                  sx={{
                    p: 0,
                    color: headerColor,
                    "&.Mui-checked": { color: headerColor },
                  }}
                />
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  Select All
                </Typography>
              </Box>

              {/* Column headers */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "32px 22px 1fr 72px 72px 1fr",
                  gap: "5px",
                  px: "9px",
                  mb: "4px",
                  alignItems: "center",
                }}
              >
                <Box />
                <Box />
                {["Item", isFirstRound ? "Indent Approved" : "Remaining Qty", isApprove ? "Approve" : "Reject", "Reason"].map(
                  (h, i) => (
                    <Typography
                      key={h}
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: i === 1 ? "#7c3aed" : "#9ca3af",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        textAlign: i === 1 || i === 2 ? "center" : "left",
                      }}
                    >
                      {h}
                    </Typography>
                  ),
                )}
              </Box>

              {/* Item rows */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {actionableIndices.map((idx) => {
                  const item = allItems[idx];
                  const balance = getLineBalance(item);
                  const isChecked = selected.includes(idx);
                  const amt = qty[idx] ?? balance;
                  const isPartial = isChecked && Number(amt) < balance;
                  return (
                    <Box key={idx}>
                      <Box
                        onClick={() => toggle(idx)}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "32px 22px 1fr 72px 72px 1fr",
                          gap: "5px",
                          alignItems: "center",
                          p: "6px 9px",
                          borderRadius: "7px",
                          border: `1px solid ${isChecked ? (isApprove ? "#bbf7d0" : "#fecaca") : "#e5e7eb"}`,
                          bgcolor: isChecked ? headerBg : "#f9fafb",
                          cursor: "pointer",
                          transition: "all 0.12s",
                          "&:hover": { borderColor: isApprove ? "#bbf7d0" : "#fecaca", bgcolor: headerBg },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={() => toggle(idx)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            p: 0,
                            color: headerColor,
                            "&.Mui-checked": { color: headerColor },
                          }}
                        />
                        <Box
                          sx={{
                            width: 17,
                            height: 17,
                            borderRadius: "50%",
                            bgcolor: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>
                            {idx + 1}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
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
                            {item.description}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>
                            Unit cost: ${item.unitCost?.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#7c3aed" }}>
                            {isFirstRound
                              ? (item.indentApprovedQty != null ? item.indentApprovedQty : item.quantity)
                              : balance}
                          </Typography>
                       
                         
                          {Number(item.rejectedQty) > 0 && (
                            <Typography sx={{ fontSize: 9, color: "#dc2626" }}>
                              rej: {item.rejectedQty}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{ textAlign: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TextField
                            size="small"
                            type="number"
                            value={amt}
                            disabled={!isChecked}
                            onChange={(e) => {
                              const val = Math.max(
                                0,
                                Math.min(Number(e.target.value) || 0, balance),
                              );
                              setQty((prev) => ({ ...prev, [idx]: val }));
                            }}
                            inputProps={{
                              min: 0,
                              max: balance,
                              style: {
                                textAlign: "center",
                                padding: "4px 4px",
                                fontSize: 12,
                                fontWeight: 700,
                              },
                            }}
                            sx={{
                              width: "55px",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "6px",
                                bgcolor: isChecked ? "#fff" : "#f3f4f6",
                                "& fieldset": {
                                  borderColor: isPartial ? "#f59e0b" : "#d1d5db",
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
                            placeholder={isApprove ? "Reason (if partial) *" : "Reason *"}
                            value={reason[idx] || ""}
                            disabled={!isChecked}
                            onChange={(e) =>
                              setReason((prev) => ({ ...prev, [idx]: e.target.value }))
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                fontSize: 11.5,
                                borderRadius: "6px",
                                bgcolor: isChecked ? "#fff" : "#f3f4f6",
                                "& fieldset": {
                                  borderColor:
                                    submitted &&
                                    isChecked &&
                                    (!isApprove || isPartial) &&
                                    !reason[idx]?.trim()
                                      ? "#ef4444"
                                      : "#d1d5db",
                                },
                              },
                              "& .MuiInputBase-input": { py: "5px", px: "8px" },
                            }}
                          />
                          {submitted && isChecked && (!isApprove || isPartial) && !reason[idx]?.trim() && (
                            <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "2px" }}>
                              Required
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </DialogContent>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: "14px",
            py: "10px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#fff",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: 11.5, color: "#9ca3af" }}>
            {selected.length} of {actionableIndices.length} item{actionableIndices.length !== 1 ? "s" : ""} selected
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
              disabled={selected.length === 0}
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "6px",
                px: "14px",
                py: "6px",
                bgcolor: confirmBg,
                color: "#fff",
                boxShadow: `0 2px 8px ${isApprove ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                "&:hover": { bgcolor: confirmBgHover },
                "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
              }}
            >
              {isApprove ? "Approve" : "Reject"} ({selected.length})
            </Button>
          </Box>
        </Box>
      </Dialog>
    );
  }

  // ── MailPOModal ────────────────────────────────────────────────────────────

  function MailPOModal({ open, onClose, po, onConfirm }) {
    const [recipient, setRecipient] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
      if (open && po) {
        let detectedRecipient = "";
        let detectedEmail = "";
        const gpoCompanies = ["Vizient", "Premier", "Intalere", "HealthTrust"];
        const supplier = getSupplierByName(po.supplier);
        if (supplier) {
          if (gpoCompanies.includes(supplier.company)) {
            detectedRecipient = "gpo";
          } else {
            detectedRecipient = "supplier";
          }
          detectedEmail = supplier.contactEmail || "";
        } else {
          const manufacturer = getManufacturerByName(po.supplier);
          if (manufacturer) {
            detectedRecipient = "manufacturer";
            detectedEmail = manufacturer.contactEmail || "";
          }
        }
        setRecipient(detectedRecipient);
        setEmail(detectedEmail);
        setMessage(
          `Dear ${po.supplier || "Supplier"},\n\nPlease find the attached Purchase Order ${po.id} for your reference.\n\nThank you.`
        );
      }
    }, [open, po]);

    if (!po) return null;

    const getRecipientLabel = () => {
      if (recipient === "gpo") return "GPO (Group Purchasing Organization)";
      if (recipient === "manufacturer") return "Manufacturer";
      if (recipient === "supplier") return `Supplier (${po.supplier})`;
      return "—";
    };

    const handleSend = async () => {
      if (!recipient || !email.trim()) {
        alert("Please select recipient type and provide email address");
        return;
      }
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onConfirm({
          poId: po.id,
          recipient,
          email,
          message,
          sentAt: new Date().toLocaleString(),
        });
        onClose();
      } catch (err) {
        alert("Failed to send PO. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: "14px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            overflow: "hidden",
            maxWidth: "520px",
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 1.25, sm: 1.5, md: 2 },
            pt: { xs: 1, sm: 1.25, md: 1.5 },
            pb: { xs: 0.75, sm: 1, md: 1.25 },
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
            bgcolor: "#fff",
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
                width: { xs: 32, sm: 36, md: 38 },
                height: { xs: 32, sm: 36, md: 38 },
                borderRadius: "10px",
                bgcolor: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EmailIcon
                sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, color: "#059669" }}
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
                Mail PO — {po?.id}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 11, sm: 12, md: 12 },
                  color: "#9ca3af",
                  mt: "1px",
                }}
              >
                Send purchase order to recipient
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            disabled={loading}
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

        <DialogContent
          sx={{
            px: { xs: 1.25, sm: 1.5, md: 2 },
            py: { xs: 1, sm: 1.25, md: 1.5 },
            overflowY: "auto",
            maxHeight: "70vh",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { bgcolor: "#f3f4f6" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#d1d5db",
              borderRadius: "4px",
              "&:hover": { bgcolor: "#9ca3af" },
            },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 11, sm: 12, md: 12 },
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: { xs: 0.5, sm: 0.75, md: 1 },
                  display: "block",
                }}
              >
                Recipient Type
              </Typography>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={loading}
                sx={{
                  fontSize: 13,
                  borderRadius: "8px",
                  "& .MuiSelect-select": { py: "8px", px: "12px" },
                }}
                renderValue={(v) =>
                  v ? (
                    getRecipientLabel()
                  ) : (
                    <span style={{ color: "#9ca3af" }}>Select recipient type…</span>
                  )
                }
              >
                <MenuItem value="supplier" sx={{ fontSize: 13 }}>
                  Supplier ({po.supplier})
                </MenuItem>
                <MenuItem value="gpo" sx={{ fontSize: 13 }}>
                  GPO (Group Purchasing Organization)
                </MenuItem>
                <MenuItem value="manufacturer" sx={{ fontSize: 13 }}>
                  Manufacturer
                </MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 11, sm: 12, md: 12 },
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: { xs: 0.5, sm: 0.75, md: 1 },
                  display: "block",
                }}
              >
                Email Address *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: { xs: 12, sm: 13, md: 13 },
                    "& fieldset": { borderColor: "#e5e7eb" },
                    "&:hover fieldset": { borderColor: "#d1d5db" },
                    "&.Mui-focused fieldset": { borderColor: "#10b981" },
                  },
                  "& .MuiInputBase-input": {
                    py: { xs: 1, sm: 1.125, md: 1.25 },
                    px: { xs: 1, sm: 1.25, md: 1.5 },
                  },
                }}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 11, sm: 12, md: 12 },
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: { xs: 0.5, sm: 0.75, md: 1 },
                  display: "block",
                }}
              >
                Message
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder="Enter message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: { xs: 12, sm: 13, md: 13 },
                    "& fieldset": { borderColor: "#e5e7eb" },
                    "&:hover fieldset": { borderColor: "#d1d5db" },
                    "&.Mui-focused fieldset": { borderColor: "#10b981" },
                  },
                  "& .MuiInputBase-input": {
                    py: { xs: 1, sm: 1.125, md: 1.25 },
                    px: { xs: 1, sm: 1.25, md: 1.5 },
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#d1d5db",
                      borderRadius: "4px",
                      "&:hover": { background: "#9ca3af" },
                    },
                    scrollbarWidth: "thin",
                    scrollbarColor: "#d1d5db transparent",
                  },
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: 10, sm: 11, md: 11 },
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: 1,
                }}
              >
                PO Summary
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.5 }}>
                {[
                  { label: "PO Number:", value: po.id },
                  { label: "Supplier:", value: po.supplier },
                  { label: "Total Value:", value: `$${po.total.toLocaleString()}` },
                  { label: "Items:", value: `${po.lines} item${po.lines !== 1 ? "s" : ""}` },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11, md: 11 },
                    fontWeight: 700,
                    color: "#6b7280",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    mb: 0.75,
                  }}
                >
                  Items List
                </Typography>
                <Box
                  sx={{
                    maxHeight: "150px",
                    overflowY: "auto",
                    bgcolor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    px: 1,
                    py: 0.5,
                  }}
                >
                  {(po.lineItems || []).length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {(po.lineItems || []).map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            py: 0.5,
                            px: 0.75,
                            borderRadius: "4px",
                            bgcolor: idx % 2 === 0 ? "#f9fafb" : "#fff",
                            borderLeft: "3px solid #059669",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#111827",
                              mb: 0.25,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.description}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
                            Qty: {item.quantity} × ${item.unitCost?.toFixed(2) || "0.00"} = ${(item.total || item.quantity * item.unitCost).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: 11, color: "#9ca3af", textAlign: "center", py: 1 }}>
                      No items in this PO
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <Box
          sx={{
            px: { xs: 1.25, sm: 1.5, md: 2 },
            py: { xs: 0.75, sm: 1, md: 1.25 },
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: { xs: 0.625, sm: 0.875, md: 1 },
            bgcolor: "#fff",
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              fontSize: { xs: 12, sm: 13, md: 14 },
              fontWeight: 600,
              color: "#374151",
              textTransform: "none",
              borderRadius: "8px",
              px: { xs: 1.5, sm: 2, md: 2.5 },
              py: { xs: 0.75, sm: 1, md: 1.125 },
              height: { xs: 44, sm: 40, md: 36 },
              border: "1px solid #e5e7eb",
              bgcolor: "#fff",
              "&:hover": { bgcolor: "#f9fafb" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!recipient || !email.trim() || loading}
            sx={{
              fontSize: { xs: 12, sm: 13, md: 14 },
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              px: { xs: 1.5, sm: 2, md: 2.5 },
              py: { xs: 0.75, sm: 1, md: 1.125 },
              height: { xs: 44, sm: 40, md: 36 },
              bgcolor: "#10b981",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
              "&:hover": { bgcolor: "#059669" },
              "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
            }}
          >
            {loading ? "Sending..." : "Send PO"}
          </Button>
        </Box>
      </Dialog>
    );
  }

  // ── ViewPOModal ────────────────────────────────────────────────────────────

  const ViewPOModal = ({ open, onClose, po, onSave }) => {
    const [editMode, setEditMode] = React.useState(false);
    const [draftLines, setDraftLines] = React.useState([]);

    React.useEffect(() => {
      if (open && po) {
        setEditMode(false);
        setDraftLines(
          (po.lineItems || []).map((item) => ({
            rejected: false,
            quantity: item.quantity,
            quantityRaw: String(item.quantity),
          })),
        );
      }
    }, [open, po]);

    if (!po) return null;

    const getStatusColor = (s) =>
      ({
        Approved: { bg: "#e0f2fe", color: "#14b8a6", border: "#bae6fd" },
        Pending: { bg: "#fffbeb", color: "#f59e0b", border: "#fde68a" },
        Received: { bg: "#f0fdf4", color: "#10b981", border: "#bbf7d0" },
        Draft: { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
      })[s] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

    const getPriorityColor = (p) =>
      ({
        Low:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
        Medium:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
        High:     { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
        Critical: { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
      })[p] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

    // Chip helper for a line's approval outcome. Includes the new "Partial"
    // (balance > 0) state as an informational label too, so it's clear the
    // line is still open for another approve/reject round.
    const getApprovalChipStyle = (status) =>
      ({
        Approved: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
        Partial: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
        Rejected: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
      })[status] || null;

    const displayItems = editMode
      ? (po.lineItems || []).map((item, i) => ({
          ...item,
          quantity: draftLines[i]?.quantity ?? item.quantity,
          total: (draftLines[i]?.quantity ?? item.quantity) * item.unitCost,
          rejected: draftLines[i]?.rejected ?? false,
        }))
      : (po.lineItems || []).map((item) => ({ ...item, rejected: false }));

    const poTotal = displayItems
      .filter((item) => !item.rejected)
      .reduce((sum, item) => sum + item.total, 0);

    const handleToggleReject = (idx) =>
      setDraftLines((prev) =>
        prev.map((d, i) => (i === idx ? { ...d, rejected: !d.rejected } : d)),
      );
    const handleQtyChange = (idx, val) =>
      setDraftLines((prev) =>
        prev.map((d, i) => (i === idx ? { ...d, quantityRaw: val } : d)),
      );
    const handleQtyBlur = (idx) => {
      const original = po.lineItems[idx].quantity;
      const parsed = parseInt(draftLines[idx]?.quantityRaw, 10);
      const clamped =
        isNaN(parsed) || parsed < 1 ? 1 : Math.min(original, parsed);
      setDraftLines((prev) =>
        prev.map((d, i) =>
          i === idx
            ? { ...d, quantity: clamped, quantityRaw: String(clamped) }
            : d,
        ),
      );
    };

    const handleSaveEdits = () => {
      const updatedLineItems = (po.lineItems || [])
        .map((item, i) => ({
          ...item,
          quantity: draftLines[i]?.quantity ?? item.quantity,
          total: (draftLines[i]?.quantity ?? item.quantity) * item.unitCost,
        }))
        .filter((_, i) => !draftLines[i]?.rejected);
      onSave({
        ...po,
        lineItems: updatedLineItems,
        lines: updatedLineItems.length,
        total: updatedLineItems.reduce((s, it) => s + it.total, 0),
      });
      setEditMode(false);
      onClose();
    };

    const hasChanges =
      editMode &&
      draftLines.some(
        (d, i) => d.rejected || d.quantity !== po.lineItems[i]?.quantity,
      );
    const sc = getStatusColor(po.status);
    const pc = getPriorityColor(po.priority);

    return (
      <Dialog
        open={open}
        onClose={() => {
          setEditMode(false);
          onClose();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
            flexShrink: 0,
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1, md: 1.5 } }}>
            <Box
              sx={{
                width: { xs: 36, sm: 38, md: 38 },
                height: { xs: 36, sm: 38, md: 38 },
                borderRadius: "10px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCartOutlinedIcon
                sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, color: "#2563eb" }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: 14, sm: 15, md: 16 }, fontWeight: 700, color: "#111827" }}>
                {po.id}
              </Typography>
              <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 12 }, color: "#9ca3af", mt: "1px" }}>
                {po.supplier}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
            {!editMode ? (
              <Tooltip title="Edit items">
                <IconButton
                  size="small"
                  onClick={() => setEditMode(true)}
                  disableRipple
                  sx={{
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    width: { xs: 28, sm: 30, md: 30 },
                    height: { xs: 28, sm: 30, md: 30 },
                    "&:hover": { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" },
                    "&:focus": { outline: "none" },
                  }}
                >
                  <EditOutlinedIcon sx={{ fontSize: { xs: 14, sm: 15, md: 15 } }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                size="small"
                onClick={() => {
                  setDraftLines(
                    (po.lineItems || []).map((item) => ({
                      rejected: false,
                      quantity: item.quantity,
                      quantityRaw: String(item.quantity),
                    })),
                  );
                  setEditMode(false);
                }}
                disableRipple
                sx={{
                  fontSize: { xs: 10, sm: 11, md: 12 },
                  fontWeight: 600,
                  textTransform: "none",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  px: { xs: 0.75, sm: 1, md: 1.25 },
                  py: { xs: 0.375, sm: 0.5, md: 0.625 },
                  bgcolor: "#fff",
                  "&:hover": { bgcolor: "#f9fafb" },
                  "&:focus": { outline: "none" },
                }}
              >
                Cancel Edit
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => { setEditMode(false); onClose(); }}
              disableRipple
              sx={{
                color: "#9ca3af",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                width: { xs: 28, sm: 30, md: 30 },
                height: { xs: 28, sm: 30, md: 30 },
                "&:hover": { background: "#f3f4f6", color: "#374151" },
                "&:focus": { outline: "none" },
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: 14, sm: 15, md: 15 } }} />
            </IconButton>
          </Box>
        </Box>
        {editMode && (
          <Box
            sx={{
              px: { xs: 1.5, sm: 2, md: 2.5 },
              py: { xs: 0.75, sm: 1, md: 1.25 },
              bgcolor: "#fffbeb",
              borderBottom: "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 0.75, md: 1 },
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: { xs: 13, sm: 14, md: 14 }, color: "#d97706" }} />
            <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 13 }, color: "#92400e", fontWeight: 600 }}>
              Edit mode — reject items or decrease quantities only
            </Typography>
          </Box>
        )}
        <DialogContent
          sx={{
            px: { xs: 1.5, sm: 2, md: 2.5 },
            py: { xs: 1.25, sm: 1.5, md: 1.75 },
            overflowY: "auto",
            flex: 1,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, mb: "20px" }}>
            <Chip label={po.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700, fontSize: 11, height: 24 }} />
            <Chip label={po.priority} size="small" sx={{ bgcolor: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, fontWeight: 700, fontSize: 11, height: 24 }} />
            {po.fromExpiry && (
              <Tooltip title={`From Expiry Tracking — Item: ${po.fromExpiryItemName || "—"}, Reason: ${po.fromExpiryReason || "—"}`} arrow>
                <Chip label="From Expiry" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", fontWeight: 700, fontSize: 11, height: 24, cursor: "pointer" }} />
              </Tooltip>
            )}
            {po.fromReplacement && (
              <Tooltip title={`From Replacement — Item: ${po.fromReplacementItemName || "—"}, Reason: ${po.fromReplacementReason || "—"}`} arrow>
                <Chip label="From Replacement" size="small" sx={{ bgcolor: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe", fontWeight: 700, fontSize: 11, height: 24, cursor: "pointer" }} />
              </Tooltip>
            )}
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 1, sm: 1.25, md: 1.5 },
              mb: { xs: 1.25, sm: 1.5, md: 1.75 },
              p: { xs: 1, sm: 1.25, md: 1.5 },
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              bgcolor: "#f9fafb",
            }}
          >
            {[
              { label: "PO Number", value: po.id, valueColor: "#14b8a6" },
              { label: "Indent No/ID", value: po.indentId || "—", valueColor: po.indentId && po.indentId !== "—" ? "#2563eb" : "#9ca3af" },
              { label: "Quotation Ref", value: po.quotRef },
              { label: "Supplier", value: po.supplier },
              { label: "Deliver To", value: po.location },
              { label: "Order Date", value: po.date },
              { label: "Required Delivery", value: po.delivery },
              { label: "Created By", value: po.createdBy },
            ].map(({ label, value, valueColor }) => (
              <Box key={label}>
                <Typography sx={labelSx}>{label}</Typography>
                <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 600, color: valueColor || "#111827" }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ mb: { xs: 1.25, sm: 1.5, md: 1.75 } }} />
          <Box sx={{ mb: { xs: 1.25, sm: 1.5, md: 1.75 } }}>
            <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 12 }, fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em", textTransform: "uppercase", mb: { xs: 0.75, sm: 1, md: 1.25 } }}>
              Items
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: editMode
                  ? { xs: "minmax(0,3fr) 80px 72px 72px 36px", md: "minmax(0,3fr) 80px 72px 72px 36px" }
                  : { xs: "minmax(0,2.4fr) 52px 60px 64px 64px 68px", md: "minmax(0,2.4fr) 52px 60px 64px 64px 68px" },
                gap: { xs: 0.5, sm: 0.75, md: 1 },
                mb: { xs: 0.5, sm: 0.75, md: 1 },
                px: { xs: 0.75, sm: 1, md: 1.25 },
              }}
            >
              {(editMode
                ? ["DESCRIPTION", "QTY", "UNIT COST", "TOTAL", ""]
                : ["DESCRIPTION", "REQUIRED", "APPROVED", "REMAINING", "UNIT COST", "TOTAL"]
              ).map((h) => (
                <Typography
                  key={h}
                  sx={{
                    fontSize: { xs: 9, sm: 10, md: 10 },
                    fontWeight: 700,
                    color: "#9ca3af",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    textAlign: h === "DESCRIPTION" || h === "" ? "left" : "right",
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
              {displayItems.map((item, idx) => {
                const isRejected = item.rejected;
                const approvalChipStyle = getApprovalChipStyle(item.approvalStatus);
                const balance = getLineBalance(item);
                return (
                  <Box
                    key={idx}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: editMode
                        ? { xs: "minmax(0,3fr) 80px 72px 72px 36px", md: "minmax(0,3fr) 80px 72px 72px 36px" }
                        : { xs: "minmax(0,2.4fr) 52px 60px 64px 64px 68px", md: "minmax(0,2.4fr) 52px 60px 64px 64px 68px" },
                      gap: { xs: 0.5, sm: 0.75, md: 1 },
                      alignItems: "center",
                      p: { xs: 0.75, sm: 1, md: 1.25 },
                      borderRadius: "8px",
                      border: isRejected ? "1px solid #fecaca" : "1px solid #e5e7eb",
                      bgcolor: isRejected ? "#fef2f2" : "#fff",
                      opacity: isRejected ? 0.75 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 }, minWidth: 0, flexWrap: "wrap" }}>
                      {isRejected && <BlockOutlinedIcon sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, color: "#ef4444", flexShrink: 0 }} />}
                      <Typography
                        sx={{
                          fontSize: { xs: 12, sm: 13, md: 13 },
                          fontWeight: 500,
                          color: isRejected ? "#9ca3af" : "#111827",
                          textDecoration: isRejected ? "line-through" : "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.description}
                      </Typography>
                      {approvalChipStyle && (
                        <Chip
                          label={item.approvalStatus}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: 9,
                            fontWeight: 700,
                            bgcolor: approvalChipStyle.bg,
                            color: approvalChipStyle.color,
                            border: `1px solid ${approvalChipStyle.border}`,
                            "& .MuiChip-label": { px: "5px" },
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {!editMode && balance > 0 && (
                        <Chip
                          label={`${balance} open`}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: 9,
                            fontWeight: 700,
                            bgcolor: "#f3f4f6",
                            color: "#6b7280",
                            border: "1px solid #e5e7eb",
                            "& .MuiChip-label": { px: "5px" },
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                    {editMode ? (
                      <Box sx={{ position: "relative" }}>
                        <TextField
                          size="small"
                          type="number"
                          value={draftLines[idx]?.quantityRaw ?? String(item.quantity)}
                          disabled={isRejected}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                          onBlur={() => handleQtyBlur(idx)}
                          inputProps={{ min: 1 }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              fontSize: { xs: 12, sm: 13, md: 13 },
                              borderRadius: "6px",
                              bgcolor: isRejected ? "#f9fafb" : "#fff",
                              "& fieldset": { borderColor: "#d1d5db" },
                              "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                            },
                            "& .MuiInputBase-input": { py: { xs: 0.5, sm: 0.625, md: 0.75 }, px: { xs: 0.5, sm: 0.75, md: 1 }, textAlign: "right" },
                            "& input[type=number]": { MozAppearance: "textfield" },
                            "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" },
                            "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" },
                          }}
                        />
                        {!isRejected && (
                          <Typography sx={{ fontSize: { xs: 8, sm: 9, md: 9 }, color: "#9ca3af", textAlign: "right", mt: "2px", lineHeight: 1 }}>
                            max {po.lineItems[idx]?.quantity}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <>
                        <Tooltip title="Required (ordered) quantity" placement="top" arrow>
                          <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, color: "#6b7280", textAlign: "right" }}>
                            {item.quantity}
                          </Typography>
                        </Tooltip>
                        <Tooltip title="Approved quantity" placement="top" arrow>
                          <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 700, color: Number(item.approvedQty) > 0 ? "#16a34a" : "#9ca3af", textAlign: "right" }}>
                            {Number(item.approvedQty) || 0}
                          </Typography>
                        </Tooltip>
                        <Tooltip title="Remaining (still open) quantity" placement="top" arrow>
                          <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 700, color: balance > 0 ? "#d97706" : "#9ca3af", textAlign: "right" }}>
                            {balance}
                          </Typography>
                        </Tooltip>
                      </>
                    )}
                    <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, textAlign: "right", color: isRejected ? "#9ca3af" : "#6b7280" }}>
                      ${item.unitCost.toFixed(2)}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, fontWeight: 600, textAlign: "right", color: isRejected ? "#9ca3af" : "#111827", textDecoration: isRejected ? "line-through" : "none" }}>
                      ${item.total.toFixed(2)}
                    </Typography>
                    {editMode && (
                      <Tooltip title={isRejected ? "Restore item" : "Reject item"}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleReject(idx)}
                          disableRipple
                          sx={{
                            width: { xs: 26, sm: 28, md: 28 },
                            height: { xs: 26, sm: 28, md: 28 },
                            borderRadius: "6px",
                            border: isRejected ? "1px solid #fca5a5" : "1px solid #e5e7eb",
                            color: isRejected ? "#ef4444" : "#9ca3af",
                            bgcolor: isRejected ? "#fef2f2" : "#fff",
                            "&:hover": { bgcolor: isRejected ? "#fff" : "#fef2f2", color: isRejected ? "#6b7280" : "#ef4444", borderColor: isRejected ? "#e5e7eb" : "#fca5a5" },
                            "&:focus": { outline: "none" },
                          }}
                        >
                          <BlockOutlinedIcon sx={{ fontSize: { xs: 12, sm: 13, md: 13 } }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: { xs: 0.75, sm: 1, md: 1.25 }, pt: { xs: 0.75, sm: 1, md: 1.25 }, borderTop: "1px dashed #e5e7eb" }}>
              <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 13 }, color: "#6b7280", mr: 1 }}>
                {editMode ? "Revised Total:" : "Total Amount:"}
              </Typography>
              <Typography sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, fontWeight: 800, color: "#111827" }}>
                ${poTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
            {editMode && draftLines.some((d) => d.rejected) && (
              <Box sx={{ mt: { xs: 0.75, sm: 1, md: 1.25 }, p: { xs: 0.75, sm: 1, md: 1.25 }, borderRadius: "8px", bgcolor: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75, md: 1 } }}>
                <BlockOutlinedIcon sx={{ fontSize: { xs: 13, sm: 14, md: 14 }, color: "#ef4444" }} />
                <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 12 }, color: "#dc2626", fontWeight: 600 }}>
                  {draftLines.filter((d) => d.rejected).length} item(s) will be removed from this PO
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <Box
          sx={{
            px: { xs: 1.5, sm: 2, md: 2.5 },
            py: { xs: 1, sm: 1.25, md: 1.5 },
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "flex-end",
            gap: { xs: 0.75, sm: 1, md: 1.25 },
            bgcolor: "#fff",
            flexShrink: 0,
          }}
        >
          <Button
            onClick={() => { setEditMode(false); onClose(); }}
            disableRipple
            sx={{ ...btnBase, color: "#374151", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}
          >
            Close
          </Button>
          {editMode && (
            <Button
              onClick={handleSaveEdits}
              disabled={!hasChanges}
              disableRipple
              sx={{
                ...btnBase,
                fontWeight: 700,
                color: "#fff",
                bgcolor: hasChanges ? "#2563eb" : "#93c5fd",
                boxShadow: hasChanges ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
                "&:hover": { bgcolor: hasChanges ? "#1d4ed8" : "#93c5fd" },
                "&:focus": { outline: "none" },
              }}
            >
              Save Changes
            </Button>
          )}
        </Box>
      </Dialog>
    );
  };

  // ── POStatusChip ───────────────────────────────────────────────────────────

  function POStatusChip({ po, statusStyle }) {
    const items = po.lineItems || [];
    const getTooltipText = () => {
      if (po.status === "Partial Approved") {
        const approved = items.filter((it) => getLineStatus(it) === "Approved").length;
        const partial = items.filter((it) => getLineBalance(it) > 0).length;
        const rejected = items.filter((it) => getLineStatus(it) === "Rejected").length;
        return `Status: ${po.status} (${approved} fully approved, ${partial} still open, ${rejected} fully rejected)`;
      }
      return `Status: ${po.status}`;
    };
    const tooltipBg = { Approved: "#065f46", "Partial Approved": "#92400e", Rejected: "#991b1b" }[po.status];
    const showInfo = ["Approved", "Partial Approved", "Rejected"].includes(po.status) && items.length > 0;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Chip
          label={po.status}
          size="small"
          sx={{
            bgcolor: statusStyle.bg,
            color: statusStyle.color,
            border: `1px solid ${statusStyle.border}`,
            fontWeight: 600,
            fontSize: 11,
            height: 20,
            "& .MuiChip-label": { px: "7px" },
          }}
        />
        {showInfo && (
          <Tooltip title={getTooltipText()} arrow placement="top" componentsProps={{ tooltip: { sx: { bgcolor: tooltipBg, "& .MuiTooltip-arrow": { color: tooltipBg }, borderRadius: "8px", px: "12px", py: "10px", maxWidth: 260 } } }}>
            <InfoOutlinedIcon sx={{ fontSize: 13, color: statusStyle.color, cursor: "pointer", opacity: 0.75, "&:hover": { opacity: 1 }, flexShrink: 0 }} />
          </Tooltip>
        )}
      </Box>
    );
  }

  // ── GRN helpers ────────────────────────────────────────────────────────────

  function getGRNDisplayStatus(po, grns) {
    const poGRNs = grns.filter((g) => g.linkedPO === po.id);
    if (poGRNs.length === 0) return { label: "Not Started", extra: null };
    const poQty = (po.lineItems || []).reduce((s, it) => s + (it.quantity || 0), 0);
    const hasDraft = poGRNs.some((g) => g.grnType === "draft");
    const hasSubmitted = poGRNs.some(
      (g) => g.grnType === "submitted" || g.status === "Approved" || g.status === "Completed" || g.status === "Discrepancy" || g.status === "Short Delivery",
    );
    if (hasDraft && !hasSubmitted) return { label: "Draft GRN", extra: null };
    if (hasSubmitted) {
      const receivedQty = poGRNs
        .filter((g) => g.grnType === "submitted" || g.status === "Approved" || g.status === "Completed" || g.status === "Short Delivery")
        .reduce((sum, g) => sum + (g.receivedQty || 0), 0);
      let goodItemCount = 0, discrepancyItemCount = 0, shortDeliveryItemCount = 0, discrepancyTypes = [];
      poGRNs.forEach((grn) => {
        if (grn.lineItems && Array.isArray(grn.lineItems)) {
          grn.lineItems.forEach((item) => {
            if (item.condition === "Good — No Issues" || !item.condition) {
              goodItemCount++;
            } else if (item.condition === "Short Delivery") {
              shortDeliveryItemCount++;
              if (!discrepancyTypes.includes("Short Delivery")) discrepancyTypes.push("Short Delivery");
            } else {
              discrepancyItemCount++;
              const condType = item.condition?.split(" — ")[0] || item.condition;
              if (!discrepancyTypes.includes(condType)) discrepancyTypes.push(condType);
            }
          });
        }
      });
      const hasDiscrepancy = poGRNs.some((g) => g.status === "Discrepancy") || discrepancyItemCount > 0;
      const hasShortDelivery = poGRNs.some((g) => g.status === "Short Delivery") || shortDeliveryItemCount > 0;
      const hasApproved = poGRNs.some((g) => g.status === "Approved" || g.status === "Completed" || g.status === "Pending" || g.status === "Short Delivery") || goodItemCount > 0;
      const hasShortClose = poGRNs.some((g) => g.isShortClose || g.status === "Short Close");
      const shortCloseReasons = poGRNs.filter((g) => g.isShortClose).flatMap((g) => g.shortCloseReasons || []).filter(Boolean);

      if (hasShortClose && poQty > 0 && receivedQty < poQty) return { label: "Short Close", extra: { poQty, receivedQty, gap: poQty - receivedQty, reasons: shortCloseReasons } };
      if (hasShortDelivery && receivedQty > 0 && receivedQty < poQty) return { label: "Short Delivery", extra: { poQty, receivedQty, gap: poQty - receivedQty, isPending: true } };
      if (hasDiscrepancy && hasApproved && discrepancyItemCount > 0 && goodItemCount > 0) return { label: "Discrepancy GRN Submitted", extra: { goodItems: goodItemCount, discrepancyItems: discrepancyItemCount, discrepancyTypes: discrepancyTypes.filter((t) => t !== "Short Delivery") } };
      if (hasShortDelivery && hasApproved && shortDeliveryItemCount > 0 && goodItemCount > 0) return { label: "Short Delivery GRN Submitted", extra: { goodItems: goodItemCount, shortDeliveryItems: shortDeliveryItemCount } };
      if (hasDiscrepancy) return { label: "Discrepancy", extra: { discrepancyTypes: discrepancyTypes.filter((t) => t !== "Short Delivery") } };
      if (hasShortDelivery) return { label: "Short Delivery", extra: null };
      if (receivedQty >= poQty && poQty > 0) return { label: "GRN Submitted", extra: { poQty, receivedQty } };
      return { label: "GRN Submitted", extra: null };
    }
    if (hasDraft) return { label: "Draft GRN", extra: null };
    return { label: "Not Started", extra: null };
  }

  function grnStatusStyle(label) {
    return (
      {
        "Draft GRN": { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
        "GRN Submitted": { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
        "Short Close": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
        Received: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
        Discrepancy: { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
        "Discrepancy GRN Submitted": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
        "Short Delivery": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
        "Short Delivery GRN Submitted": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
      }[label] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" }
    );
  }

  function GRNStatusChip({ po, grns }) {
    const { label, extra } = getGRNDisplayStatus(po, grns);
    const style = grnStatusStyle(label);
    const hasInfo = !!extra;
    let tooltipContent = "";
    let tooltipBg = "#065f46";

    if (hasInfo) {
      if (label === "Short Close") {
        tooltipBg = "#c2410c";
        tooltipContent = (
          <Box sx={{ p: "2px 0" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff", mb: "4px" }}>Short Close — Delivery Gap</Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>PO Qty: <strong style={{ color: "#fff" }}>{extra?.poQty || 0}</strong></Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>Received: <strong style={{ color: "#fff" }}>{extra?.receivedQty || 0}</strong></Typography>
            <Typography sx={{ fontSize: 11, color: "#fca5a5", fontWeight: 700 }}>Gap: {extra?.gap || 0} unit{(extra?.gap || 0) !== 1 ? "s" : ""} short</Typography>
            {extra?.reasons?.length > 0 && (
              <Box sx={{ mt: "6px", pt: "6px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", mb: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Reasons</Typography>
                {extra.reasons.map((r, i) => <Typography key={i} sx={{ fontSize: 11, color: "rgba(255,255,255,0.9)" }}>• {r}</Typography>)}
              </Box>
            )}
          </Box>
        );
      } else if (label === "Discrepancy GRN Submitted") {
        tooltipBg = "#d97706";
        tooltipContent = (
          <Box sx={{ p: "2px 0" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff", mb: "4px" }}>Discrepancy GRN Submitted</Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>✓ Good Items: <strong style={{ color: "#fff" }}>{extra?.goodItems || 0}</strong></Typography>
            <Typography sx={{ fontSize: 11, color: "#fca5a5", fontWeight: 700 }}>⚠ Discrepancy Items: {extra?.discrepancyItems || 0}</Typography>
            {extra?.discrepancyTypes?.length > 0 && (
              <Box sx={{ mt: "6px", pt: "6px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", mb: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Issues</Typography>
                {extra.discrepancyTypes.map((t, i) => <Typography key={i} sx={{ fontSize: 11, color: "rgba(255,255,255,0.9)" }}>• {t}</Typography>)}
              </Box>
            )}
          </Box>
        );
      } else if (label === "Short Delivery GRN Submitted") {
        tooltipBg = "#c2410c";
        tooltipContent = (
          <Box sx={{ p: "2px 0" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff", mb: "4px" }}>Short Delivery GRN Submitted</Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>✓ Good Items: <strong style={{ color: "#fff" }}>{extra?.goodItems || 0}</strong></Typography>
            <Typography sx={{ fontSize: 11, color: "#fca5a5", fontWeight: 700 }}>📦 Short Delivery Items: {extra?.shortDeliveryItems || 0}</Typography>
          </Box>
        );
      } else if (extra?.poQty !== undefined) {
        tooltipBg = "#065f46";
        tooltipContent = (
          <Box sx={{ p: "2px 0" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff", mb: "4px" }}>GRN Submitted</Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>PO Qty: <strong style={{ color: "#fff" }}>{extra?.poQty || 0}</strong></Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>Received: <strong style={{ color: "#fff" }}>{extra?.receivedQty || 0}</strong></Typography>
          </Box>
        );
      }
    }

    const tooltipProps = { arrow: true, placement: "top", componentsProps: { tooltip: { sx: { bgcolor: tooltipBg, "& .MuiTooltip-arrow": { color: tooltipBg }, borderRadius: "8px", px: "12px", py: "10px", maxWidth: 240 } } } };

    if (label === "Discrepancy GRN Submitted" && extra?.goodItems > 0 && extra?.discrepancyItems > 0) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Chip label={`GRN Submitted (${extra.goodItems})`} size="small" sx={{ bgcolor: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontWeight: 700, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" } }} />
          <Chip label={`Discrepancy (${extra.discrepancyItems})`} size="small" sx={{ bgcolor: "#fef3c7", color: "#d97706", border: "1px solid #fde68a", fontWeight: 700, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" } }} />
          {extra?.discrepancyTypes?.length > 0 && (
            <Tooltip title={tooltipContent} {...tooltipProps}>
              <InfoOutlinedIcon sx={{ fontSize: 13, color: "#d97706", cursor: "pointer", opacity: 0.8, "&:hover": { opacity: 1 }, flexShrink: 0 }} />
            </Tooltip>
          )}
        </Box>
      );
    }

    if (label === "Short Delivery GRN Submitted" && extra?.goodItems > 0 && extra?.shortDeliveryItems > 0) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Chip label={`GRN Submitted (${extra.goodItems})`} size="small" sx={{ bgcolor: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontWeight: 700, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" } }} />
          <Chip label={`Short Delivery (${extra.shortDeliveryItems})`} size="small" sx={{ bgcolor: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", fontWeight: 700, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" } }} />
          <Tooltip title={tooltipContent} {...tooltipProps}>
            <InfoOutlinedIcon sx={{ fontSize: 13, color: "#ea580c", cursor: "pointer", opacity: 0.8, "&:hover": { opacity: 1 }, flexShrink: 0 }} />
          </Tooltip>
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Chip label={label} size="small" sx={{ bgcolor: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 700, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" } }} />
        {hasInfo && (
          <Tooltip title={tooltipContent} {...tooltipProps}>
            <InfoOutlinedIcon sx={{ fontSize: 13, color: style.color, cursor: "pointer", opacity: 0.8, "&:hover": { opacity: 1 }, flexShrink: 0 }} />
          </Tooltip>
        )}
      </Box>
    );
  }

  // ── Main Component ─────────────────────────────────────────────────────────

  const STORAGE_KEY = "purchase_orders_data";

  const INITIAL_POS = [
    {
      id: "PO-2026-0004",
      indentId: "IND-2026-0041",
      quotRef: "—",
      supplier: "McKesson Medical-Surgical",
      location: "Main Acute Care Hospital",
      lines: 2,
      total: 850,
      createdBy: "S. Anderson",
      date: "Mar 19, 2026",
      delivery: "Mar 24, 2026",
      priority: "High",
      status: "Approved",
      lineItems: [
        { description: "Amoxicillin 500mg Capsules", quantity: 200, unitCost: 2.4, total: 480.0 },
        { description: "Epinephrine 1mg/mL 10mL", quantity: 20, unitCost: 18.5, total: 370.0 },
      ],
    },
    {
      id: "PO-2026-0003",
      indentId: "IND-2026-0038",
      quotRef: "—",
      supplier: "Cardinal Health",
      location: "Central Warehouse & Stores",
      lines: 2,
      total: 525,
      createdBy: "S. Anderson",
      date: "Mar 17, 2026",
      delivery: "Mar 22, 2026",
      priority: "Medium",
      status: "Pending",
      lineItems: [
        { description: "Paracetamol 500mg Tablets", quantity: 100, unitCost: 2.5, total: 250.0 },
        { description: "Ibuprofen 200mg Tablets", quantity: 50, unitCost: 5.5, total: 275.0 },
      ],
    },
    {
      id: "PO-2026-0002",
      indentId: "IND-2026-0035",
      quotRef: "—",
      supplier: "Medline Industries",
      location: "Main Acute Care Hospital",
      lines: 2,
      total: 696,
      createdBy: "T. Williams",
      date: "Mar 14, 2026",
      delivery: "Mar 20, 2026",
      priority: "Medium",
      status: "Received",
      lineItems: [
        { description: "Surgical Gloves (Box of 100)", quantity: 10, unitCost: 45.6, total: 456.0 },
        { description: "Face Masks (Box of 50)", quantity: 15, unitCost: 16.0, total: 240.0 },
      ],
    },
    {
      id: "PO-2026-0001",
      indentId: "IND-2026-0029",
      quotRef: "—",
      supplier: "Fisher Scientific",
      location: "Central Warehouse & Stores",
      lines: 1,
      total: 175,
      createdBy: "T. Williams",
      date: "Mar 10, 2026",
      delivery: "Mar 18, 2026",
      priority: "Low",
      status: "Draft",
      lineItems: [
        { description: "Lab Coats (Large)", quantity: 5, unitCost: 35.0, total: 175.0 },
      ],
    },
  ];

  const PurchaseOrders = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addGRN, updateGRN, grns, nextGRNId } = useGRN();
    const { can } = usePermissions();
    const { currentUser } = useAuth();
    const userLocation = getUserLocation(currentUser);
    const [newPOModalOpen, setNewPOModalOpen] = useState(false);
    const [editingDraftPO, setEditingDraftPO] = useState(null);
    const [viewPOModalOpen, setViewPOModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [poApprovalModal, setPoApprovalModal] = useState({ open: false, po: null, mode: "approve" });
    const [newGRNModalOpen, setNewGRNModalOpen] = useState(false);
    const [selectedGRNPO, setSelectedGRNPO] = useState(null);
    const [editingDraftGRN, setEditingDraftGRN] = useState(null);
    const [viewGRNModalOpen, setViewGRNModalOpen] = useState(false);
    const [selectedPOForGRNView, setSelectedPOForGRNView] = useState(null);
    const [mailPOModal, setMailPOModal] = useState({ open: false, po: null });
    const [toast, setToast] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightIndent, setHighlightIndent] = useState(null);
    const [highlightPO, setHighlightPO] = useState(location.state?.highlightPO || null);
    const { suppliers, supplierNames, locationNames } = useVendorManagement();
    const [locationsList, setLocationsList] = useState(() => getLocations());
    const [currentPage, setCurrentPage] = useState(1);
    const [priorityFilter, setPriorityFilter] = useState("All");

    const [purchaseOrders, setPurchaseOrders] = useState(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
      return INITIAL_POS;
    });

    React.useEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchaseOrders));
    }, [purchaseOrders]);

    // ── Re-sync from localStorage whenever a GRN submission updates PO
    //    balances out-of-band (see NewGRNDialog's updatePOAfterGRNSubmission,
    //    which writes directly to localStorage and fires this event). Without
    //    this listener, this component's own save-effect above would blindly
    //    overwrite those changes with its stale in-memory copy. ──
    React.useEffect(() => {
      const onPOsUpdated = () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setPurchaseOrders(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      };
      window.addEventListener("purchaseOrdersUpdated", onPOsUpdated);
      return () => window.removeEventListener("purchaseOrdersUpdated", onPOsUpdated);
    }, []);

    React.useEffect(() => {
      if (locationNames && locationNames.length) setLocationsList(locationNames);
    }, [locationNames]);

    React.useEffect(() => {
      const onLocationsUpdated = () => setLocationsList(getLocations());
      window.addEventListener("locationsUpdated", onLocationsUpdated);
      return () => window.removeEventListener("locationsUpdated", onLocationsUpdated);
    }, []);

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const highlightId = params.get("highlight");
      if (highlightId) {
        if (highlightId.startsWith("IND-")) {
          setHighlightIndent(highlightId);
          const timer = setTimeout(() => setHighlightIndent(null), 5000);
          return () => clearTimeout(timer);
        } else {
          setHighlightPO(highlightId);
          const timer = setTimeout(() => setHighlightPO(null), 5000);
          return () => clearTimeout(timer);
        }
      }
    }, [location.search]);

    const activeIndentFilter = highlightIndent || (searchQuery.trim() ? searchQuery.trim() : null);

    const filteredPOs = purchaseOrders.filter((po) => {
      if (highlightPO) return true;
      if (priorityFilter !== "All" && po.priority !== priorityFilter) return false;
      if (!activeIndentFilter) return true;
      const q = activeIndentFilter.toLowerCase();
      const indent = hasRealIndentId(po.indentId) ? String(po.indentId).toLowerCase() : "";
      if (indent.includes(q)) return true;
      return (
        po.id?.toLowerCase().includes(q) ||
        po.supplier?.toLowerCase().includes(q) ||
        po.location?.toLowerCase().includes(q)
      );
    });

    const totalPages = Math.ceil(filteredPOs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedPOs = filteredPOs.slice(startIndex, endIndex);

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

    React.useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, highlightIndent, highlightPO, priorityFilter]);

    const supplierOptions = supplierNames.map((name) => ({ value: name, label: name }));
    const locations = [
      { value: "all", label: "All Locations" },
      ...locationsList.map((loc) => ({ value: loc, label: loc })),
    ];

    const fullyReceivedCount = purchaseOrders.filter((po) => {
      const { label } = getGRNDisplayStatus(po, grns);
      return (label === "GRN Submitted" || label === "Received") && label !== "Short Delivery" && label !== "Short Close";
    }).length;

    const stats = {
      totalPOs: purchaseOrders.length,
      totalValue: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
      pendingApproval: purchaseOrders.filter((po) => po.status === "Pending").length,
      approvedActive: purchaseOrders.filter((po) => po.status === "Approved" || po.status === "Partial Approved").length,
      fullyReceived: fullyReceivedCount,
    };

    const statCards = [
      {
        label: "Total Purchase Orders",
        count: stats.totalPOs,
        sub: `$${stats.totalValue.toLocaleString()} total value`,
        iconBg: "#3b82f6",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ),
      },
      {
        label: "Pending Approval",
        count: stats.pendingApproval,
        sub: "Awaiting approval",
        iconBg: "#f59e0b",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        label: "Approved / In Transit",
        count: stats.approvedActive,
        sub: "Ready to receive GRN",
        iconBg: "#10b981",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ),
      },
      {
        label: "Received",
        count: stats.fullyReceived,
        sub: "Completed orders",
        iconBg: "#8b5cf6",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        ),
      },
    ];

    const getStatusStyle = (status) =>
      ({
        Approved: { bg: "#e0f2fe", color: "#14b8a6", border: "#bae6fd" },
        "Partial Approved": { bg: "#dbeafe", color: "#2563eb", border: "#93c5fd" },
        Pending: { bg: "#fffbeb", color: "#f59e0b", border: "#fde68a" },
        "Partially Received": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
        Received: { bg: "#f0fdf4", color: "#10b981", border: "#bbf7d0" },
        Rejected: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
        Draft: { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
      })[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

    // Both Approve and Reject open the SAME modal with a different `mode`
    // — mirroring the Indent page's separate approve/reject buttons instead
    // of one combined checkbox modal. Works entirely off local state.
    const handleApprove = (po) => setPoApprovalModal({ open: true, po, mode: "approve" });
    const handleRejectItems = (po) => setPoApprovalModal({ open: true, po, mode: "reject" });

    // Applies the approve/reject decision directly to local state and
    // recomputes the PO's overall status from its line items.
    const handleApprovalConfirm = (updatedPO, mode) => {
      const finalPO = { ...updatedPO, status: computePOStatus(updatedPO.lineItems) };
      setPurchaseOrders((prev) => prev.map((p) => (p.id === finalPO.id ? finalPO : p)));
      const isPartial = finalPO.status === "Partial Approved";
      setToast({
        msg: (
          <span>
            PO <strong>{finalPO.id}</strong>{" "}
            {mode === "reject"
              ? "— selected item(s) rejected."
              : isPartial
                ? "partially approved — remaining balance still open."
                : finalPO.status === "Rejected"
                  ? "rejected."
                  : "approved."}
          </span>
        ),
        type: finalPO.status === "Rejected" ? "error" : isPartial ? "info" : "success",
      });
      setTimeout(() => setToast(null), 4000);
    };

    const handleViewPO = (po) => {
      setSelectedPO(po);
      setViewPOModalOpen(true);
    };

    // Caps GRN eligibility by approvedQty (what was actually approved) —
    // this already correctly reflects incremental/partial approval rounds
    // and never counts a rejected or still-pending balance.
    const getOpenPOBalance = (po) => {
      const submittedGRNs = grns.filter(
        (g) =>
          g.linkedPO === po.id &&
          (g.grnType === "submitted" || g.status === "Approved" || g.status === "Completed" || g.status === "Short Delivery"),
      );
      const receivedByItem = {};
      submittedGRNs.forEach((grn) => {
        (grn.lineItems || []).forEach((li) => {
          const key = (li.item || "").toLowerCase();
          if (!key) return;
          receivedByItem[key] = (receivedByItem[key] || 0) + (parseFloat(li.rcvQty) || 0);
        });
      });
      return (po.lineItems || []).reduce((total, item) => {
        const approvedQty = Number(item.approvedQty) || 0;
        if (approvedQty <= 0) return total;
        const key = (item.description || item.item || "").toLowerCase();
        const receivedQty = receivedByItem[key] || 0;
        return total + Math.max(0, approvedQty - receivedQty);
      }, 0);
    };

    const handleCreateGRN = (po) => { setEditingDraftGRN(null); setSelectedGRNPO(po); setNewGRNModalOpen(true); };
    const handleEditDraftGRN = (po) => {
      const existingGRN = grns.find((g) => g.linkedPO === po.id && g.grnType === "draft");
      setEditingDraftGRN(existingGRN || null);
      setSelectedGRNPO(po);
      setNewGRNModalOpen(true);
    };
    const handleViewGRN = (po) => { setSelectedPOForGRNView(po); setViewGRNModalOpen(true); };
    const handleMailPO = (po) => setMailPOModal({ open: true, po });
    const handleMailPOConfirm = (mailData) => {
      setPurchaseOrders((prev) =>
        prev.map((p) =>
          p.id === mailData.poId ? { ...p, mailSent: true, mailSentAt: new Date().toLocaleString() } : p,
        ),
      );
      setToast({
        msg: (<span>PO <strong>{mailData.poId}</strong> sent to <strong>{mailData.email}</strong> as {mailData.recipient}.</span>),
        type: "success",
      });
      setTimeout(() => setToast(null), 4000);
      setMailPOModal({ open: false, po: null });
    };

    const handleSavePO = (poData) => {
      const supplierLabel = poData.supplier || "";
      const locationLabel = locations.find((l) => l.value === poData.deliverTo)?.label || poData.deliverTo || "";
      const isDraft = poData.status === "Draft";
      const localLineItems = poData.lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        total: Number(item.quantity) * Number(item.unitCost),
        indentApprovedQty:
          item._approvedQty != null
            ? Number(item._approvedQty)
            : item.indentApprovedQty != null
              ? Number(item.indentApprovedQty)
              : null,
      }));
      const localPO = {
        id: poData.poNumber,
        indentId: hasRealIndentId(poData.indentId) ? String(poData.indentId).trim() : "—",
        quotRef: poData.quotationRef || "—",
        supplier: supplierLabel,
        location: locationLabel,
        lines: localLineItems.length,
        total: poData.totalAmount,
        createdBy: "Current User",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        delivery: poData.requiredDelivery
          ? new Date(poData.requiredDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—",
        priority: poData.priority,
        status: isDraft ? "Draft" : "Pending",
        lineItems: localLineItems,
      };

      setPurchaseOrders((prev) => [localPO, ...prev]);
      setToast({
        msg: (
          <span>
            PO <strong>{localPO.id}</strong> {isDraft ? "saved as draft" : "submitted successfully"}!{" "}
            <a
              href="/admin/purchase-orders"
              style={{ color: "#fff", textDecoration: "underline", fontWeight: 600, cursor: "pointer" }}
              onClick={(e) => { e.preventDefault(); navigate("/admin/purchase-orders"); }}
            >
              View POs
            </a>
          </span>
        ),
        type: isDraft ? "info" : "success",
      });
      setTimeout(() => setToast(null), 4000);
    };

    const COLUMNS = ["PO / Indent", "Supplier / Location", "Priority & Status", "GRN Status", "Actions"];

    return (
      <Box>
        <Snackbar
          open={!!toast}
          autoHideDuration={4000}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={toast?.type === "error" ? "error" : toast?.type === "info" ? "info" : "success"}
            variant="filled"
            sx={{ fontSize: 13, fontWeight: 600, borderRadius: "10px", minWidth: 320, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
            onClose={() => setToast(null)}
          >
            {toast?.msg}
          </Alert>
        </Snackbar>

        {/* ── Header ── */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: { xs: 1.25, sm: 1.5, md: 1.75 },
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 1, md: 0 },
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, fontWeight: 700, color: "#111827" }}>
              Purchase Orders
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search by PO, Indent ID, Supplier…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightIndent(null);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => { setSearchQuery(""); setHighlightIndent(null); }}
                      disableRipple
                      sx={{ p: 0.5, color: "#9ca3af", "&:hover": { color: "#374151" } }}
                    >
                      <ClearIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: { xs: "100%", md: 260 },
                "& .MuiOutlinedInput-root": {
                  fontSize: 13,
                  borderRadius: "8px",
                  bgcolor: "#fff",
                  height: 36,
                  "& fieldset": { borderColor: "#e5e7eb" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
                },
              }}
            />

            <Box sx={{ minWidth: 148 }}>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                size="small"
                fullWidth
                sx={{
                  fontSize: 13,
                  borderRadius: "20px",
                  background: "#fff",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb", borderWidth: "1px" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
                }}
              >
                {["All", "Low", "Medium", "High", "Critical"].map((p) => (
                  <MenuItem key={p} value={p}>
                    {p === "All" ? "All Priorities" : p}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Tooltip title={!can.createPO ? "You don't have permission to create purchase orders" : ""}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setNewPOModalOpen(true)}
                  disabled={!can.createPO}
                  sx={{
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: "8px",
                    px: 1.875,
                    height: 36,
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: "none",
                    boxShadow: "0 1px 4px rgba(37,99,235,0.25)",
                    whiteSpace: "nowrap",
                    "&:hover": { background: "#1d4ed8" },
                    "&:disabled": { background: "#d1d5db", color: "#9ca3af", boxShadow: "none" },
                  }}
                >
                  New PO
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {(searchQuery || highlightIndent) && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1.125,
              px: 1.25,
              py: 0.75,
              borderRadius: "8px",
              bgcolor: "#eff6ff",
              border: "1px solid #bfdbfe",
              width: "fit-content",
            }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#2563eb", flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
              {filteredPOs.length} PO{filteredPOs.length !== 1 ? "s" : ""} for "{highlightIndent || searchQuery}"
            </Typography>
            <IconButton
              size="small"
              onClick={() => { setSearchQuery(""); setHighlightIndent(null); }}
              disableRipple
              sx={{ p: 0.5, color: "#9ca3af", ml: 0.5, "&:hover": { color: "#374151" } }}
            >
              <ClearIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            mb: { xs: 0.875, sm: 1.125, md: 1.375 },
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          {statCards.map((s) => (
            <StatCard key={s.label} label={s.label} count={s.count} sub={s.sub} iconBg={s.iconBg} iconEl={s.icon} />
          ))}
        </Box>

        <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <TableContainer sx={{ overflowX: { xs: "auto", md: "visible" } }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#EBF1FE" }}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col} sx={thSx}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPOs.map((po, idx) => {
                  const ss = getStatusStyle(po.status);
                  const ps = getPriorityStyle(po.priority);
                  const indentVisible = hasRealIndentId(po.indentId);
                  const isHighlighted =
                    (highlightIndent && po.indentId === highlightIndent) ||
                    (highlightPO && po.id === highlightPO);
                  const isDimmed =
                    (highlightIndent && po.indentId !== highlightIndent && !highlightPO) ||
                    (highlightPO && po.id !== highlightPO);
                  const hasActionableBalance = (po.lineItems || []).some((it) => getLineBalance(it) > 0);

                  return (
                    <TableRow
                      key={po.id}
                      sx={{
                        background: highlightPO === po.id ? "#fef3c7" : (highlightIndent && po.indentId === highlightIndent) ? "#fef3c7" : isHighlighted ? "#eff6ff" : "#fff",
                        opacity: isDimmed ? 0.45 : 1,
                        outline: "none",
                        outlineOffset: "-1px",
                        "&:hover": { background: highlightPO === po.id ? "#fef3c7" : (highlightIndent && po.indentId === highlightIndent) ? "#fef3c7" : isHighlighted ? "#dbeafe" : "#fafafa" },
                        transition: "background 0.3s",
                        "& td": { borderBottom: idx < paginatedPOs.length - 1 ? "1px solid #f3f4f6" : "none" },
                        boxShadow: (highlightPO === po.id || (highlightIndent && po.indentId === highlightIndent)) ? "inset 0 0 0 2px #f59e0b" : "none",
                      }}
                    >
                      {/* Col 1: PO / Indent */}
                      <TableCell sx={{ ...tdSx, minWidth: 148 }}>
                        <Tooltip title={`PO: ${po.id}`} placement="top" arrow>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                            {po.id}
                          </Typography>
                        </Tooltip>
                        {indentVisible ? (
                          <Tooltip title={`Click to view Indent: ${po.indentId}`}>
                            <Chip
                              label={po.indentId}
                              size="small"
                              onClick={() => navigate(`/admin/inventory/indent?highlight=${po.indentId}`)}
                              sx={{
                                mt: "5px",
                                bgcolor: "#eff6ff",
                                color: "#2563eb",
                                border: "1px solid #bfdbfe",
                                fontWeight: 600,
                                fontSize: 10,
                                height: 18,
                                cursor: "pointer",
                                "& .MuiChip-label": { px: "6px" },
                                "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd", color: "#1d4ed8" },
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="No indent linked">
                            <Typography sx={{ fontSize: 11, color: "#d1d5db", mt: "4px" }}>
                              No indent linked
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Col 2: Supplier / Location */}
                      <TableCell sx={{ ...tdSx, minWidth: 160 }}>
                        <Tooltip title={`Supplier: ${po.supplier}`} placement="top" arrow>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>
                            {po.supplier}
                          </Typography>
                        </Tooltip>
                        <Tooltip title={`Location: ${po.location || "Not specified"}`} placement="top" arrow>
                          <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mt: "4px" }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#a78bfa", flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>
                              {po.location || "—"}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Col 3: Priority & Status */}
                      <TableCell sx={{ ...tdSx, minWidth: 130 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Tooltip title={`Priority: ${po.priority}`} placement="top" arrow>
                              <Box>
                                <Chip
                                  label={po.priority}
                                  size="small"
                                  sx={{ bgcolor: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, fontWeight: 600, fontSize: 11, height: 20, "& .MuiChip-label": { px: "7px" }, flexShrink: 0 }}
                                />
                              </Box>
                            </Tooltip>
                            {po.fromExpiry && (
                              <Tooltip title={`From Expiry Tracking — Item: ${po.fromExpiryItemName || "—"}, Reason: ${po.fromExpiryReason || "—"}`} placement="top" arrow>
                                <Chip label="From Expiry" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", fontWeight: 600, fontSize: 10, height: 20, "& .MuiChip-label": { px: "6px" }, cursor: "pointer" }} />
                              </Tooltip>
                            )}
                            {po.fromReplacement && (
                              <Tooltip title={`From Replacement — Item: ${po.fromReplacementItemName || "—"}, Reason: ${po.fromReplacementReason || "—"}`} placement="top" arrow>
                                <Chip label="From Replacement" size="small" sx={{ bgcolor: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe", fontWeight: 600, fontSize: 10, height: 20, "& .MuiChip-label": { px: "6px" }, cursor: "pointer" }} />
                              </Tooltip>
                            )}
                          </Box>
                          <Tooltip title={`Status: ${po.status}`} placement="top" arrow>
                            <Box sx={{ flexShrink: 0 }}>
                              <POStatusChip po={po} statusStyle={ss} />
                            </Box>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {/* Col 4: GRN Status */}
                      <TableCell sx={{ ...tdSx, minWidth: 120 }}>
                        <Tooltip title="GRN Status" placement="top" arrow>
                          <Box>
                            <GRNStatusChip po={po} grns={grns} />
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Col 5: Actions */}
                      <TableCell sx={{ ...tdSx, minWidth: 100 }}>
                        <Box sx={{ display: "flex", gap: { xs: 0.25, sm: 0.5, md: 0.75 }, flexWrap: "wrap" }}>
                          {po.status === "Draft" && (
                            <Tooltip title="Edit Draft PO">
                              <IconButton
                                size="small"
                                onClick={() => { setEditingDraftPO(po); setNewPOModalOpen(true); }}
                                sx={{ color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: "6px", width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 }, bgcolor: "#eff6ff", "&:hover": { background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" } }}
                              >
                                <EditOutlinedIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {/* Approve / Reject — shown whenever ANY line still has an
                              open balance, regardless of the PO's overall status
                              label. This covers "one item approved, one still
                              pending" and "partial approval with balance left"
                              the same way, instead of gating on a single status
                              string like the old Pending/Partial Approved split. */}
                          {hasActionableBalance && (
                            <>
                              <Tooltip title={!can.approvePOItems ? "You don't have permission to approve purchase orders" : "Approve items"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleApprove(po)}
                                    disabled={!can.approvePOItems}
                                    sx={{
                                      color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px",
                                      width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 },
                                      "&:hover": { background: !can.approvePOItems ? "transparent" : "#f0fdf4", color: !can.approvePOItems ? "#6b7280" : "#16a34a", borderColor: !can.approvePOItems ? "#e5e7eb" : "#bbf7d0" },
                                      "&:disabled": { opacity: 0.5, color: "#6b7280" },
                                    }}
                                  >
                                    <CheckIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={!can.rejectPOItems ? "You don't have permission to reject purchase orders" : "Reject items"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRejectItems(po)}
                                    disabled={!can.rejectPOItems}
                                    sx={{
                                      color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px",
                                      width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 },
                                      "&:hover": { background: !can.rejectPOItems ? "transparent" : "#fef2f2", color: !can.rejectPOItems ? "#6b7280" : "#dc2626", borderColor: !can.rejectPOItems ? "#e5e7eb" : "#fecaca" },
                                      "&:disabled": { opacity: 0.5, color: "#6b7280" },
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}
                          {(po.status === "Approved" || po.status === "Partial Approved" || po.status === "Partially Received") &&
                            (() => {
                              const existingDraft = grns.find((g) => g.linkedPO === po.id && g.grnType === "draft");
                              const hasShortClose = grns.some((g) => g.linkedPO === po.id && g.grnType === "submitted" && g.isShortClose);
                              const remainingQty = getOpenPOBalance(po);
                              if (existingDraft)
                                return (
                                  <Tooltip title="Edit Draft GRN">
                                    <IconButton size="small" onClick={() => handleEditDraftGRN(po)} sx={{ color: "#9333ea", border: "1px solid #e9d5ff", borderRadius: "6px", width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 }, bgcolor: "#fdf4ff", "&:hover": { background: "#f3e8ff", color: "#7e22ce", borderColor: "#d8b4fe" } }}>
                                      <EditOutlinedIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                                    </IconButton>
                                  </Tooltip>
                                );
                              if (hasShortClose || remainingQty <= 0) return null;
                              return (
                                <Tooltip title={!can.createGRN ? "You don't have permission to create GRN" : `Create GRN (${remainingQty} left)`}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCreateGRN(po)}
                                    disabled={!can.createGRN}
                                    sx={{
                                      color: !can.createGRN ? "#9ca3af" : "#6b7280",
                                      border: `1px solid ${!can.createGRN ? "#e5e7eb" : "#e5e7eb"}`,
                                      borderRadius: "6px",
                                      width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 },
                                      bgcolor: "transparent",
                                      "&:hover": { background: !can.createGRN ? "transparent" : "#f0fdfa", color: !can.createGRN ? "#9ca3af" : "#0d9488", borderColor: !can.createGRN ? "#e5e7eb" : "#99f6e4" },
                                      "&.Mui-disabled": { opacity: 0.5 },
                                    }}
                                  >
                                    <InventoryIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                          {(po.status === "GRN Drafted" || po.status === "GRN Submitted") && (
                            <Tooltip title={po.status === "GRN Drafted" ? "Edit Draft GRN" : "Edit Submitted GRN"}>
                              <IconButton size="small" onClick={() => handleEditDraftGRN(po)} sx={{ color: "#9333ea", border: "1px solid #e9d5ff", borderRadius: "6px", width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 }, bgcolor: "#fdf4ff", "&:hover": { background: "#f3e8ff", color: "#7e22ce", borderColor: "#d8b4fe" } }}>
                                <EditOutlinedIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View PO">
                            <IconButton size="small" onClick={() => handleViewPO(po)} sx={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 }, "&:hover": { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" } }}>
                              <VisibilityIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                            </IconButton>
                          </Tooltip>
                          {grns.some((g) => g.linkedPO === po.id && g.grnType === "submitted") && (
                            <Tooltip title="View GRN Details">
                              <IconButton size="small" onClick={() => handleViewGRN(po)} sx={{ color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 }, bgcolor: "#eff6ff", "&:hover": { background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" } }}>
                                <InventoryIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(po.status === "Approved" || po.status === "Partial Approved") && (
                            <Tooltip title={po.mailSent ? `Mail sent at ${po.mailSentAt || ""}` : "Mail PO"}>
                              <span>
                                <IconButton size="small" onClick={() => handleMailPO(po)} disabled={po.mailSent} sx={{ color: po.mailSent ? "#d1d5db" : "#059669", border: `1px solid ${po.mailSent ? "#e5e7eb" : "#a7f3d0"}`, borderRadius: "6px", width: { xs: 26, sm: 28, md: 28 }, height: { xs: 26, sm: 28, md: 28 }, bgcolor: po.mailSent ? "#f3f4f6" : "#ecfdf5", "&:hover": { background: po.mailSent ? "#f3f4f6" : "#d1fae5", color: po.mailSent ? "#d1d5db" : "#047857", borderColor: po.mailSent ? "#e5e7eb" : "#6ee7b7" }, cursor: po.mailSent ? "not-allowed" : "pointer" }}>
                                  <EmailIcon sx={{ fontSize: { xs: 12, sm: 14, md: 14 } }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ── Modals ── */}
        <POApprovalModal
          open={poApprovalModal.open}
          onClose={() => setPoApprovalModal({ open: false, po: null, mode: "approve" })}
          po={poApprovalModal.po}
          mode={poApprovalModal.mode}
          onConfirm={(updated, mode) => handleApprovalConfirm(updated, mode)}
        />
        <MailPOModal open={mailPOModal.open} onClose={() => setMailPOModal({ open: false, po: null })} po={mailPOModal.po} onConfirm={handleMailPOConfirm} />
        <NewPO
          open={newPOModalOpen}
          onClose={() => { setNewPOModalOpen(false); setEditingDraftPO(null); }}
          onSave={handleSavePO}
          onSaveAsDraft={handleSavePO}
          suppliers={supplierNames}
          editingDraftPO={editingDraftPO}
        />
        <ViewPOModal
          open={viewPOModalOpen}
          onClose={() => setViewPOModalOpen(false)}
          po={selectedPO}
          onSave={(updatedPO) => {
            setPurchaseOrders((prev) => prev.map((po) => (po.id === updatedPO.id ? updatedPO : po)));
            setToast({
              msg: (<span>PO <strong>{updatedPO.id}</strong> updated — {updatedPO.lines} line(s), total <strong>${updatedPO.total.toLocaleString()}</strong></span>),
              type: "success",
            });
            setTimeout(() => setToast(null), 4000);
          }}
        />
        <NewGRNDialog
          open={newGRNModalOpen}
          onClose={() => { setNewGRNModalOpen(false); setSelectedGRNPO(null); setEditingDraftGRN(null); }}
          draftGRN={editingDraftGRN}
          existingGRNs={grns}
          onSave={(grnData) => {
            const isDraft = grnData.grnType === "draft";
            if (editingDraftGRN) {
              updateGRN(editingDraftGRN.id, { ...grnData, id: editingDraftGRN.id });
            } else {
              addGRN(grnData);
            }
            const isShortClose = grnData.isShortClose;
            const grnLabel = isDraft ? "Draft GRN" : isShortClose ? "Short Close" : "GRN Submitted";
            setToast({
              msg: (
                <span>
                  {isDraft ? "GRN saved as draft —" : isShortClose ? "GRN submitted (Short Close) —" : "GRN submitted —"}{" "}
                  <strong>{editingDraftGRN ? editingDraftGRN.id : grnData.id}</strong> linked to <strong>{selectedGRNPO?.id}</strong>. GRN Status updated to <strong>{grnLabel}</strong>.
                </span>
              ),
              type: isDraft ? "info" : isShortClose ? "warning" : "success",
            });
            setTimeout(() => setToast(null), 5000);
            setNewGRNModalOpen(false);
            setSelectedGRNPO(null);
            setEditingDraftGRN(null);
          }}
          nextId={editingDraftGRN ? editingDraftGRN.id : nextGRNId()}
          linkedPO={selectedGRNPO}
        />
        <ViewGRNModal
          open={viewGRNModalOpen}
          onClose={() => { setViewGRNModalOpen(false); setSelectedPOForGRNView(null); }}
          po={selectedPOForGRNView}
          grns={selectedPOForGRNView ? grns.filter((g) => g.linkedPO === selectedPOForGRNView.id && g.grnType === "submitted") : []}
        />

        {/* ── Pagination ── */}
        {filteredPOs.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "right",
              mt: 2.5,
              pt: 1.5,
              pb: 0.75,
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                sx={{
                  minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb",
                  color: currentPage === 1 ? "#d1d5db" : "#374151",
                  "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                  "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" },
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 16 }} />
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
                    borderRadius: "5px", fontSize: 11, fontWeight: 500, minWidth: 28, height: 28,
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
                  minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb",
                  color: currentPage === totalPages ? "#d1d5db" : "#374151",
                  fontSize: 16,
                  "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                  "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  export default PurchaseOrders;