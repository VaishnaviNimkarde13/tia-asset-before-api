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
  Snackbar,
  Alert,
  Chip,
  Modal,
  Paper,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { getManufacturerNames } from "../../utils/manufacturerUtils";
import {
  DOCUMENT_TYPES,
  getVendorDocuments,
  saveVendorDocument,
  deleteVendorDocument,
} from "../../utils/vendorDocumentUtils";
import SupplierDocumentViewModal from "./SupplierDocumentViewModal";

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

const GPO_OPTIONS = [
  "Vizient",
  "Premier",
  "Provista",
  "Intalere",
  "Direct Contract",
  "Spot Purchase",
];
const PAYMENT_TERMS_OPTIONS = ["Net-30", "Net-45", "Net-60", "Net-15", "COD"];

const CODE_TO_NAME = {
  TEVA: "Teva Pharmaceuticals",
  PFZ: "Pfizer Inc.",
  BAX: "Baxter International",
  ANSELL: "Ansell Healthcare",
  "3M": "3M Health Care",
  BD: "Becton Dickinson (BD)",
  WWPH: "West-Ward Pharmaceuticals",
  MDL: "Medline Industries",
};

const EMPTY_FORM = {
  company: "",
  contactPerson: "",
  phone: "",
  email: "",
  cityState: "",
  gpo: "",
  contractNumber: "",
  paymentTerms: "",
  leadTime: "",
  notes: "",
  manufacturers: [],
};

export default function SupplierModal({
  open,
  onClose,
  onSave,
  supplier,
  onAddManufacturer,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [mSearch, setMSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [allManufacturers, setAllManufacturers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({
    docType: "",
    description: "",
    docId: "",
    file: null,
    fileName: "",
  });
  const [docErrors, setDocErrors] = useState({});
  const [viewDocOpen, setViewDocOpen] = useState(false);
  const [selectedViewDoc, setSelectedViewDoc] = useState(null);

  useEffect(() => {
    const manufacturers = getManufacturerNames();
    setAllManufacturers(manufacturers);
    const handleManufacturersUpdated = () => {
      setAllManufacturers(getManufacturerNames());
    };
    window.addEventListener("manufacturersUpdated", handleManufacturersUpdated);
    return () => window.removeEventListener("manufacturersUpdated", handleManufacturersUpdated);
  }, []);

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  useEffect(() => {
    if (supplier) {
      const raw = supplier.manufacturers || [];
      const mapped = raw.map((s) => CODE_TO_NAME[s] || s);
      setForm({
        company: supplier.company || "",
        contactPerson: supplier.contactName || "",
        phone: supplier.phone || "",
        email: supplier.contactEmail || "",
        cityState: supplier.location || "",
        gpo: supplier.gpo || "",
        contractNumber: supplier.contractNumber || "",
        paymentTerms: supplier.terms || "",
        leadTime: supplier.leadTime?.replace("d", "") || "",
        notes: supplier.notes || "",
        manufacturers: mapped,
      });
      const docs = getVendorDocuments(supplier.id, "supplier");
      setDocuments(docs);
    } else {
      setForm(EMPTY_FORM);
      setDocuments([]);
    }
    setErrors({});
    setMSearch("");
    setDocForm({ docType: "", description: "", docId: "", file: null, fileName: "" });
    setDocErrors({});
  }, [supplier, open]);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const toggleManufacturer = (name) => {
    setForm((p) => {
      const has = p.manufacturers.some((m) => m.toLowerCase() === name.toLowerCase());
      return {
        ...p,
        manufacturers: has
          ? p.manufacturers.filter((m) => m.toLowerCase() !== name.toLowerCase())
          : [...p.manufacturers, name],
      };
    });
  };

  const getErrors = () => {
    const e = {};
    if (!form.company.trim()) e.company = true;
    if (!form.gpo) e.gpo = true;
    if (!form.paymentTerms) e.paymentTerms = true;
    if (!form.email.trim()) e.email = "required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "invalid";
    if (form.phone.trim()) {
      const cleanedPhone = form.phone.replace(/\D/g, "");
      if (cleanedPhone.length !== 10) e.phone = true;
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = getErrors();

    // Validate document fields
    const dErrs = {};
    if (!docForm.docType) dErrs.docType = true;
    if (!docForm.file) dErrs.file = true;
    if (Object.keys(dErrs).length) setDocErrors(dErrs);

    if (Object.keys(e).length || Object.keys(dErrs).length) {
      setErrors(e);
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 600));

      const vendorId =
        supplier?.id ||
        `supplier-${form.company.replace(/\s+/g, "-").toLowerCase()}`;

      await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          saveVendorDocument({
            vendorId,
            vendorType: "supplier",
            vendorName: form.company,
            docType: docForm.docType,
            description: docForm.description,
            docId: docForm.docId,
            fileName: docForm.fileName,
            fileSize: docForm.file.size,
            fileType: docForm.file.type,
            fileData: ev.target.result,
          });
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(docForm.file);
      });

      onSave?.({
        company: form.company,
        location: form.cityState,
        contactName: form.contactPerson,
        contactEmail: form.email,
        phone: form.phone,
        gpo: form.gpo,
        contractNumber: form.contractNumber,
        terms: form.paymentTerms,
        leadTime: form.leadTime ? `${form.leadTime}d` : "",
        manufacturers: form.manufacturers,
        instruments: [],
        notes: form.notes,
        status: "Active",
      });
      handleClose();
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm(EMPTY_FORM);
    setMSearch("");
    setErrors({});
    onClose();
  };

  const filteredManufacturers = allManufacturers.filter((m) =>
    m.toLowerCase().includes(mSearch.toLowerCase()),
  );

  const handleDocumentUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocForm((p) => ({ ...p, file, fileName: file.name }));
      setDocErrors((p) => { const n = { ...p }; delete n.file; return n; });
    }
  };

  const handleDeleteDocument = (docId) => {
    if (deleteVendorDocument(docId)) {
      setDocuments((p) => p.filter((d) => d.id !== docId));
      showToast("Document deleted.", "success");
    }
  };

  const handleDownloadDocument = (doc) => {
    if (doc.fileData) {
      const a = document.createElement("a");
      a.href = doc.fileData;
      a.download = doc.fileName;
      a.click();
      showToast("Download started", "success");
    }
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
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BusinessIcon sx={{ fontSize: 20, color: "#2563eb" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                {supplier ? "Edit Supplier" : "Add Supplier"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>
                Approved vendor master record
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
            "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
            "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
          }}
        >
          {/* ── Section: Company Info ── */}
          <Box sx={{ mb: "20px" }}>
            <SectionLabel>Company Info</SectionLabel>

            <Box sx={{ mb: "16px" }}>
              <FieldLabel required>Company Name</FieldLabel>
              <TextField
                fullWidth size="small"
                placeholder="e.g. McKesson Medical"
                value={form.company}
                onChange={set("company")}
                disabled={loading}
                sx={errors.company ? inputErrSx : inputSx}
              />
              {errors.company && (
                <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>
              )}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", mb: "16px" }}>
              <Box>
                <FieldLabel>Contact Person</FieldLabel>
                <TextField
                  fullWidth size="small" placeholder="John Reid"
                  value={form.contactPerson} onChange={set("contactPerson")}
                  disabled={loading} sx={inputSx}
                />
              </Box>
              <Box>
                <FieldLabel>Phone (optional - 10 digits)</FieldLabel>
                <TextField
                  fullWidth size="small" placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((p) => ({ ...p, phone: value }));
                    setErrors((p) => { const n = { ...p }; delete n.phone; return n; });
                  }}
                  disabled={loading}
                  sx={errors.phone ? inputErrSx : inputSx}
                  inputProps={{ maxLength: 10 }}
                />
                {errors.phone && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    Phone number must be exactly 10 digits
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Box>
                <FieldLabel required>Email</FieldLabel>
                <TextField
                  fullWidth size="small" type="email" placeholder="orders@supplier.com"
                  value={form.email} onChange={set("email")}
                  disabled={loading} sx={errors.email ? inputErrSx : inputSx}
                />
                {errors.email && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>
                    Provide a valid Email address
                  </Typography>
                )}
              </Box>
              <Box>
                <FieldLabel>City, State</FieldLabel>
                <TextField
                  fullWidth size="small" placeholder="Irving, TX"
                  value={form.cityState} onChange={set("cityState")}
                  disabled={loading} sx={inputSx}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: "20px" }} />

          {/* ── Section: Contract & Terms ── */}
          <Box sx={{ mb: "20px" }}>
            <SectionLabel>Contract &amp; Terms</SectionLabel>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", mb: "16px" }}>
              <Box>
                <FieldLabel required>GPO</FieldLabel>
                <FormControl fullWidth size="small">
                  <Select value={form.gpo} onChange={set("gpo")} displayEmpty disabled={loading} sx={errors.gpo ? selectErrSx : selectSx}>
                    <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>Select GPO…</MenuItem>
                    {GPO_OPTIONS.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: 13 }}>{o}</MenuItem>)}
                  </Select>
                </FormControl>
                {errors.gpo && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
              </Box>
              <Box>
                <FieldLabel>Contract #</FieldLabel>
                <TextField fullWidth size="small" placeholder="VZ-2025-MCK" value={form.contractNumber} onChange={set("contractNumber")} disabled={loading} sx={inputSx} />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Box>
                <FieldLabel required>Payment Terms</FieldLabel>
                <FormControl fullWidth size="small">
                  <Select value={form.paymentTerms} onChange={set("paymentTerms")} displayEmpty disabled={loading} sx={errors.paymentTerms ? selectErrSx : selectSx}>
                    <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>Select Terms…</MenuItem>
                    {PAYMENT_TERMS_OPTIONS.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: 13 }}>{o}</MenuItem>)}
                  </Select>
                </FormControl>
                {errors.paymentTerms && <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>}
              </Box>
              <Box>
                <FieldLabel>Lead Time (days)</FieldLabel>
                <TextField
                  fullWidth size="small" type="number" placeholder="e.g. 3"
                  value={form.leadTime} onChange={set("leadTime")}
                  disabled={loading} inputProps={{ min: 0 }}
                  sx={{
                    ...inputSx,
                    "& input[type=number]": { MozAppearance: "textfield" },
                    "& input[type=number]::-webkit-outer-spin-button": { WebkitAppearance: "none" },
                    "& input[type=number]::-webkit-inner-spin-button": { WebkitAppearance: "none" },
                  }}
                />
                <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "3px" }}>avg. days from order to delivery</Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: "20px" }} />

          {/* ── Section: Manufacturers Supplied ── */}
          <Box sx={{ mb: "20px" }}>
            <SectionLabel>Manufacturers Supplied</SectionLabel>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mb: "12px" }}>
              Select all manufacturers this supplier carries or distributes for:
            </Typography>
            <TextField
              fullWidth size="small" placeholder="Search manufacturers…"
              value={mSearch} onChange={(e) => setMSearch(e.target.value)}
              disabled={loading} sx={{ ...inputSx, mb: "8px" }}
            />
            <Box
              sx={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px",
                maxHeight: "180px", overflowY: "auto",
                border: "1px solid #e5e7eb", borderRadius: "8px", p: "10px", background: "#f9fafb",
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
              }}
            >
              {filteredManufacturers.map((name) => {
                const selected = form.manufacturers.some((m) => m.toLowerCase() === name.toLowerCase());
                return (
                  <Box
                    key={name}
                    onClick={() => !loading && toggleManufacturer(name)}
                    sx={{
                      display: "flex", alignItems: "center", gap: "8px",
                      p: "6px 8px", borderRadius: "6px",
                      cursor: loading ? "default" : "pointer",
                      border: `1.5px solid ${selected ? "#bfdbfe" : "transparent"}`,
                      background: selected ? "#eff6ff" : "transparent",
                      transition: "all 0.12s",
                      "&:hover": loading ? {} : { background: "#eff6ff", borderColor: "#bfdbfe" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 16, height: 16, borderRadius: "4px", flexShrink: 0,
                        border: `2px solid ${selected ? "#2563eb" : "#d1d5db"}`,
                        background: selected ? "#2563eb" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.12s",
                      }}
                    >
                      {selected && <Typography sx={{ fontSize: 10, color: "#fff", lineHeight: 1, fontWeight: 700 }}>✓</Typography>}
                    </Box>
                    <Typography sx={{ fontSize: 12, color: selected ? "#1d4ed8" : "#374151", fontWeight: selected ? 600 : 400 }}>
                      {name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "8px" }}>
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                Can't find a manufacturer?{" "}
                <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }} onClick={() => { handleClose(); onAddManufacturer?.(); }}>
                  Add Manufacturer →
                </span>
              </Typography>
              {form.manufacturers.length > 0 && (
                <Box sx={{ px: "10px", py: "3px", borderRadius: "20px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>{form.manufacturers.length} selected</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: "20px" }} />

          {/* ── Section: Documents ── */}
          <Box sx={{ mb: "20px" }}>
            <SectionLabel>Documents</SectionLabel>

            <Box
              sx={{
                p: "12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                bgcolor: "#f9fafb",
                mb: "16px",
              }}
            >
              {/* File Type — REQUIRED */}
              <Box sx={{ mb: "12px" }}>
                <FieldLabel required>File Type</FieldLabel>
                <FormControl fullWidth size="small">
                  <Select
                    value={docForm.docType}
                    onChange={(e) => {
                      setDocForm((p) => ({ ...p, docType: e.target.value }));
                      setDocErrors((p) => { const n = { ...p }; delete n.docType; return n; });
                    }}
                    displayEmpty disabled={loading}
                    sx={docErrors.docType ? selectErrSx : selectSx}
                  >
                    <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>Select type…</MenuItem>
                    {DOCUMENT_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
                {docErrors.docType && (
                  <Typography sx={{ fontSize: 10, color: "#ef4444", mt: "3px" }}>Required</Typography>
                )}
              </Box>

              {/* Description */}
              <Box sx={{ mb: "12px" }}>
                <FieldLabel>Description</FieldLabel>
                <TextField
                  fullWidth size="small" placeholder="e.g. ISO 9001:2015 Certification"
                  value={docForm.description}
                  onChange={(e) => {
                    setDocForm((p) => ({ ...p, description: e.target.value }));
                    setDocErrors((p) => { const n = { ...p }; delete n.description; return n; });
                  }}
                  disabled={loading}
                  sx={docErrors.description ? inputErrSx : inputSx}
                />
              </Box>

              {/* Document ID */}
              <Box sx={{ mb: "12px" }}>
                <FieldLabel>Document ID / Reference</FieldLabel>
                <TextField
                  fullWidth size="small" placeholder="e.g. ISO-2025-001"
                  value={docForm.docId}
                  onChange={(e) => setDocForm((p) => ({ ...p, docId: e.target.value }))}
                  disabled={loading} sx={inputSx}
                />
              </Box>

              {/* File Upload — REQUIRED */}
              <Box>
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
                    "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
                  }}
                >
                  <input
                    type="file"
                    onChange={handleDocumentUpload}
                    disabled={loading}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                  <CloudUploadIcon sx={{ fontSize: 24, color: docErrors.file ? "#ef4444" : "#9ca3af", mb: "6px" }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: docErrors.file ? "#ef4444" : "#374151" }}>
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
            <FieldLabel>Notes</FieldLabel>
            <TextField
              fullWidth multiline rows={3}
              placeholder="Special terms, certifications, delivery instructions…"
              value={form.notes} onChange={set("notes")} disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: 13, borderRadius: "8px", background: "#f9fafb",
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
            px: "24px", py: "16px",
            borderTop: "1px solid #f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px",
            bgcolor: "#fff", flexShrink: 0,
          }}
        >
          <Button
            onClick={handleClose} disabled={loading}
            sx={{
              fontSize: 13, fontWeight: 600, color: "#374151", textTransform: "none",
              borderRadius: "8px", px: "20px", py: "9px",
              border: "1px solid #e5e7eb", bgcolor: "#fff",
              "&:hover": { bgcolor: "#f9fafb" },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit} disabled={loading}
            startIcon={
              loading ? (
                <Box component="span" sx={{
                  width: 14, height: 14,
                  border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                }} />
              ) : (
                <SaveIcon sx={{ fontSize: 15 }} />
              )
            }
            sx={{
              fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "none",
              borderRadius: "8px", px: "20px", py: "9px",
              bgcolor: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              "&:hover": { bgcolor: "#1d4ed8" },
              "&.Mui-disabled": { opacity: 0.6, color: "#fff" },
            }}
          >
            {supplier ? "Save Changes" : "Save Supplier"}
          </Button>
        </Box>
      </Dialog>

      <SupplierDocumentViewModal
        open={viewDocOpen}
        onClose={() => { setViewDocOpen(false); setSelectedViewDoc(null); }}
        document={selectedViewDoc}
      />

      <Snackbar
        open={toast.open} autoHideDuration={4000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity} variant="filled"
          sx={{ fontSize: 13, borderRadius: "10px", minWidth: 320 }}
          icon={toast.severity === "success" ? <CheckCircleOutlineIcon fontSize="inherit" /> : undefined}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}