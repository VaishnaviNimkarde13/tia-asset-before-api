import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import DocumentUploadModal from "./DocumentUploadModal";
import Swal from "sweetalert2";

// ── Style tokens (mirrors PurchaseOrders) ─────────────────────────────────

const thSx = {
  fontSize: 11,
  fontWeight: 500,
  color: "#373B4D",
  letterSpacing: "0.05em",
  textTransform: "none",
  whiteSpace: "nowrap",
  py: "12px",
  px: "16px",
  borderBottom: "1px solid #f3f4f6",
  borderRight: "1px solid #BED3FC",
  "&:last-child": { borderRight: "none" },
};

const tdSx = {
  py: "12px",
  px: "16px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: 13,
  color: "#111827",
};

const selectSx = {
  fontSize: 13,
  borderRadius: "18px",
  height: 36,
  bgcolor: "#fff",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
  "& .MuiSelect-select": { py: "7px", px: "12px" },
};

// ── Mock data with file references ─────────────────────────────────────────────

const INITIAL_DOCS = [
  {
    id: "DOC-2026-001",
    title: "McKesson Master Supply Agreement",
    subtitle: "Annual supply contract — auto-renews",
    type: "Contract",
    linkedTo: { label: "McKesson Medical-Surgical", kind: "Supplier" },
    issuedDate: "2024-01-15",
    expiryDate: "2026-12-31",
    uploadedBy: "S. Anderson",
    uploadedOn: "Mar 10, 2026",
    size: "1.2 MB",
    status: "Active",
    fileName: "mckesson_agreement.pdf",
    fileData: null, // Will store base64 or blob URL
  },
  {
    id: "DOC-2026-002",
    title: "PO-2026-0004 Acknowledgement",
    subtitle: "Supplier confirmed receipt of PO",
    type: "PO Acknowledgement",
    linkedTo: { label: "PO-2026-0004", kind: "PO" },
    issuedDate: "2026-03-19",
    expiryDate: null,
    uploadedBy: "S. Anderson",
    uploadedOn: "Mar 19, 2026",
    size: "320 KB",
    status: "Active",
    fileName: "po_acknowledgement.pdf",
    fileData: null,
  },
  {
    id: "DOC-2026-003",
    title: "Medline Industries — ISO Certificate",
    subtitle: "ISO 9001:2015 certification",
    type: "Quality Certificate",
    linkedTo: { label: "Medline Industries", kind: "Supplier" },
    issuedDate: "2024-06-01",
    expiryDate: "2026-05-31",
    uploadedBy: "T. Williams",
    uploadedOn: "Feb 20, 2026",
    size: "540 KB",
    status: "Expiring Soon",
    fileName: "iso_certificate.pdf",
    fileData: null,
  },
  {
    id: "DOC-2026-004",
    title: "Amoxicillin 500mg — FDA Recall Notice",
    subtitle: "FDA Class II recall — Lot AM2024B",
    type: "Regulatory Notice",
    linkedTo: { label: "Amoxicillin 500mg Capsules", kind: "Item" },
    issuedDate: "2026-03-10",
    expiryDate: null,
    uploadedBy: "S. Anderson",
    uploadedOn: "Mar 10, 2026",
    size: "188 KB",
    status: "Active",
    fileName: "fda_recall.pdf",
    fileData: null,
  },
];

const DOC_TYPES = [
  "All Types",
  "Contract",
  "PO Acknowledgement",
  "Quality Certificate",
  "Regulatory Notice",
  "MSDS / Safety Sheet",
  "Delivery Note",
  "Invoice",
  "SOP / Policy",
  "Other",
];

const LINKED_RECORDS = ["All Linked Records", "Supplier", "Item", "PO", "GRN"];
const STATUSES = ["All Statuses", "Active", "Expiring Soon", "Expired"];

const STORAGE_KEY = "document_management_data";

// ── Type badge ────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  Contract: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "PO Acknowledgement": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Quality Certificate": { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  "Regulatory Notice": { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "MSDS / Safety Sheet": { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  "Delivery Note": { bg: "#f3e8ff", color: "#7c3aed", border: "#ddd6fe" },
  Invoice: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  "SOP / Policy": { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  Other: { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" },
};

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS["Other"];
  return (
    <Chip
      label={type}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontWeight: 700,
        fontSize: 11,
        height: 22,
        borderRadius: "6px",
      }}
    />
  );
}

// ── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    Active: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    "Expiring Soon": { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    Expired: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  };
  const c = map[status] || map["Active"];
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontWeight: 700,
        fontSize: 11,
        height: 22,
        borderRadius: "6px",
      }}
    />
  );
}

// ── Linked record badge ───────────────────────────────────────────────────

const KIND_COLORS = {
  Supplier: { bg: "#eff6ff", color: "#2563eb" },
  Item: { bg: "#f0fdf4", color: "#16a34a" },
  PO: { bg: "#fef3c7", color: "#92400e" },
  GRN: { bg: "#f3e8ff", color: "#7c3aed" },
};

function LinkedBadge({ linked }) {
  const c = KIND_COLORS[linked.kind] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
        {linked.label}
      </Typography>
      <Box
        component="span"
        sx={{
          fontSize: 10,
          fontWeight: 700,
          px: "6px",
          py: "1px",
          borderRadius: "4px",
          bgcolor: c.bg,
          color: c.color,
          display: "inline-block",
          mt: "2px",
        }}
      >
        {linked.kind}
      </Box>
    </Box>
  );
}

// ── Stat Card ──────────────────────────────────────────────

function StatCard({ label, count, sub, iconEl, iconBg }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        px: 2,
        py: 1.5,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
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
            fontSize: 11,
            fontWeight: 600,
            color: "#9ca3af",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: 22,
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
                fontSize: 11,
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

// ── Main Page ─────────────────────────────────────────────────────────────

export default function DocumentManagement() {
  const [docs, setDocs] = useState(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse localStorage data:", e);
      }
    }
    return INITIAL_DOCS;
  });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [linkedFilter, setLinkedFilter] = useState("All Linked Records");
  const [statFilter, setStatFilter] = useState("All Statuses");
  const [showUpload, setShowUpload] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Save to localStorage whenever docs change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }, [docs]);

  // ── Stats ──
  const total = docs.length;
  const active = docs.filter((d) => d.status === "Active").length;
  const expiringSoon = docs.filter((d) => d.status === "Expiring Soon").length;
  const expired = docs.filter((d) => d.status === "Expired").length;

  // ── Filtering ──
  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      d.linkedTo.label.toLowerCase().includes(q);
    const matchType = typeFilter === "All Types" || d.type === typeFilter;
    const matchLinked =
      linkedFilter === "All Linked Records" || d.linkedTo.kind === linkedFilter;
    const matchStat = statFilter === "All Statuses" || d.status === statFilter;
    return matchSearch && matchType && matchLinked && matchStat;
  });

  // ── Handlers ──
  const handleUpload = (doc) => {
    setDocs((prev) => [doc, ...prev]);
    setToast({
      open: true,
      message: `Document "${doc.title}" uploaded successfully!`,
      severity: "success",
    });
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setShowUpload(true);
  };

  const handleUpdate = (updatedDoc) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)),
    );
    setToast({
      open: true,
      message: `Document "${updatedDoc.title}" updated successfully!`,
      severity: "success",
    });
  };

  const handleDownload = (doc) => {
    if (doc.fileData) {
      // Create a download link for the file
      const link = document.createElement("a");
      link.href = doc.fileData;
      link.download = doc.fileName || `${doc.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        open: true,
        message: `Downloading "${doc.title}"...`,
        severity: "success",
      });
    } else {
      // If no file is attached, show a small message
      Swal.fire({
        icon: "info",
        title: "",
        html: `
        <div >
          <div style="margin-bottom: 8px;">
            <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">No File Attached</div>
            <p style="font-size: 14px; color: #64748b; margin: 0;">This document doesn't have an attached file.</p>
          </div>
        </div>
      `,
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
        width: 320,
        padding: "1rem",
        customClass: {
          popup: "small-info-popup",
          icon: "small-info-icon",
          confirmButton: "medium-ok-btn",
        },
        didOpen: () => {
          const style = document.createElement("style");
          style.textContent = `
          .small-info-popup {
            border-radius: 12px !important;
           
          }
          .small-info-icon {
            transform: scale(0.6) !important;
            margin: 0 auto 0 auto !important;
          }
          .small-ok-btn {
            font-size: 12px !important;
            font-weight: 600 !important;
            padding: 6px 20px !important;
            border-radius: 8px !important;
           
          }
        `;
          document.head.appendChild(style);
        },
      });
    }
  };

  const handleView = (doc) => {
    Swal.fire({
      title: "",
      html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0;">
          <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${doc.title}</div>
          ${doc.subtitle ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${doc.subtitle}</div>` : ""}
        </div>
        
        <div style="display: grid; grid-template-columns: 70px 1fr; gap: 6px; font-size: 14px;">
          <div style="color: #64748b;">Type:</div>
          <div style="color: #1e293b; font-weight: 500;">${doc.type || "Other"}</div>
          
          <div style="color: #64748b;">Linked:</div>
          <div style="color: #1e293b;">${doc.linkedTo.label} <span style="font-size: 12px; color: #94a3b8;">(${doc.linkedTo.kind})</span></div>
          
          <div style="color: #64748b;">Issued:</div>
          <div style="color: #1e293b;">${doc.issuedDate || "—"}</div>
          
          <div style="color: #64748b;">Expiry:</div>
          <div style="color: ${doc.expiryDate && new Date(doc.expiryDate) < new Date() ? "#dc2626" : "#1e293b"};">
            ${doc.expiryDate || "No expiry"}
          </div>
          
          <div style="color: #64748b;">Uploaded:</div>
          <div style="color: #1e293b; font-size: 12px;">${doc.uploadedBy}</div>
          
          <div style="color: #64748b;">Size:</div>
          <div style="color: #1e293b;">${doc.size}</div>
          
          ${
            doc.fileName
              ? `
            <div style="color: #64748b;">File:</div>
            <div style="color: #2563eb; font-size: 12px; word-break: break-all;">${doc.fileName}</div>
          `
              : ""
          }
        </div>
      </div>
    `,
      confirmButtonText: "Close",
      confirmButtonColor: "#2563eb",
      width: 360,
      padding: "0.8rem",
      showCloseButton: false,
      allowOutsideClick: true,
      customClass: {
        popup: "compact-view-popup",
        confirmButton: "medium-view-btn",
      },
      didOpen: () => {
        const style = document.createElement("style");
        style.textContent = `
        .compact-view-popup {
          border-radius: 16px !important;
          padding: 16px !important;
        }
        .compact-view-btn {
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 6px 20px !important;
          border-radius: 8px !important;
          margin-top: 8px !important;
          border: none !important;
          outline: none !important;
        }
        .compact-view-btn:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `;
        document.head.appendChild(style);
      },
    });
  };
  const handleDelete = async (doc) => {
    const result = await Swal.fire({
      title: "Delete Document?",
      text: `"${doc.title}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#e5e7eb",
      width: 300,
      padding: "1.2rem",
      customClass: {
        popup: "small-delete-popup",
        title: "small-title",
        htmlContainer: "small-text",
        icon: "small-icon",
        confirmButton: "medium-delete-btn",
        cancelButton: "medium-cancel-btn",
      },
      didOpen: () => {
        const style = document.createElement("style");
        style.textContent = `
        .small-delete-popup {
          border-radius: 14px !important;
        }
        .small-title {
          font-size: 16px !important;
          font-weight: 700 !important;
          padding: 0 !important;
          margin: 0 0 8px 0 !important;
        }
        .small-text {
          font-size: 13px !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .small-icon {
          transform: scale(0.6) !important;
          margin: 0 auto 4px auto !important;
        }
        .swal2-actions {
          margin: 16px 0 0 0 !important;
          gap: 10px !important;
        }
        .medium-delete-btn {
          font-size: 13px !important;
          font-weight: 600 !important;
          padding: 8px 24px !important;
          border-radius: 8px !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          min-width: 90px !important;
        }
        .medium-cancel-btn {
          font-size: 13px !important;
          font-weight: 600 !important;
          padding: 8px 24px !important;
          border-radius: 8px !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          min-width: 90px !important;
        }
        .medium-delete-btn:focus, .medium-cancel-btn:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `;
        document.head.appendChild(style);
      },
    });
    if (!result.isConfirmed) return;

    // Clean up blob URL if it exists
    if (doc.fileData && doc.fileData.startsWith("blob:")) {
      URL.revokeObjectURL(doc.fileData);
    }

    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setToast({
      open: true,
      message: `Document "${doc.title}" deleted successfully!`,
      severity: "info",
    });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const formatDate = (iso) => {
    if (!iso) return <span style={{ color: "#9ca3af" }}>No Expiry</span>;
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    const str = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    if (diffDays < 0)
      return <span style={{ color: "#dc2626", fontWeight: 600 }}>{str}</span>;
    if (diffDays < 90)
      return <span style={{ color: "#d97706", fontWeight: 600 }}>{str}</span>;
    return <span>{str}</span>;
  };

  return (
    <Box>
      {/* ── Header Row with Title, Search, Filters, and Upload Button ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "20px",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
          Document Management
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 200,
              "& .MuiOutlinedInput-root": {
                fontSize: 13,
                borderRadius: "8px",
                bgcolor: "#fff",
                height: 36,
                "& fieldset": { borderColor: "#e5e7eb" },
                "&:hover fieldset": { borderColor: "#d1d5db" },
                "&.Mui-focused fieldset": { borderColor: "#2563eb" },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={selectSx}
              displayEmpty
            >
              {DOC_TYPES.map((t) => (
                <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={linkedFilter}
              onChange={(e) => setLinkedFilter(e.target.value)}
              sx={selectSx}
              displayEmpty
            >
              {LINKED_RECORDS.map((r) => (
                <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setEditingDoc(null);
              setShowUpload(true);
            }}
            sx={{
              bgcolor: "#2563eb",
              color: "#fff",
              borderRadius: "12px",
              px: "15px",
              py: "8px",
              fontSize: "12px",
              fontWeight: 500,
              textTransform: "none",
              lineHeight: 1,
              boxShadow: "0 1px 4px rgba(37,99,235,0.25)",
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            Upload Document
          </Button>
        </Box>
      </Box>

      {/* ── Stat Cards ── */}
      <Box sx={{ display: "flex", gap: "12px", mb: "20px", flexWrap: "wrap" }}>
        <StatCard
          label="Total Documents"
          count={total}
          sub="All records"
          iconBg="#3b82f6"
          iconEl={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
        <StatCard
          label="Active"
          count={active}
          sub="Valid & current"
          iconBg="#10b981"
          iconEl={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <StatCard
          label="Expiring Soon"
          count={expiringSoon}
          sub="Within 90 days"
          iconBg="#f59e0b"
          iconEl={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Expired"
          count={expired}
          sub="Renewal required"
          iconBg="#ef4444"
          iconEl={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </Box>

      {/* ── Table with horizontal scrolling ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
            borderRadius: 3,
            "&:hover": { background: "#a8a8a8" },
          },
        }}
      >
        <Table size="small" sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: "#F8FAFF" }}>
            <TableRow>
              {[
                "DOC NO.",
                "TITLE",
                "TYPE",
                "LINKED TO",
                "STATUS",
                "ACTIONS",
              ].map((h) => (
                <TableCell key={h} sx={thSx}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  sx={{ textAlign: "center", py: "48px", color: "#9ca3af" }}
                >
                  <DescriptionOutlinedIcon
                    sx={{
                      fontSize: 36,
                      mb: 1,
                      display: "block",
                      mx: "auto",
                      color: "#d1d5db",
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}
                  >
                    No documents found
                  </Typography>
                  <Typography sx={{ fontSize: 12, mt: 0.5 }}>
                    {search ||
                    typeFilter !== "All Types" ||
                    linkedFilter !== "All Linked Records" ||
                    statFilter !== "All Statuses"
                      ? "Try adjusting your filters."
                      : 'Click "Upload Document" to add one.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc, idx) => (
                <TableRow
                  key={doc.id}
                  sx={{
                    bgcolor: idx % 2 === 0 ? "#fff" : "#fafafa",
                    "&:hover": { bgcolor: "#f0f7ff" },
                    transition: "background 0.12s",
                  }}
                >
                  <TableCell
                    sx={{
                      ...tdSx,
                      color: "#2563eb",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.id}
                  </TableCell>

                  <TableCell sx={{ ...tdSx, maxWidth: 220 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                        lineHeight: 1.3,
                      }}
                    >
                      {doc.title}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11, color: "#9ca3af", mt: "2px" }}
                    >
                      {doc.subtitle}
                    </Typography>
                  </TableCell>

                  <TableCell sx={tdSx}>
                    <TypeBadge type={doc.type} />
                  </TableCell>

                  <TableCell sx={tdSx}>
                    <LinkedBadge linked={doc.linkedTo} />
                  </TableCell>

                  <TableCell sx={tdSx}>
                    <StatusBadge status={doc.status} />
                  </TableCell>

                  <TableCell sx={{ ...tdSx, whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", gap: "4px" }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleView(doc)}
                          sx={{
                            width: 28,
                            height: 28,
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            color: "#6b7280",
                            "&:hover": {
                              bgcolor: "#eff6ff",
                              color: "#2563eb",
                              borderColor: "#bfdbfe",
                            },
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download File">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(doc)}
                          sx={{
                            width: 28,
                            height: 28,
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            color: "#6b7280",
                            "&:hover": {
                              bgcolor: "#dcfce7",
                              color: "#16a34a",
                              borderColor: "#bbf7d0",
                            },
                          }}
                        >
                          <DownloadIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(doc)}
                          sx={{
                            width: 28,
                            height: 28,
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            color: "#6b7280",
                            "&:hover": {
                              bgcolor: "#fffbeb",
                              color: "#d97706",
                              borderColor: "#fde68a",
                            },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(doc)}
                          sx={{
                            width: 28,
                            height: 28,
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            color: "#6b7280",
                            "&:hover": {
                              bgcolor: "#fef2f2",
                              color: "#ef4444",
                              borderColor: "#fecaca",
                            },
                          }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Upload/Edit Modal ── */}
      <DocumentUploadModal
        open={showUpload}
        onClose={() => {
          setShowUpload(false);
          setEditingDoc(null);
        }}
        onSave={editingDoc ? handleUpdate : handleUpload}
        document={editingDoc}
      />

      {/* ── Toast Notification ── */}
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
    </Box>
  );
}
