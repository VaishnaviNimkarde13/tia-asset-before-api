import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  FormHelperText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import EventIcon from "@mui/icons-material/Event";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const DocumentUploadModal = ({ open, onClose, onSave, document }) => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    fileType: "",
    issuedDate: "",
    expiryDate: "",
    linkedType: "",
    linkedId: "",
    linkedName: "",
    size: "",
    notes: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [linkedOptions, setLinkedOptions] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [touched, setTouched] = useState({
    title: false,
    linkedType: false,
    linkedId: false,
  });

  const fileInputRef = useRef(null);
  const issuedDateInputRef = useRef(null);
  const expiryDateInputRef = useRef(null);

  const mockLinkedRecords = {
    supplier: [
      { id: "SUP-001", name: "McKesson Medical-Surgical" },
      { id: "SUP-002", name: "Medline Industries" },
      { id: "SUP-003", name: "Fisher Scientific" },
      { id: "SUP-004", name: "Cardinal Health" },
    ],
    po: [
      { id: "PO-2026-0001", name: "PO-2026-0001 - Medical Supplies" },
      { id: "PO-2026-0002", name: "PO-2026-0002 - Pharmaceuticals" },
      { id: "PO-2026-0003", name: "PO-2026-0003 - Equipment" },
      { id: "PO-2026-0004", name: "PO-2026-0004 - Lab Supplies" },
    ],
    grn: [
      { id: "GRN-2026-0001", name: "GRN-2026-0001 - McKesson Delivery" },
      { id: "GRN-2026-0002", name: "GRN-2026-0002 - Medline Shipment" },
      { id: "GRN-2026-0003", name: "GRN-2026-0003 - Fisher Scientific" },
    ],
    item: [
      { id: "ITEM-001", name: "Amoxicillin 500mg Capsules" },
      { id: "ITEM-002", name: "Sodium Chloride 0.9% IV 1L" },
      { id: "ITEM-003", name: "Surgical Mask Level 3" },
      { id: "ITEM-004", name: "Nitrile Gloves Large" },
    ],
  };

  useEffect(() => {
    if (open) {
      if (document) {
        // Edit mode
        setFormData({
          title: document.title || "",
          type: document.type || "",
          fileType: document.fileType || "",
          issuedDate: document.issuedDate || "",
          expiryDate: document.expiryDate || "",
          linkedType: document.linkedTo?.kind?.toLowerCase() || "",
          linkedId: document.linkedTo?.label || "",
          linkedName: document.linkedTo?.label || "",
          size: document.size || "",
          notes: document.subtitle || "",
        });
        setTouched({
          title: !!document.title,
          linkedType: !!document.linkedTo?.kind,
          linkedId: !!document.linkedTo?.label,
        });
        if (document.linkedTo?.kind) {
          loadLinkedOptions(document.linkedTo.kind.toLowerCase());
        }
      } else {
        // New mode
        setFormData({
          title: "",
          type: "",
          fileType: "",
          issuedDate: new Date().toISOString().split("T")[0],
          expiryDate: "",
          linkedType: "",
          linkedId: "",
          linkedName: "",
          size: "",
          notes: "",
        });
        setTouched({
          title: false,
          linkedType: false,
          linkedId: false,
        });
        setLinkedOptions([]);
        setSelectedFile(null);
        setFilePreview(null);
      }
    }
  }, [open, document]);

  const loadLinkedOptions = (type) => {
    setLinkedOptions(mockLinkedRecords[type] || []);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData((prev) => ({
        ...prev,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));

      // Create preview URL for the file
      const fileUrl = URL.createObjectURL(file);
      setFilePreview(fileUrl);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    if (field === "linkedType") {
      loadLinkedOptions(value);
      setFormData((prev) => ({
        ...prev,
        linkedType: value,
        linkedId: "",
        linkedName: "",
      }));
      setTouched((prev) => ({ ...prev, linkedType: true, linkedId: true }));
    } else if (field === "linkedId") {
      const selected = linkedOptions.find((opt) => opt.id === value);
      setFormData((prev) => ({
        ...prev,
        linkedId: value,
        linkedName: selected?.name || "",
      }));
      setTouched((prev) => ({ ...prev, linkedId: true }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const hasError = (field) => touched[field] && !formData[field];

  const handleSubmit = () => {
    setTouched({
      title: true,
      linkedType: true,
      linkedId: true,
    });

    const hasErrors =
      !formData.title.trim() || !formData.linkedType || !formData.linkedId;

    if (hasErrors) {
      setToast({
        open: true,
        message: "Please fill in all required fields (*)",
        severity: "error",
      });
      return;
    }

    const linkedKindMap = {
      supplier: "Supplier",
      po: "PO",
      grn: "GRN",
      item: "Item",
    };

    const saveData = {
      id: document?.id || `DOC-${Date.now()}`,
      title: formData.title,
      subtitle: formData.notes || "",
      type: formData.type || "Other",
      fileType: formData.fileType || "",
      linkedTo: {
        label: formData.linkedName,
        kind: linkedKindMap[formData.linkedType] || formData.linkedType,
      },
      issuedDate: formData.issuedDate || new Date().toISOString().split("T")[0],
      expiryDate: formData.expiryDate || null,
      uploadedBy: "Current User",
      uploadedOn: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      size: formData.size || "0 KB",
      status:
        formData.expiryDate && new Date(formData.expiryDate) < new Date()
          ? "Expired"
          : formData.expiryDate &&
              new Date(formData.expiryDate) <
                new Date(new Date().setMonth(new Date().getMonth() + 3))
            ? "Expiring Soon"
            : "Active",
      fileName: selectedFile ? selectedFile.name : document?.fileName || "",
      fileData: selectedFile
        ? URL.createObjectURL(selectedFile)
        : document?.fileData || null,
    };

    onSave(saveData);
    handleClose();
  };

  const handleClose = () => {
    // Clean up file preview URL
    if (filePreview && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }

    setFormData({
      title: "",
      type: "",
      fileType: "",
      issuedDate: "",
      expiryDate: "",
      linkedType: "",
      linkedId: "",
      linkedName: "",
      size: "",
      notes: "",
    });
    setTouched({
      title: false,
      linkedType: false,
      linkedId: false,
    });
    setLinkedOptions([]);
    setSelectedFile(null);
    setFilePreview(null);
    onClose();
  };

  const documentTypes = [
    "Contract",
    "PO Acknowledgement",
    "Quality Certificate",
    "Regulatory Notice",
    "MSDS / Safety Sheet",
    "Delivery Note",
    "Invoice",
    "Warranty",
    "Inspection Report",
    "Other",
  ];
  const fileTypes = ["PDF", "Image", "Excel", "CSV"];
  const linkedTypes = [
    { value: "supplier", label: "Supplier", icon: "🏢" },
    { value: "po", label: "Purchase Order", icon: "🛒" },
    { value: "grn", label: "Goods Receipt Note", icon: "📥" },
    { value: "item", label: "Inventory Item", icon: "📦" },
  ];

  // Shared field label style
  const labelSx = {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    mb: "4px",
  };

  const inputSx = (hasError = false) => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      backgroundColor: "#f8fafc",
      fontSize: "0.82rem",
      "& fieldset": { borderColor: hasError ? "#ef4444" : "#e2e8f0" },
      "&:hover fieldset": { borderColor: hasError ? "#ef4444" : "#2563eb" },
      "&.Mui-focused fieldset": {
        borderColor: hasError ? "#ef4444" : "#2563eb",
        borderWidth: "1.5px",
      },
    },
    "& .MuiInputBase-input": {
      fontSize: "0.82rem",
      padding: "8px 12px",
      color: "#1e293b",
      colorScheme: "light",
      "&::placeholder": { color: "#94a3b8", opacity: 1 },
      "&::-webkit-calendar-picker-indicator": { display: "none" },
    },
  });

  const selectSx = (hasError = false) => ({
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    fontSize: "0.82rem",
    "& .MuiSelect-select": {
      padding: "8px 12px",
      fontSize: "0.82rem",
      color: "#1e293b",
    },
    "& fieldset": { borderColor: hasError ? "#ef4444" : "#e2e8f0" },
    "&:hover fieldset": { borderColor: hasError ? "#ef4444" : "#2563eb" },
    "&.Mui-focused fieldset": {
      borderColor: hasError ? "#ef4444" : "#2563eb",
      borderWidth: "1.5px",
    },
  });

  const sectionLabelSx = {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    mb: 1.5,
  };

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
            maxWidth: "520px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.13)",
            overflow: "hidden",
          },
        }}
      >
        {/* ── Title ── */}
        <DialogTitle
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "9px",
                bgcolor: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InsertDriveFileOutlinedIcon
                sx={{ fontSize: 18, color: "#d97706" }}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                {document ? "Edit Document" : "Upload Document"}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: "#94a3b8",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              width: 28,
              height: 28,
              "&:hover": { bgcolor: "#f1f5f9", color: "#374151" },
              "&:focus": { outline: "none" },
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </DialogTitle>

        {/* ── Required fields info banner ── */}
        <Box sx={{ px: 2.5, pt: 1, pb: 0 }}>
          <Typography
            sx={{
              fontSize: 11,
              color: "#9ca3af",
              fontStyle: "italic",
            }}
          >
            <span style={{ color: "#ef4444" }}>*</span> Required fields
          </Typography>
        </Box>

        {/* ── Content ── */}
        <DialogContent
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            "&::-webkit-scrollbar": { width: 5 },
            "&::-webkit-scrollbar-thumb": {
              background: "#e2e8f0",
              borderRadius: 4,
            },
          }}
        >
          {/* ── DOCUMENT INFO ── */}
          <Box>
            <Typography sx={sectionLabelSx}>Document Info</Typography>

            {/* Document Title */}
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={labelSx}>
                Document Title <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. McKesson Supply Agreement 2026"
                value={formData.title}
                onChange={handleChange("title")}
                onBlur={handleBlur("title")}
                error={hasError("title")}
                helperText={
                  hasError("title") ? "Document title is required" : ""
                }
                sx={inputSx(hasError("title"))}
              />
            </Box>

            {/* Document Type + File Type side by side */}
            <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Document Type</Typography>
                <FormControl fullWidth size="small" error={false}>
                  <Select
                    value={formData.type}
                    onChange={handleChange("type")}
                    displayEmpty
                    sx={selectSx(false)}
                  >
                    <MenuItem
                      value=""
                      disabled
                      sx={{ fontSize: "0.8rem", color: "#94a3b8" }}
                    >
                      Select type...
                    </MenuItem>
                    {documentTypes.map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: "0.8rem" }}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>
                  File Type <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.fileType}
                    onChange={handleChange("fileType")}
                    displayEmpty
                    sx={selectSx(false)}
                  >
                    <MenuItem
                      value=""
                      disabled
                      sx={{ fontSize: "0.8rem", color: "#94a3b8" }}
                    >
                      Select type...
                    </MenuItem>
                    {fileTypes.map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: "0.8rem" }}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Issued Date + Expiry Date side by side */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Issued Date</Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={formData.issuedDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, issuedDate: e.target.value }))
                  }
                  inputRef={issuedDateInputRef}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() =>
                            issuedDateInputRef.current?.showPicker?.()
                          }
                          sx={{
                            color: "#94a3b8",
                            p: "2px",
                            "&:focus": { outline: "none" },
                            "&:hover": { color: "#2563eb" },
                          }}
                        >
                          <EventIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx(false)}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Expiry Date (if applicable)</Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                  inputRef={expiryDateInputRef}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() =>
                            expiryDateInputRef.current?.showPicker?.()
                          }
                          sx={{
                            color: "#94a3b8",
                            p: "2px",
                            "&:focus": { outline: "none" },
                            "&:hover": { color: "#2563eb" },
                          }}
                        >
                          <EventIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx(false)}
                />
              </Box>
            </Box>
          </Box>

          {/* ── FILE UPLOAD ── */}
          <Box>
            <Typography sx={sectionLabelSx}>File Attachment</Typography>

            <Box
              sx={{
                border: "2px dashed #e2e8f0",
                borderRadius: "12px",
                p: 2,
                textAlign: "center",
                backgroundColor: "#fafcff",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "#2563eb",
                  backgroundColor: "#f0f9ff",
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <CloudUploadIcon sx={{ fontSize: 36, color: "#2563eb", mb: 1 }} />
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  mb: 0.5,
                }}
              >
                {selectedFile
                  ? selectedFile.name
                  : "Click to upload or drag and drop"}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                PDF, DOC, XLS, JPG, PNG (max. 10MB)
              </Typography>
              {selectedFile && (
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <AttachFileIcon sx={{ fontSize: 14, color: "#16a34a" }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "#16a34a" }}>
                    File selected: {selectedFile.name}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* ── LINK TO RECORD ── */}
          <Box>
            <Typography sx={sectionLabelSx}>Link to Record</Typography>

            {/* Record Type + Linked Record side by side */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>
                  Record Type <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <FormControl
                  fullWidth
                  size="small"
                  error={hasError("linkedType")}
                >
                  <Select
                    value={formData.linkedType}
                    onChange={handleChange("linkedType")}
                    onBlur={handleBlur("linkedType")}
                    displayEmpty
                    sx={selectSx(hasError("linkedType"))}
                  >
                    <MenuItem
                      value=""
                      disabled
                      sx={{ fontSize: "0.8rem", color: "#94a3b8" }}
                    >
                      Select type…
                    </MenuItem>
                    {linkedTypes.map((t) => (
                      <MenuItem
                        key={t.value}
                        value={t.value}
                        sx={{ fontSize: "0.8rem" }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {hasError("linkedType") && (
                    <FormHelperText
                      sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                    >
                      Record type is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>
                  Linked Record <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <FormControl
                  fullWidth
                  size="small"
                  error={hasError("linkedId")}
                >
                  <Select
                    value={formData.linkedId}
                    onChange={handleChange("linkedId")}
                    onBlur={handleBlur("linkedId")}
                    displayEmpty
                    disabled={!formData.linkedType}
                    sx={selectSx(hasError("linkedId"))}
                  >
                    <MenuItem
                      value=""
                      disabled
                      sx={{ fontSize: "0.8rem", color: "#94a3b8" }}
                    >
                      {formData.linkedType
                        ? "Select record…"
                        : "Select type first…"}
                    </MenuItem>
                    {linkedOptions.map((opt) => (
                      <MenuItem
                        key={opt.id}
                        value={opt.id}
                        sx={{ fontSize: "0.8rem" }}
                      >
                        <Box>
                          <Typography
                            sx={{ fontSize: "0.78rem", fontWeight: 500 }}
                          >
                            {opt.name}
                          </Typography>
                          <Typography
                            sx={{ fontSize: "0.65rem", color: "#64748b" }}
                          >
                            ID: {opt.id}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {hasError("linkedId") && (
                    <FormHelperText
                      sx={{ color: "#ef4444", fontSize: 11, mx: 0 }}
                    >
                      Linked record is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Box>
          </Box>

          {/* ── FILE DETAILS ── */}
          <Box>
            <Typography sx={sectionLabelSx}>Additional Details</Typography>

            {/* Notes */}
            <Box>
              <Typography sx={labelSx}>Notes / Description</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="Brief description of the document…"
                value={formData.notes}
                onChange={handleChange("notes")}
                sx={{
                  ...inputSx(false),
                  "& .MuiInputBase-input": {
                    fontSize: "0.82rem",
                    color: "#1e293b",
                    "&::placeholder": { color: "#94a3b8", opacity: 1 },
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #f1f5f9",
            bgcolor: "#fff",
            gap: 1,
          }}
        >
          <Button
            onClick={handleClose}
            disableRipple
            sx={{
              color: "#64748b",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.8rem",
              px: 2,
              py: 0.7,
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#f8fafc" },
              "&:focus": { outline: "none" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon sx={{ fontSize: 15 }} />}
            disableRipple
            sx={{
              bgcolor: "#2563eb",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              px: 2.5,
              py: 0.7,
              borderRadius: "8px",
              boxShadow: "0 1px 4px rgba(37,99,235,0.25)",
              "&:hover": { bgcolor: "#1d4ed8" },
              "&:focus": { outline: "none" },
            }}
          >
            {document ? "Update Document" : "Save Document"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DocumentUploadModal;