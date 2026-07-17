import { useState } from "react";
import {
  Dialog, DialogContent, Box, Typography, Button,
  IconButton, Checkbox, Chip, TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

const chipStyle = (s) => {
  if (s === "Approved")         return { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" };
  if (s === "Partial Approved") return { bg: "#dbeafe", color: "#2563eb", border: "#93c5fd" };
  if (s === "Rejected")         return { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" };
  if (s === "In PO")            return { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff" };
  return                               { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" };
};

const isActionable = (it) =>
  !it.status || it.status === "Pending" || it.status === "Partial Approved";

export default function ItemApprovalModal({ open, onClose, indent, mode, onConfirm }) {
  const items = indent?.lineItems || indent?.items || [];
  const actionableItems = items.filter(isActionable);

  const remainingQty = (it) => {
    if (!it) return 0;
    const req = Number(it.qtyReq || it.qty || 1);
    const alreadyApproved = Number(it.approvedQty || 0);
    return req - alreadyApproved;
  };

  const [selected, setSelected] = useState(() =>
    actionableItems.map((it) => it.id ?? it.itemName)
  );
  const [approvedQty, setApprovedQty] = useState(() => {
    const init = {};
    actionableItems.forEach((it) => {
      init[it.id ?? it.itemName] = remainingQty(it);
    });
    return init;
  });
  const [reason, setReason] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const isApprove    = mode === "approve";
  const actionLabel  = isApprove ? "Approve" : "Reject";
  const actionColor  = isApprove ? "#16a34a" : "#dc2626";
  const actionBg     = isApprove ? "#f0fdf4"  : "#fef2f2";
  const actionBorder = isApprove ? "#bbf7d0"  : "#fecaca";

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () => {
    const allIds = actionableItems.map((it) => it.id ?? it.itemName);
    setSelected(selected.length === allIds.length ? [] : allIds);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  const handleConfirm = () => {
    setSubmitted(true);

    if (isApprove) {
      const missingReason = selected.some((id) => {
        const item = actionableItems.find((it) => (it.id ?? it.itemName) === id);
        if (!item) return false;
        const remQty = remainingQty(item);
        const appQty = approvedQty[id] ?? remQty;
        return Number(appQty) < remQty && !reason[id]?.trim();
      });
      if (missingReason) return;
    }

    if (!isApprove) {
      const missingReason = selected.some((id) => !reason[id]?.trim());
      if (missingReason) return;
    }

    const payload = selected.map((id) => {
      const item = actionableItems.find((it) => (it.id ?? it.itemName) === id);
      if (!item) return null;
      const remQty = remainingQty(item);
      const appQty = isApprove ? (approvedQty[id] ?? remQty) : 0;
      const alreadyApproved = Number(item.approvedQty || 0);
      return {
        id,
        approvedQty: isApprove ? alreadyApproved + Number(appQty) : 0,
        reason: reason[id] || item.reason || "",
      };
    }).filter(Boolean);

    onConfirm(payload, mode);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      <Box sx={{
        px: "14px", pt: "12px", pb: "10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #f3f4f6", bgcolor: "#fff", flexShrink: 0,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Box sx={{
            width: 27, height: 27, borderRadius: "7px",
            bgcolor: isApprove ? "#f0fdf4" : "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {isApprove
              ? <CheckCircleOutlineIcon sx={{ fontSize: 15, color: "#16a34a" }} />
              : <CancelOutlinedIcon    sx={{ fontSize: 15, color: "#dc2626" }} />
            }
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
              {actionLabel} Items — {indent?.indentNo}
            </Typography>
           
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClose}
          sx={{
            color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "6px",
            width: 24, height: 24, "&:hover": { bgcolor: "#f3f4f6" }, "&:focus": { outline: "none" },
          }}>
          <CloseIcon sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      {/* ── Scrollable body ── */}
      <DialogContent sx={{
        px: "14px", py: "10px", overflowY: "auto", flex: 1,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
        scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent",
      }}>
        {actionableItems.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
              No pending items to {actionLabel.toLowerCase()}.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Select All */}
            <Box sx={{
              display: "flex", alignItems: "center", gap: "6px",
              mb: "7px", pb: "7px", borderBottom: "1px solid #f3f4f6",
            }}>
              <Checkbox
                size="small"
                checked={selected.length === actionableItems.length && actionableItems.length > 0}
                indeterminate={selected.length > 0 && selected.length < actionableItems.length}
                onChange={toggleAll}
                sx={{ p: 0, color: actionColor, "&.Mui-checked": { color: actionColor } }}
              />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                Select All ({actionableItems.length} item{actionableItems.length !== 1 ? "s" : ""})
              </Typography>
            </Box>

            {/* Column headers */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: isApprove
                ? "28px 20px 1fr 70px 70px 1fr"
                : "28px 20px 1fr 70px",
              gap: "5px", px: "9px", mb: "4px", alignItems: "center",
            }}>
              <Box /><Box />
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Item
              </Typography>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>
                {isApprove ? "Req" : "Req Qty"}
              </Typography>
              {isApprove && (
                <>
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>
                    Appr
                  </Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Reason 
                  </Typography>
                </>
              )}
            </Box>

            {/* Item rows */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {items.map((item) => {
                const itemId     = item.id ?? item.itemName;
                const actionable = isActionable(item);
                const isChecked  = selected.includes(itemId);
                const cs         = chipStyle(item.status || "Pending");
                const reqQty     = Number(item.qtyReq || item.qty || 1);
                const alreadyApp = Number(item.approvedQty || 0);
                const remQty     = remainingQty(item);
                const appQty     = approvedQty[itemId] ?? remQty;
                const isPartial  = isApprove && isChecked && actionable && Number(appQty) < remQty;
                const isPartialItem = item.status === "Partial Approved";
                const missingRejectReason = !isApprove && submitted && isChecked && actionable && !reason[itemId]?.trim();

                return (
                  <Box key={itemId}>
                    {/* ── Item row ── */}
                    <Box
                      onClick={() => actionable && toggle(itemId)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: isApprove
                          ? "28px 20px 1fr 70px 70px 1fr"
                          : "28px 20px 1fr 70px",
                        gap: "5px", alignItems: "center",
                        p: "6px 9px",
                        borderRadius: isChecked && actionable && !isApprove ? "6px 6px 0 0" : "6px",
                        border: `1px solid ${isChecked && actionable ? actionBorder : "#e5e7eb"}`,
                        borderBottom: isChecked && actionable && !isApprove ? "none" : undefined,
                        bgcolor: isChecked && actionable ? actionBg : "#f9fafb",
                        cursor: actionable ? "pointer" : "default",
                        opacity: actionable ? 1 : 0.55,
                        transition: "all 0.12s",
                        "&:hover": actionable ? { borderColor: actionBorder, bgcolor: actionBg } : {},
                      }}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        size="small"
                        checked={isChecked && actionable}
                        disabled={!actionable}
                        onChange={() => actionable && toggle(itemId)}
                        sx={{ p: 0, color: actionColor, "&.Mui-checked": { color: actionColor }, cursor: actionable ? "pointer" : "default" }}
                      />

                      {/* Row number */}
                      <Box sx={{
                        width: 17, height: 17, borderRadius: "50%", bgcolor: "#e5e7eb",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#6b7280" }}>
                          {items.indexOf(item) + 1}
                        </Typography>
                      </Box>

                      {/* Item name */}
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#111827" }}>
                            {item.itemName || item.item || item.description || "—"}
                          </Typography>
                          {isPartialItem && (
                            <Chip label="Partial" size="small" sx={{
                              bgcolor: "#dbeafe", color: "#2563eb", border: "1px solid #93c5fd",
                              fontWeight: 700, fontSize: 9, height: 14,
                            }} />
                          )}
                          {!actionable && (
                            <Chip label={item.status} size="small" sx={{
                              bgcolor: cs.bg, color: cs.color,
                              border: `1px solid ${cs.border}`, fontWeight: 600, fontSize: 9, height: 14,
                            }} />
                          )}
                        </Box>
                       
                      </Box>

                      {/* Qty */}
                      <Box sx={{ textAlign: "center" }}>
                        <Typography sx={{ fontSize: 9, color: "#9ca3af", mb: "1px" }}>
                          {isPartialItem ? "Remaining" : "Required"}
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#374151" }}>
                          {isPartialItem ? remQty : reqQty}
                        </Typography>
                      </Box>

                      {isApprove && (
                        <>
                          <Box sx={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <Typography sx={{ fontSize: 9, color: "#9ca3af", mb: "1px" }}>Approve</Typography>
                            <TextField
                              size="small" type="number"
                              value={appQty === 0 ? "" : appQty}
                              disabled={!isChecked || !actionable}
                              placeholder={String(remQty)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  setApprovedQty((prev) => ({ ...prev, [itemId]: "" }));
                                  return;
                                }
                                const val = Math.max(0, Math.min(Number(raw), remQty));
                                setApprovedQty((prev) => ({ ...prev, [itemId]: val }));
                              }}
                              onBlur={() => {
                                const cur = approvedQty[itemId];
                                if (cur === "" || cur == null) {
                                  setApprovedQty((prev) => ({ ...prev, [itemId]: remQty }));
                                }
                              }}
                              inputProps={{ min: 0, max: remQty, style: { textAlign: "center", padding: "3px 4px", fontSize: 12, fontWeight: 700 } }}
                              sx={{
                                width: "55px",
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "5px",
                                  bgcolor: isChecked && actionable ? "#fff" : "#f3f4f6",
                                  "& fieldset": { borderColor: isPartial ? "#f59e0b" : "#d1d5db" },
                                  "&:hover fieldset": { borderColor: isPartial ? "#d97706" : "#9ca3af" },
                                  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
                                },
                                "& input[type=number]": { MozAppearance: "textfield" },
                                "& input::-webkit-outer-spin-button": { WebkitAppearance: "none" },
                                "& input::-webkit-inner-spin-button": { WebkitAppearance: "none" },
                              }}
                            />
                          </Box>

                          <Box onClick={(e) => e.stopPropagation()}>
                            <TextField
                              size="small" fullWidth
                              placeholder={isPartial ? "Reason required *" : "Reason (optional)"}
                              value={reason[itemId] || ""}
                              disabled={!isChecked || !actionable}
                              onChange={(e) => setReason((prev) => ({ ...prev, [itemId]: e.target.value }))}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  fontSize: 11, borderRadius: "5px",
                                  bgcolor: isChecked && actionable ? "#fff" : "#f3f4f6",
                                  "& fieldset": {
                                    borderColor: submitted && isChecked && actionable && isPartial && !reason[itemId]?.trim()
                                      ? "#ef4444" : "#d1d5db",
                                  },
                                  "&:hover fieldset": { borderColor: "#9ca3af" },
                                  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
                                },
                                "& .MuiInputBase-input": { py: "5px", px: "8px" },
                              }}
                            />
                            {submitted && isChecked && actionable && isPartial && !reason[itemId]?.trim() && (
                              <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "1px" }}>
                                Required for partial approval
                              </Typography>
                            )}
                          </Box>
                        </>
                      )}
                    </Box>

                    {/* ── Reject reason — full-width below the row ── */}
                    {!isApprove && isChecked && actionable && (
                      <Box
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          px: "9px", py: "7px",
                          border: `1px solid ${missingRejectReason ? "#ef4444" : actionBorder}`,
                          borderTop: "1px dashed #fca5a5",
                          borderRadius: "0 0 6px 6px",
                          bgcolor: "#fff5f5",
                          display: "flex", alignItems: "flex-start", gap: "8px",
                        }}
                      >
                        <CancelOutlinedIcon sx={{ fontSize: 13, color: "#dc2626", mt: "6px", flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#dc2626", mb: "4px" }}>
                            Rejection reason for <em>{item.itemName || item.item || item.description}</em> *
                          </Typography>
                          <TextField
                            size="small" fullWidth multiline rows={1}
                            placeholder="e.g. Item not required, duplicate request, budget constraint..."
                            value={reason[itemId] || ""}
                            onChange={(e) => setReason((prev) => ({ ...prev, [itemId]: e.target.value }))}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                fontSize: 12, borderRadius: "5px", bgcolor: "#fff",
                                "& fieldset": {
                                  borderColor: missingRejectReason ? "#ef4444" : "#fca5a5",
                                },
                                "&:hover fieldset": { borderColor: "#f87171" },
                                "&.Mui-focused fieldset": { borderColor: "#ef4444", borderWidth: "1.5px" },
                              },
                              "& .MuiInputBase-input": { py: "6px", px: "10px" },
                            }}
                          />
                          {missingRejectReason && (
                            <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "2px", fontWeight: 600 }}>
                              Rejection reason is required
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}

                
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>

      {/* ── Footer ── */}
      <Box sx={{
        px: "14px", py: "10px", borderTop: "1px solid #f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        bgcolor: "#fff", flexShrink: 0,
      }}>
        <Box>
       
          {isApprove && submitted && selected.some((id) => {
            const item = actionableItems.find((it) => (it.id ?? it.itemName) === id);
            if (!item) return false;
            const remQty = remainingQty(item);
            const appQty = approvedQty[id] ?? remQty;
            return Number(appQty) < remQty && !reason[id]?.trim();
          }) && (
            <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "1px" }}>
              Reason required for partial approvals
            </Typography>
          )}
          {!isApprove && submitted && selected.some((id) => !reason[id]?.trim()) && (
            <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "1px" }}>
              Rejection reason required for all selected items
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Button onClick={handleClose} sx={{
            fontSize: 11.5, fontWeight: 600, color: "#374151", textTransform: "none",
            borderRadius: "6px", px: "14px", py: "6px",
            border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" },
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            sx={{
              fontSize: 11.5, fontWeight: 600, textTransform: "none",
              borderRadius: "6px", px: "14px", py: "6px",
              bgcolor: isApprove ? "#16a34a" : "#dc2626", color: "#fff",
              boxShadow: `0 2px 8px ${isApprove ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
              "&:hover": { bgcolor: isApprove ? "#15803d" : "#b91c1c" },
              "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
            }}
          >
            {actionLabel} {selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}