import React from "react";
import { Dialog, Box, Typography, Button } from "@mui/material";

export default function SupplierDocumentViewModal({ open, onClose, document }) {
  if (!document) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    if (document.fileData) {
      const link = window.document.createElement("a");
      link.href = document.fileData;
      link.download = document.fileName || "document";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const rows = [
    { label: " File Type:", value: document.docType || "—" },
    {
      label: "Linked:",
      value: document.vendorName || "—",
      extra: document.linkedType ? `(${document.linkedType})` : null,
    },
    {
      label: "Issued:",
      value:
        document.issuedDate ||
        (document.uploadedAt
          ? new Date(document.uploadedAt).toLocaleDateString()
          : "—"),
    },
    { label: "Expiry:", value: document.expiryDate || "No expiry" },
    { label: "Uploaded:", value: document.uploadedBy || "System" },
    { label: "Size:", value: formatFileSize(document.fileSize) },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
          maxWidth: "380px",
          m: 1,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: "20px",
          pt: "20px",
          pb: "16px",
          borderBottom: "1px solid #f3f4f6",
          bgcolor: "#fff",
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          Document Details
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ px: "20px", pt: "16px", pb: "8px", bgcolor: "#fff" }}>
        {rows.map(({ label, value, extra }) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: "90px 1fr",
              alignItems: "baseline",
              mb: "10px",
            }}
          >
            <Typography
              sx={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}
            >
              {label}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#111827" }}>
              {value}
              {extra && (
                <Typography
                  component="span"
                  sx={{ fontSize: 12, color: "#6b7280", ml: "4px" }}
                >
                  {extra}
                </Typography>
              )}
            </Typography>
          </Box>
        ))}

        {/* File row */}
        {document.fileName && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "90px 1fr",
              alignItems: "baseline",
              mb: "10px",
            }}
          >
            <Typography
              sx={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}
            >
              File:
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: "#2563eb",
                cursor: "pointer",
                wordBreak: "break-all",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={handleDownload}
            >
              {document.fileName}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: "20px",
          pt: "12px",
          pb: "20px",
          display: "flex",
          justifyContent: "center",
          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            textTransform: "none",
            borderRadius: "8px",
            px: "48px",
            py: "9px",
            bgcolor: "#2563eb",
            "&:hover": { bgcolor: "#1d4ed8" },
          }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
}
