import { useState, useEffect } from "react";
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
  FormHelperText,
  Snackbar,
  Alert,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "../../contexts/Authcontext";
import { useInventory } from "../../contexts/InventoryContext";

export const LOCATION_CODE_MAP = {
  "Main Acute Care Hospital": "MACH-01",
  "Central Warehouse & Stores": "CWS-01",
  "Ambulatory Surgery Center": "ASC-01",
  "Urgent Care Center": "UCC-01",
  "Women's & Children's Hospital": "WCH-01",
  "Core Laboratory": "CLAB-01",
  "Outpatient Imaging Center": "OIC-01",
  "Blood Bank": "BB-01",
  "Retail / Discharge Pharmacy": "RDP-01",
  "Specialty Pharmacy": "SP-01",
};

export function locationToCode(name) {
  if (!name) return "";
  return (
    LOCATION_CODE_MAP[name] ??
    name.replace(/\s+/g, "-").toUpperCase().slice(0, 5) + "-01"
  );
}

const BASE_LOCATIONS = Object.keys(LOCATION_CODE_MAP);

const DEPARTMENT_NAMES = [
  "Central Store",
  "Ward / Department Store",
  "Pharmacy",
  "Operation Theater",
  "Laboratory",
  "Clinic / OPD",
  "Branch Facility / Satellite Site",
  "ICU",
  "Emergency Dept",
  "OR / Surgery",
  "Intensive Care",
  "Ward A",
  "Ward B",
  "Surgery",
  "Maintenance",
];

function loadLocations() {
  try {
    const saved = localStorage.getItem("tia_locations");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Only extract location names, filtering out department names
        const extraNames = parsed
          .map((l) => l.name)
          .filter(Boolean)
          .filter((name) => !DEPARTMENT_NAMES.includes(name));
        return [...new Set([...BASE_LOCATIONS, ...extraNames])];
      }
    }
  } catch {}
  return BASE_LOCATIONS;
}

const FREE_ROLES = new Set(["admin", "location_manager_super"]);

const PRIORITY_CONFIG = {
  Low: {
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#86efac",
  },
  Medium: {
    color: "#ca8a04",
    bg: "#fefce8",
    border: "#fde047",
  },
  High: {
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fdba74",
  },
  Critical: {
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
  },
};
const inputSx = (err = false) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "8px",
    background: "#f9fafb",
    "& fieldset": { borderColor: err ? "#ef4444" : "#e5e7eb" },
    "&:hover fieldset": { borderColor: err ? "#ef4444" : "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: err ? "#ef4444" : "#2563eb" },
  },
});
const disabledInputSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "8px",
    background: "#f3f4f6",
    "& fieldset": { borderColor: "#e5e7eb" },
  },
};
const selectSx = (err = false) => ({
  fontSize: 13,
  borderRadius: "8px",
  background: "#f9fafb",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: err ? "#ef4444" : "#e5e7eb",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: err ? "#ef4444" : "#d1d5db",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: err ? "#ef4444" : "#2563eb",
  },
});
const noSpinnerSx = {
  "& input[type=number]": { MozAppearance: "textfield" },
  "& input[type=number]::-webkit-outer-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "& input[type=number]::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
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

// Styling for the item Autocomplete's input, mirroring selectSx in both
// normal and error states, pinned to the same 34px height as the rest of
// the row so everything lines up in one clean line. Only vertical padding
// is forced here — horizontal/right padding is left to MUI so it can keep
// reserving room for the clear (×) and dropdown icons; overriding that was
// what caused the item name to visually collide with the × button.
const itemAutocompleteSx = (hasError = false) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 12,
    borderRadius: "8px",
    background: hasError ? "#fff5f5" : "#f9fafb",
    height: "34px",
    paddingTop: "0px !important",
    paddingBottom: "0px !important",
    paddingLeft: "8px !important",
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
    paddingTop: "3px !important",
    paddingBottom: "3px !important",
    paddingLeft: "0 !important",
    textOverflow: "ellipsis",
  },
  "& .MuiAutocomplete-endAdornment": {
    color: "#9ca3af",
    right: "6px",
  },
  "& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator": {
    color: "#9ca3af",
    padding: "2px",
    "&:hover": { color: "#6b7280", background: "transparent" },
  },
});

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
function PriorityIcon({ priority }) {
  if (priority === "Critical")
    return <ErrorOutlineIcon sx={{ fontSize: 14 }} />;
  if (priority === "Urgent") return <WarningAmberIcon sx={{ fontSize: 14 }} />;
  return <InfoOutlinedIcon sx={{ fontSize: 14 }} />;
}

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

function validate({ fromLocation, toLocation, items, availableItems }) {
  const errs = {};
  if (!fromLocation) errs.fromLocation = true;
  if (!toLocation) errs.toLocation = true;
  if (!items.some((i) => i.item)) errs.items = true;
  items.forEach((row) => {
    const qty = parseInt(row.qty);
    const data = availableItems.find((a) => a.id === row.item);
    const lots = getLotsForItem(data);

    if (row.item && (!row.qty || isNaN(qty) || qty <= 0)) {
      errs[`qty_${row.id}`] = true;
    } else if (row.item && row.qty) {
      // maxQty is always expressed in BASE UOM (e.g. Pairs).
      let maxQty = data?.qty;
      if (lots.length > 0 && row.lot) {
        const lotData = lots.find((l) => l.lotNo === row.lot);
        if (lotData) maxQty = lotData.qty;
      }

      // The entered qty is in ISSUE UOM (e.g. Box), so it must be converted
      // to base UOM before comparing against maxQty, otherwise something
      // like "100 Box" (=10,000 Pairs) would incorrectly pass against an
      // available stock of "8,500 Pairs".
      const conversionFactor = getConversionFactor(data);
      const qtyInBaseUom = qty * conversionFactor;

      if (maxQty !== undefined && qtyInBaseUom > maxQty) {
        const issueUom = data?.issueUom || data?.uom || "EA";
        const baseUom = data?.uom || "EA";
        if (conversionFactor !== 1) {
          const maxIssueQty = Math.floor(maxQty / conversionFactor);
          errs[`qty_${row.id}_max`] =
            `Max ${maxIssueQty} ${issueUom} (${maxQty} ${baseUom} avail.)`;
        } else {
          errs[`qty_${row.id}_max`] = `Max ${maxQty}`;
        }
      }
    }
  });
  return errs;
}

const makeRow = () => ({
  id: Date.now() + Math.random(),
  item: "",
  lot: "",
  qty: "",
});
const getNextId = () =>
  `TRF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000 + 1000)).padStart(4, "0")}`;

// Column widths shared between the header row and every item row so the
// two stay perfectly aligned. Everything — Item, Lot, Avail, UOM, Qty, and
// the delete button — lives in ONE row per item. Item gets a capped
// flexible width and truncates with an ellipsis (full name on hover) so it
// can't blow out the layout; the rest are fixed, narrow columns — sized to
// match the Issue Stock modal so both look and behave consistently. Lot No.
// only ever holds short codes like "LOT-2401", so it doesn't need much room;
// giving it too much (as before) was what starved the Item field of space.
const ROW_COLUMNS = "minmax(0,1fr) 66px 50px 46px 68px 28px";

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateTransferModal({
  open,
  onClose,
  onSave,
  prefillItem = null,
}) {
  const { currentUser } = useAuth();
  const { items: inventoryItems } = useInventory();

  const isFreeRole = FREE_ROLES.has(currentUser?.role);
  const userLocation = currentUser?.locationName ?? ""; // e.g. "Main Acute Care Hospital"

  const [priority, setPriority] = useState("");
  const [fromLocation, setFrom] = useState("");
  const [toLocation, setTo] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    prefillItem
      ? {
          id: Date.now(),
          item: prefillItem,
          lot: getAutoLot(inventoryItems.find((a) => a.id === prefillItem)),
          qty: "",
        }
      : makeRow(),
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({
    fromLocation: false,
    toLocation: false,
  });
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [transferId, setTransferId] = useState(getNextId());
  const [locations, setLocations] = useState(BASE_LOCATIONS);

  useEffect(() => {
    if (!open) return;
    setTransferId(getNextId());
    const allLocs = loadLocations();
    setLocations(allLocs);

    if (!isFreeRole && userLocation) {
      setTo(userLocation);
    } else {
      setTo("");
    }
    setFrom("");
    setNotes("");
    setItems([
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
    setPriority("");
    setErrors({});
    setTouched({ fromLocation: false, toLocation: false });
  }, [open]);

  const addItem = () => setItems((p) => [...p, makeRow()]);
  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems((p) => p.filter((i) => i.id !== id));
  };
  const updateItem = (id, field, value) => {
    setItems((p) =>
      p.map((i) => {
        if (i.id !== id) return i;
        // Changing the item auto-populates the lot from that item's data.
        if (field === "item") {
          const data = inventoryItems.find((a) => a.id === value);
          return { ...i, item: value, lot: getAutoLot(data) };
        }
        return { ...i, [field]: value };
      })
    );
    setErrors((e) => {
      const n = { ...e };
      delete n[`qty_${id}`];
      delete n[`qty_${id}_max`];
      delete n[`lot_${id}`];
      return n;
    });
  };
  const getItemData = (itemId) => inventoryItems.find((a) => a.id === itemId);
  const totalQty = items.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);
  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));
  const handleClose = () => {
    onClose();
  };

  const submit = async () => {
    setTouched({ fromLocation: true, toLocation: true });
    const validationErrors = validate({
      fromLocation,
      toLocation,
      items,
      availableItems: inventoryItems,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSnack({
        open: true,
        msg: "Please fix the highlighted fields.",
        severity: "error",
      });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      const filledItems = items.filter((i) => i.item);
      const fromCode = locationToCode(fromLocation);
      const toCode = locationToCode(toLocation);
      const newTransfer = {
        id: transferId,
        from: fromCode,
        fromLabel: fromLocation,
        to: toCode,
        toLabel: toLocation,
        items: filledItems.map((i) => {
          const d = inventoryItems.find((a) => a.id === i.item);
          return {
            item: d?.name ?? i.item,
            lotNo: i.lot || undefined,
            qty: parseInt(i.qty),
          };
        }),
        lineItems: filledItems.map((i) => {
          const d = inventoryItems.find((a) => a.id === i.item);
          return {
            name: d?.name ?? i.item,
            lotNo: i.lot || undefined,
            quantity: parseInt(i.qty),
            approvedQty: 0,
            approvalStatus: "Pending",
          };
        }),
        itemsLabel: filledItems
          .map((i) => {
            const d = inventoryItems.find((a) => a.id === i.item);
            const lotSuffix = i.lot ? ` (Lot ${i.lot})` : "";
            return `${d?.name ?? i.item}${lotSuffix} ×${i.qty}`;
          })
          .join(", "),
        priority,
        notes: notes.trim() || "—",
        by: currentUser?.name ?? "Current User",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "Requested",
        createdById: currentUser?.id,
        createdByRole: currentUser?.role,
      };
      onSave?.(newTransfer);
      setSnack({
        open: true,
        msg: `Transfer ${transferId} submitted for approval!`,
        severity: "success",
      });
      handleClose();
    } catch {
      setSnack({
        open: true,
        msg: "Something went wrong. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // TO list excludes the FROM location
  const toLocations = locations.filter((l) => l !== fromLocation);

  return (
    <>
      <Dialog
        open={open}
        onClose={loading ? undefined : handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: "24px",
            pt: "20px",
            pb: "16px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
            flexShrink: 0,
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SwapHorizIcon sx={{ fontSize: 20, color: "#2563eb" }} />
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}
              >
                Stock Transfer Request
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: "#9ca3af",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              width: 30,
              height: 30,
              "&:hover": { background: "#f3f4f6" },
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: "24px", pt: "12px", pb: 0 }}>
          <Typography
            sx={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}
          >
            <span style={{ color: "#ef4444" }}>*</span> Required fields
          </Typography>
        </Box>

        <DialogContent
          sx={{
            px: "24px",
            py: "20px",
            overflowY: "auto",
            maxHeight: "70vh",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": {
              background: "#d1d5db",
              borderRadius: 4,
            },
          }}
        >
          {/* Transfer # + Priority */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              mb: "16px",
            }}
          >
            <Box>
              <FieldLabel>Transfer Number</FieldLabel>
              <TextField
                fullWidth
                size="small"
                value={transferId}
                disabled
                sx={disabledInputSx}
                inputProps={{ style: { color: "#9ca3af" } }}
              />
            </Box>
            <Box>
             <Box>
  <FieldLabel required>Priority</FieldLabel>
  <FormControl fullWidth size="small" error={!!errors.priority}>
    <Select
      value={priority}
      displayEmpty
      onBlur={handleBlur("priority")}
      onChange={(e) => {
        setPriority(e.target.value);
        setErrors((p) => ({ ...p, priority: false }));
      }}
      sx={selectSx(!!errors.priority)}
      renderValue={(v) =>
        v ? (
          v
        ) : (
          <span style={{ color: "#9ca3af", fontSize: 13 }}>
            Select priority
          </span>
        )
      }
    >
      <MenuItem value="Low" sx={{ fontSize: 13 }}>
        Low
      </MenuItem>
      <MenuItem value="Medium" sx={{ fontSize: 13 }}>
        Medium
      </MenuItem>
      <MenuItem value="High" sx={{ fontSize: 13 }}>
        High
      </MenuItem>
      <MenuItem value="Critical" sx={{ fontSize: 13 }}>
        Critical
      </MenuItem>
    </Select>

    {errors.priority && (
      <FormHelperText sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}>
        Priority is required
      </FormHelperText>
    )}
  </FormControl>
</Box>
            </Box>
          </Box>

          {/* From + To */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              mb: "16px",
            }}
          >
            <Box>
              <FieldLabel required>To Location (Your Location)</FieldLabel>
              {!isFreeRole && userLocation ? (
                // Locked: show as a read-only styled field with a lock icon
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    px: "12px",
                    py: "9px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    bgcolor: "#f3f4f6",
                    minHeight: 40,
                  }}
                >
                  <LockOutlinedIcon
                    sx={{ fontSize: 14, color: "#9ca3af", flexShrink: 0 }}
                  />
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#374151",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userLocation}
                  </Typography>
                </Box>
              ) : (
                <FormControl fullWidth size="small" error={!!errors.toLocation}>
                  <Select
                    value={toLocation}
                    displayEmpty
                    onBlur={handleBlur("toLocation")}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setErrors((p) => ({ ...p, toLocation: false }));
                    }}
                    sx={selectSx(!!errors.toLocation)}
                    renderValue={(v) =>
                      v ? (
                        v
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          Select location…
                        </span>
                      )
                    }
                  >
                    {toLocations.length === 0 ? (
                      <MenuItem
                        disabled
                        sx={{ fontSize: 13, color: "#9ca3af" }}
                      >
                        Select a From location first
                      </MenuItem>
                    ) : (
                      toLocations.map((l) => (
                        <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>
                          {l}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.toLocation && (
                    <FormHelperText
                      sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                    >
                      To Location is required
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            </Box>

            {/* FROM */}
            <Box>
              <FieldLabel required>From Location</FieldLabel>
              <FormControl fullWidth size="small" error={!!errors.fromLocation}>
                <Select
                  value={fromLocation}
                  displayEmpty
                  onBlur={handleBlur("fromLocation")}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    if (toLocation === e.target.value) setTo("");
                    setErrors((p) => ({ ...p, fromLocation: false }));
                  }}
                  sx={selectSx(!!errors.fromLocation)}
                  renderValue={(v) =>
                    v ? (
                      v
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>
                        Select location…
                      </span>
                    )
                  }
                >
                  {locations.map((l) => (
                    <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>
                      {l}
                    </MenuItem>
                  ))}
                </Select>
                {errors.fromLocation && (
                  <FormHelperText
                    sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                  >
                    From Location is required
                  </FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>

          {/* Route preview */}
          {fromLocation && toLocation && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                px: "12px",
                py: "7px",
                mb: "16px",
                borderRadius: "8px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <LocalShippingOutlinedIcon
                sx={{ fontSize: 14, color: "#2563eb" }}
              />
              <Typography
                sx={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}
              >
                {fromLocation}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: "1px",
                  borderTop: "1.5px dashed #93c5fd",
                  mx: "4px",
                }}
              />
              <Typography
                sx={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}
              >
                {toLocation}
              </Typography>
            </Box>
          )}

          {/* Notes */}
          <Box sx={{ mb: "16px" }}>
            <FieldLabel>Reason / Notes</FieldLabel>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="e.g. ICU surge — urgent restock request…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              sx={inputSx(false)}
            />
          </Box>

          {/* Items */}
          <Box sx={{ mb: "16px" }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "#2563eb",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                mb: "12px",
              }}
            >
              Items to Transfer
            </Typography>

            {/* Column headers */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: ROW_COLUMNS,
                gap: "6px",
                mb: "6px",
                px: "2px",
              }}
            >
              {["ITEM", "LOT", "AVAIL.", "UOM", "QTY", ""].map((h, i) => (
                <Typography
                  key={i}
                  sx={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: "#9ca3af",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textAlign: h === "ITEM" ? "left" : "center",
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((row) => {
                const data = getItemData(row.item);
                const lots = getLotsForItem(data);
                const selectedLot = lots.find((l) => l.lotNo === row.lot);
                const qtyErr =
                  errors[`qty_${row.id}`] || errors[`qty_${row.id}_max`];

                // Calculate conversion display for Issue UOM
                const qty = parseFloat(row.qty) || 0;
                const issueUom = data?.issueUom || data?.uom || "EA";
                const baseUom = data?.uom || "EA";
                const conversionFactor = getConversionFactor(data);
                const convertedQty = qty * conversionFactor;

                // Available quantity reflects the auto-populated lot when lots exist
                // (always in BASE UOM, e.g. Pairs)
                const availableQty =
                  lots.length > 0
                    ? (selectedLot ? selectedLot.qty : "")
                    : data
                    ? data.qty
                    : "";

                // Cap on the QTY field (entered in Issue UOM) so the browser-level
                // max stays consistent with the base-UOM available quantity.
                const maxIssueQty =
                  availableQty !== "" && conversionFactor
                    ? Math.floor(availableQty / conversionFactor)
                    : undefined;

                // Live over-stock check used to flag the row red even before blur/submit
                const isOverStock =
                  qty > 0 &&
                  availableQty !== "" &&
                  convertedQty > availableQty;

                // Currently selected item object for the Autocomplete (or
                // null if nothing selected yet / value no longer exists).
                const selectedItemOption =
                  inventoryItems.find((a) => a.id === row.item) || null;

                return (
                  <Box key={row.id}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: ROW_COLUMNS,
                        gap: "6px",
                        alignItems: "center",
                        p: "6px 8px",
                        borderRadius: "8px",
                        border: `1px solid ${isOverStock ? "#fca5a5" : "#e5e7eb"}`,
                        bgcolor: isOverStock ? "#fff5f5" : "#fff",
                        "&:hover": {
                          borderColor: isOverStock ? "#f87171" : "#bbf7d0",
                          bgcolor: isOverStock ? "#fff5f5" : "#f0fdf4",
                        },
                        transition: "all 0.15s",
                      }}
                    >
                      {/* Item — type-to-search Autocomplete, capped width + ellipsis */}
                      <FormControl size="small" fullWidth sx={{ minWidth: 0 }}>
                        <Autocomplete
                          size="small"
                          options={inventoryItems}
                          value={selectedItemOption}
                          isOptionEqualToValue={(opt, val) =>
                            opt.id === val?.id
                          }
                          getOptionLabel={(opt) => opt?.name || ""}
                          slotProps={{
                            popper: {
                              style: { zIndex: 1500 },
                              placement: "bottom-start",
                            },
                          }}
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
                                sx={itemAutocompleteSx(false)}
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

                      {/* Lot No (auto-populated, read-only) */}
                      <Tooltip
                        title={row.item ? row.lot || "—" : ""}
                        arrow
                        slotProps={whiteTooltipSx}
                      >
                        <TextField
                          size="small"
                          value={row.item ? row.lot || "—" : ""}
                          disabled
                          sx={{
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
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </Tooltip>

                      {/* Available */}
                      <TextField
                        size="small"
                        value={availableQty}
                        disabled
                        sx={{
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
                        }}
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
                            bgcolor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
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

                      {/* Qty — error/max hint floats below so the row itself
                          never grows past a single line. */}
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
                            ...noSpinnerSx,
                            "& .MuiOutlinedInput-root": {
                              fontSize: 12.5,
                              borderRadius: "8px",
                              height: "34px",
                              background:
                                qtyErr || isOverStock ? "#fff5f5" : "#f9fafb",
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
                            {errors[`qty_${row.id}_max`] ||
                              (qtyErr
                                ? "Enter quantity"
                                : conversionFactor !== 1
                                ? `Max ${maxIssueQty} ${issueUom}`
                                : `Max ${availableQty}`)}
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
                          border: "1px solid #bbf7d0",
                          borderRadius: "6px",
                          width: 28,
                          height: 28,
                          "&:hover": { background: "#f0fdf4" },
                          "&.Mui-disabled": {
                            color: "#d1d5db",
                            borderColor: "#e5e7eb",
                          },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Button
              onClick={addItem}
              disabled={loading}
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              sx={{
                mt: "10px",
                width: "100%",
                border: "1.5px dashed #bbf7d0",
                borderRadius: "8px",
                py: "8px",
                fontSize: 12,
                fontWeight: 600,
                color: "#16a34a",
                textTransform: "none",
                background: "transparent",
                "&:hover": { background: "#f0fdf4", borderColor: "#86efac" },
              }}
            >
              Add Item
            </Button>
            {errors.items && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  mt: "8px",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#ef4444",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}
                >
                  At least one item must be selected
                </Typography>
              </Box>
            )}
          </Box>

          {/* Total */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: "16px",
              p: "10px 16px",
              borderRadius: "10px",
              background: totalQty > 0 ? "#eff6ff" : "#f9fafb",
              border: `1px solid ${totalQty > 0 ? "#bfdbfe" : "#e5e7eb"}`,
              transition: "all 0.2s",
            }}
          >
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
              Total Units:{" "}
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: totalQty > 0 ? "#2563eb" : "#111827",
                }}
              >
                {totalQty}
              </span>
            </Typography>
          </Box>
          <Divider sx={{ mb: "16px" }} />
        </DialogContent>

        {/* Footer */}
        <Box
          sx={{
            px: "24px",
            py: "16px",
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
            onClick={handleClose}
            disabled={loading}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              textTransform: "none",
              borderRadius: "8px",
              px: "20px",
              py: "9px",
              border: "1px solid #e5e7eb",
              bgcolor: "#fff",
              "&:hover": { bgcolor: "#f9fafb" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            startIcon={<HourglassTopIcon sx={{ fontSize: 15 }} />}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              textTransform: "none",
              borderRadius: "8px",
              px: "20px",
              py: "9px",
              bgcolor: "#2563eb",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              "&:hover": { bgcolor: "#1d4ed8" },
              "&.Mui-disabled": { opacity: 0.6 },
            }}
          >
            {loading ? "Submitting…" : "Transfer Request"}
          </Button>
        </Box>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}