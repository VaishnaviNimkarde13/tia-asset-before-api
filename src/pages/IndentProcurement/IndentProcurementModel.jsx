import React, { useState, useEffect, useRef } from "react";
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
  Tooltip,
  FormHelperText,
  Paper,
  List,
  ListItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import { useInventory } from "../../contexts/InventoryContext";
import { useAuth } from "../../contexts/Authcontext";
import { getLocations, getDepartments } from "../../utils/locationUtils";

const TRANSFER_BASE_LOCATIONS = [
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

const DEPARTMENT_NAMES = [
  "Central Store",
  "Ward / Department Store",
  "Pharmacy",
  "Operation Theater",
  "Laboratory",
  "Clinic / OPD",
  "Branch Facility / Satellite Site",
  "ICU",
];

const loadStoreLocations = () => {
  try {
    const saved = localStorage.getItem("tia_locations");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const extraNames = parsed
          .map((l) => l.name)
          .filter(Boolean)
          .filter((name) => !DEPARTMENT_NAMES.includes(name));
        return [...new Set([...TRANSFER_BASE_LOCATIONS, ...extraNames])];
      }
    }
  } catch {
    /* ignore */
  }
  return TRANSFER_BASE_LOCATIONS;
};

const labelSx = {
  fontSize: 10,
  fontWeight: 700,
  color: "#6b7280",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  mb: 0.5,
  display: "block",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "6px",
    bgcolor: "#fff",
    "& fieldset": { borderColor: "#d1d5db" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": { py: "8px", px: "12px" },
  "& .MuiInputBase-input::placeholder": { color: "#9ca3af", opacity: 1 },
};

const disabledInputSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    bgcolor: "#f3f4f6",
    "& fieldset": { borderColor: "#e5e7eb" },
  },
};

const selectSx = {
  fontSize: 13,
  borderRadius: "6px",
  bgcolor: "#fff",
  "& fieldset": { borderColor: "#d1d5db" },
  "&:hover fieldset": { borderColor: "#9ca3af" },
  "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
  "& .MuiSelect-select": { py: "8px", px: "12px" },
};

const rowFieldSx = (extraInput = {}) => ({
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "6px",
    bgcolor: "#fff",
    "& fieldset": { borderColor: "#d1d5db" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": { py: "7px", px: "10px", ...extraInput },
  "& input[type=number]": { MozAppearance: "textfield" },
  "& input::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
  "& input::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
});

const btnBase = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "8px",
  px: "18px",
  py: "9px",
  outline: "none",
  "&:focus": { outline: "none" },
};

// Priority color helper
const priorityColor = (p) =>
  p === "Critical"
    ? "#ef4444"
    : p === "High"
      ? "#f59e0b"
      : p === "Medium"
        ? "#3b82f6"
        : "#22c55e"; // Low

// ── Read-only UOM badge ───────────────────────────────────────────────────
function UomBadge({ value }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "34px",
        px: "4px",
        borderRadius: "6px",
        bgcolor: value ? "#e0f2fe" : "#f9fafb",
        border: `1px solid ${value ? "#bae6fd" : "#e5e7eb"}`,
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: value ? 600 : 400,
          color: value ? "#0284c7" : "#9ca3af",
          whiteSpace: "nowrap",
        }}
      >
        {value || "Nos"}
      </Typography>
    </Box>
  );
}

function UomSelect({
  value,
  baseUom,
  purchaseUom,
  issueUom,
  onChange,
  colorScheme = "blue",
}) {
  const options = [
    ...new Set(
      [
        baseUom || "Nos",
        purchaseUom || baseUom || "Nos",
        issueUom || baseUom || "Nos",
      ].filter(Boolean),
    ),
  ];

  const colors = {
    blue: {
      bg: "#eff6ff",
      border: "#bfdbfe",
      text: "#2563eb",
      focus: "#2563eb",
    },
    green: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#16a34a",
      focus: "#16a34a",
    },
  };
  const c = colors[colorScheme] || colors.blue;

  return (
    <Select
      size="small"
      value={value || options[0]}
      onChange={(e) => onChange(e.target.value)}
      displayEmpty
      sx={{
        fontSize: 12,
        fontWeight: 600,
        borderRadius: "6px",
        bgcolor: c.bg,
        color: c.text,
        height: "34px",
        "& fieldset": { borderColor: c.border },
        "&:hover fieldset": { borderColor: c.focus },
        "&.Mui-focused fieldset": {
          borderColor: c.focus,
          borderWidth: "1.5px",
        },
        "& .MuiSelect-select": { py: "6px", px: "8px" },
        "& .MuiSvgIcon-root": { color: c.text, fontSize: 14 },
      }}
    >
      {options.map((opt) => (
        <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>
          {opt}
        </MenuItem>
      ))}
    </Select>
  );
}

function DateField({
  value,
  onChange,
  disabled = false,
  error = false,
  min,
  max,
}) {
  const ref = useRef(null);
  const openPicker = () => {
    if (disabled) return;
    try {
      ref.current?.showPicker();
    } catch {
      ref.current?.click();
    }
  };

  return (
    <Box
      onClick={openPicker}
      sx={{
        display: "flex",
        alignItems: "center",
        border: `1px solid ${error ? "#ef4444" : disabled ? "#e5e7eb" : "#d1d5db"}`,
        borderRadius: "6px",
        bgcolor: disabled ? "#f3f4f6" : "#fff",
        px: 1.5,
        height: 36,
        cursor: disabled ? "default" : "pointer",
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
        "&:hover": {
          borderColor: error ? "#ef4444" : disabled ? "#e5e7eb" : "#9ca3af",
        },
        "&:focus-within":
          !disabled && !error
            ? {
                borderColor: "#2563eb",
                outline: "2px solid #dbeafe",
                outlineOffset: "-1px",
              }
            : {},
        transition: "border-color 0.15s",
      }}
    >
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={min}
        max={max}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 13,
          color: value ? "#111827" : "#9ca3af",
          flex: 1,
          cursor: disabled ? "default" : "pointer",
          minWidth: 0,
          width: "100%",
          colorScheme: "light",
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0; position: absolute; right: 0; width: 40px; height: 100%; cursor: pointer;
        }
      `}</style>
      <CalendarTodayOutlinedIcon
        sx={{
          fontSize: 14,
          color: error ? "#ef4444" : "#9ca3af",
          flexShrink: 0,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}

function ItemSearchField({ value, inventoryItems, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered =
    query.trim().length > 0
      ? inventoryItems
          .filter((it) => it.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
      : [];

  const handleSelect = (item) => {
    setQuery(item.name);
    setOpen(false);
    onSelect(item);
  };

  return (
    <Box ref={wrapRef} sx={{ position: "relative", width: "100%" }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Search item…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        InputProps={{
          startAdornment: (
            <SearchIcon
              sx={{ fontSize: 14, color: "#9ca3af", mr: "6px", flexShrink: 0 }}
            />
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            fontSize: 13,
            borderRadius: "6px",
            bgcolor: "#fff",
            "& fieldset": { borderColor: "#d1d5db" },
            "&:hover fieldset": { borderColor: "#9ca3af" },
            "&.Mui-focused fieldset": {
              borderColor: "#2563eb",
              borderWidth: "1.5px",
            },
          },
          "& .MuiInputBase-input": { py: "7px", px: "8px" },
        }}
      />
      {open && filtered.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <List dense disablePadding>
            {filtered.map((item) => (
              <ListItem
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                sx={{
                  px: "12px",
                  py: "8px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f3f4f6",
                  "&:last-child": { borderBottom: "none" },
                  "&:hover": { bgcolor: "#eff6ff" },
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Typography
                  sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                >
                  {item.name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: "6px",
                    mt: "2px",
                    flexWrap: "wrap",
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                    {item.category}
                  </Typography>
                  {item.uom && (
                    <>
                      <Typography sx={{ fontSize: 11, color: "#d1d5db" }}>
                        ·
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11, color: "#0284c7", fontWeight: 600 }}
                      >
                        Base: {item.uom}
                      </Typography>
                    </>
                  )}
                  {item.purchaseUom && item.purchaseUom !== item.uom && (
                    <>
                      <Typography sx={{ fontSize: 11, color: "#d1d5db" }}>
                        ·
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}
                      >
                        Pur: {item.purchaseUom}
                      </Typography>
                    </>
                  )}
                  {item.issueUom && item.issueUom !== item.uom && (
                    <>
                      <Typography sx={{ fontSize: 11, color: "#d1d5db" }}>
                        ·
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}
                      >
                        Issue: {item.issueUom}
                      </Typography>
                    </>
                  )}
                  <Typography sx={{ fontSize: 11, color: "#d1d5db" }}>
                    ·
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                    Stock: {item.qty}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}

const makeItem = (id) => ({
  id,
  itemName: "",
  description: "",
  uom: "",
  qtyReq: 1,
  currStock: "",
  category: "Raw Material",
});

const makeIssuedItem = (id) => ({
  id,
  itemName: "",
  baseUom: "",
  purchaseUom: "",
  issueUom: "",
  qtyIssued: 1,
  batchNo: "",
  remarks: "",
});

const makeTransferItem = (id) => ({
  id,
  itemName: "",
  baseUom: "",
  purchaseUom: "",
  issueUom: "",
  qtyTransfer: 1,
  batchNo: "",
  remarks: "",
});

const IndentProcurementModal = ({
  open,
  onClose,
  onSave,
  onSaveAsDraft,
  initialData = null,
}) => {
  const { items: inventoryItems } = useInventory();
  const { currentUser } = useAuth();
  const today = dayjs().format("YYYY-MM-DD");
  const [locations, setLocations] = useState(() => getLocations());
  const [storeLocations, setStoreLocations] = useState(() =>
    loadStoreLocations(),
  );
  const [departments, setDepartments] = useState(() => getDepartments());

  useEffect(() => {
    if (open) {
      setLocations(getLocations());
      setStoreLocations(loadStoreLocations());
      setDepartments(getDepartments());
    }
  }, [open]);

  useEffect(() => {
    const onLocationsUpdated = () => {
      if (open) setLocations(getLocations());
    };
    const onStoreLocationsUpdated = () => {
      if (open) setStoreLocations(loadStoreLocations());
    };
    const onDepartmentsUpdated = () => {
      if (open) setDepartments(getDepartments());
    };
    window.addEventListener("locationsUpdated", onLocationsUpdated);
    window.addEventListener("storeLocationsUpdated", onStoreLocationsUpdated);
    window.addEventListener("departmentsUpdated", onDepartmentsUpdated);
    return () => {
      window.removeEventListener("locationsUpdated", onLocationsUpdated);
      window.removeEventListener(
        "storeLocationsUpdated",
        onStoreLocationsUpdated,
      );
      window.removeEventListener("departmentsUpdated", onDepartmentsUpdated);
    };
  }, [open]);

  const defaultForm = () => ({
    indentNo: "",
    indentDate: dayjs().format("YYYY-MM-DD"),
    indentType: "Select",
    location: "",
    department: "",
    requiredBy: "",
    priority: "Low",
    requestedBy: "",
    purposeRemarks: "",
    lineItems: [makeItem(1), makeItem(2)],
    issueNumber: "",
    issueType: "Internal Issue",
    issueFrom: "",
    issueTo: "",
    authorisedBy: "",
    issueDate: dayjs().format("YYYY-MM-DD"),
    issuedItems: [makeIssuedItem(1)],
    transferNumber: "",
    transferFrom: "",
    transferTo: "",
    transferDate: dayjs().format("YYYY-MM-DD"),
    transferAuthorisedBy: "",
    transferItems: [makeTransferItem(1)],
  });

  const [formData, setFormData] = useState(defaultForm());
  const [touched, setTouched] = useState({
    department: false,
    location: false,
    requiredBy: false,
    requestedBy: false,
    lineItems: false,
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          indentType: initialData.indentType || "Select",
          location: initialData.location || "",
          lineItems: initialData.lineItems?.length
            ? initialData.lineItems
            : [makeItem(1), makeItem(2)],
          requestedBy:
            initialData.requestedBy ||
            currentUser?.displayName ||
            currentUser?.name ||
            currentUser?.email ||
            currentUser?.role ||
            "",
        });
        setTouched({
          department: !!initialData.department,
          location: !!initialData.location,
          requiredBy: !!initialData.requiredBy,
          requestedBy: true,
        });
      } else {
        const no = `IND-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
        const requestedByValue =
          currentUser?.displayName ||
          currentUser?.name ||
          currentUser?.email ||
          currentUser?.role ||
          "";
        setFormData({
          ...defaultForm(),
          indentNo: no,
          location: currentUser?.locationName || "",
          department: currentUser?.department || "",
          requestedBy: requestedByValue,
        });
        setTouched({
          department: !!currentUser?.department,
          location: !!currentUser?.locationName,
          requiredBy: false,
          requestedBy: true,
          lineItems: false,
        });
      }
    }
  }, [open, initialData, currentUser]);

  useEffect(() => {
    if (formData.indentType === "Stock Issue") {
      if (
        !formData.indentNo ||
        formData.indentNo.startsWith("IND-") ||
        formData.indentNo.startsWith("TRF-")
      ) {
        setFormData((prev) => ({
          ...prev,
          indentNo: `ISS-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        }));
      }
      if (!formData.issueNumber) {
        setFormData((prev) => ({
          ...prev,
          issueNumber: `ISS-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        }));
      }
    }
    if (formData.indentType === "Stock Transfer") {
      if (
        !formData.indentNo ||
        formData.indentNo.startsWith("IND-") ||
        formData.indentNo.startsWith("ISS-")
      ) {
        setFormData((prev) => ({
          ...prev,
          indentNo: `TRF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        }));
      }
      if (!formData.transferNumber) {
        setFormData((prev) => ({
          ...prev,
          transferNumber: `TRF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        }));
      }
    }
    if (
      formData.indentType !== "Stock Issue" &&
      formData.indentType !== "Stock Transfer" &&
      formData.indentType !== "Select"
    ) {
      if (
        formData.indentNo.startsWith("ISS-") ||
        formData.indentNo.startsWith("TRF-")
      ) {
        setFormData((prev) => ({
          ...prev,
          indentNo: `IND-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
        }));
      }
    }
  }, [formData.indentType]);

  const setField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const handleChange = (field) => (e) => {
    setField(field, e.target.value);
    if (touched[field] === false)
      setTouched((prev) => ({ ...prev, [field]: true }));
  };
  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const updateItem = (id, field, value) =>
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((it) =>
        it.id === id ? { ...it, [field]: value } : it,
      ),
    }));
  const addItem = () => {
    const newId = Math.max(...formData.lineItems.map((it) => it.id), 0) + 1;
    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, makeItem(newId)],
    }));
  };
  const removeItem = (id) => {
    if (formData.lineItems.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((it) => it.id !== id),
    }));
  };

  const addIssuedItem = () => {
    const newId =
      Math.max(...(formData.issuedItems || []).map((it) => it.id), 0) + 1;
    setFormData((prev) => ({
      ...prev,
      issuedItems: [...(prev.issuedItems || []), makeIssuedItem(newId)],
    }));
  };
  const removeIssuedItem = (id) => {
    if ((formData.issuedItems || []).length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      issuedItems: (prev.issuedItems || []).filter((it) => it.id !== id),
    }));
  };
  const updateIssuedItem = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      issuedItems: (prev.issuedItems || []).map((it) => {
        if (it.id !== id) return it;
        if (field === "itemName") {
          const inv = inventoryItems.find((i) => i.name === value);
          const baseUom = inv?.uom || "";
          const purchaseUom = inv?.purchaseUom || baseUom;
          const issueUom = inv?.issueUom || baseUom;
          return { ...it, itemName: value, baseUom, purchaseUom, issueUom };
        }
        return { ...it, [field]: value };
      }),
    }));
  };

  const addTransferItem = () => {
    const newId =
      Math.max(...(formData.transferItems || []).map((it) => it.id), 0) + 1;
    setFormData((prev) => ({
      ...prev,
      transferItems: [...(prev.transferItems || []), makeTransferItem(newId)],
    }));
  };
  const removeTransferItem = (id) => {
    if ((formData.transferItems || []).length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      transferItems: (prev.transferItems || []).filter((it) => it.id !== id),
    }));
  };
  const updateTransferItem = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      transferItems: (prev.transferItems || []).map((it) => {
        if (it.id !== id) return it;
        if (field === "itemName") {
          const inv = inventoryItems.find((i) => i.name === value);
          const baseUom = inv?.uom || "";
          const purchaseUom = inv?.purchaseUom || baseUom;
          const issueUom = inv?.issueUom || baseUom;
          return { ...it, itemName: value, baseUom, purchaseUom, issueUom };
        }
        return { ...it, [field]: value };
      }),
    }));
  };

  const selectInventoryItem = (lineItemId, inv) => {
    const categoryMap = {
      Pharmaceuticals: "Medicine",
      "PPE & Protective": "Consumable",
      "Wound Care": "Consumable",
      "Lab Supplies": "Consumable",
      Equipment: "Equipment",
      "Equipment/Devices": "Equipment",
    };
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((it) =>
        it.id !== lineItemId
          ? it
          : {
              ...it,
              itemName: inv.name,
              description: inv.subcategory || inv.category || "",
              uom: inv.purchaseUom || inv.uom || "Nos",
              baseUom: inv.uom || "Nos",
              currStock: String(inv.qty ?? ""),
              category: categoryMap[inv.category] || "Raw Material",
              lotNumber: inv.lot || "",
            },
      ),
    }));
  };

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    const no = `IND-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
    const requestedByValue =
      currentUser?.displayName ||
      currentUser?.name ||
      currentUser?.email ||
      currentUser?.role ||
      "";
    setFormData({
      ...defaultForm(),
      indentNo: no,
      location: currentUser?.locationName || "",
      department: currentUser?.department || "",
      requestedBy: requestedByValue,
    });
    setTouched({
      department: !!currentUser?.department,
      location: !!currentUser?.locationName,
      requiredBy: false,
      requestedBy: true,
      lineItems: false,
    });
  };

  const handleSubmit = (isDraft = false) => {
    console.log("=== SUBMIT DEBUG ===");
    console.log("isDraft:", isDraft);
    console.log("indentType:", formData.indentType);
    console.log("formData:", formData);

    setTouched({
      department: true,
      location: true,
      requiredBy: true,
      requestedBy: true,
      lineItems: true,
      issueNumber: true,
      issueFrom: true,
      issueTo: true,
      issueDate: true,
      transferNumber: true,
      transferFrom: true,
      transferTo: true,
      transferDate: true,
    });

    if (!isDraft) {
      const isIssueOrTransfer =
        formData.indentType === "Stock Issue" ||
        formData.indentType === "Stock Transfer";

      const hasBaseErrors = isIssueOrTransfer
        ? !formData.requestedBy
        : !formData.department ||
          !formData.location ||
          !formData.requiredBy ||
          !formData.requestedBy;

      console.log("isIssueOrTransfer:", isIssueOrTransfer);
      console.log("hasBaseErrors:", hasBaseErrors);

      if (hasBaseErrors) {
        console.log("❌ Failed: Base field validation");
        return;
      }

      if (
        formData.indentType === "Stock Issue" &&
        (!formData.issueFrom?.trim() ||
          !formData.issueTo?.trim() ||
          !formData.issueDate)
      ) {
        console.log("❌ Failed: Stock Issue validation");
        return;
      }

      if (
        formData.indentType === "Stock Transfer" &&
        (!formData.transferFrom?.trim() ||
          !formData.transferTo?.trim() ||
          !formData.transferDate)
      ) {
        console.log("❌ Failed: Stock Transfer validation");
        return;
      }
    }

    const isStockIssue = formData.indentType === "Stock Issue";
    const isStockTransfer = formData.indentType === "Stock Transfer";
    const isNewAcquisition = formData.indentType === "New Acquisition";
    const validItems = isStockIssue
      ? (formData.issuedItems || []).filter((it) => it.itemName?.trim() !== "")
      : isStockTransfer
        ? (formData.transferItems || []).filter(
            (it) => it.itemName?.trim() !== "",
          )
        : isNewAcquisition
          ? formData.lineItems.filter((it) => it.itemName.trim() !== "")
          : formData.lineItems.filter((it) => it.itemName.trim() !== "");

    if (!isDraft && validItems.length === 0) {
      console.log("❌ Failed: No valid items");
      setTouched((prev) => ({ ...prev, lineItems: true }));
      return;
    }

    const payload = {
      ...formData,
      lineItems: isStockIssue
        ? formData.issuedItems || []
        : isStockTransfer
          ? formData.transferItems || []
          : validItems,
      status: isDraft ? "Draft" : "Pending Approval",
    };

    console.log("✅ Payload ready:", payload);

    if (isDraft && onSaveAsDraft) {
      onSaveAsDraft(payload);
    } else if (onSave) {
      onSave(payload);
    }
    handleClose();
  };

  const handleClose = () => {
    setFormData(defaultForm());
    setTouched({
      department: false,
      location: false,
      requiredBy: false,
      requestedBy: false,
      lineItems: false,
    });
    onClose();
  };

  const hasError = (field) => touched[field] && !formData[field];

  // ── Options ────────────────────────────────────────────────────────────
  const departmentsList = currentUser?.department
    ? departments.filter((d) => d === currentUser.department)
    : departments;
  const locationsList = currentUser?.locationName
    ? locations.filter((l) => l === currentUser.locationName)
    : locations;
  const priorities = ["Low", "Medium", "High", "Critical"];
  const indentTypes = ["Stock Issue", "Stock Transfer", "New Acquisition"];
  const categories = [
    "Raw Material",
    "Consumable",
    "Equipment",
    "Medicine",
    "Stationery",
    "Other",
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
              background: "#fff7ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 20, color: "#ea580c" }} />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}
            >
              {formData.indentType === "Stock Issue"
                ? "New Stock Issue"
                : formData.indentType === "Stock Transfer"
                  ? "New Stock Transfer"
                  : "New Indent"}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          disableRipple
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            width: 30,
            height: 30,
            outline: "none",
            "&:hover": { background: "#f3f4f6", color: "#374151" },
            "&:focus": { outline: "none" },
          }}
        >
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* ── Required fields info ── */}
      <Box sx={{ px: "24px", pt: "12px", pb: 0 }}>
        <Typography
          sx={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", mb: 1 }}
        >
          <span style={{ color: "#ef4444" }}>*</span> Required fields
        </Typography>
      </Box>

      {/* ── Scrollable body ── */}
      <DialogContent
        sx={{
          px: "24px",
          py: "20px",
          overflowY: "auto",
          flex: 1,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
          scrollbarWidth: "thin",
          scrollbarColor: "#d1d5db transparent",
        }}
      >
        {/* ── INDENT DETAILS section ── */}
        <Box
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            p: "16px",
            mb: "20px",
            bgcolor: "#fafafa",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              mb: "14px",
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "4px",
                bgcolor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              📋
            </Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 800,
                color: "#374151",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Indent Details
            </Typography>
          </Box>

          {/* ── Row 1 — 2 columns: Indent Number | Date ── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              mb: "12px",
            }}
          >
            {/* Col 1 — Indent No. */}
            <Box>
              <Typography sx={labelSx}>Indent No.</Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.indentNo}
                disabled
                sx={disabledInputSx}
                inputProps={{ style: { color: "#6b7280", fontSize: 13 } }}
              />
            </Box>

            {/* Col 2 — Date */}
            <Box>
              <Typography sx={labelSx}>Date</Typography>
              <DateField
                value={formData.indentDate}
                onChange={(v) => setField("indentDate", v)}
                max={today}
                disabled
              />
            </Box>
          </Box>

          {/* ── Stock Issue fields — Row 2: Issue Type | Issue From | Issue To ── */}
          {formData.indentType === "Stock Issue" && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  mb: "12px",
                }}
              >
                <Box>
                  <Typography sx={labelSx}>Issue Type</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.issueType || "Internal Issue"}
                    onChange={handleChange("issueType")}
                    sx={selectSx}
                  >
                    {[
                      "Internal Issue",
                      "Patient Dispensing",
                      "Department Transfer",
                      "Emergency Issue",
                      "Return to Supplier",
                      "Wastage / Disposal",
                    ].map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Typography sx={labelSx}>
                    Issue From (Store){" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.issueFrom}
                    onChange={handleChange("issueFrom")}
                    sx={{
                      ...selectSx,
                      ...(touched.issueFrom &&
                        !formData.issueFrom?.trim() && {
                          "& fieldset": { borderColor: "#ef4444" },
                          "&:hover fieldset": { borderColor: "#ef4444" },
                        }),
                    }}
                    renderValue={(v) =>
                      v || (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          Select
                        </span>
                      )
                    }
                  >
                    {departments.map((l) => (
                      <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>
                        {l}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.issueFrom && !formData.issueFrom?.trim() && (
                    <Typography
                      sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}
                    >
                      Required
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography sx={labelSx}>
                    Issue To (Dept / Ward){" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.issueTo}
                    onChange={handleChange("issueTo")}
                    sx={{
                      ...selectSx,
                      ...(touched.issueTo &&
                        !formData.issueTo?.trim() && {
                          "& fieldset": { borderColor: "#ef4444" },
                          "&:hover fieldset": { borderColor: "#ef4444" },
                        }),
                    }}
                    renderValue={(v) =>
                      v || (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          Select
                        </span>
                      )
                    }
                  >
                    {departments.map((d) => (
                      <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.issueTo && !formData.issueTo?.trim() && (
                    <Typography
                      sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}
                    >
                      Required
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Row 3: Requested By */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  mb: "12px",
                }}
              >
                <Box>
                  <Typography sx={labelSx}>
                    Requested By <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Name / Employee ID"
                    value={formData.requestedBy}
                    disabled
                    sx={disabledInputSx}
                  />
                </Box>
              </Box>
            </>
          )}

          {/* ── Stock Transfer fields — Row 2: Priority | From Location | To Location ── */}
          {formData.indentType === "Stock Transfer" && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  mb: "12px",
                }}
              >
                <Box>
                  <Typography sx={labelSx}>Priority</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.priority}
                    onChange={handleChange("priority")}
                    sx={selectSx}
                  >
                    {priorities.map((p) => (
                      <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              flexShrink: 0,
                              bgcolor: priorityColor(p),
                            }}
                          />
                          {p}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Typography sx={labelSx}>
                    From Location <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.transferFrom}
                    onChange={handleChange("transferFrom")}
                    sx={{
                      ...selectSx,
                      ...(touched.transferFrom &&
                        !formData.transferFrom?.trim() && {
                          "& fieldset": { borderColor: "#ef4444" },
                          "&:hover fieldset": { borderColor: "#ef4444" },
                        }),
                    }}
                    renderValue={(v) =>
                      v || (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          Select
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
                  {touched.transferFrom && !formData.transferFrom?.trim() && (
                    <Typography
                      sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}
                    >
                      Required
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography sx={labelSx}>
                    To Location <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.transferTo}
                    onChange={handleChange("transferTo")}
                    sx={{
                      ...selectSx,
                      ...(touched.transferTo &&
                        !formData.transferTo?.trim() && {
                          "& fieldset": { borderColor: "#ef4444" },
                          "&:hover fieldset": { borderColor: "#ef4444" },
                        }),
                    }}
                    renderValue={(v) =>
                      v || (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          Select
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
                  {touched.transferTo && !formData.transferTo?.trim() && (
                    <Typography
                      sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}
                    >
                      Required
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Row 3: Requested By */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  mb: "12px",
                }}
              >
                <Box>
                  <Typography sx={labelSx}>
                    Requested By <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Name / Employee ID"
                    value={formData.requestedBy}
                    disabled
                    sx={disabledInputSx}
                  />
                </Box>
              </Box>
            </>
          )}

          {/* All other types — Department, Location, etc. */}
          {formData.indentType !== "Stock Issue" &&
            formData.indentType !== "Stock Transfer" && (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    mb: "12px",
                  }}
                >
                  <Box>
                    <Typography sx={labelSx}>
                      Department <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      displayEmpty
                      size="small"
                      value={formData.department}
                      onChange={handleChange("department")}
                      onBlur={handleBlur("department")}
                      sx={{
                        ...selectSx,
                        ...(hasError("department") && {
                          "& fieldset": { borderColor: "#ef4444" },
                          "&:hover fieldset": { borderColor: "#ef4444" },
                        }),
                      }}
                      renderValue={(v) =>
                        v || (
                          <span style={{ color: "#9ca3af", fontSize: 13 }}>
                            Select
                          </span>
                        )
                      }
                    >
                      {departmentsList.map((d) => (
                        <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>
                          {d}
                        </MenuItem>
                      ))}
                    </Select>
                    {hasError("department") && (
                      <FormHelperText
                        sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                      >
                        Department is required
                      </FormHelperText>
                    )}
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>
                      Required by Date{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <DateField
                      value={formData.requiredBy}
                      onChange={(v) => {
                        setField("requiredBy", v);
                        setTouched((prev) => ({ ...prev, requiredBy: true }));
                      }}
                      error={hasError("requiredBy")}
                      min={today}
                    />
                    {hasError("requiredBy") && (
                      <FormHelperText
                        sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                      >
                        Required By date is required
                      </FormHelperText>
                    )}
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>Priority</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={formData.priority}
                      onChange={handleChange("priority")}
                      sx={selectSx}
                    >
                      {priorities.map((p) => (
                        <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                flexShrink: 0,
                                bgcolor: priorityColor(p),
                              }}
                            />
                            {p}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                    mb: "12px",
                  }}
                >
                  <Box>
                    <Typography sx={labelSx}>
                      Location / Store{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      displayEmpty
                      size="small"
                      value={formData.location}
                      onChange={handleChange("location")}
                      onBlur={handleBlur("location")}
                      sx={{
                        ...selectSx,
                        ...(hasError("location") && {
                          "& fieldset": { borderColor: "#ef4444" },
                          "&:hover fieldset": { borderColor: "#ef4444" },
                        }),
                      }}
                      renderValue={(v) =>
                        v || (
                          <span style={{ color: "#9ca3af", fontSize: 13 }}>
                            Select
                          </span>
                        )
                      }
                    >
                      {locationsList.map((loc) => (
                        <MenuItem key={loc} value={loc} sx={{ fontSize: 13 }}>
                          {loc}
                        </MenuItem>
                      ))}
                    </Select>
                    {hasError("location") && (
                      <FormHelperText
                        sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                      >
                        Location is required
                      </FormHelperText>
                    )}
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>
                      Requested By <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Name / Employee ID"
                      value={formData.requestedBy}
                      disabled
                      sx={disabledInputSx}
                    />
                  </Box>
                </Box>
              </>
            )}

          {/* Purpose / Remarks */}
          <Box sx={{ mt: "12px" }}>
            <Typography sx={labelSx}>Purpose / Remarks</Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              value={formData.purposeRemarks}
              onChange={handleChange("purposeRemarks")}
              placeholder="Reason for indent, current stock level, usage details…"
              sx={{
                ...inputSx,
                "& .MuiInputBase-input": {
                  py: "8px",
                  px: "12px",
                  fontSize: 13,
                },
              }}
            />
          </Box>
        </Box>

        {/* ── MATERIAL ITEMS — non-issue/transfer types ── */}
        {formData.indentType !== "Stock Issue" &&
          formData.indentType !== "Stock Transfer" && (
            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                p: "16px",
                bgcolor: "#fafafa",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: "10px",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "4px",
                      bgcolor: "#ffedd5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                    }}
                  >
                    🧱
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#374151",
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                    }}
                  >
                    Material Items
                  </Typography>
                </Box>
                <Button
                  onClick={addItem}
                  disableRipple
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2563eb",
                    textTransform: "none",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    px: "12px",
                    py: "5px",
                    bgcolor: "#eff6ff",
                    outline: "none",
                    "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" },
                    "&:focus": { outline: "none" },
                  }}
                >
                  Add Item
                </Button>
              </Box>

              {/* UOM legend */}
              <Box
                sx={{
                  display: "flex",
                  gap: "16px",
                  mb: "10px",
                  px: "2px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  {
                    bg: "#e0f2fe",
                    border: "#bae6fd",
                    label: "Base UOM — unit stock is kept in",
                  },
                  {
                    bg: "#fef3c7",
                    border: "#fcd34d",
                    label: "Purchase UOM — unit for procurement (editable)",
                  },
                ].map((leg) => (
                  <Box
                    key={leg.label}
                    sx={{ display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "2px",
                        bgcolor: leg.bg,
                        border: `1px solid ${leg.border}`,
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
                      {leg.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Column headers */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0,1.6fr) 88px 100px 72px 72px 32px",
                  gap: "8px",
                  mb: "8px",
                  px: "2px",
                }}
              >
                {[
                  "ITEM",
                  "AVAIL.",
                  "PURCHASE UOM",
                  "QTY REQ.",
                  "REMARKS",
                  "",
                ].map((h) => (
                  <Typography
                    key={h}
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#9ca3af",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </Typography>
                ))}
              </Box>

              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {formData.lineItems.map((item) => {
                  const invItem = inventoryItems.find(
                    (i) => i.name === item.itemName,
                  );
                  const qty = parseFloat(item.qtyReq) || 0;
                  const purchaseUom =
                    item.uom || invItem?.purchaseUom || invItem?.uom;
                  const baseUom = item.baseUom || invItem?.uom;
                  const availableQty = invItem?.qty ?? 0;
                  const conversionFactor =
                    invItem?.purchaseToBaseConversion || 1;
                  const convertedQty = qty * conversionFactor;

                  const conversionDisplay =
                    qty > 0 && purchaseUom && baseUom && purchaseUom !== baseUom
                      ? `${qty} ${purchaseUom} = ${convertedQty} ${baseUom}`
                      : null;

                  const isInsufficientStock =
                    qty > 0 && invItem && convertedQty > availableQty;

                  return (
                    <Box key={item.id}>
                      {isInsufficientStock && (
                        <Box
                          sx={{
                            mb: "6px",
                            p: "8px 10px",
                            borderRadius: "6px",
                            bgcolor: "#fef2f2",
                            border: "1px solid #fecaca",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Box sx={{ fontSize: 16 }}>⚠️</Box>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#dc2626",
                                mb: "2px",
                              }}
                            >
                              Insufficient Stock
                            </Typography>
                            <Typography sx={{ fontSize: 10, color: "#991b1b" }}>
                              Requested: {convertedQty} {baseUom} | Available:{" "}
                              {availableQty} {baseUom} | Shortage:{" "}
                              {Math.round((convertedQty - availableQty) * 100) /
                                100}{" "}
                              {baseUom}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0,1.6fr) 88px 100px 72px 72px 32px",
                          gap: "8px",
                          alignItems: "flex-start",
                          p: "8px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${isInsufficientStock ? "#fecaca" : "#e5e7eb"}`,
                          bgcolor: "#fff",
                          "&:hover": {
                            borderColor: isInsufficientStock
                              ? "#fecaca"
                              : "#bfdbfe",
                            bgcolor: isInsufficientStock
                              ? "#fff5f5"
                              : "#f8faff",
                          },
                          transition: "all 0.15s",
                        }}
                      >
                        <ItemSearchField
                          value={item.itemName}
                          inventoryItems={inventoryItems}
                          onSelect={(inv) => selectInventoryItem(item.id, inv)}
                        />

                        <TextField
                          size="small"
                          value={invItem ? invItem.qty : ""}
                          disabled
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              fontSize: 13,
                              borderRadius: "6px",
                              bgcolor: "#f3f4f6",
                              "& fieldset": { borderColor: "#e5e7eb" },
                            },
                            "& input": {
                              textAlign: "center",
                              color: "#374151",
                              fontWeight: 600,
                              py: "6px",
                            },
                          }}
                        />

                        <UomSelect
                          value={item.uom}
                          baseUom={item.baseUom || invItem?.uom}
                          purchaseUom={item.uom || invItem?.purchaseUom}
                          issueUom={item.issueUom || invItem?.issueUom}
                          onChange={(v) => updateItem(item.id, "uom", v)}
                          colorScheme="green"
                        />

                        <Box>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Qty"
                            value={item.qtyReq === 0 ? "" : item.qtyReq}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "qtyReq",
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value) || 1,
                              )
                            }
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value);
                              updateItem(
                                item.id,
                                "qtyReq",
                                isNaN(v) || v < 1 ? 1 : v,
                              );
                            }}
                            inputProps={{ min: 1 }}
                            sx={{
                              "& input[type=number]": {
                                MozAppearance: "textfield",
                              },
                              "& input::-webkit-outer-spin-button": {
                                WebkitAppearance: "none",
                              },
                              "& input::-webkit-inner-spin-button": {
                                WebkitAppearance: "none",
                              },
                              "& .MuiOutlinedInput-root": {
                                fontSize: 13,
                                borderRadius: "6px",
                                bgcolor: isInsufficientStock
                                  ? "#fef2f2"
                                  : "#f9fafb",
                                "& fieldset": {
                                  borderColor: isInsufficientStock
                                    ? "#fecaca"
                                    : "#e5e7eb",
                                },
                                "&:hover fieldset": {
                                  borderColor: isInsufficientStock
                                    ? "#fecaca"
                                    : "#d1d5db",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: isInsufficientStock
                                    ? "#dc2626"
                                    : "#2563eb",
                                },
                              },
                              "& input": { py: "6px", textAlign: "center" },
                            }}
                          />
                          {conversionDisplay && (
                            <Box sx={{ mt: "5px" }}>
                              <Typography
                                sx={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: "#6b7280",
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  mb: "2px",
                                  textAlign: "center",
                                }}
                              >
                                Conversion
                              </Typography>
                              <Box
                                sx={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textAlign: "center",
                                  lineHeight: 1.3,
                                  borderRadius: "4px",
                                  px: "4px",
                                  py: "3px",
                                  bgcolor: isInsufficientStock
                                    ? "#fef2f2"
                                    : "#e0f2fe",
                                  color: isInsufficientStock
                                    ? "#b91c1c"
                                    : "#0369A1",
                                  border: `1px solid ${isInsufficientStock ? "#fecaca" : "#bae6fd"}`,
                                }}
                              >
                                {conversionDisplay}
                              </Box>
                            </Box>
                          )}
                        </Box>

                        <TextField
                          size="small"
                          placeholder="Remarks"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          sx={rowFieldSx()}
                        />

                        <IconButton
                          size="small"
                          onClick={() => removeItem(item.id)}
                          disabled={formData.lineItems.length === 1}
                          sx={{
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            width: 28,
                            height: 28,
                            bgcolor: "#fff",
                            outline: "none",
                            mt: "3px",
                            "&:hover": { bgcolor: "#fef2f2" },
                            "&:focus": { outline: "none" },
                            "&.Mui-disabled": {
                              borderColor: "#e5e7eb",
                              color: "#d1d5db",
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

              {touched.lineItems &&
                formData.lineItems.every((it) => !it.itemName?.trim()) && (
                  <Box
                    sx={{
                      mt: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
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
                      At least one item must be selected before submitting
                    </Typography>
                  </Box>
                )}
            </Box>
          )}

        {/* ── ISSUED ITEMS — Stock Issue only ── */}
        {formData.indentType === "Stock Issue" && (
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              p: "16px",
              bgcolor: "#fafafa",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "10px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "4px",
                    bgcolor: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                  }}
                >
                  📦
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#374151",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Issued Items
                </Typography>
              </Box>
              <Button
                onClick={addIssuedItem}
                disableRipple
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#2563eb",
                  textTransform: "none",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  px: "12px",
                  py: "5px",
                  bgcolor: "#eff6ff",
                  outline: "none",
                  "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" },
                  "&:focus": { outline: "none" },
                }}
              >
                Add Item
              </Button>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: "16px",
                mb: "10px",
                px: "2px",
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  bg: "#e0f2fe",
                  border: "#bae6fd",
                  label: "Base UOM — unit stock is kept in",
                },
                {
                  bg: "#eff6ff",
                  border: "#bfdbfe",
                  label: "Issue UOM — unit used when issuing (editable)",
                },
              ].map((leg) => (
                <Box
                  key={leg.label}
                  sx={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "2px",
                      bgcolor: leg.bg,
                      border: `1px solid ${leg.border}`,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
                    {leg.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0,1.6fr) 88px 100px 72px 72px 32px",
                gap: "8px",
                mb: "8px",
                px: "2px",
              }}
            >
              {["ITEM", "AVAIL.", "LOT #", "ISSUE UOM", "QTY", ""].map((h) => (
                <Typography
                  key={h}
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#9ca3af",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(formData.issuedItems || []).map((item) => {
                const invItem = inventoryItems.find(
                  (i) => i.name === item.itemName,
                );
                const qty = parseFloat(item.qtyIssued) || 0;
                const issueUom =
                  item.issueUom || invItem?.issueUom || invItem?.uom;
                const baseUom = item.baseUom || invItem?.uom;
                const availableQty = invItem?.qty ?? 0;
                const conversionFactor = invItem?.issueToBaseConversion || 1;
                const convertedQty = qty * conversionFactor;
                const conversionDisplay =
                  qty > 0 && issueUom && baseUom && issueUom !== baseUom
                    ? `${qty} ${issueUom} = ${convertedQty} ${baseUom}`
                    : null;
                const isOverStock =
                  qty > 0 && invItem && convertedQty > availableQty;
                const remainingAfter = availableQty - convertedQty;

                return (
                  <Box key={item.id}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0,1.6fr) 88px 100px 72px 72px 32px",
                        gap: "8px",
                        alignItems: "flex-start",
                        p: "8px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${isOverStock ? "#fca5a5" : "#e5e7eb"}`,
                        bgcolor: "#fff",
                        "&:hover": {
                          borderColor: isOverStock ? "#f87171" : "#bfdbfe",
                          bgcolor: isOverStock ? "#fff5f5" : "#f8faff",
                        },
                        transition: "all 0.15s",
                      }}
                    >
                      <ItemSearchField
                        value={item.itemName}
                        inventoryItems={inventoryItems}
                        onSelect={(inv) =>
                          updateIssuedItem(item.id, "itemName", inv.name)
                        }
                      />

                      <TextField
                        size="small"
                        value={invItem ? invItem.qty : ""}
                        disabled
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: 13,
                            borderRadius: "6px",
                            bgcolor: "#f3f4f6",
                            "& fieldset": { borderColor: "#e5e7eb" },
                          },
                          "& input": {
                            textAlign: "center",
                            color: "#374151",
                            fontWeight: 600,
                            py: "6px",
                          },
                        }}
                      />

                      <TextField
                        size="small"
                        value={invItem ? invItem.lot || "" : ""}
                        placeholder="LOT #"
                        disabled
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: 12,
                            borderRadius: "6px",
                            bgcolor: "#f3f4f6",
                            "& fieldset": { borderColor: "#e5e7eb" },
                          },
                          "& input": { py: "6px" },
                        }}
                      />

                      <UomSelect
                        value={item.issueUom}
                        baseUom={item.baseUom || invItem?.uom}
                        purchaseUom={item.purchaseUom || invItem?.purchaseUom}
                        issueUom={item.issueUom || invItem?.issueUom}
                        onChange={(v) =>
                          updateIssuedItem(item.id, "issueUom", v)
                        }
                        colorScheme="blue"
                      />

                      <Box>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Qty"
                          value={item.qtyIssued === 0 ? "" : item.qtyIssued}
                          onChange={(e) =>
                            updateIssuedItem(
                              item.id,
                              "qtyIssued",
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value) || 1,
                            )
                          }
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            updateIssuedItem(
                              item.id,
                              "qtyIssued",
                              isNaN(v) || v < 1 ? 1 : v,
                            );
                          }}
                          inputProps={{ min: 1, max: invItem?.qty }}
                          sx={{
                            "& input[type=number]": {
                              MozAppearance: "textfield",
                            },
                            "& input::-webkit-outer-spin-button": {
                              WebkitAppearance: "none",
                            },
                            "& input::-webkit-inner-spin-button": {
                              WebkitAppearance: "none",
                            },
                            "& .MuiOutlinedInput-root": {
                              fontSize: 13,
                              borderRadius: "6px",
                              bgcolor: isOverStock ? "#fef2f2" : "#f9fafb",
                              "& fieldset": {
                                borderColor: isOverStock
                                  ? "#fca5a5"
                                  : "#e5e7eb",
                              },
                              "&:hover fieldset": {
                                borderColor: isOverStock
                                  ? "#f87171"
                                  : "#d1d5db",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: isOverStock
                                  ? "#ef4444"
                                  : "#2563eb",
                              },
                            },
                            "& input": { py: "6px", textAlign: "center" },
                          }}
                        />
                        {conversionDisplay && (
                          <Box sx={{ mt: "5px" }}>
                            <Typography
                              sx={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#6b7280",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                mb: "2px",
                                textAlign: "center",
                              }}
                            >
                              Conversion
                            </Typography>
                            <Box
                              sx={{
                                fontSize: 10,
                                fontWeight: 700,
                                textAlign: "center",
                                lineHeight: 1.3,
                                borderRadius: "4px",
                                px: "4px",
                                py: "3px",
                                bgcolor: isOverStock ? "#fef2f2" : "#e0f2fe",
                                color: isOverStock ? "#b91c1c" : "#0369A1",
                                border: `1px solid ${isOverStock ? "#fca5a5" : "#bae6fd"}`,
                              }}
                            >
                              {conversionDisplay}
                            </Box>
                          </Box>
                        )}
                        {qty > 0 && invItem && (
                          <Box sx={{ mt: "5px" }}>
                            <Typography
                              sx={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: isOverStock ? "#dc2626" : "#6b7280",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                mb: "2px",
                                textAlign: "center",
                              }}
                            >
                              {isOverStock ? "Over Stock" : "Remaining"}
                            </Typography>
                            <Box
                              sx={{
                                fontSize: 10,
                                fontWeight: 600,
                                textAlign: "center",
                                lineHeight: 1.3,
                                borderRadius: "4px",
                                px: "4px",
                                py: "3px",
                                bgcolor: isOverStock ? "#fef2f2" : "#f0fdf4",
                                color: isOverStock ? "#dc2626" : "#15803d",
                                border: `1px solid ${isOverStock ? "#fecaca" : "#bbf7d0"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "2px",
                              }}
                            >
                              {isOverStock ? (
                                <>
                                  ⚠ +
                                  {Math.abs(
                                    Math.round(remainingAfter * 100) / 100,
                                  )}{" "}
                                  {baseUom} over
                                </>
                              ) : (
                                <>
                                  {Math.round(remainingAfter * 100) / 100}{" "}
                                  {baseUom} left
                                </>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>

                      <IconButton
                        size="small"
                        onClick={() => removeIssuedItem(item.id)}
                        disabled={(formData.issuedItems || []).length === 1}
                        sx={{
                          color: "#ef4444",
                          border: "1px solid #fecaca",
                          borderRadius: "6px",
                          width: 28,
                          height: 28,
                          bgcolor: "#fff",
                          outline: "none",
                          mt: "3px",
                          "&:hover": { bgcolor: "#fef2f2" },
                          "&:focus": { outline: "none" },
                          "&.Mui-disabled": {
                            borderColor: "#e5e7eb",
                            color: "#d1d5db",
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

            {touched.lineItems &&
              (formData.issuedItems || []).every(
                (it) => !it.itemName?.trim(),
              ) && (
                <Box
                  sx={{
                    mt: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
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
                    At least one item must be selected before submitting
                  </Typography>
                </Box>
              )}
          </Box>
        )}

        {/* ── TRANSFER ITEMS — Stock Transfer only ── */}
        {formData.indentType === "Stock Transfer" && (
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              p: "16px",
              bgcolor: "#fafafa",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "10px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "4px",
                    bgcolor: "#d1fae5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                  }}
                >
                  🔄
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#374151",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Transfer Items
                </Typography>
              </Box>
              <Button
                onClick={addTransferItem}
                disableRipple
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#16a34a",
                  textTransform: "none",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  px: "12px",
                  py: "5px",
                  bgcolor: "#f0fdf4",
                  outline: "none",
                  "&:hover": { bgcolor: "#dcfce7", borderColor: "#86efac" },
                  "&:focus": { outline: "none" },
                }}
              >
                Add Item
              </Button>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: "16px",
                mb: "10px",
                px: "2px",
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  bg: "#e0f2fe",
                  border: "#bae6fd",
                  label: "Base UOM — unit stock is kept in",
                },
                {
                  bg: "#f0fdf4",
                  border: "#bbf7d0",
                  label: "Issue UOM — unit used for transfer (editable)",
                },
              ].map((leg) => (
                <Box
                  key={leg.label}
                  sx={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "2px",
                      bgcolor: leg.bg,
                      border: `1px solid ${leg.border}`,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
                    {leg.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0,1.6fr) 88px 100px 72px 72px 32px",
                gap: "8px",
                mb: "8px",
                px: "2px",
              }}
            >
              {["ITEM", "AVAIL.", "LOT #", "ISSUE UOM", "QTY", ""].map((h) => (
                <Typography
                  key={h}
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#9ca3af",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(formData.transferItems || []).map((item) => {
                const invItem = inventoryItems.find(
                  (i) => i.name === item.itemName,
                );
                const qty = parseFloat(item.qtyTransfer) || 0;
                const issueUom =
                  item.issueUom || invItem?.issueUom || invItem?.uom;
                const baseUom = item.baseUom || invItem?.uom;
                const availableQty = invItem?.qty ?? 0;
                const conversionFactor = invItem?.issueToBaseConversion || 1;
                const convertedQty = qty * conversionFactor;
                const conversionDisplay =
                  qty > 0 && issueUom && baseUom && issueUom !== baseUom
                    ? `${qty} ${issueUom} = ${convertedQty} ${baseUom}`
                    : null;
                const isOverStock =
                  qty > 0 && invItem && convertedQty > availableQty;
                const remainingAfter = availableQty - convertedQty;

                return (
                  <Box key={item.id}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0,1.6fr) 88px 100px 72px 72px 32px",
                        gap: "8px",
                        alignItems: "flex-start",
                        p: "8px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${isOverStock ? "#fca5a5" : "#e5e7eb"}`,
                        bgcolor: "#fff",
                        "&:hover": {
                          borderColor: isOverStock ? "#f87171" : "#bbf7d0",
                          bgcolor: isOverStock ? "#fff5f5" : "#f0fdf4",
                        },
                        transition: "all 0.15s",
                      }}
                    >
                      <ItemSearchField
                        value={item.itemName}
                        inventoryItems={inventoryItems}
                        onSelect={(inv) =>
                          updateTransferItem(item.id, "itemName", inv.name)
                        }
                      />

                      <TextField
                        size="small"
                        value={invItem ? invItem.qty : ""}
                        disabled
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: 13,
                            borderRadius: "6px",
                            bgcolor: "#f3f4f6",
                            "& fieldset": { borderColor: "#e5e7eb" },
                          },
                          "& input": {
                            textAlign: "center",
                            color: "#374151",
                            fontWeight: 600,
                            py: "6px",
                          },
                        }}
                      />

                      <TextField
                        size="small"
                        value={invItem ? invItem.lot || "" : ""}
                        placeholder="LOT #"
                        disabled
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: 12,
                            borderRadius: "6px",
                            bgcolor: "#f3f4f6",
                            "& fieldset": { borderColor: "#e5e7eb" },
                          },
                          "& input": { py: "6px" },
                        }}
                      />

                      <UomSelect
                        value={item.issueUom}
                        baseUom={item.baseUom || invItem?.uom}
                        purchaseUom={item.purchaseUom || invItem?.purchaseUom}
                        issueUom={item.issueUom || invItem?.issueUom}
                        onChange={(v) =>
                          updateTransferItem(item.id, "issueUom", v)
                        }
                        colorScheme="green"
                      />

                      <Box>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Qty"
                          value={item.qtyTransfer === 0 ? "" : item.qtyTransfer}
                          onChange={(e) =>
                            updateTransferItem(
                              item.id,
                              "qtyTransfer",
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value) || 1,
                            )
                          }
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            updateTransferItem(
                              item.id,
                              "qtyTransfer",
                              isNaN(v) || v < 1 ? 1 : v,
                            );
                          }}
                          inputProps={{ min: 1, max: invItem?.qty }}
                          sx={{
                            "& input[type=number]": {
                              MozAppearance: "textfield",
                            },
                            "& input::-webkit-outer-spin-button": {
                              WebkitAppearance: "none",
                            },
                            "& input::-webkit-inner-spin-button": {
                              WebkitAppearance: "none",
                            },
                            "& .MuiOutlinedInput-root": {
                              fontSize: 13,
                              borderRadius: "6px",
                              bgcolor: isOverStock ? "#fef2f2" : "#f9fafb",
                              "& fieldset": {
                                borderColor: isOverStock
                                  ? "#fca5a5"
                                  : "#e5e7eb",
                              },
                              "&:hover fieldset": {
                                borderColor: isOverStock
                                  ? "#f87171"
                                  : "#d1d5db",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: isOverStock
                                  ? "#ef4444"
                                  : "#16a34a",
                              },
                            },
                            "& input": { py: "6px", textAlign: "center" },
                          }}
                        />
                        {conversionDisplay && (
                          <Box sx={{ mt: "5px" }}>
                            <Typography
                              sx={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#6b7280",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                mb: "2px",
                                textAlign: "center",
                              }}
                            >
                              Conversion
                            </Typography>
                            <Box
                              sx={{
                                fontSize: 10,
                                fontWeight: 700,
                                textAlign: "center",
                                lineHeight: 1.3,
                                borderRadius: "4px",
                                px: "4px",
                                py: "3px",
                                bgcolor: isOverStock ? "#fef2f2" : "#f0fdf4",
                                color: isOverStock ? "#b91c1c" : "#166534",
                                border: `1px solid ${isOverStock ? "#fca5a5" : "#bbf7d0"}`,
                              }}
                            >
                              {conversionDisplay}
                            </Box>
                          </Box>
                        )}
                        {qty > 0 && invItem && (
                          <Box sx={{ mt: "5px" }}>
                            <Typography
                              sx={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: isOverStock ? "#dc2626" : "#6b7280",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                mb: "2px",
                                textAlign: "center",
                              }}
                            >
                              {isOverStock ? "Over Stock" : "Remaining"}
                            </Typography>
                            <Box
                              sx={{
                                fontSize: 10,
                                fontWeight: 600,
                                textAlign: "center",
                                lineHeight: 1.3,
                                borderRadius: "4px",
                                px: "4px",
                                py: "3px",
                                bgcolor: isOverStock ? "#fef2f2" : "#f0fdf4",
                                color: isOverStock ? "#dc2626" : "#15803d",
                                border: `1px solid ${isOverStock ? "#fecaca" : "#bbf7d0"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "2px",
                              }}
                            >
                              {isOverStock ? (
                                <>
                                  ⚠ +
                                  {Math.abs(
                                    Math.round(remainingAfter * 100) / 100,
                                  )}{" "}
                                  {baseUom} over
                                </>
                              ) : (
                                <>
                                  {Math.round(remainingAfter * 100) / 100}{" "}
                                  {baseUom} left
                                </>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>

                      <IconButton
                        size="small"
                        onClick={() => removeTransferItem(item.id)}
                        disabled={(formData.transferItems || []).length === 1}
                        sx={{
                          color: "#16a34a",
                          border: "1px solid #bbf7d0",
                          borderRadius: "6px",
                          width: 28,
                          height: 28,
                          bgcolor: "#fff",
                          outline: "none",
                          mt: "3px",
                          "&:hover": { bgcolor: "#f0fdf4" },
                          "&:focus": { outline: "none" },
                          "&.Mui-disabled": {
                            borderColor: "#e5e7eb",
                            color: "#d1d5db",
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

            {touched.lineItems &&
              (formData.transferItems || []).every(
                (it) => !it.itemName?.trim(),
              ) && (
                <Box
                  sx={{
                    mt: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
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
                    At least one item must be selected before submitting
                  </Typography>
                </Box>
              )}
          </Box>
        )}
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
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={handleClose}
          disableRipple
          sx={{
            ...btnBase,
            color: "#374151",
            border: "1px solid #e5e7eb",
            bgcolor: "#fff",
            "&:hover": { bgcolor: "#f9fafb" },
          }}
        >
          Cancel
        </Button>
        <Button
          startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
          onClick={handleReset}
          disableRipple
          sx={{
            ...btnBase,
            color: "#374151",
            border: "1px solid #e5e7eb",
            bgcolor: "#fff",
            "&:hover": { bgcolor: "#f9fafb" },
          }}
        >
          Reset
        </Button>
        <Button
          startIcon={<SaveIcon sx={{ fontSize: 15 }} />}
          onClick={() => handleSubmit(false)}
          disableRipple
          sx={{
            ...btnBase,
            fontWeight: 700,
            color: "#fff",
            bgcolor: "#2563eb",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            "&:hover": { bgcolor: "#1d4ed8" },
          }}
        >
          Save 
        </Button>
      </Box>
    </Dialog>
  );
};

export default IndentProcurementModal;