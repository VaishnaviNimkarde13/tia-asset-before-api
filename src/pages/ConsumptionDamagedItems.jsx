import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogContent,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Snackbar, Alert,
  Tooltip, IconButton, InputAdornment, Autocomplete,
} from "@mui/material";
import { Add, Delete as DeleteIcon, Edit as EditIcon, FileDownload, Close, Search } from "@mui/icons-material";
import { useAuth } from "../contexts/Authcontext";
import { useInventory } from "../contexts/InventoryContext";
import { usePermissions } from "../hooks/usePermissions";
import { getUserLocation, locationMatches } from "../utils/locationUtils";

const C = {
  bg: "#F5F6FA", surface: "#FFFFFF", border: "#E5E7EB",
  textPrimary: "#111827", textSecondary: "#6B7280",
};

const btnPrimary = {
  height: 32, px: "12px", borderRadius: "12px", bgcolor: "#015DFF", color: "#fff",
  textTransform: "none", fontSize: 13, fontWeight: 600, boxShadow: "none", gap: "8px",
  minWidth: 0, "& .MuiButton-startIcon": { mr: 0 },
  "&:hover": { bgcolor: "#0147CC", boxShadow: "none" },
};

const btnOutlined = {
  height: 32, px: "12px", borderRadius: "12px", border: "1px solid #015DFF",
  bgcolor: "#fff", color: "#015DFF", textTransform: "none", fontSize: 13, fontWeight: 600,
  boxShadow: "none", gap: "8px", minWidth: 0, "& .MuiButton-startIcon": { mr: 0 },
  "&:hover": { border: "1px solid #015DFF", bgcolor: "#EFF4FF", boxShadow: "none" },
};

function StatusChip({ type }) {
  const map = {
    consumption: { bg: "#dbeafe", color: "#0284c7", border: "#93c5fd" },
    damaged: { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  };
  const s = map[type] || map.consumption;
  return (
    <Chip
      label={type === "consumption" ? "Consumption" : "Damaged"}
      size="small"
      variant="outlined"
      sx={{
        bgcolor: s.bg, color: s.color, borderColor: s.border,
        fontWeight: 700, fontSize: 12, height: 24, borderRadius: "99px",
        borderWidth: "1.5px",
      }}
    />
  );
}

// Resolves the lot number for an inventory item, checking a multi-lot array
// first, then falling back to common flat field-name variants.
function getAutoLot(item) {
  if (!item) return "";
  const raw = item.lots || item.batches || item.lotDetails;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0].lotNo ?? raw[0].lot ?? raw[0].batchNo ?? raw[0].id ?? "";
  }
  return (
    item.lotNo ??
    item.lot_no ??
    item.lotNumber ??
    item.lot ??
    item.batchNo ??
    item.batch_no ??
    ""
  );
}

const CONSUMPTION_STORAGE_KEY = "tia_consumption_records";
const loadRecords = () => {
  try {
    const s = localStorage.getItem(CONSUMPTION_STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch { }
  return [];
};
const saveRecords = (data) => {
  try { localStorage.setItem(CONSUMPTION_STORAGE_KEY, JSON.stringify(data)); } catch { }
};

const buildStatCards = (records) => {
  const consumptionRecs = records.filter((r) => r.type === "consumption");
  const damagedRecs = records.filter((r) => r.type === "damaged");
  const consumptionTotal = consumptionRecs.reduce((s, r) => s + parseInt(r.quantity || 0), 0);
  const damagedTotal = damagedRecs.reduce((s, r) => s + parseInt(r.quantity || 0), 0);

  return [
    {
      label: "Total Consumed", value: consumptionTotal,
      sub: `${consumptionRecs.length} records`, iconBg: "#0284c7",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 7h13M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      ),
    },
    {
      label: "Total Damaged", value: damagedTotal,
      sub: `${damagedRecs.length} records`, iconBg: "#dc2626",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: "Total Records", value: records.length,
      sub: "All records", iconBg: "#6B7280",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: "This Month", value: records.filter((r) => {
        const d = new Date(r.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      sub: "Recent entries", iconBg: "#10b981",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];
};

export default function ConsumptionDamagedItems() {
  const { currentUser } = useAuth();
  const { can } = usePermissions();
  const { items: inventoryItems, updateItem } = useInventory();
  const [records, setRecords] = useState(loadRecords);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [formData, setFormData] = useState({
    itemId: "", itemName: "", lotNo: "", quantity: "", type: "consumption",
    reason: "", date: new Date().toISOString().split("T")[0],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType] = useState("all");

  useEffect(() => { saveRecords(records); }, [records]);

  const userLocation = getUserLocation(currentUser);

  const filteredInventoryItems = inventoryItems.filter((item) => {
    if (!userLocation) return true;
    return item.location === userLocation || item.locationName === userLocation;
  });

  const displayedRecords = records.filter((r) => {
    const matchesType = filterType === "all" || r.type === filterType;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      r.itemName?.toLowerCase().includes(q) ||
      r.lotNo?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q) ||
      r.createdBy?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q);
    const matchesLocation = !userLocation || !r.location || locationMatches(userLocation, r.location);
    return matchesType && matchesSearch && matchesLocation;
  });

  const statCards = buildStatCards(records);

  const handleExport = () => {
    if (displayedRecords.length === 0) {
      setSnackbar({ open: true, message: "No records to export", severity: "warning" });
      return;
    }

    const headers = ["Item Name", "Lot No", "Quantity", "Type", "Reason", "Date", "Created By", "Department", "Location"];
    const rows = displayedRecords.map(record => [
      record.itemName,
      record.lotNo || "—",
      record.quantity,
      record.type === "consumption" ? "Consumption" : "Damaged",
      record.reason || '',
      record.date,
      record.createdBy || "Unknown",
      record.department || "—",
      record.location || "—"
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consumption_records_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setSnackbar({ open: true, message: `Exported ${displayedRecords.length} records`, severity: "success" });
  };

  const handleOpenDialog = (record = null, type = "consumption") => {
    if (record) {
      setEditingId(record.id);
      setFormData(record);
    } else {
      setEditingId(null);
      setFormData({
        itemId: "", itemName: "", lotNo: "", quantity: "", type: type,
        reason: "", date: new Date().toISOString().split("T")[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setEditingId(null); };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "itemId") {
      const item = inventoryItems.find((i) => String(i.id) === String(value));
      setFormData({ ...formData, itemId: value, itemName: item?.name || "", lotNo: getAutoLot(item) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleItemAutocompleteChange = (item) => {
    if (item) {
      setFormData({ ...formData, itemId: item.id, itemName: item.name || "", lotNo: getAutoLot(item) });
    } else {
      setFormData({ ...formData, itemId: "", itemName: "", lotNo: "" });
    }
  };

const handleSave = () => {
  if (!formData.itemId || !formData.quantity) {
    setSnackbar({ open: true, message: "Please fill in all required fields", severity: "error" });
    return;
  }
  const quantity = parseInt(formData.quantity);
  if (quantity <= 0) {
    setSnackbar({ open: true, message: "Quantity must be greater than 0", severity: "error" });
    return;
  }

  const selectedItem = inventoryItems.find(i => String(i.id) === String(formData.itemId));
  
  // Stock validation for new records only
  if (selectedItem && !editingId && parseInt(selectedItem.qty) < quantity) {
    setSnackbar({
      open: true,
      message: `Insufficient stock! Only ${selectedItem.qty} ${selectedItem.name} available`,
      severity: "error"
    });
    return;
  }

  // Check if editing existing record
  if (editingId) {
    // Handle edit - update existing record
    setRecords(records.map((r) =>
      r.id === editingId
        ? { ...formData, id: editingId, quantity: quantity.toString(), location: r.location || userLocation || "—" }
        : r
    ));
    setSnackbar({ open: true, message: "Record updated successfully", severity: "success" });
    handleCloseDialog();
    return;
  }

  // For new records: Check if record already exists for same item & type & date
  const existingRecordIndex = records.findIndex(
    (r) => r.itemId === formData.itemId && 
           r.type === formData.type && 
           r.date === formData.date
  );

  if (existingRecordIndex !== -1) {
    // Update existing record - add to existing quantity
    const existingRecord = records[existingRecordIndex];
    const newQuantity = parseInt(existingRecord.quantity) + quantity;
    
    // Check stock for the additional quantity
    if (selectedItem && parseInt(selectedItem.qty) < quantity) {
      setSnackbar({
        open: true,
        message: `Insufficient stock! Only ${selectedItem.qty} ${selectedItem.name} available for additional ${quantity} units`,
        severity: "error"
      });
      return;
    }
    
    // Update the existing record with new total quantity
    const updatedRecords = [...records];
    updatedRecords[existingRecordIndex] = {
      ...existingRecord,
      lotNo: existingRecord.lotNo || formData.lotNo,
      quantity: newQuantity.toString(),
      reason: formData.reason || existingRecord.reason, // Update reason if provided
      updatedDate: new Date().toLocaleString(),
    };
    
    setRecords(updatedRecords);
    
    // Deduct only the new quantity from inventory
    if (selectedItem && updateItem) {
      updateItem(selectedItem.id, { qty: parseInt(selectedItem.qty) - quantity });
    }
    
    setSnackbar({ 
      open: true, 
      message: `Updated existing record! ${existingRecord.itemName} quantity increased by ${quantity} (Total: ${newQuantity})`, 
      severity: "success" 
    });
  } else {
    // Create completely new record
    setRecords([...records, {
      ...formData,
      id: Date.now(),
      quantity: quantity.toString(),
      createdBy: currentUser?.name || "Unknown",
      department: currentUser?.department || "—",
      location: userLocation || "—",
      createdDate: new Date().toLocaleString(),
    }]);

    // Deduct from inventory
    if (selectedItem && updateItem) {
      updateItem(selectedItem.id, { qty: parseInt(selectedItem.qty) - quantity });
    }

    setSnackbar({ open: true, message: "Record added successfully", severity: "success" });
  }
  
  handleCloseDialog();
};

  const handleDelete = (id) => {
    setRecords(records.filter((r) => r.id !== id));
    setSnackbar({ open: true, message: "Record deleted successfully", severity: "success" });
  };

  const pendingCount = records.filter((r) => r.type === "consumption").length;

  return (
    <Box sx={{ p: { xs: 2, md: 2.5 } }}>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity} variant="filled"
          sx={{ fontSize: 13, fontWeight: 600, borderRadius: "10px", minWidth: 320, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header - Title, Search, Buttons */}
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
          <Typography sx={{ fontSize: { xs: 18, sm: 20, md: 20 }, fontWeight: 700, color: C.textPrimary }}>
            Consumption & Damaged Items
          </Typography>
        </Box>

        {/* Search, Filter, and Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search items, lot no, reason…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: "#9ca3af" }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery("")}
                    disableRipple
                    sx={{ p: 0.5, color: "#9ca3af", "&:hover": { color: "#374151" } }}
                  >
                    <Close sx={{ fontSize: 14 }} />
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

          {/* Export Button */}
          <Button
            onClick={handleExport}
            variant="outlined"
            startIcon={<FileDownload sx={{ fontSize: "16px !important" }} />}
            sx={btnOutlined}
          >
            Export
          </Button>

          {/* Add Consumption Button */}
          <Tooltip title={!can.consumptionDamagedItems ? "You don't have permission to add records" : ""}>
            <span>
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: "16px !important" }} />}
                onClick={() => handleOpenDialog(null, "consumption")}
                disabled={!can.consumptionDamagedItems}
                sx={{ ...btnPrimary, background: "#0284c7", "&:hover": { bgcolor: "#0369a1" }, "&.Mui-disabled": { background: "#d1d5db", color: "#9ca3af" } }}
              >
                Add Consumption
              </Button>
            </span>
          </Tooltip>

          {/* Add Damaged Button */}
          <Tooltip title={!can.consumptionDamagedItems ? "You don't have permission to add records" : ""}>
            <span>
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: "16px !important" }} />}
                onClick={() => handleOpenDialog(null, "damaged")}
                disabled={!can.consumptionDamagedItems}
                sx={{ ...btnPrimary, background: "#dc2626", "&:hover": { bgcolor: "#b91c1c" }, "&.Mui-disabled": { background: "#d1d5db", color: "#9ca3af" } }}
              >
                Add Damaged
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.5, sm: 0.75, md: 1 },
          mb: { xs: 0.875, sm: 1.125, md: 1.375 },
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        {statCards.map((s) => (
          <Box
            key={s.label}
            sx={{
              flex: 1,
              bgcolor: "#fff",
              border: `1px solid ${C.border}`,
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
                bgcolor: s.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.icon}
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
                {s.label}
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
                    color: C.textPrimary,
                    lineHeight: 1.2,
                  }}
                >
                  {s.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 9, sm: 10, md: 11 },
                    fontWeight: 500,
                    color: "#6b7280",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.sub}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

     

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px", border: "1px solid #f0f0f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden",
        }}
      >
        <TableContainer sx={{ overflowX: { xs: "auto", md: "visible" } }}>
          <Table sx={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ background: "#EBF1FE" }}>
                {["Item Name", "Lot No", "Quantity", "Type", "Reason", "Date", "Created By", "Department", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      py: "11px", px: "14px", fontSize: 13, fontWeight: 600,
                      color: "#373B4D", letterSpacing: "0.04em", whiteSpace: "nowrap",
                      borderBottom: "1px solid #f3f4f6",
                      borderRight: "1px solid #BED3FC",
                      "&:last-child": { borderRight: "none" },
                      textAlign: h === "Actions" ? "center" : "left",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    sx={{ py: 6, textAlign: "center", color: "#94a3b8", fontSize: 14, border: "none" }}
                  >
                    {records.length === 0
                      ? 'No records found. Click "Add Record" to create one.'
                      : "No records match your search or filter."}
                  </TableCell>
                </TableRow>
              ) : (
                displayedRecords.map((record, i) => (
                  <TableRow
                    key={record.id}
                    sx={{
                      background: "#fff",
                      "&:hover": { background: "#fafafa" },
                      transition: "background 0.15s",
                      "& td": {
                        borderBottom: i < displayedRecords.length - 1 ? "1px solid #f3f4f6" : "none",
                      },
                    }}
                  >
                    <TableCell sx={{ py: "12px", px: "14px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                      {record.itemName}
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px", fontSize: 13, color: C.textSecondary }}>
                      {record.lotNo || "—"}
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                      {record.quantity}
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px" }}>
                      <StatusChip type={record.type} />
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px", fontSize: 13, color: C.textSecondary }}>
                      {record.reason || "—"}
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px", fontSize: 13, color: C.textSecondary }}>
                      {record.date}
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px", fontSize: 13, color: C.textSecondary }}>
                      {record.createdBy}
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px", fontSize: 13, color: C.textSecondary }}>
                      {record.department || "—"}
                    </TableCell>
                    <TableCell sx={{ py: "12px", px: "14px" }}>
                      <Box sx={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "center" }}>
                        <Tooltip title={!can.consumptionDamagedItems ? "No permission to edit" : "Edit"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(record)}
                              disabled={!can.consumptionDamagedItems}
                              sx={{
                                width: 28, height: 28,
                                border: "1px solid #bfdbfe", borderRadius: "6px", bgcolor: "#eff6ff",
                                "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" },
                                "&.Mui-disabled": { opacity: 0.4 },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 14, color: "#2563eb" }} />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={!can.consumptionDamagedItems ? "No permission to delete" : "Delete"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(record.id)}
                              disabled={!can.consumptionDamagedItems}
                              sx={{
                                width: 28, height: 28,
                                border: "1px solid #fecaca", borderRadius: "6px", bgcolor: "#fff5f5",
                                "&:hover": { bgcolor: "#fee2e2", borderColor: "#fca5a5" },
                                "&.Mui-disabled": { opacity: 0.4 },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 14, color: "#dc2626" }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", overflow: "hidden" } }}
      >
        <Box sx={{
          px: "20px", py: "18px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb", bgcolor: "#fff",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: "10px",
              bgcolor: formData.type === "consumption" ? "#dbeafe" : "#fee2e2",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Add sx={{ fontSize: 18, color: formData.type === "consumption" ? "#0284c7" : "#dc2626" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
                {editingId ? "Edit Record" : `Add ${formData.type === "consumption" ? "Consumption" : "Damaged"} Record`}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: "2px" }}>
                {editingId ? "Update the record details below." : `Fill in the details to log a new ${formData.type} record.`}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleCloseDialog}
            sx={{
              color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "8px",
              width: 30, height: 30, "&:hover": { bgcolor: "#f3f4f6", color: "#6b7280" }, "&:focus": { outline: "none" },
            }}
          >
            <Close sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: "20px", py: "18px" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Autocomplete
              size="small"
              options={filteredInventoryItems}
              getOptionLabel={(item) =>
                typeof item === "string" ? item : `${item.name} (Available: ${item.qty})`
              }
              value={filteredInventoryItems.find((i) => String(i.id) === String(formData.itemId)) || null}
              onChange={(e, newValue) => handleItemAutocompleteChange(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="No items available in your location"
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name} (Available: {option.qty})
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Item *"
                  placeholder="Type to search item..."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
                />
              )}
            />

            <TextField
              label="Lot No"
              name="lotNo"
              value={formData.lotNo ? formData.lotNo : (formData.itemId ? "—" : "")}
              disabled
              fullWidth size="small"
              placeholder="Auto-filled from selected item"
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, bgcolor: "#f3f4f6" },
              }}
            />

            <TextField
              label={`${formData.type === "consumption" ? "Consumed" : "Damaged"} Quantity *`}
              name="quantity" type="number"
              value={formData.quantity} onChange={handleFormChange}
              fullWidth size="small" inputProps={{ min: 1 }}
              placeholder="Enter quantity"
              sx={{ 
                "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 },
                "& input[type=number]": { MozAppearance: "textfield" },
                "& input::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
                "& input::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 }
              }}
            />

            <TextField
              label="Reason" name="reason" value={formData.reason}
              onChange={handleFormChange} fullWidth size="small"
              multiline rows={2} placeholder="Enter reason (optional)"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />

            <TextField
              label="Date *" name="date" type="date"
              value={formData.date} onChange={handleFormChange}
              fullWidth size="small" InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
          </Box>
        </DialogContent>

        <Box sx={{
          px: "20px", py: "14px", borderTop: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: "10px", bgcolor: "#f9fafb",
        }}>
          <Button onClick={handleCloseDialog}
            sx={{
              fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none",
              borderRadius: "8px", px: "16px", py: "8px",
              border: "1px solid #d1d5db", bgcolor: "#fff",
              "&:hover": { bgcolor: "#f3f4f6", border: "1px solid #d1d5db" },
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}
            sx={{
              fontSize: 13, fontWeight: 600, textTransform: "none",
              borderRadius: "8px", px: "16px", py: "8px",
              bgcolor: "#015DFF", color: "#fff",
              boxShadow: "0 1px 4px rgba(1,93,255,0.25)",
              "&:hover": { bgcolor: "#0147CC", boxShadow: "0 2px 6px rgba(1,93,255,0.3)" },
            }}
          >
            {editingId ? "Update Record" : "Add Record"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}