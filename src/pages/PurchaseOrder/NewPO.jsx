import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  IconButton,
  Divider,
  FormHelperText,
  Snackbar,
  Alert,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SaveIcon from "@mui/icons-material/Save";
import DraftsIcon from "@mui/icons-material/Drafts";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LinkIcon from "@mui/icons-material/Link";
import dayjs from "dayjs";
import { getLocations } from "../../utils/locationUtils";
import { getSupplierByName } from "../../utils/supplierUtils";
import { getGPONames } from "../../utils/gpoUtils";
import { useVendorManagement } from "../../contexts/VendorManagementContext";
import { useInventory } from "../../contexts/InventoryContext";


// Priority color helper
const priorityColor = (p) =>
  p === "Critical" ? "#ef4444" :
  p === "High"     ? "#f59e0b" :
  p === "Medium"   ? "#3b82f6" :
                     "#22c55e"; // Low

const priorityBg = (p) =>
  p === "Critical" ? "#fef2f2" :
  p === "High"     ? "#fffbeb" :
  p === "Medium"   ? "#eff6ff" :
                     "#f0fdf4"; // Low

const priorityBorder = (p) =>
  p === "Critical" ? "#fecaca" :
  p === "High"     ? "#fde68a" :
  p === "Medium"   ? "#bfdbfe" :
                     "#bbf7d0"; // Low


const labelSx = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  mb: 0.5,
  display: "block",
};

const inputSx = (hasError = false) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "6px",
    bgcolor: "#fff",
    "& fieldset": { borderColor: hasError ? "#ef4444" : "#d1d5db" },
    "&:hover fieldset": { borderColor: hasError ? "#ef4444" : "#9ca3af" },
    "&.Mui-focused fieldset": {
      borderColor: hasError ? "#ef4444" : "#2563eb",
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputBase-input": { py: "8px", px: "12px" },
  "& .MuiInputBase-input::placeholder": { color: "#9ca3af", opacity: 1 },
});

const disabledInputSx = {
  ...inputSx(false),
  "& .MuiOutlinedInput-root": {
    ...inputSx(false)["& .MuiOutlinedInput-root"],
    bgcolor: "#f9fafb",
  },
};

const selectSx = (hasError = false) => ({
  fontSize: 13,
  borderRadius: "6px",
  "& fieldset": { borderColor: hasError ? "#ef4444" : "#d1d5db" },
  "&:hover fieldset": { borderColor: hasError ? "#ef4444" : "#9ca3af" },
  "&.Mui-focused fieldset": {
    borderColor: hasError ? "#ef4444" : "#2563eb",
    borderWidth: "1.5px",
  },
  "& .MuiSelect-select": { py: "8px", px: "12px" },
});

const rowFieldSx = (extraInput = {}) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "6px",
    bgcolor: "#fff",
    "& fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb" },
  },
  "& .MuiInputBase-input": { py: "6px", px: "8px", ...extraInput },
  "& input[type=number]": { MozAppearance: "textfield" },
  "& input::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
  "& input::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
});

const btnBase = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "8px",
  px: "20px",
  py: "9px",
  outline: "none",
  "&:focus": { outline: "none" },
};



function DateField({ value, onChange, hasError = false, min, max }) {
  const ref = useRef(null);
  const openPicker = () => {
    try { ref.current?.showPicker(); } catch { ref.current?.click(); }
  };
  return (
    <Box
      onClick={openPicker}
      sx={{
        display: "flex",
        alignItems: "center",
        border: `1px solid ${hasError ? "#ef4444" : "#d1d5db"}`,
        borderRadius: "6px",
        bgcolor: "#fff",
        px: 1,
        height: 34,
        cursor: "pointer",
        width: "100%",
        position: "relative",
        "&:hover": { borderColor: hasError ? "#ef4444" : "#9ca3af" },
        "&:focus-within": {
          borderColor: hasError ? "#ef4444" : "#2563eb",
          outline: "2px solid #dbeafe",
          outlineOffset: "-1px",
        },
        transition: "border-color 0.15s",
        boxSizing: "border-box",
      }}
    >
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 12,
          color: value ? "#111827" : "#9ca3af",
          flex: 1,
          cursor: "pointer",
          minWidth: 0,
          colorScheme: "light",
          WebkitAppearance: "none",
          appearance: "none",
          width: "100%",
        }}
      />
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 0;
          width: 40px;
          height: 100%;
          cursor: pointer;
        }
      `}</style>
      <CalendarTodayOutlinedIcon
        sx={{ fontSize: 13, color: hasError ? "#ef4444" : "#9ca3af", flexShrink: 0, pointerEvents: "none" }}
      />
    </Box>
  );
}


const loadIndentsFromStorage = () => {
  try {
    const savedData = localStorage.getItem("indent_procurement_data");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((indent) => ({
          id: indent.indentNo,
          supplier: indent.supplier || "s1",
          deliverTo: indent.deliverTo || indent.location || "l1",
          items: (indent.lineItems || indent.items || []).map((it, idx) => ({
            id: idx + 1,
            description: it.itemName || it.description || it.item || "",
            quantity:    it.qtyReq   || it.quantity   || it.qty  || 1,
            unitCost:    it.unitCost || 0,
            status:      it.status   || "Pending",
          })),
        }));
      }
    }
  } catch (e) {
    console.error("Failed to load indents from localStorage:", e);
  }
  return [];
};


const getLocationsForDropdown = () => [
  { value: "all", label: "All Locations" },
  ...getLocations().map((loc) => ({ value: loc, label: loc })),
];

const priorities = ["Low", "Medium", "High", "Critical"];


const NewPO = ({ open, onClose, onSave, onSaveAsDraft, initialIndentId, indentData, expiryReplacementData, suppliers: suppliersProp, editingDraftPO }) => {
  const today = dayjs().format("YYYY-MM-DD");
  const [locations, setLocations] = useState(() => getLocationsForDropdown());
  const { supplierNames: contextSupplierNames } = useVendorManagement();
  const { items: inventoryItems } = useInventory();
  const [gpoOptions, setGpoOptions] = useState([
    { value: "vizient",   label: "Vizient" },
    { value: "premier",   label: "Premier" },
    { value: "hpg",       label: "HealthTrust (HPG)" },
    { value: "intalere",  label: "Intalere" },
    { value: "provista",  label: "Provista" },
    { value: "medassets", label: "MedAssets" },
  ]);

  const [lineItemSuggestions, setLineItemSuggestions] = useState({});

  const supplierList = suppliersProp || contextSupplierNames || [];
  const suppliers = supplierList.map((name) => ({
    value: name,
    label: name,
  }));

  useEffect(() => {
    if (open) {
      setLocations(getLocationsForDropdown());
      const gpoNames = getGPONames();
      if (gpoNames && gpoNames.length > 0) {
        setGpoOptions(gpoNames.map((name) => ({
          value: name.toLowerCase().replace(/\s+/g, "_"),
          label: name,
        })));
      }
    }
  }, [open]);

  useEffect(() => {
    const onLocationsUpdated = () => {
      if (open) setLocations(getLocationsForDropdown());
    };
    window.addEventListener("locationsUpdated", onLocationsUpdated);
    return () => window.removeEventListener("locationsUpdated", onLocationsUpdated);
  }, [open]);

  useEffect(() => {
    const onGposUpdated = () => {
      const gpoNames = getGPONames();
      if (gpoNames && gpoNames.length > 0) {
        setGpoOptions(gpoNames.map((name) => ({
          value: name.toLowerCase().replace(/\s+/g, "_"),
          label: name,
        })));
      }
    };
    window.addEventListener("gposUpdated", onGposUpdated);
    return () => window.removeEventListener("gposUpdated", onGposUpdated);
  }, []);

  const [formData, setFormData] = useState({
    indentId: "",
    poNumber: "",
    quotationRef: "",
    supplier: "",
    gpo: "",
    gpoContractId: "",
    orderDate: dayjs().format("YYYY-MM-DD"),
    requiredDelivery: "",
    deliverTo: "",
    priority: "Low",
    notes: "",
    lineItems: [{ id: 1, description: "", quantity: 1, unitCost: 0 }],
  });

  const [touched, setTouched] = useState({
    supplier: false,
    deliverTo: false,
    requiredDelivery: false,
  });

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [totalAmount, setTotalAmount] = useState(0);
  const [availableIndents, setAvailableIndents] = useState([]);

  useEffect(() => {
    if (open) {
      const indents = loadIndentsFromStorage();
      setAvailableIndents(indents);
      const newPONumber = `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

      if (editingDraftPO) {
        setFormData({
          indentId: editingDraftPO.indentId || "",
          poNumber: editingDraftPO.id,
          quotationRef: editingDraftPO.quotRef || "",
          supplier: editingDraftPO.supplier || "",
          gpo: editingDraftPO.gpo || "",
          gpoContractId: editingDraftPO.gpoContractId || "",
          orderDate: editingDraftPO.date || dayjs().format("YYYY-MM-DD"),
          requiredDelivery: editingDraftPO.delivery || "",
          deliverTo: editingDraftPO.location || "",
          priority: editingDraftPO.priority || "Low",
          notes: editingDraftPO.notes || "",
          lineItems: (editingDraftPO.lineItems || []).map((item, idx) => ({
            id: idx + 1,
            description: item.description || "",
            quantity: item.quantity || 1,
            unitCost: item.unitCost || 0,
          })),
        });
        setTouched({ supplier: true, deliverTo: true, requiredDelivery: true });
        return;
      }

      if (initialIndentId && indentData) {
        const indent = indents.find((i) => i.id === initialIndentId);

        let lastSupplier = "";
        try {
          const existingPOs = JSON.parse(localStorage.getItem("purchase_orders_data") || "[]");
          const matchingPO = existingPOs.find((po) => po.indentId === initialIndentId);
          if (matchingPO) {
            const found = suppliers.find((s) => s.label === matchingPO.supplier);
            lastSupplier = found ? found.value : "";
          }
        } catch { /* ignore */ }

        const indentLineItems = (indentData.lineItems || []);
        const mergedItems = indentLineItems.map((it, idx) => {
          const approvedQty = Number(it.approvedQty ?? it._approvedQty ?? it.qty ?? it.qtyReq ?? 1);
          const alreadyOrdered = Number(it.orderedQty || 0);
          const balanceToOrder = Math.max(1, approvedQty - alreadyOrdered);
          return {
            id: idx + 1,
            description: it.itemName || it.description || "",
            quantity: balanceToOrder,
            unitCost: it.unitCost ?? 0,
            _approvedQty: approvedQty,
            _maxQty: balanceToOrder,
          };
        });

        setFormData((prev) => ({
          ...prev,
          poNumber: newPONumber,
          orderDate: dayjs().format("YYYY-MM-DD"),
          indentId: initialIndentId,
          supplier: lastSupplier || indent?.supplier || "",
          deliverTo: indent?.deliverTo || indentData.location || "",
          requiredDelivery: indent?.requiredDelivery || indentData.requiredDelivery || "",
          priority: indentData.priority || "Low",
          lineItems: mergedItems.length > 0
            ? mergedItems
            : [{ id: 1, description: "", quantity: 1, unitCost: 0 }],
        }));
        setTouched({ supplier: !!lastSupplier, deliverTo: true, requiredDelivery: true });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        poNumber: newPONumber,
        orderDate: dayjs().format("YYYY-MM-DD"),
        priority: "Low",
      }));
      setTouched({ supplier: false, deliverTo: false, requiredDelivery: false });

      if (expiryReplacementData?.prefillData) {
        const prefill = expiryReplacementData.prefillData;
        setFormData((prev) => ({
          ...prev,
          poNumber: newPONumber,
          orderDate: dayjs().format("YYYY-MM-DD"),
          supplier: prefill.supplier || "",
          deliverTo: prefill.location || "",
          priority: prefill.urgency?.includes("Critical") ? "Critical" : prefill.urgency?.includes("High") ? "High" : "Low",
          lineItems: [{
            id: 1,
            description: prefill.itemName || "",
            quantity: prefill.quantity || 1,
            unitCost: prefill.unitCost || 0,
            _expiryReplacement: true,
            _replacementReason: prefill.reason,
            _itemNDC: prefill.itemNDC,
          }],
          notes: `[EXPIRY REPLACEMENT] Reason: ${prefill.reason}\nUrgency: ${prefill.urgency}\n${prefill.notes ? `Notes: ${prefill.notes}` : ''}`,
        }));
        setTouched({ supplier: true, deliverTo: true, requiredDelivery: false });
      }
    }
  }, [open, initialIndentId, indentData, expiryReplacementData, editingDraftPO]);

  useEffect(() => {
    const total = formData.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost, 0
    );
    setTotalAmount(total);
  }, [formData.lineItems]);

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleChange = (field) => (event) => {
    setField(field, event.target.value);
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const hasError = (field) => touched[field] && !formData[field];

  const handleIndentChange = (event) => {
    const selectedId = event.target.value;
    if (!selectedId) {
      setFormData((prev) => ({
        ...prev,
        indentId: "",
        lineItems: [{ id: 1, description: "", quantity: 1, unitCost: 0 }],
      }));
      return;
    }
    const indent = availableIndents.find((i) => i.id === selectedId);
    if (indent) {
      setFormData((prev) => ({
        ...prev,
        indentId: indent.id,
        supplier: indent.supplier,
        deliverTo: indent.deliverTo,
        lineItems: indent.items.length > 0
          ? indent.items.map((item) => ({ ...item }))
          : [{ id: 1, description: "", quantity: 1, unitCost: 0 }],
      }));
      setTouched((prev) => ({ ...prev, supplier: true, deliverTo: true }));
    }
  };

  const handleLineItemChange = (id, field) => (event) => {
    const value =
      field === "quantity" || field === "unitCost"
        ? parseFloat(event.target.value) || 0
        : event.target.value;

    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));

    if (field === "description") {
      const matchingItems = inventoryItems.filter((invItem) =>
        invItem.name && invItem.name.toLowerCase().includes(value.toLowerCase())
      );
      setLineItemSuggestions((prev) => ({ ...prev, [id]: matchingItems }));
    }
  };

  const handleSelectInventoryItem = (id, inventoryItem) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              description: inventoryItem.name,
              unitCost: inventoryItem.cost || inventoryItem.unitCost || 0,
              _selectedInventoryItem: inventoryItem,
            }
          : item
      ),
    }));
    setLineItemSuggestions((prev) => ({ ...prev, [id]: [] }));
  };

  const addLineItem = () => {
    const newId = Math.max(...formData.lineItems.map((item) => item.id), 0) + 1;
    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { id: newId, description: "", quantity: 1, unitCost: 0 }],
    }));
  };

  const removeLineItem = (id) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((item) => item.id !== id),
      }));
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.supplier) errors.push("supplier");
    if (!formData.deliverTo) errors.push("deliverTo");
    if (!formData.requiredDelivery) errors.push("requiredDelivery");
    return errors;
  };

  const handleCloseToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleSubmit = (isDraft = false) => {
    setTouched({ supplier: true, deliverTo: true, requiredDelivery: true });
    const errors = validateForm();
    if (!isDraft && errors.length > 0) {
      setToast({ open: true, message: "Please fill in all required fields", severity: "error" });
      return;
    }
    const validLineItems = formData.lineItems.filter((item) => item.description.trim() !== "");
    const poData = {
      ...formData,
      indentId: formData.indentId || "",
      lineItems: validLineItems,
      totalAmount,
      status: isDraft ? "Draft" : "Pending",
    };
    if (isDraft && onSaveAsDraft) {
      onSaveAsDraft(poData);
      setToast({ open: true, message: `PO ${formData.poNumber} saved as Draft successfully!`, severity: "info" });
    } else if (onSave) {
      onSave(poData);
      setToast({ open: true, message: `PO ${formData.poNumber} submitted successfully!`, severity: "success" });
    }
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      indentId: "",
      poNumber: "",
      quotationRef: "",
      supplier: "",
      gpo: "",
      gpoContractId: "",
      orderDate: dayjs().format("YYYY-MM-DD"),
      requiredDelivery: "",
      deliverTo: "",
      priority: "Low",
      notes: "",
      lineItems: [{ id: 1, description: "", quantity: 1, unitCost: 0 }],
    });
    setTouched({ supplier: false, deliverTo: false, requiredDelivery: false });
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
        disableScrollLock
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
        {/* ── Header ── */}
        <Box
          sx={{
            px: "20px", pt: "16px", pb: "12px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6", flexShrink: 0, bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCartOutlinedIcon sx={{ fontSize: 20, color: "#2563eb" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                {editingDraftPO ? "Edit Draft PO" : "Create Purchase Order"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>
                Raise a new PO against an approved supplier
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small" onClick={handleClose} disableRipple
            sx={{ color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px", width: 30, height: 30, outline: "none", "&:hover": { background: "#f3f4f6", color: "#374151" }, "&:focus": { outline: "none" } }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        {/* ── Required fields note ── */}
        <Box sx={{ px: "20px", pt: "8px", pb: 0 }}>
          <Typography sx={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>
            <span style={{ color: "#ef4444" }}>*</span> Required fields
          </Typography>
        </Box>

        {/* ── Expiry Replacement Banner ── */}
        {expiryReplacementData?.fromExpiry && (
          <Box sx={{ px: "20px", pt: "8px", pb: 0 }}>
            <Box sx={{ p: "12px 14px", borderRadius: "10px", border: "1.5px solid #fde68a", bgcolor: "#fffbeb", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 14, fontWeight: 700 }}>
                ⚠
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#92400e", mb: "4px" }}>
                  Expiry Replacement Request
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#b45309", lineHeight: 1.4 }}>
                  <strong>Item:</strong> {expiryReplacementData.prefillData?.itemName}
                  {expiryReplacementData.prefillData?.itemNDC && ` (${expiryReplacementData.prefillData.itemNDC})`}
                  <br />
                  <strong>Reason:</strong> {expiryReplacementData.prefillData?.reason}
                  <br />
                  <strong>Urgency:</strong> {expiryReplacementData.prefillData?.urgency}
                  <br />
                  <strong>Request ID:</strong> {expiryReplacementData.replacementRequestId}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Scrollable body ── */}
        <DialogContent
          sx={{
            px: "20px", py: "14px", overflowY: "auto", flex: 1,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
            "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
            scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent",
          }}
        >
          {/* Indent ID section */}
          <Box sx={{ mb: "12px", p: "12px 14px", borderRadius: "10px", border: "1.5px solid #dbeafe", bgcolor: "#eff6ff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mb: "6px" }}>
              <LinkIcon sx={{ fontSize: 14, color: "#2563eb" }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Indent ID
              </Typography>
              {!initialIndentId && (
                <Typography sx={{ fontSize: 10, color: "#9ca3af", ml: "4px" }}>
                  (optional — leave blank to create a standalone PO)
                </Typography>
              )}
            </Box>

            {initialIndentId ? (
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: "8px", px: "12px", py: "7px", borderRadius: "8px", bgcolor: "#fff", border: "1px solid #bfdbfe", width: "100%", boxSizing: "border-box" }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {formData.indentId}
                </Typography>
              </Box>
            ) : (
              <Select
                fullWidth displayEmpty size="small"
                value={formData.indentId}
                onChange={handleIndentChange}
                sx={{ ...selectSx(false), bgcolor: "#fff" }}
                renderValue={(v) =>
                  v ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{v}</Typography>
                    </Box>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>Select indent ID… (optional)</span>
                  )
                }
              >
                <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>
                  — No indent (standalone PO) —
                </MenuItem>
                {availableIndents.map((indent) => (
                  <MenuItem key={indent.id} value={indent.id} sx={{ fontSize: 13 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{indent.id}</Typography>
                      <Typography sx={{ fontSize: 11, color: "#9ca3af", ml: "auto" }}>
                        {indent.items.length} item{indent.items.length !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>

          {/* PO Number + Quotation Ref */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", mb: "12px" }}>
            <Box>
              <Typography sx={labelSx}>PO Number</Typography>
              <TextField fullWidth size="small" value={formData.poNumber} disabled sx={disabledInputSx} inputProps={{ style: { color: "#9ca3af" } }} />
            </Box>
            <Box>
              <Typography sx={labelSx}>
                {formData.supplier?.includes("Amazon") ? "Amazon Order ID" : "Supplier Quotation Ref"}
              </Typography>
              <TextField
                fullWidth size="small"
                placeholder={formData.supplier?.includes("Amazon") ? "e.g. AMAZON-2026-001" : "e.g. QTN-2026-001"}
                value={formData.quotationRef}
                onChange={handleChange("quotationRef")}
                sx={inputSx(false)}
              />
              {formData.supplier?.includes("Amazon") && (
                <Typography sx={{ fontSize: 10, color: "#6b7280", mt: "3px" }}>
                  Amazon supplier identification
                </Typography>
              )}
            </Box>
          </Box>

          {/* Supplier + Deliver To */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", mb: "12px" }}>
            <Box>
              <Typography sx={labelSx}>Supplier <span style={{ color: "#ef4444" }}>*</span></Typography>
              <Select
                fullWidth displayEmpty size="small"
                value={formData.supplier}
                onChange={handleChange("supplier")}
                onBlur={handleBlur("supplier")}
                sx={selectSx(hasError("supplier"))}
                renderValue={(v) =>
                  v ? suppliers.find((s) => s.value === v)?.label
                    : <span style={{ color: "#9ca3af", fontSize: 13 }}>Select supplier…</span>
                }
              >
                {suppliers.map((sup) => (
                  <MenuItem key={sup.value} value={sup.value} sx={{ fontSize: 13 }}>{sup.label}</MenuItem>
                ))}
              </Select>
              {hasError("supplier") && (
                <FormHelperText sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}>Supplier is required</FormHelperText>
              )}
              {formData.supplier && !hasError("supplier") && (() => {
                const supplierData = getSupplierByName(formData.supplier);
                return supplierData ? (
                  <Typography sx={{ fontSize: 11, color: "#2563eb", fontWeight: 600, mt: "4px" }}>
                    ✓ Supplier ID: {supplierData.id}
                  </Typography>
                ) : null;
              })()}
            </Box>
            <Box>
              <Typography sx={labelSx}>Deliver To <span style={{ color: "#ef4444" }}>*</span></Typography>
              <Select
                fullWidth displayEmpty size="small"
                value={formData.deliverTo}
                onChange={handleChange("deliverTo")}
                onBlur={handleBlur("deliverTo")}
                sx={selectSx(hasError("deliverTo"))}
                renderValue={(v) =>
                  v ? locations.find((l) => l.value === v)?.label
                    : <span style={{ color: "#9ca3af", fontSize: 13 }}>Select location…</span>
                }
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.value} value={loc.value} sx={{ fontSize: 13 }}>{loc.label}</MenuItem>
                ))}
              </Select>
              {hasError("deliverTo") && (
                <FormHelperText sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}>Delivery location is required</FormHelperText>
              )}
            </Box>
          </Box>

          {/* GPO + GPO Contract ID */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", mb: "12px" }}>
            <Box>
              <Typography sx={labelSx}>GPO</Typography>
              <Select
                fullWidth displayEmpty size="small"
                value={formData.gpo}
                onChange={(e) => {
                  setField("gpo", e.target.value);
                  if (!e.target.value) setField("gpoContractId", "");
                }}
                sx={selectSx(false)}
                renderValue={(v) =>
                  v ? gpoOptions.find((g) => g.value === v)?.label
                    : <span style={{ color: "#9ca3af", fontSize: 13 }}>Select GPO…</span>
                }
              >
                <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>— None —</MenuItem>
                {gpoOptions.map((g) => (
                  <MenuItem key={g.value} value={g.value} sx={{ fontSize: 13 }}>{g.label}</MenuItem>
                ))}
              </Select>
            </Box>
            {formData.gpo && (
              <Box>
                <Typography sx={labelSx}>GPO Contract ID</Typography>
                <TextField
                  fullWidth size="small"
                  placeholder="e.g. VIZ-2025-00123"
                  value={formData.gpoContractId}
                  onChange={handleChange("gpoContractId")}
                  sx={inputSx(false)}
                />
                <Typography sx={{ fontSize: 10, color: "#6b7280", mt: "3px" }}>
                  Ties item price to GPO contract
                </Typography>
              </Box>
            )}
          </Box>

          {/* Order Date + Required Delivery */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", mb: "12px" }}>
            <Box>
              <Typography sx={labelSx}>Order Date</Typography>
              <DateField value={formData.orderDate} onChange={(v) => setField("orderDate", v)} max={today} />
            </Box>
            <Box>
              <Typography sx={labelSx}>Required Delivery <span style={{ color: "#ef4444" }}>*</span></Typography>
              <DateField
                value={formData.requiredDelivery}
                onChange={(v) => { setField("requiredDelivery", v); setTouched((prev) => ({ ...prev, requiredDelivery: true })); }}
                hasError={hasError("requiredDelivery")}
                min={today}
              />
              {hasError("requiredDelivery") && (
                <FormHelperText sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}>Required delivery date is required</FormHelperText>
              )}
            </Box>
          </Box>

          {/* Priority */}
          <Box sx={{ mb: "20px" }}>
            <Typography sx={labelSx}>Priority</Typography>
            {initialIndentId ? (
              // Read-only pill when linked to an indent
              <Box
                sx={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  px: "12px", height: 36, borderRadius: "6px",
                  bgcolor: priorityBg(formData.priority),
                  border: `1px solid ${priorityBorder(formData.priority)}`,
                  width: "100%", boxSizing: "border-box",
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: priorityColor(formData.priority) }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: priorityColor(formData.priority) }}>
                  {formData.priority || "Low"}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#9ca3af", ml: "auto" }}>from indent</Typography>
              </Box>
            ) : (
              // Editable dropdown with colored dots
              <Select
                fullWidth size="small"
                value={formData.priority}
                onChange={handleChange("priority")}
                sx={selectSx(false)}
              >
                {priorities.map((p) => (
                  <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, bgcolor: priorityColor(p) }} />
                      {p}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>

          <Divider sx={{ mb: "20px" }} />

          {/* Line Items */}
          <Box sx={{ mb: "12px" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em", textTransform: "uppercase", mb: "12px" }}>
              Items
            </Typography>

            {/* Column headers */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: formData.indentId ? "90px minmax(0,2.5fr) 52px 76px 28px" : "minmax(0,2.5fr) 52px 76px 28px",
                gap: "4px", mb: "4px", px: "10px",
              }}
            >
              {(formData.indentId
                ? ["INDENT ID", "ITEM DESCRIPTION", "APPROVED QTY", "UNIT COST", ""]
                : ["ITEM DESCRIPTION", "REQUIRED QTY", "UNIT COST", ""]
              ).map((h) => (
                <Typography key={h} sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.04em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Line rows */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {formData.lineItems.map((item) => {
                const fromIndent = !!formData.indentId;
                return (
                  <Box
                    key={item.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: fromIndent ? "90px minmax(0,2.5fr) 52px 76px 28px" : "minmax(0,2.5fr) 52px 76px 28px",
                      gap: "6px", alignItems: "center",
                      p: "10px", borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      bgcolor: fromIndent ? "#f8faff" : "#fff",
                      "&:hover": { borderColor: "#bfdbfe" },
                      transition: "all 0.15s",
                    }}
                  >
                    {fromIndent && (
                      <Box sx={{ display: "inline-flex", alignItems: "center", bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", px: "6px", py: "4px", gap: "4px" }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#22c55e", flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#2563eb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {formData.indentId}
                        </Typography>
                      </Box>
                    )}
                    {!fromIndent ? (
                      <Autocomplete
                        size="small"
                        freeSolo
                        options={lineItemSuggestions[item.id] || []}
                        getOptionLabel={(option) => typeof option === 'string' ? option : (option.name || '')}
                        value={item.description}
                        onChange={(event, newValue) => {
                          if (newValue && typeof newValue === 'object' && newValue.name) {
                            handleSelectInventoryItem(item.id, newValue);
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              lineItems: prev.lineItems.map((lineItem) =>
                                lineItem.id === item.id ? { ...lineItem, description: newValue || '', _selectedInventoryItem: null } : lineItem
                              ),
                            }));
                          }
                        }}
                        onInputChange={(event, newValue) => {
                          setFormData((prev) => ({
                            ...prev,
                            lineItems: prev.lineItems.map((lineItem) =>
                              lineItem.id === item.id ? { ...lineItem, description: newValue } : lineItem
                            ),
                          }));
                          const matchingItems = inventoryItems.filter((invItem) =>
                            invItem.name && invItem.name.toLowerCase().includes(newValue.toLowerCase())
                          );
                          setLineItemSuggestions((prev) => ({ ...prev, [item.id]: matchingItems }));
                        }}
                        renderOption={(props, option) => (
                          <Box {...props} sx={{ p: 1 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{option.name}</Typography>
                            <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>
                              Stock: {option.qty || 0} | Cost: ${(option.cost || option.unitCost || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Search item from inventory" sx={rowFieldSx()} />
                        )}
                        ListboxProps={{
                          sx: {
                            "&::-webkit-scrollbar": { width: 6 },
                            "&::-webkit-scrollbar-track": { background: "transparent" },
                            "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: "3px", "&:hover": { background: "#9ca3af" } },
                            scrollbarWidth: "thin",
                            scrollbarColor: "#d1d5db transparent",
                          }
                        }}
                      />
                    ) : (
                      <TextField size="small" placeholder="Item description" value={item.description} disabled fullWidth sx={disabledInputSx} />
                    )}
                    <TextField
                      size="small" type="number"
                      value={item.quantity}
                      onChange={handleLineItemChange(item.id, "quantity")}
                      disabled={fromIndent}
                      inputProps={{ min: 1 }}
                      sx={fromIndent ? disabledInputSx : rowFieldSx({ textAlign: "center" })}
                    />
                    <TextField
                      size="small" type="number" placeholder="0.00"
                      value={item.unitCost}
                      onChange={handleLineItemChange(item.id, "unitCost")}
                      disabled={fromIndent}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={fromIndent ? disabledInputSx : { ...rowFieldSx(), "& .MuiInputBase-input": { textAlign: "right", py: "6px", px: "8px" } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeLineItem(item.id)}
                      disabled={formData.lineItems.length === 1 || fromIndent}
                      sx={{ color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px", width: 28, height: 28, bgcolor: "#fff", outline: "none", flexShrink: 0, "&:hover": { bgcolor: "#fef2f2" }, "&:focus": { outline: "none" }, "&.Mui-disabled": { borderColor: "#e5e7eb", color: "#d1d5db" } }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>

            {!formData.indentId && (
              <Button
                onClick={addLineItem} fullWidth disableRipple
                sx={{ mt: "6px", border: "1.5px dashed #bfdbfe", borderRadius: "8px", py: "6px", fontSize: 12, fontWeight: 600, color: "#2563eb", textTransform: "none", background: "transparent", outline: "none", "&:hover": { background: "#eff6ff", borderColor: "#93c5fd" }, "&:focus": { outline: "none" } }}
              >
                <AddIcon sx={{ fontSize: 14, mr: 0.5 }} /> Add Line
              </Button>
            )}

            {/* Total */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: "12px", pt: "12px", borderTop: "1px dashed #e5e7eb" }}>
              <Typography sx={{ fontSize: 13, color: "#6b7280", mr: 1 }}>Total Amount:</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
                ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: "12px" }} />

          {/* Notes */}
          <Box sx={{ mb: "12px" }}>
            <Typography sx={labelSx}>Notes</Typography>
            <TextField
              fullWidth multiline rows={2} size="small"
              value={formData.notes}
              onChange={handleChange("notes")}
              placeholder="Special delivery instructions…"
              sx={{ ...inputSx(false), "& .MuiInputBase-input": { py: "8px", px: "12px", fontSize: 13 } }}
            />
          </Box>
        </DialogContent>

        {/* ── Footer ── */}
        <Box sx={{ px: "20px", py: "12px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", bgcolor: "#fff", flexShrink: 0 }}>
          <Button onClick={handleClose} disableRipple sx={{ ...btnBase, color: "#374151", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>
            Cancel
          </Button>
          <Button startIcon={<DraftsIcon sx={{ fontSize: 15 }} />} onClick={() => handleSubmit(true)} disableRipple sx={{ ...btnBase, color: "#374151", border: "1px solid #e5e7eb", bgcolor: "#fff", "&:hover": { bgcolor: "#f9fafb" } }}>
            Draft
          </Button>
          <Button startIcon={<SaveIcon sx={{ fontSize: 15 }} />} onClick={() => handleSubmit(false)} disableRipple sx={{ ...btnBase, fontWeight: 700, color: "#fff", bgcolor: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", "&:hover": { bgcolor: "#1d4ed8" } }}>
            Submit PO
          </Button>
        </Box>
      </Dialog>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NewPO;