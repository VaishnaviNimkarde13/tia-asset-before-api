import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  FormHelperText,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useInventory } from "../../contexts/InventoryContext";
import { useAuth } from "../../contexts/Authcontext";

const generateIssueNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ISS-${year}-${randomNum}`;
};

const loadDepartments = () => {
  try {
    const saved = localStorage.getItem("tia_departments");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0)
        return parsed.map((d) => d.name).filter(Boolean);
    }
  } catch {
    /* ignore */
  }
  return [
    "Central Store",
    "Ward / Department Store",
    "Pharmacy",
    "Operation Theater",
    "Laboratory",
    "Clinic / OPD",
  ];
};

const loadLocations = loadDepartments;

function FieldLabel({ children, required }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: "#6b7280",
        letterSpacing: "0.04em",
        mb: "6px",
        textTransform: "uppercase",
      }}
    >
      {children}
      {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </Typography>
  );
}

const inputSx = (hasError = false) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "8px",
    background: "#f9fafb",
    "& fieldset": { borderColor: hasError ? "#ef4444" : "#e5e7eb" },
    "&:hover fieldset": { borderColor: hasError ? "#ef4444" : "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: hasError ? "#ef4444" : "#2563eb" },
  },
});

const disabledInputSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "8px",
    background: "#f3f4f6",
    "& fieldset": { borderColor: "#e5e7eb" },
  },
  "& .MuiInputBase-input": { color: "#374151" },
};

const selectSx = (hasError = false) => ({
  fontSize: 13,
  borderRadius: "8px",
  background: "#f9fafb",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: hasError ? "#ef4444" : "#e5e7eb",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: hasError ? "#ef4444" : "#d1d5db",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: hasError ? "#ef4444" : "#2563eb",
  },
});

const selectErrSx = {
  ...selectSx(true),
  background: "#fff5f5",
};

// Styling for the item Autocomplete's input, mirroring selectSx/selectErrSx
// so it looks identical to the old Select in both normal and error states.
// Also forces every outline state (default/hover/focus) to our palette so
// the browser/MUI default black focus ring never shows through.
// Height is pinned to 34px to match the Lot/Avail fields and the Qty row
// below, so the whole item card lines up into clean, compact single rows.
const itemAutocompleteSx = (hasError = false) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 12.5,
    borderRadius: "8px",
    background: hasError ? "#fff5f5" : "#f9fafb",
    padding: "0 8px !important",
    height: "34px",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: hasError ? "#ef4444" : "#e5e7eb",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: hasError ? "#ef4444" : "#d1d5db",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: `${hasError ? "#ef4444" : "#2563eb"} !important`,
      borderWidth: "1.5px",
    },
  },
  "& .MuiAutocomplete-input": {
    padding: "0 4px !important",
  },
  "& .MuiAutocomplete-endAdornment": {
    color: "#9ca3af",
  },
  "& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator": {
    color: "#9ca3af",
    "&:hover": { color: "#6b7280", background: "transparent" },
  },
});

// Shared styling for the small read-only Lot No. / Available boxes so both
// stay compact and match each other exactly. Pinned to the same 34px height
// as the item Autocomplete and the Qty field for a clean single-row layout.
const compactReadonlySx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 11.5,
    borderRadius: "8px",
    background: "#f3f4f6",
    height: "34px",
    "& fieldset": { borderColor: "#e5e7eb" },
  },
  "& input": {
    textAlign: "center",
    color: "#374151",
    fontWeight: 600,
    padding: "0 4px",
  },
};

const whiteTooltipSx = {
  tooltip: {
    sx: {
      bgcolor: "#fff",
      color: "#374151",
      fontSize: 12,
      fontWeight: 500,
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      px: "10px",
      py: "6px",
    },
  },
  arrow: {
    sx: {
      color: "#fff",
      "&::before": {
        border: "1px solid #e5e7eb",
      },
    },
  },
};

// Returns the lots available for a given inventory item, normalizing a few
// possible shapes the inventory data might come in (lots / batches / lotDetails).
function getLotsForItem(data) {
  if (!data) return [];
  const raw = data.lots || data.batches || data.lotDetails || [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => ({
      lotNo: l.lotNo ?? l.lot ?? l.batchNo ?? l.id,
      qty: l.qty ?? l.quantity ?? 0,
      expiry: l.expiry ?? l.expiryDate ?? null,
    }))
    .filter((l) => l.lotNo);
}

// Resolves the lot number to auto-fill for an item, checking a multi-lot
// array first, then falling back to common flat field-name variants.
function getAutoLot(data) {
  const lots = getLotsForItem(data);
  if (lots.length > 0) return lots[0].lotNo;
  return (
    data?.lotNo ??
    data?.lot_no ??
    data?.lotNumber ??
    data?.lot ??
    data?.batchNo ??
    data?.batch_no ??
    ""
  );
}

// Returns the Issue UOM -> Base UOM conversion factor for an item.
// e.g. if 1 Box = 100 Pairs, this returns 100.
function getConversionFactor(data) {
  return data?.issueToBaseConversion || 1;
}

const makeRow = () => ({
  id: Date.now() + Math.random(),
  item: "",
  lot: "",
  qty: "",
});

// Column widths shared between the header row and every item row so the
// two stay perfectly aligned. Everything — Item, Lot, Avail, UOM, Qty, and
// the delete button — lives in ONE row per item. Item gets a capped flexible
// width and truncates with an ellipsis (full name on hover) so it can't blow
// out the layout; the rest are fixed, narrow columns sized to their content.
const ROW_COLUMNS = {
  xs: "minmax(0,1fr) 42px 38px 34px 56px 26px",
  sm: "minmax(0,1fr) 66px 50px 46px 68px 28px",
};

export default function IssuestockModal({
  open,
  onClose,
  prefillItem = null,
  onPending,
}) {
  const navigate = useNavigate();
  const { items: inventoryItems } = useInventory();
  const { currentUser } = useAuth();
  const todayISO = new Date().toISOString().split("T")[0];

  const [issueNumber, setIssueNumber] = useState("");
  const [issueType, setIssueType] = useState("Ward Requisition");
  const [issueFrom, setIssueFrom] = useState("");
  const [issueTo, setIssueTo] = useState("");
  const [patientId, setPatientId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO);
  const [items, setItems] = useState([
    prefillItem
      ? {
          id: Date.now(),
          item: prefillItem,
          lot: getAutoLot(
            inventoryItems.find((a) => a.id === prefillItem)
          ),
          qty: "",
        }
      : makeRow(),
  ]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ issueFrom: false, issueTo: false });
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // Get current user's name for Requested By field
  const requestedByValue =
    currentUser?.displayName ||
    currentUser?.name ||
    currentUser?.email ||
    currentUser?.role ||
    "";

  const locationOptions = loadLocations();
  const departmentOptions = loadDepartments();

  useEffect(() => {
    if (open) {
      setIssueNumber(generateIssueNumber());
      setTouched({ issueFrom: false, issueTo: false });
    }
  }, [open]);

  const getItemData = (itemId) => inventoryItems.find((a) => a.id === itemId);

  const issueValue = items.reduce((sum, row) => {
    const d = getItemData(row.item);
    const qty = parseFloat(row.qty) || 0;
    const unitCost = d?.unitCost ?? d?.cost ?? 0;
    return d && qty > 0 ? sum + qty * unitCost : sum;
  }, 0);

  const addItem = () => setItems((p) => [...p, makeRow()]);
  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems((p) => p.filter((r) => r.id !== id));
    setErrors((e) => {
      const n = { ...e };
      delete n[`item_${id}`];
      delete n[`qty_${id}`];
      return n;
    });
  };
  const updateItem = (id, field, value) => {
    setItems((p) =>
      p.map((r) => {
        if (r.id !== id) return r;
        // Changing the item auto-populates the lot from that item's data.
        if (field === "item") {
          const data = inventoryItems.find((a) => a.id === value);
          return { ...r, item: value, lot: getAutoLot(data) };
        }
        return { ...r, [field]: value };
      })
    );
    setErrors((e) => {
      const n = { ...e };
      delete n[`${field}_${id}`];
      return n;
    });
  };

  const validate = () => {
    const errs = {};
    if (!issueFrom) errs.issueFrom = true;
    if (!issueTo) errs.issueTo = true;
    items.forEach((row) => {
      if (!row.item) errs[`item_${row.id}`] = "Select an item";
      const qty = parseFloat(row.qty);
      const data = getItemData(row.item);

      if (!row.qty || isNaN(qty) || qty <= 0) {
        errs[`qty_${row.id}`] = "Enter qty";
      } else if (data) {
        // Available stock (data.qty) is always in BASE UOM. The entered qty
        // is in ISSUE UOM, so convert before comparing, otherwise a value
        // like "100 Box" (=10,000 Pairs) could pass against an available
        // stock of "8,500 Pairs".
        const conversionFactor = getConversionFactor(data);
        const qtyInBaseUom = qty * conversionFactor;

        if (qtyInBaseUom > data.qty) {
          const issueUom = data?.issueUom || data?.uom || "EA";
          const baseUom = data?.uom || "EA";
          if (conversionFactor !== 1) {
            const maxIssueQty = Math.floor(data.qty / conversionFactor);
            errs[`qty_${row.id}`] =
              `Max ${maxIssueQty} ${issueUom} (${data.qty} ${baseUom} avail.)`;
          } else {
            errs[`qty_${row.id}`] = `Max ${data.qty}`;
          }
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const reset = () => {
    setIssueNumber(generateIssueNumber());
    setIssueType("Ward Requisition");
    setIssueFrom("");
    setIssueTo("");
    setPatientId("");
    setRemarks("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setItems([makeRow()]);
    setErrors({});
    setTouched({ issueFrom: false, issueTo: false });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const buildPayload = (status) => ({
    issueNumber,
    issueType,
    issueFrom,
    issueTo,
    requestedBy: requestedByValue,
    authorisedBy: "S. Anderson",
    issueDate,
    patientId,
    remarks,
    items: items.map((r) => {
      const d = getItemData(r.item);
      const unitCost = d?.unitCost ?? d?.cost ?? 0;
      return {
        item: r.item,
        name: d?.name || r.item,
        lotNo: r.lot || undefined,
        qty: parseFloat(r.qty),
        unitCost: unitCost,
      };
    }),
    totalValue: issueValue,
    status,
  });

  const handleIssueRequest = () => {
    setTouched({ issueFrom: true, issueTo: true });
    if (!validate()) {
      setSnack({
        open: true,
        msg: "Please fix the highlighted fields.",
        severity: "error",
      });
      return;
    }
    const payload = buildPayload("Pending Approval");
    onPending?.(payload);
    reset();
    onClose();
  };

  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            overflow: "hidden",
            maxHeight: { xs: "90vh", md: "88vh" },
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            pt: { xs: 1.5, sm: 2, md: 2.5 },
            pb: { xs: 1, sm: 1.5, md: 2 },
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 1.5, md: 3 },
            }}
          >
            <Box
              sx={{
                width: { xs: 32, md: 38 },
                height: { xs: 32, md: 38 },
                borderRadius: "10px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AssignmentIcon
                sx={{ fontSize: { xs: 18, md: 20 }, color: "#2563eb" }}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: 14, sm: 15, md: 16 },
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Issue Stock Request
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: "#9ca3af",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              width: { xs: 28, md: 30 },
              height: { xs: 28, md: 30 },
              flexShrink: 0,
              "&:hover": { background: "#f3f4f6" },
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: 14, md: 15 } }} />
          </IconButton>
        </Box>

        {/* ── Required fields note ── */}
        <Box sx={{ px: "24px", pt: "12px", pb: 0 }}>
          <Typography
            sx={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}
          >
            <span style={{ color: "#ef4444" }}>*</span> Required fields
          </Typography>
        </Box>

        {/* ── Body ── */}
        <DialogContent
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            py: { xs: 1.5, sm: 2, md: 2.5 },
            overflowY: "auto",
            maxHeight: { xs: "calc(90vh - 140px)", md: "70vh" },
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": {
              background: "#d1d5db",
              borderRadius: 4,
            },
          }}
        >
          {/* Row 1 — Issue # + Type */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: { xs: 1, sm: 1.5, md: 2 },
              mb: { xs: 1, sm: 1.5, md: 2 },
            }}
          >
            <Box>
              <FieldLabel>Issue Number</FieldLabel>
              <TextField
                fullWidth
                size="small"
                value={issueNumber}
                disabled
                sx={disabledInputSx}
              />
            </Box>
            <Box>
              <FieldLabel required>Issue Type</FieldLabel>
              <FormControl fullWidth size="small">
                <Select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  sx={selectSx(false)}
                >
                  {[
                    "Ward Requisition",
                    "OT Request",
                    "Emergency Issue",
                    "Transfer",
                    "Wastage/Disposal",
                    "Patient Dispensing",
                    "Return to Supplier",
                  ].map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: { xs: 1, sm: 1.5, md: 2 },
              mb: { xs: 1, sm: 1.5, md: 2 },
            }}
          >
            {/* Issue From — store locations */}
            <Box>
              <FieldLabel required>Issue From (Store)</FieldLabel>
              <FormControl fullWidth size="small" error={!!errors.issueFrom}>
                <Select
                  value={issueFrom}
                  displayEmpty
                  onBlur={handleBlur("issueFrom")}
                  onChange={(e) => {
                    setIssueFrom(e.target.value);
                    setErrors((er) => ({ ...er, issueFrom: false }));
                  }}
                  sx={errors.issueFrom ? selectErrSx : selectSx(false)}
                >
                  <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>
                    Select store
                  </MenuItem>
                  {departmentOptions.map((l) => (
                    <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>
                      {l}
                    </MenuItem>
                  ))}
                </Select>
                {errors.issueFrom && (
                  <FormHelperText
                    sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                  >
                    Issue From is required
                  </FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Issue To — departments */}
            <Box>
              <FieldLabel required>Issue To (Dept / Ward)</FieldLabel>
              <FormControl fullWidth size="small" error={!!errors.issueTo}>
                <Select
                  value={issueTo}
                  displayEmpty
                  onBlur={handleBlur("issueTo")}
                  onChange={(e) => {
                    setIssueTo(e.target.value);
                    setErrors((er) => ({ ...er, issueTo: false }));
                  }}
                  sx={errors.issueTo ? selectErrSx : selectSx(false)}
                >
                  <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>
                    Select dept
                  </MenuItem>
                  {departmentOptions.map((d) => (
                    <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
                {errors.issueTo && (
                  <FormHelperText
                    sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                  >
                    Issue To is required
                  </FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>

          {/* Row 3 — Requested By + Authorised By */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: { xs: 1, sm: 1.5, md: 2 },
              mb: { xs: 1, sm: 1.5, md: 2 },
            }}
          >
            <Box>
              <FieldLabel>Requested By</FieldLabel>
              <TextField
                fullWidth
                size="small"
                value={requestedByValue}
                disabled
                sx={disabledInputSx}
                inputProps={{ style: { color: "#374151", fontSize: 13 } }}
              />
            </Box>
            <Box>
              <FieldLabel>Authorised By</FieldLabel>
              <TextField
                fullWidth
                size="small"
                value="S. Anderson"
                disabled
                sx={disabledInputSx}
              />
            </Box>
          </Box>

          {/* Row 4 — Date + Patient ID */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: { xs: 1, sm: 1.5, md: 2 },
              mb: { xs: 1.5, sm: 2, md: 2.5 },
            }}
          >
            <Box>
              <FieldLabel>Date</FieldLabel>
              <TextField
                fullWidth
                size="small"
                value={issueDate}
                disabled
                sx={disabledInputSx}
                inputProps={{ style: { color: "#374151", fontSize: 13 } }}
              />
            </Box>
            <Box>
              <FieldLabel>Patient ID (Optional)</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="PT-2026-00000"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                sx={inputSx(false)}
              />
            </Box>
          </Box>

          {/* ── Items to Issue ── */}
          <Box sx={{ mb: { xs: 1, sm: 1.5, md: 2 } }}>
            <Typography
              sx={{
                fontSize: { xs: 11, sm: 11.5, md: 12 },
                fontWeight: 700,
                color: "#2563eb",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                mb: { xs: 1, sm: 1.5, md: 1.5 },
              }}
            >
              Items to Issue
            </Typography>

            {/* Column headers — Item / Lot / Avail / UOM / Qty (Delete has no label) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: ROW_COLUMNS,
                gap: { xs: 0.5, sm: 0.75 },
                mb: "6px",
                px: "2px",
              }}
            >
              {["ITEM", "LOT", "AVAIL.", "UOM", "QTY", ""].map((h, i) => (
                <Typography
                  key={i}
                  sx={{
                    fontSize: { xs: 8.5, sm: 9.5 },
                    fontWeight: 600,
                    color: "#9ca3af",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    textAlign: h === "ITEM" ? "left" : "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: { xs: 0.75, sm: 1, md: 1 },
              }}
            >
              {items.map((row) => {
                const data = getItemData(row.item);
                const itemErr = errors[`item_${row.id}`];
                const qtyErr = errors[`qty_${row.id}`];

                const qty = parseFloat(row.qty) || 0;
                const issueUom = data?.issueUom || data?.uom || "EA";
                const baseUom = data?.uom || "EA";
                const conversionFactor = getConversionFactor(data);
                const convertedQty = qty * conversionFactor;
                const conversionDisplay =
                  qty > 0 && issueUom !== baseUom
                    ? `${qty} ${issueUom} = ${convertedQty} ${baseUom}`
                    : "";

                // Live over-stock check (independent of submit-time errors)
                const isOverStock =
                  qty > 0 && data && convertedQty > data.qty;

                const maxIssueQty =
                  data && conversionFactor
                    ? Math.floor(data.qty / conversionFactor)
                    : undefined;

                // Currently selected item object for the Autocomplete (or
                // null if nothing selected yet / value no longer exists).
                const selectedItemOption =
                  inventoryItems.find((a) => a.id === row.item) || null;

                return (
                  <Box key={row.id}>
                    <Box
                      sx={{
                        p: "6px 8px",
                        borderRadius: "10px",
                        border: `1px solid ${isOverStock ? "#fca5a5" : "#e5e7eb"}`,
                        bgcolor: isOverStock ? "#fff5f5" : "#fff",
                        "&:hover": {
                          borderColor: isOverStock ? "#f87171" : "#a7f3d0",
                          bgcolor: isOverStock ? "#fff5f5" : "#ecfdf5",
                        },
                        transition: "all 0.15s",
                      }}
                    >
                      {/* Single row: Item / Lot / Avail / UOM / Qty / Delete — everything inline */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: ROW_COLUMNS,
                          gap: { xs: 0.5, sm: 0.75 },
                          alignItems: "center",
                        }}
                      >
                        {/* Item select — type-to-search Autocomplete, capped width + ellipsis */}
                        <FormControl
                          fullWidth
                          size="small"
                          error={!!itemErr}
                          sx={{ minWidth: 0 }}
                        >
                          <Autocomplete
                            size="small"
                            disablePortal
                            options={inventoryItems}
                            value={selectedItemOption}
                            isOptionEqualToValue={(opt, val) =>
                              opt.id === val?.id
                            }
                            getOptionLabel={(opt) => opt?.name || ""}
                            onChange={(_, newValue) =>
                              updateItem(
                                row.id,
                                "item",
                                newValue ? newValue.id : ""
                              )
                            }
                            // Search across name, code/sku, and category too,
                            // not just the visible label.
                            filterOptions={(options, { inputValue }) => {
                              const q = inputValue.trim().toLowerCase();
                              if (!q) return options;
                              return options.filter((opt) =>
                                [opt.name, opt.code, opt.sku, opt.category]
                                  .filter(Boolean)
                                  .some((f) =>
                                    String(f).toLowerCase().includes(q)
                                  )
                              );
                            }}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box
                                  sx={{ display: "flex", flexDirection: "column" }}
                                >
                                  <Typography sx={{ fontSize: 12.5 }}>
                                    {option.name}
                                  </Typography>
                                  {(option.code || option.sku) && (
                                    <Typography
                                      sx={{ fontSize: 10.5, color: "#9ca3af" }}
                                    >
                                      {option.code || option.sku}
                                    </Typography>
                                  )}
                                </Box>
                              </li>
                            )}
                            renderInput={(params) => (
                              <Tooltip
                                title={selectedItemOption?.name || ""}
                                arrow
                                slotProps={whiteTooltipSx}
                              >
                                <TextField
                                  {...params}
                                  placeholder="Search item..."
                                  sx={itemAutocompleteSx(!!itemErr)}
                                />
                              </Tooltip>
                            )}
                            ListboxProps={{
                              sx: {
                                maxHeight: 260,
                                "&::-webkit-scrollbar": { width: 6 },
                                "&::-webkit-scrollbar-track": {
                                  background: "transparent",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                  background: "#d1d5db",
                                  borderRadius: 10,
                                },
                                "&::-webkit-scrollbar-thumb:hover": {
                                  background: "#9ca3af",
                                },
                                scrollbarWidth: "thin",
                                scrollbarColor: "#d1d5db transparent",
                              },
                            }}
                            noOptionsText="No items found"
                          />
                        </FormControl>

                        {/* Lot No (auto-populated, read-only) — compact */}
                        <Tooltip
                          title={row.item ? row.lot || "—" : ""}
                          arrow
                          slotProps={whiteTooltipSx}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            value={row.item ? row.lot || "—" : ""}
                            disabled
                            sx={compactReadonlySx}
                          />
                        </Tooltip>

                        {/* Available — compact */}
                        <TextField
                          fullWidth
                          size="small"
                          value={data ? data.qty : ""}
                          disabled
                          sx={compactReadonlySx}
                        />

                        {/* Issue UOM (read-only badge) */}
                        <Tooltip
                          title={
                            conversionFactor !== 1
                              ? `1 ${issueUom} = ${conversionFactor} ${baseUom}`
                              : ""
                          }
                          arrow
                          slotProps={whiteTooltipSx}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "34px",
                              px: "2px",
                              borderRadius: "6px",
                              bgcolor: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              overflow: "hidden",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: "#16a34a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {issueUom}
                            </Typography>
                          </Box>
                        </Tooltip>

                        {/* Qty — shows its error/conversion hint as a small
                            absolutely-positioned line underneath so it never
                            pushes the row out of alignment. */}
                        <Box sx={{ position: "relative" }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Qty"
                            type="number"
                            value={row.qty}
                            onChange={(e) =>
                              updateItem(row.id, "qty", e.target.value)
                            }
                            inputProps={{ min: 0, max: maxIssueQty }}
                            error={!!qtyErr || isOverStock}
                            sx={{
                              "& input[type=number]": {
                                MozAppearance: "textfield",
                              },
                              "& input[type=number]::-webkit-outer-spin-button":
                                {
                                  WebkitAppearance: "none",
                                  margin: 0,
                                },
                              "& input[type=number]::-webkit-inner-spin-button":
                                {
                                  WebkitAppearance: "none",
                                  margin: 0,
                                },
                              "& .MuiOutlinedInput-root": {
                                fontSize: 12.5,
                                borderRadius: "8px",
                                height: "34px",
                                background:
                                  qtyErr || isOverStock
                                    ? "#fff5f5"
                                    : "#f9fafb",
                                "& fieldset": {
                                  borderColor:
                                    qtyErr || isOverStock
                                      ? "#fca5a5"
                                      : "#e5e7eb",
                                },
                                "&:hover fieldset": {
                                  borderColor:
                                    qtyErr || isOverStock
                                      ? "#f87171"
                                      : "#d1d5db",
                                },
                              },
                              "& input": {
                                py: "7px",
                                px: "4px",
                                textAlign: "center",
                              },
                            }}
                          />
                          {(qtyErr || isOverStock) && (
                            <Typography
                              sx={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                mt: "2px",
                                fontSize: 9.5,
                                fontWeight: 600,
                                color: "#ef4444",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                textAlign: "center",
                              }}
                            >
                              {qtyErr ||
                                (conversionFactor !== 1
                                  ? `Max ${maxIssueQty}`
                                  : `Max ${data?.qty}`)}
                            </Typography>
                          )}
                        </Box>

                        {/* Delete */}
                        <IconButton
                          size="small"
                          onClick={() => removeItem(row.id)}
                          disabled={items.length === 1}
                          sx={{
                            color: "#16a34a",
                            border: "1px solid #a7f3d0",
                            borderRadius: "6px",
                            width: 26,
                            height: 26,
                            "&:hover": { background: "#ecfdf5" },
                            "&.Mui-disabled": {
                              color: "#d1d5db",
                              borderColor: "#e5e7eb",
                            },
                          }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>

                      {/* Item-not-selected error, shown only when relevant */}
                      {itemErr && (
                        <Typography
                          sx={{
                            color: "#ef4444",
                            fontSize: 10,
                            mt: "3px",
                            ml: "2px",
                          }}
                        >
                          {itemErr}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Button
              onClick={addItem}
              startIcon={<AddIcon sx={{ fontSize: { xs: 13, md: 14 } }} />}
              sx={{
                mt: { xs: 0.75, sm: 1, md: 1.25 },
                width: "100%",
                border: "1.5px dashed #a7f3d0",
                borderRadius: "8px",
                py: { xs: 0.75, sm: 1, md: 1 },
                fontSize: { xs: 11, sm: 12, md: 12 },
                fontWeight: 600,
                color: "#16a34a",
                textTransform: "none",
                background: "transparent",
                "&:hover": { background: "#ecfdf5", borderColor: "#6ee7b7" },
              }}
            >
              Add Item
            </Button>
          </Box>

          {/* ── Issue Value ── */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: { xs: 1, sm: 1.5, md: 2 },
              p: { xs: 0.75, sm: 1, md: 1.25 },
              borderRadius: "10px",
              background: issueValue > 0 ? "#eff6ff" : "#f9fafb",
              border: `1px solid ${issueValue > 0 ? "#bfdbfe" : "#e5e7eb"}`,
              transition: "all 0.2s",
            }}
          >
            <Typography
              sx={{ fontSize: { xs: 12, sm: 12.5, md: 13 }, color: "#6b7280" }}
            >
              Issue Value:{" "}
              <span
                style={{
                  fontWeight: 800,
                  color: issueValue > 0 ? "#2563eb" : "#111827",
                }}
              >
                ${issueValue.toFixed(2)}
              </span>
            </Typography>
          </Box>

          <Divider sx={{ mb: "16px" }} />

          {/* ── Remarks ── */}
          <Box>
            <FieldLabel>Remarks</FieldLabel>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Any special instructions..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: 13,
                  borderRadius: "8px",
                  background: "#f9fafb",
                  "& fieldset": { borderColor: "#e5e7eb" },
                  "&:hover fieldset": { borderColor: "#d1d5db" },
                  "&.Mui-focused fieldset": { borderColor: "#2563eb" },
                },
              }}
            />
          </Box>
        </DialogContent>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: "24px",
            py: "16px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              textTransform: "none",
              borderRadius: "8px",
              px: "20px",
              py: "9px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              "&:hover": { background: "#f9fafb" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleIssueRequest}
            startIcon={<AssignmentIcon sx={{ fontSize: 15 }} />}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              textTransform: "none",
              borderRadius: "8px",
              px: "20px",
              py: "9px",
              background: "#2563eb",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              "&:hover": { background: "#1d4ed8" },
            }}
          >
            Issue Request
          </Button>
        </Box>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          sx={{ fontSize: 13, borderRadius: "10px" }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}