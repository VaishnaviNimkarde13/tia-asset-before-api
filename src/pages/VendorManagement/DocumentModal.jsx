import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";

export default function DocumentModal({
  open,
  onClose,
  vendorName,
  vendorType,
  onDocumentSaved,
  initialDocuments = [],
}) {
  const [activeTab, setActiveTab] = useState("view");
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [newDoc, setNewDoc] = useState({
    name: "",
    type: "",
    file: null,
  });

  useEffect(() => {
    if (open) {
      const docs = initialDocuments || [];
      setDocuments(docs);
      setSelectedDoc(docs.length ? docs[0] : null);
      setActiveTab("view");
    }
  }, [open, initialDocuments]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewDoc((prev) => ({
        ...prev,
        file: file,
      }));
    }
  };

  const handleAddDocument = () => {
    if (!newDoc.name || !newDoc.type || !newDoc.file) {
      alert("Please fill in all fields and select a file");
      return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target.result;
      const doc = {
        id: Date.now(),
        name: newDoc.name,
        type: newDoc.type,
        fileName: newDoc.file.name,
        fileSize: (newDoc.file.size / 1024).toFixed(2) + " KB",
        uploadedAt: new Date().toLocaleString(),
        fileData: fileData, // Store base64 data
      };

      const updatedDocs = [...documents, doc];
      setDocuments(updatedDocs);
      setSelectedDoc(doc);
      setNewDoc({ name: "", type: "", file: null });
      setActiveTab("view"); // Switch to view tab after upload
    };
    reader.readAsDataURL(newDoc.file);
  };

  const handleDeleteDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleSave = () => {
    onDocumentSaved?.(documents);
    onClose();
  };

  const handleDownload = (doc) => {
    if (doc.fileData) {
      // Create a download link for the file
      const link = document.createElement("a");
      link.href = doc.fileData;
      link.download = doc.fileName || `${doc.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Swal.fire({
        icon: "info",
        title: "No File",
        text: "This document doesn't have an attached file.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
        width: 300,
      });
    }
  };

  const handleView = (doc) => {
    Swal.fire({
      title: "",
      html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0;">
          <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${doc.name}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 70px 1fr; gap: 6px; font-size: 14px;">
          <div style="color: #64748b;">Type:</div>
          <div style="color: #1e293b; font-weight: 500;">${doc.type || "Other"}</div>
          
          <div style="color: #64748b;">File:</div>
          <div style="color: #1e293b;">${doc.fileName}</div>
          
          <div style="color: #64748b;">Size:</div>
          <div style="color: #1e293b;">${doc.fileSize}</div>
          
          <div style="color: #64748b;">Uploaded:</div>
          <div style="color: #1e293b; font-size: 12px;">${doc.uploadedAt}</div>
        </div>
      </div>
    `,
      confirmButtonText: "Close",
      confirmButtonColor: "#2563eb",
      width: 360,
      padding: "0.8rem",
      allowOutsideClick: true,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: 16,
          color: "#111827",
          pb: 1,
        }}
      >
        {vendorType} Documents - {vendorName}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Simple Tab Buttons */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, borderBottom: "1px solid #e5e7eb", pb: 1 }}>
          <Button
            onClick={() => setActiveTab("view")}
            sx={{
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              pb: 1.5,
              color: activeTab === "view" ? "#2563eb" : "#6b7280",
              borderBottom: activeTab === "view" ? "2px solid #2563eb" : "none",
              "&:hover": { color: "#2563eb" },
            }}
          >
            View Documents {documents.length > 0 && `(${documents.length})`}
          </Button>
          <Button
            onClick={() => setActiveTab("add")}
            sx={{
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              pb: 1.5,
              color: activeTab === "add" ? "#2563eb" : "#6b7280",
              borderBottom: activeTab === "add" ? "2px solid #2563eb" : "none",
              "&:hover": { color: "#2563eb" },
            }}
          >
            Add Document
          </Button>
        </Box>

        {/* View Tab Content */}
        {activeTab === "view" && (
          <>
            {documents.length > 0 ? (
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280", fontSize: 11 }}>
                        Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280", fontSize: 11 }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280", fontSize: 11 }}>
                        File
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280", fontSize: 11 }}>
                        Size
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, color: "#6b7280", fontSize: 11 }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((doc, idx) => (
                      <TableRow
                        key={doc.id}
                        hover
                        onClick={() => setSelectedDoc(doc)}
                        sx={{
                          bgcolor: selectedDoc?.id === doc.id ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#fafafa",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#f0f7ff" },
                        }}
                      >
                        <TableCell sx={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>
                          {doc.name}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>
                          <Chip
                            label={doc.type}
                            size="small"
                            sx={{
                              backgroundColor: "#e3f2fd",
                              color: "#2563eb",
                              fontSize: "11px",
                              fontWeight: 600,
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, color: "#6b7280" }}>
                          {doc.fileName}
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, color: "#6b7280" }}>
                          {doc.fileSize}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleView(doc);
                                }}
                                sx={{ color: "#2563eb" }}
                              >
                                <VisibilityIcon sx={{ fontSize: "16px" }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDownload(doc);
                                }}
                                sx={{ color: "#059669" }}
                              >
                                <DownloadIcon sx={{ fontSize: "16px" }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: "center",
                  border: "1px dashed #e5e7eb",
                  borderRadius: "10px",
                  bgcolor: "#f9fafb",
                }}
              >
                <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
                  No documents uploaded yet. Add documents in the "Add Document" tab.
                </Typography>
              </Paper>
            )}

            {selectedDoc && documents.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  bgcolor: "#fff",
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1, color: "#111827" }}>
                  Document Details
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 1.5, mb: 1 }}>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Name:</Typography>
                  <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 600 }}>{selectedDoc.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Type:</Typography>
                  <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 600 }}>{selectedDoc.type}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>File:</Typography>
                  <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 600 }}>{selectedDoc.fileName}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Size:</Typography>
                  <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 600 }}>{selectedDoc.fileSize}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Uploaded:</Typography>
                  <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 600 }}>{selectedDoc.uploadedAt}</Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleDownload(selectedDoc)}
                  sx={{
                    mt: 1,
                    textTransform: "none",
                    background: "#059669",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: 13,
                    fontWeight: 600,
                    "&:hover": { background: "#047857" },
                  }}
                >
                  Download Document
                </Button>
              </Paper>
            )}
          </>
        )}

        {/* Add Tab Content */}
        {activeTab === "add" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Document Name"
              value={newDoc.name}
              onChange={(e) =>
                setNewDoc((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: 13,
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#e5e7eb" },
                  "&:hover fieldset": { borderColor: "#d1d5db" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563eb",
                    borderWidth: "1.5px",
                  },
                },
              }}
            />

            <TextField
              size="small"
              placeholder="Document Type (e.g., License, Certificate, Tax ID)"
              value={newDoc.type}
              onChange={(e) =>
                setNewDoc((prev) => ({ ...prev, type: e.target.value }))
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: 13,
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#e5e7eb" },
                  "&:hover fieldset": { borderColor: "#d1d5db" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563eb",
                    borderWidth: "1.5px",
                  },
                },
              }}
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <input
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                type="file"
                id="doc-upload"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <label htmlFor="doc-upload" style={{ flex: 1 }}>
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{
                    textTransform: "none",
                    borderColor: "#e5e7eb",
                    color: "#6b7280",
                    fontSize: 13,
                    "&:hover": {
                      borderColor: "#9ca3af",
                      bgcolor: "#f9fafb",
                    },
                  }}
                >
                  Choose File
                </Button>
              </label>
              {newDoc.file && (
                <Typography sx={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                  ✓ {newDoc.file.name}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleAddDocument}
              sx={{
                background: "#2563eb",
                color: "#fff",
                textTransform: "none",
                borderRadius: "8px",
                fontSize: 13,
                fontWeight: 600,
                "&:hover": { background: "#1d4ed8" },
              }}
            >
              Add Document
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            color: "#374151",
            textTransform: "none",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            "&:hover": { bgcolor: "#f9fafb" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            background: "#2563eb",
            color: "#fff",
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": { background: "#1d4ed8" },
          }}
        >
          Save Documents
        </Button>
      </DialogActions>
    </Dialog>
  );
}
