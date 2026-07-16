import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SupplierModal from "./SupplierModal";
import ManufacturerModal from "./ManufacturerModal";
import GPOModal from "./GPOModal";
import DocumentModal from "./DocumentModal";
import SupplierDocumentViewModal from "./SupplierDocumentViewModal";
import { getSuppliers, saveSuppliers, initializeSuppliers } from "../../utils/supplierUtils";
import { getManufacturers, saveManufacturers, initializeManufacturers } from "../../utils/manufacturerUtils";
import { getGPOs, saveGPOs, initializeGPOs } from "../../utils/gpoUtils";

// ── Constants ────────────────────────────────────────────────────────────────
const C = {
  border:        "#E5E7EB",
  textPrimary:   "#111827",
  textSecondary: "#6B7280",
  primary:       "#2563eb",
};

const thSx = {
  fontWeight: 600,
  fontSize: 11,
  color: "#373B4D",
  letterSpacing: "0.04em",
  py: "11px",
  px: "14px",
  borderBottom: "1px solid #f3f4f6",
  whiteSpace: "nowrap",
};

// ── StatCard (compact — matches Locations page size) ─────────────────────────
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
          width:  { xs: 32, sm: 36, md: 40 },
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
        <Box sx={{ display: "flex", alignItems: "baseline", gap: { xs: 0.25, sm: 0.5, md: 0.75 } }}>
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

// ── Main Component ────────────────────────────────────────────────────────────
const VendorManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [gpos, setGpos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const [supplierModalOpen,     setSupplierModalOpen]     = useState(false);
  const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
  const [gpoModalOpen,          setGpoModalOpen]          = useState(false);
  const [documentModalOpen,     setDocumentModalOpen]     = useState(false);

  const [selectedSupplier,     setSelectedSupplier]     = useState(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedGPO,          setSelectedGPO]          = useState(null);
  const [selectedVendor,       setSelectedVendor]        = useState(null);
  const [vendorDocType,        setVendorDocType]         = useState("");
  
  const [documentViewOpen, setDocumentViewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // reset search on tab change
  useEffect(() => { setSearchQuery(""); }, [tabValue]);

  useEffect(() => {
    initializeSuppliers();
    initializeManufacturers();
    initializeGPOs();
    loadAllData();
  }, []);

  useEffect(() => {
    const h1 = () => loadAllData();
    window.addEventListener("suppliersUpdated",     h1);
    window.addEventListener("manufacturersUpdated", h1);
    window.addEventListener("gposUpdated",          h1);
    return () => {
      window.removeEventListener("suppliersUpdated",     h1);
      window.removeEventListener("manufacturersUpdated", h1);
      window.removeEventListener("gposUpdated",          h1);
    };
  }, []);

  const loadAllData = () => {
    setSuppliers(getSuppliers());
    setManufacturers(getManufacturers());
    setGpos(getGPOs());
  };

  const showToast = (msg, severity = "success") =>
    setToast({ open: true, msg, severity });

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeSuppliers = suppliers.filter((s) => s.status === "Active").length;

  // ── Filtered data ──────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();

  const filteredSuppliers = suppliers.filter((s) =>
    !q ||
    s.company?.toLowerCase().includes(q) ||
    s.contactName?.toLowerCase().includes(q) ||
    s.gpo?.toLowerCase().includes(q) ||
    s.location?.toLowerCase().includes(q)
  );

  const filteredManufacturers = manufacturers.filter((m) =>
    !q ||
    m.name?.toLowerCase().includes(q) ||
    m.code?.toLowerCase().includes(q) ||
    m.contactName?.toLowerCase().includes(q)
  );

  const filteredGpos = gpos.filter((g) =>
    !q ||
    g.name?.toLowerCase().includes(q) ||
    g.code?.toLowerCase().includes(q) ||
    g.contactName?.toLowerCase().includes(q)
  );

  // ── Stat cards per tab ─────────────────────────────────────────────────────
  const TAB_STATS = {
    0: [
      {
        label: "Total Suppliers",
        count: suppliers.length,
        sub: `${activeSuppliers} active`,
        iconBg: "#3b82f6",
        iconEl: <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "Active Suppliers",
        count: activeSuppliers,
        sub: "Currently active",
        iconBg: "#10b981",
        iconEl: <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "Manufacturers",
        count: manufacturers.length,
        sub: "Linked manufacturers",
        iconBg: "#8b5cf6",
        iconEl: <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "GPOs",
        count: gpos.length,
        sub: "Group purchasing orgs",
        iconBg: "#f59e0b",
        iconEl: <BusinessCenterOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
    ],
    1: [
      {
        label: "Total Manufacturers",
        count: manufacturers.length,
        sub: `${manufacturers.filter(m => m.status === "Active").length} active`,
        iconBg: "#8b5cf6",
        iconEl: <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "Active",
        count: manufacturers.filter(m => m.status === "Active").length,
        sub: "Currently active",
        iconBg: "#10b981",
        iconEl: <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "Suppliers",
        count: suppliers.length,
        sub: "Linked suppliers",
        iconBg: "#3b82f6",
        iconEl: <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "GPOs",
        count: gpos.length,
        sub: "Group purchasing orgs",
        iconBg: "#f59e0b",
        iconEl: <BusinessCenterOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
    ],
    2: [
      {
        label: "Total GPOs",
        count: gpos.length,
        sub: `${gpos.filter(g => g.status === "Active").length} active`,
        iconBg: "#f59e0b",
        iconEl: <BusinessCenterOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "Active GPOs",
        count: gpos.filter(g => g.status === "Active").length,
        sub: "Currently active",
        iconBg: "#10b981",
        iconEl: <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "Suppliers",
        count: suppliers.length,
        sub: "Linked suppliers",
        iconBg: "#3b82f6",
        iconEl: <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
      {
        label: "Manufacturers",
        count: manufacturers.length,
        sub: "Linked manufacturers",
        iconBg: "#8b5cf6",
        iconEl: <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />,
      },
    ],
  };

  const currentStats = TAB_STATS[tabValue];

  // ── SUPPLIERS handlers ─────────────────────────────────────────────────────
  const handleAddSupplier    = () => { setSelectedSupplier(null); setSupplierModalOpen(true); };
  const handleSupplierEdit   = (s) => { setSelectedSupplier(s); setSupplierModalOpen(true); };
  const handleSupplierToggle = (id) => {
    const updated = suppliers.map((s) =>
      s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s
    );
    setSuppliers(updated); saveSuppliers(updated);
  };
  const handleSaveSupplier = (data) => {
    if (selectedSupplier) {
      const updated = suppliers.map((s) =>
        s.id === selectedSupplier.id
          ? { ...s, ...data, manufacturers: data.manufacturers || [] }
          : s
      );
      setSuppliers(updated); saveSuppliers(updated);
    } else {
      const updated = [...suppliers, { id: `s${suppliers.length + 1}`, ...data, manufacturers: data.manufacturers || [] }];
      setSuppliers(updated); saveSuppliers(updated);
    }
    setSupplierModalOpen(false); setSelectedSupplier(null);
  };

  // ── MANUFACTURERS handlers ─────────────────────────────────────────────────
  const handleAddManufacturer    = () => { setSelectedManufacturer(null); setManufacturerModalOpen(true); };
  const handleManufacturerEdit   = (m) => { setSelectedManufacturer(m); setManufacturerModalOpen(true); };
  const handleManufacturerToggle = (id) => {
    const updated = manufacturers.map((m) =>
      m.id === id ? { ...m, status: m.status === "Active" ? "Inactive" : "Active" } : m
    );
    setManufacturers(updated); saveManufacturers(updated);
  };
  const handleSaveManufacturer = (data) => {
    if (selectedManufacturer) {
      const updated = manufacturers.map((m) =>
        m.id === selectedManufacturer.id ? { ...m, ...data } : m
      );
      setManufacturers(updated); saveManufacturers(updated);
    } else {
      const updated = [...manufacturers, { id: `m${manufacturers.length + 1}`, ...data }];
      setManufacturers(updated); saveManufacturers(updated);
    }
    setManufacturerModalOpen(false); setSelectedManufacturer(null);
  };

  // ── GPO handlers ───────────────────────────────────────────────────────────
  const handleAddGPO    = () => { setSelectedGPO(null); setGpoModalOpen(true); };
  const handleEditGPO   = (g) => { setSelectedGPO(g); setGpoModalOpen(true); };
  const handleGPOToggle = (id) => {
    const updated = gpos.map((g) =>
      g.id === id ? { ...g, status: g.status === "Active" ? "Inactive" : "Active" } : g
    );
    setGpos(updated); saveGPOs(updated);
  };
  const handleSaveGPO = (data) => {
    if (selectedGPO) {
      const updated = gpos.map((g) =>
        g.id === selectedGPO.id ? { ...g, ...data } : g
      );
      setGpos(updated); saveGPOs(updated);
    } else {
      const updated = [...gpos, { id: `g${gpos.length + 1}`, ...data }];
      setGpos(updated); saveGPOs(updated);
    }
    setGpoModalOpen(false); setSelectedGPO(null);
  };

  // ── DOCUMENT handlers ──────────────────────────────────────────────────────
  const handleOpenDocumentModal = (vendor, type) => {
    setSelectedVendor(vendor); setVendorDocType(type); setDocumentModalOpen(true);
  };
  const handleDocumentSaved = (documents) => {
    if (!selectedVendor) return;
    if (vendorDocType === "Supplier") {
      const u = suppliers.map((s) => s.id === selectedVendor.id ? { ...s, documents } : s);
      setSuppliers(u); saveSuppliers(u);
    } else if (vendorDocType === "Manufacturer") {
      const u = manufacturers.map((m) => m.id === selectedVendor.id ? { ...m, documents } : m);
      setManufacturers(u); saveManufacturers(u);
    } else if (vendorDocType === "GPO") {
      const u = gpos.map((g) => g.id === selectedVendor.id ? { ...g, documents } : g);
      setGpos(u); saveGPOs(u);
    }
  };

  // ── Download docs helper ──────────────────────────────────────────────────
  const handleDownloadDocs = (vendor, vendorType) => {
    try {
      const all = JSON.parse(localStorage.getItem("tia_vendor_documents") || "[]");
      const vendorName = vendor.company || vendor.name || "";
      const docs = all.filter((d) =>
        d.vendorType === vendorType &&
        (d.vendorId === vendor.id || d.vendorName === vendorName)
      );
      if (!docs.length) { showToast(`No documents uploaded for this ${vendorType}.`, "info"); return; }
      let downloaded = 0;
      docs.forEach((doc) => {
        if (!doc.fileData) return;
        const a = document.createElement("a");
        a.href = doc.fileData;
        a.download = doc.fileName || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        downloaded++;
      });
      if (downloaded === 0) showToast("Documents found but no file data available.", "info");
    } catch { showToast("Failed to download documents.", "error"); }
  };

  const getVendorDocumentsList = (vendor, vendorType) => {
    try {
      const all = JSON.parse(localStorage.getItem("tia_vendor_documents") || "[]");
      const vendorName = vendor.company || vendor.name || "";
      return all.filter((d) =>
        d.vendorType === vendorType &&
        (d.vendorId === vendor.id || d.vendorName === vendorName)
      );
    } catch {
      return [];
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setDocumentViewOpen(true);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const actionBtn = (color, bg, hoverBg) => ({
    width: 26, height: 26, borderRadius: "6px", bgcolor: bg, color,
    "&:hover": { bgcolor: hoverBg },
  });

  const addBtnLabel = ["Add Supplier", "Add Manufacturer", "Add GPO"][tabValue];
  const addBtnClick = [handleAddSupplier, handleAddManufacturer, handleAddGPO][tabValue];
  const searchPlaceholder = ["Search suppliers…", "Search manufacturers…", "Search GPOs…"][tabValue];

  return (
    <Box sx={{ maxWidth: "1400px", mx: "auto" }}>

      {/* ── Header: Title left | Search + Button right ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: { xs: 1.25, sm: 1.5, md: 1.75 },
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 20, md: 20 },
            fontWeight: 700,
            color: "#111827",
            flexShrink: 0,
          }}
        >
          Vendor Management
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder={searchPlaceholder}
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
                    sx={{ p: 0.5, color: "#9ca3af", "&:hover": { color: "#374151" } }}>
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: { xs: "100%", md: 240 },
              "& .MuiOutlinedInput-root": {
                fontSize: 13, borderRadius: "8px", bgcolor: "#fff", height: 36,
                "& fieldset": { borderColor: "#e5e7eb" },
                "&:hover fieldset": { borderColor: "#9ca3af" },
                "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "1.5px" },
              },
            }}
          />

          {/* Add button */}
          <Button
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            variant="contained"
            onClick={addBtnClick}
            sx={{
              background: "#2563eb", color: "#fff", borderRadius: "8px",
              px: 1.875, height: 36, fontSize: 13, fontWeight: 500,
              textTransform: "none", boxShadow: "0 1px 4px rgba(37,99,235,0.25)",
              whiteSpace: "nowrap",
              "&:hover": { background: "#1d4ed8" },
            }}
          >
            {addBtnLabel}
          </Button>
        </Box>
      </Box>

      {/* ── Stat Cards (large, circular icons — matches Locations) ── */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.5, sm: 0.75, md: 1 },
          mb: { xs: 0.875, sm: 1.125, md: 1.375 },
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        {currentStats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            count={s.count}
            sub={s.sub}
            iconBg={s.iconBg}
            iconEl={s.iconEl}
          />
        ))}
      </Box>

      {/* ── Pill Tabs (matches Locations exactly) ── */}
      <Box
        sx={{
          display: "flex", gap: "4px", mb: "20px",
          p: "4px", bgcolor: "#f3f4f6", borderRadius: "10px", width: "fit-content",
        }}
      >
        {[
          { label: "Suppliers",},
          { label: "Manufacturers"},
          { label: "GPO"},
        ].map((tab, i) => (
          <Box
            key={tab.label}
            onClick={() => setTabValue(i)}
            sx={{
              display: "flex", alignItems: "center", gap: "6px",
              px: "16px", py: "7px", borderRadius: "8px",
              cursor: "pointer", transition: "all 0.15s",
              bgcolor:   tabValue === i ? "#fff" : "transparent",
              boxShadow: tabValue === i ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              color:     tabValue === i ? "#111827" : "#6b7280",
              "&:hover": { color: "#111827", bgcolor: tabValue === i ? "#fff" : "#e9eaec" },
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: tabValue === i ? 600 : 500 }}>
              {tab.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — SUPPLIERS
      ══════════════════════════════════════════════════════════════════════ */}
      {tabValue === 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#EBF1FE" }}>
                {["Company", "Contact", "GPO", "Terms", "Status", "Actions"].map((h, i, arr) => (
                  <TableCell
                    key={h}
                    align={h === "Actions" ? "right" : "left"}
                    sx={{
                      ...thSx,
                      borderRight: i < arr.length - 1 ? "1px solid #BED3FC" : "none",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, fontSize: 13, color: C.textSecondary }}>
                    {searchQuery ? `No suppliers match "${searchQuery}"` : "No suppliers found."}
                  </TableCell>
                </TableRow>
              )}
              {filteredSuppliers.map((supplier, idx) => (
                <TableRow
                  key={supplier.id}
                  sx={{
                    bgcolor: "#fff",
                    "&:hover": { bgcolor: "#f8faff" },
                    transition: "background 0.15s",
                    "& td": {
                      borderBottom: idx < filteredSuppliers.length - 1 ? "1px solid #f3f4f6" : "none",
                      py: "11px",
                      px: "14px",
                    },
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: C.textPrimary, lineHeight: 1.3 }}>
                      {supplier.company}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.textSecondary, mt: 0.1 }}>
                      {supplier.location}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: 12, color: C.textPrimary }}>
                      {supplier.contactName}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.textSecondary }}>
                      {supplier.contactEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.gpo}
                      size="small"
                      sx={{ backgroundColor: "#e3f2fd", color: "#1565c0", fontSize: "11px", fontWeight: 600, height: 22 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, color: C.textSecondary }}>
                      {supplier.terms} / {supplier.leadTime}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.status}
                      size="small"
                      sx={{
                        bgcolor:  supplier.status === "Active" ? "#F0FDF4" : "#ffebee",
                        color:    supplier.status === "Active" ? "#16A34A" : "#d32f2f",
                        border:   supplier.status === "Active" ? "1px solid #BBF7D0" : "1px solid #ffcdd2",
                        fontWeight: 700, fontSize: 11, height: 22,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Documents">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const docs = getVendorDocumentsList(supplier, "supplier");
                            if (docs.length === 0) {
                              showToast("No documents uploaded for this supplier.", "info");
                            } else {
                              handleViewDocument(docs[0]);
                            }
                          }}
                          sx={actionBtn("#8b5cf6", "#f3e8ff", "#e9d5ff")}
                        >
                          <VisibilityIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleSupplierEdit(supplier)}
                          sx={actionBtn("#f59e0b", "#fef3c7", "#fde68a")}>
                          <EditIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Documents">
                        <IconButton size="small" onClick={() => handleDownloadDocs(supplier, "supplier")}
                          sx={actionBtn("#2563eb", "#eff6ff", "#dbeafe")}>
                          <DownloadIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={supplier.status === "Active" ? "Deactivate" : "Activate"}>
                        <IconButton size="small" onClick={() => handleSupplierToggle(supplier.id)}
                          sx={actionBtn(
                            supplier.status === "Active" ? "#dc2626" : "#16a34a",
                            supplier.status === "Active" ? "#fef2f2" : "#f0fdf4",
                            supplier.status === "Active" ? "#fee2e2" : "#dcfce7",
                          )}>
                          <DeleteIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — MANUFACTURERS
      ══════════════════════════════════════════════════════════════════════ */}
      {tabValue === 1 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#EBF1FE" }}>
                {["Name", "Code", "Contact", "Phone", "Status", "Actions"].map((h, i, arr) => (
                  <TableCell
                    key={h}
                    align={h === "Actions" ? "right" : "left"}
                    sx={{
                      ...thSx,
                      borderRight: i < arr.length - 1 ? "1px solid #BED3FC" : "none",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredManufacturers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, fontSize: 13, color: C.textSecondary }}>
                    {searchQuery ? `No manufacturers match "${searchQuery}"` : "No manufacturers found."}
                  </TableCell>
                </TableRow>
              )}
              {filteredManufacturers.map((mfr, idx) => (
                <TableRow
                  key={mfr.id}
                  sx={{
                    bgcolor: "#fff",
                    "&:hover": { bgcolor: "#f8faff" },
                    transition: "background 0.15s",
                    "& td": {
                      borderBottom: idx < filteredManufacturers.length - 1 ? "1px solid #f3f4f6" : "none",
                      py: "11px",
                      px: "14px",
                    },
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: C.textPrimary, lineHeight: 1.3 }}>
                      {mfr.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mfr.code}
                      size="small"
                      sx={{ backgroundColor: "#e0f2fe", color: "#0284c7", fontSize: "11px", fontWeight: 700, height: 22 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, color: C.textPrimary, fontWeight: 500 }}>
                      {mfr.contactName}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.textSecondary }}>
                      {mfr.contactEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, color: C.textSecondary }}>{mfr.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mfr.status}
                      size="small"
                      sx={{
                        bgcolor:  mfr.status === "Active" ? "#F0FDF4" : "#ffebee",
                        color:    mfr.status === "Active" ? "#16A34A" : "#d32f2f",
                        border:   mfr.status === "Active" ? "1px solid #BBF7D0" : "1px solid #ffcdd2",
                        fontWeight: 700, fontSize: 11, height: 22,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Documents">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const docs = getVendorDocumentsList(mfr, "manufacturer");
                            if (docs.length === 0) {
                              showToast("No documents uploaded for this manufacturer.", "info");
                            } else {
                              handleViewDocument(docs[0]);
                            }
                          }}
                          sx={actionBtn("#8b5cf6", "#f3e8ff", "#e9d5ff")}
                        >
                          <VisibilityIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleManufacturerEdit(mfr)}
                          sx={actionBtn("#f59e0b", "#fef3c7", "#fde68a")}>
                          <EditIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Documents">
                        <IconButton size="small" onClick={() => handleDownloadDocs(mfr, "manufacturer")}
                          sx={actionBtn("#2563eb", "#eff6ff", "#dbeafe")}>
                          <DownloadIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={mfr.status === "Active" ? "Deactivate" : "Activate"}>
                        <IconButton size="small" onClick={() => handleManufacturerToggle(mfr.id)}
                          sx={actionBtn(
                            mfr.status === "Active" ? "#dc2626" : "#16a34a",
                            mfr.status === "Active" ? "#fef2f2" : "#f0fdf4",
                            mfr.status === "Active" ? "#fee2e2" : "#dcfce7",
                          )}>
                          <DeleteIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — GPOs
      ══════════════════════════════════════════════════════════════════════ */}
      {tabValue === 2 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {gpos.length === 0 && !searchQuery ? (
            <Box
              sx={{
                p: 6, textAlign: "center",
                border: `2px dashed ${C.border}`, borderRadius: 2, bgcolor: "#f9fafb",
              }}
            >
              <Typography sx={{ fontSize: 14, color: C.textSecondary, mb: 1 }}>No GPOs found</Typography>
              <Typography sx={{ fontSize: 12, color: C.textSecondary }}>
                Click "Add GPO" to create a new Group Purchasing Organization
              </Typography>
            </Box>
          ) : (
            <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#EBF1FE" }}>
                  {["Name", "Code", "Contact", "Email", "Phone", "Status", "Actions"].map((h, i, arr) => (
                    <TableCell
                      key={h}
                      align={h === "Actions" ? "right" : "left"}
                      sx={{
                        ...thSx,
                        borderRight: i < arr.length - 1 ? "1px solid #BED3FC" : "none",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGpos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, fontSize: 13, color: C.textSecondary }}>
                      No GPOs match "{searchQuery}"
                    </TableCell>
                  </TableRow>
                )}
                {filteredGpos.map((gpo, idx) => (
                  <TableRow
                    key={gpo.id}
                    sx={{
                      bgcolor: "#fff",
                      "&:hover": { bgcolor: "#f8faff" },
                      transition: "background 0.15s",
                      "& td": {
                        borderBottom: idx < filteredGpos.length - 1 ? "1px solid #f3f4f6" : "none",
                        py: "11px",
                        px: "14px",
                      },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: C.textPrimary, lineHeight: 1.3 }}>
                        {gpo.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={gpo.code}
                        size="small"
                        sx={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "11px", fontWeight: 700, height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: C.textPrimary, fontWeight: 500 }}>
                        {gpo.contactName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11, color: C.textSecondary }}>{gpo.contactEmail}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: C.textSecondary }}>{gpo.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={gpo.status}
                        size="small"
                        sx={{
                          bgcolor:  gpo.status === "Active" ? "#F0FDF4" : "#ffebee",
                          color:    gpo.status === "Active" ? "#16A34A" : "#d32f2f",
                          border:   gpo.status === "Active" ? "1px solid #BBF7D0" : "1px solid #ffcdd2",
                          fontWeight: 700, fontSize: 11, height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Documents">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              const docs = getVendorDocumentsList(gpo, "gpo");
                              if (docs.length === 0) {
                                showToast("No documents uploaded for this GPO.", "info");
                              } else {
                                handleViewDocument(docs[0]);
                              }
                            }}
                            sx={actionBtn("#8b5cf6", "#f3e8ff", "#e9d5ff")}
                          >
                            <VisibilityIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditGPO(gpo)}
                            sx={actionBtn("#f59e0b", "#fef3c7", "#fde68a")}>
                            <EditIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Documents">
                          <IconButton size="small" onClick={() => handleDownloadDocs(gpo, "gpo")}
                            sx={actionBtn("#2563eb", "#eff6ff", "#dbeafe")}>
                            <DownloadIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={gpo.status === "Active" ? "Deactivate" : "Activate"}>
                          <IconButton size="small" onClick={() => handleGPOToggle(gpo.id)}
                            sx={actionBtn(
                              gpo.status === "Active" ? "#dc2626" : "#16a34a",
                              gpo.status === "Active" ? "#fef2f2" : "#f0fdf4",
                              gpo.status === "Active" ? "#fee2e2" : "#dcfce7",
                            )}>
                            <DeleteIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* ── Modals ── */}
      <SupplierModal
        open={supplierModalOpen}
        onClose={() => { setSupplierModalOpen(false); setSelectedSupplier(null); }}
        onSave={handleSaveSupplier}
        supplier={selectedSupplier}
        onAddManufacturer={handleAddManufacturer}
      />
      <ManufacturerModal
        open={manufacturerModalOpen}
        onClose={() => { setManufacturerModalOpen(false); setSelectedManufacturer(null); }}
        onSave={handleSaveManufacturer}
        manufacturer={selectedManufacturer}
      />
      <GPOModal
        open={gpoModalOpen}
        onClose={() => { setGpoModalOpen(false); setSelectedGPO(null); }}
        onSave={handleSaveGPO}
        gpo={selectedGPO}
      />
      <DocumentModal
        open={documentModalOpen}
        onClose={() => { setDocumentModalOpen(false); setSelectedVendor(null); setVendorDocType(""); }}
        vendorName={selectedVendor?.company || selectedVendor?.name}
        vendorType={vendorDocType}
        onDocumentSaved={handleDocumentSaved}
        initialDocuments={selectedVendor?.documents || []}
      />

      {/* Document View Modal - Shared for all vendor types */}
      <SupplierDocumentViewModal
        open={documentViewOpen}
        onClose={() => {
          setDocumentViewOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />

      {/* ── Toast ── */}
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
    </Box>
  );
};

export default VendorManagement;