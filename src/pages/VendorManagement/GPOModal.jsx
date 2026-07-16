import React, { useState, useEffect } from "react";
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
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import {
  DOCUMENT_TYPES,
  getVendorDocuments,
  saveVendorDocument,
  deleteVendorDocument,
} from "../../utils/vendorDocumentUtils";

// ─── Shared styles ──────────────────────────────────────────────────────────
const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "8px",
    background: "#f9fafb",
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb" },
  },
};

const inputErrSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 13,
    borderRadius: "8px",
    background: "#fff5f5",
    "& fieldset": { borderColor: "#fca5a5" },
    "&:hover fieldset": { borderColor: "#f87171" },
    "&.Mui-focused fieldset": { borderColor: "#ef4444" },
  },
};

const selectSx = {
  fontSize: 13,
  borderRadius: "8px",
  background: "#f9fafb",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
};

const selectErrSx = {
  ...selectSx,
  background: "#fff5f5",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fca5a5" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#f87171" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#ef4444" },
};

// ─── FieldLabel ─────────────────────────────────────────────────────────────
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
        display: "flex",
        alignItems: "center",
        gap: "3px",
      }}
    >
      {children}
      {required && <span style={{ color: "#ef4444" }}>*</span>}
    </Typography>
  );
}

// ─── Section heading ────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
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
      {children}
    </Typography>
  );
}

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  website: "",
  status: "Active",
};

// ─── Main Component ─────────────────────────────────────────────────────────
const GPOModal = ({ open, onClose, onSave, gpo }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({
    docType: "",
    description: "",
    docId: "",
    file: null,
    fileName: "",
  });
  const [docErrors, setDocErrors] = useState({});

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  useEffect(() => {
    if (gpo) {
      setFormData(gpo);
      const docs = getVendorDocuments(gpo.id, "gpo");
      setDocuments(docs);
    } else {
      setFormData(EMPTY_FORM);
      setDocuments([]);
    }
    setErrors({});
    setDocForm({ docType: "", description: "", docId: "", file: null, fileName: "" });
    setDocErrors({});
  }, [gpo, open]);

  const set = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.code.trim()) newErrors.code = true;
    if (!formData.contactEmail.trim()) newErrors.contactEmail = true;
    else if (!/\S+@\S+\.\S+/.test(formData.contactEmail))
      newErrors.contactEmail = true;

    if (formData.phone.trim()) {
      const cleanedPhone = formData.phone.replace(/\D/g, "");
      if (cleanedPhone.length !== 10) {
        newErrors.phone = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 600));

      // Save document if one was attached
      const vendorId =
        gpo?.id || `gpo-${formData.name.replace(/\s+/g, "-").toLowerCase()}`;

      if (docForm.file) {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            saveVendorDocument({
              vendorId,
              vendorType: "gpo",
              vendorName: formData.name,
              docType: docForm.docType,
              description: docForm.description,
              docId: docForm.docId,
              fileName: docForm.fileName,
              fileSize: docForm.file.size,
              fileType: docForm.file.type,
              fileData: e.target.result,
            });
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(docForm.file);
        });
      }

      onSave?.(formData);
      handleClose();
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  // ── Document handlers ─────────────────────────────────────────────────────
  const handleDocumentUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocForm((p) => ({ ...p, file, fileName: file.name }));
      setDocErrors((p) => {
        const n = { ...p };
        delete n.file;
        return n;
      });
    }
  };

  const handleDeleteDocument = (docId) => {
    if (deleteVendorDocument(docId)) {
      setDocuments((p) => p.filter((d) => d.id !== docId));
      showToast("Document deleted.", "success");
    }
  };

  const handleDownloadDocument = (doc) => {
    showToast(`Download: ${doc.fileName}`, "info");
  };

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
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StorefrontIcon sx={{ fontSize: 20, color: "#f59e0b" }} />
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}
              >
                {gpo ? "Edit GPO" : "Add GPO"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>
                Group purchasing organization master record
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
              "&:hover": { background: "#f3f4f6", color: "#374151" },
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        {/* ── Scrollable Body ── */}
        <DialogContent
          sx={{
            px: "24px",
            py: "20px",
            overflowY: "auto",
            maxHeight: "70vh",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "#d1d5db",
              borderRadius: 4,
            },
            "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
          }}
        >
          {/* ── Section: Organization Info ── */}
          <Box sx={{ mb: "20px" }}>
            <SectionLabel>Organization Info</SectionLabel>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                mb: "16px",
              }}
            >
              <Box>
                <FieldLabel required>GPO Name</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Vizient, Premier"
                  value={formData.name}
                  onChange={set("name")}
                  disabled={loading}
                  sx={errors.name ? inputErrSx : inputSx}
                />
                {errors.name && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    Required
                  </Typography>
                )}
              </Box>
              <Box>
                <FieldLabel required>Code</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. VZ, PR"
                  value={formData.code}
                  onChange={set("code")}
                  disabled={loading}
                  sx={errors.code ? inputErrSx : inputSx}
                />
                {errors.code && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    Required
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ mb: "16px" }}>
              <FieldLabel>Description</FieldLabel>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Brief description of the GPO"
                value={formData.description}
                onChange={set("description")}
                disabled={loading}
                sx={inputSx}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: "20px" }} />

          {/* ── Section: Contact Info ── */}
          <Box sx={{ mb: "20px" }}>
            <SectionLabel>Contact Info</SectionLabel>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                mb: "16px",
              }}
            >
              <Box>
                <FieldLabel>Contact Name</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Contact person name"
                  value={formData.contactName}
                  onChange={set("contactName")}
                  disabled={loading}
                  sx={inputSx}
                />
              </Box>
              <Box>
                <FieldLabel required>Contact Email</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="contact@gpo.com"
                  value={formData.contactEmail}
                  onChange={set("contactEmail")}
                  disabled={loading}
                  sx={errors.contactEmail ? inputErrSx : inputSx}
                />
                {errors.contactEmail && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    {formData.contactEmail
                      ? "Provide a valid Email address"
                      : "Required"}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <Box>
                <FieldLabel>Phone (10 digits)</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="1-800-XXX-XXXX"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setFormData((p) => ({ ...p, phone: value }));
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.phone;
                      return n;
                    });
                  }}
                  disabled={loading}
                  sx={errors.phone ? inputErrSx : inputSx}
                  inputProps={{ maxLength: 10 }}
                />
                {errors.phone && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    Phone must be exactly 10 digits
                  </Typography>
                )}
              </Box>
              <Box>
                <FieldLabel>Website</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="www.gpo.com"
                  value={formData.website}
                  onChange={set("website")}
                  disabled={loading}
                  sx={inputSx}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: "20px" }} />

          {/* ── Section: Documents ── */}
          <Box sx={{ mb: "20px" }}>
            <SectionLabel>Documents</SectionLabel>

            {/* Document Upload Form */}
            <Box
              sx={{
                p: "12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                bgcolor: "#f9fafb",
                mb: "16px",
              }}
            >
             

              {/* File Type */}
              <Box sx={{ mb: "12px" }}>
                <FieldLabel required>File Type</FieldLabel>
                <FormControl fullWidth size="small">
                  <Select
                    value={docForm.docType}
                    onChange={(e) => {
                      setDocForm((p) => ({ ...p, docType: e.target.value }));
                      setDocErrors((p) => {
                        const n = { ...p };
                        delete n.docType;
                        return n;
                      });
                    }}
                    displayEmpty
                    disabled={loading}
                    sx={docErrors.docType ? selectErrSx : selectSx}
                  >
                    <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>
                      Select type…
                    </MenuItem>
                    {DOCUMENT_TYPES.map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {docErrors.docType && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    Required
                  </Typography>
                )}
              </Box>

              {/* Description */}
              <Box sx={{ mb: "12px" }}>
                <FieldLabel>Description</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. ISO 9001:2015 Certification"
                  value={docForm.description}
                  onChange={(e) => {
                    setDocForm((p) => ({ ...p, description: e.target.value }));
                    setDocErrors((p) => {
                      const n = { ...p };
                      delete n.description;
                      return n;
                    });
                  }}
                  disabled={loading}
                  sx={docErrors.description ? inputErrSx : inputSx}
                />
             
              </Box>

              {/* Document ID */}
              <Box sx={{ mb: "12px" }}>
                <FieldLabel>Document ID / Reference</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. ISO-2025-001"
                  value={docForm.docId}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, docId: e.target.value }))
                  }
                  disabled={loading}
                  sx={inputSx}
                />
              </Box>

              {/* File Upload */}
              <Box sx={{ mb: "4px" }}>
                <FieldLabel required>Upload File</FieldLabel>
                <Box
                  sx={{
                    position: "relative",
                    border: `2px dashed ${docErrors.file ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "8px",
                    p: "16px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    bgcolor: docErrors.file ? "#fff5f5" : "#f9fafb",
                    "&:hover": {
                      borderColor: "#2563eb",
                      bgcolor: "#eff6ff",
                    },
                  }}
                >
                  <input
                    type="file"
                    onChange={handleDocumentUpload}
                    disabled={loading}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <CloudUploadIcon
                    sx={{
                      fontSize: 24,
                      color: docErrors.file ? "#ef4444" : "#9ca3af",
                      mb: "6px",
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: docErrors.file ? "#ef4444" : "#374151",
                    }}
                  >
                    {docForm.fileName || "Click to upload or drag file"}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: "4px" }}>
                    PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
                  </Typography>
                </Box>
                {docErrors.file && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    File is required
                  </Typography>
                )}
              </Box>

            </Box>
          </Box>

          <Box>
            <FieldLabel required>Status</FieldLabel>
            <FormControl fullWidth size="small">
              <Select
                value={formData.status}
                onChange={set("status")}
                disabled={loading}
                sx={selectSx}
              >
                <MenuItem value="Active" sx={{ fontSize: 13 }}>
                  Active
                </MenuItem>
                <MenuItem value="Inactive" sx={{ fontSize: 13 }}>
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>
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
            onClick={handleSubmit}
            disabled={loading}
            startIcon={
              loading ? (
                <Box
                  component="span"
                  sx={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                  }}
                />
              ) : (
                <SaveIcon sx={{ fontSize: 15 }} />
              )
            }
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
              "&.Mui-disabled": { opacity: 0.6, color: "#fff" },
            }}
          >
            {gpo ? "Save Changes" : "Add GPO"}
          </Button>
        </Box>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ fontSize: 13, borderRadius: "10px", minWidth: 320 }}
          icon={
            toast.severity === "success" ? (
              <CheckCircleOutlineIcon fontSize="inherit" />
            ) : undefined
          }
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GPOModal;