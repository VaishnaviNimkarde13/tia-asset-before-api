import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Select,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const ITEMS_PER_PAGE = 5;

const auditData = [
  {
    id: 1,
    timestamp: "2026-03-19 09:30",
    user: { name: "S. Anderson", id: "u1" },
    action: "APPROVED",
    module: "PO",
    record: "PO-2026-0004",
    detail: "PO approved for McKesson Medical-Surgical",
  },
  {
    id: 2,
    timestamp: "2026-03-20 14:32",
    user: { name: "T. Williams", id: "u4" },
    action: "GRN_COMPLETE",
    module: "GRN",
    record: "GRN-2026-0003",
    detail: "GRN confirmed, stock updated — 2 items received",
  },
  {
    id: 3,
    timestamp: "2026-03-19 09:30",
    user: { name: "S. Anderson", id: "u1" },
    action: "ISSUE",
    module: "StockIssue",
    record: "ISS-2026-0008",
    detail: "50 × Amoxicillin 500mg issued to ICU",
  },
];

const thSx = {
  fontSize: 12,
  fontWeight: 600,
  color: "#373B4D",
  letterSpacing: "0.04em",
  py: 1.5,
  px: 2,
  borderBottom: "1px solid #f3f4f6",
  borderRight: "1px solid #BED3FC",
  "&:last-child": { borderRight: "none" },
  whiteSpace: "nowrap",
};

const tdSx = {
  py: 1.5,
  px: 2,
  fontSize: 13,
  verticalAlign: "middle",
};

const selectSx = {
  fontSize: 13,
  borderRadius: "20px",
  background: "#fff",
  height: 36,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb", borderWidth: "1px" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#015DFF", borderWidth: "1px" },
  "& .MuiSelect-select": { py: "7px", px: "14px" },
};

const AuditLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const matchesSearch = (log, term) => {
    if (!term) return true;
    const q = term.toLowerCase();
    return [log.timestamp, log.user.name, log.user.id, log.action, log.module, log.record, log.detail]
      .some((f) => f.toLowerCase().includes(q));
  };

  const filteredLogs = useMemo(() => {
    return auditData.filter((log) => {
      const matchesModule = moduleFilter ? log.module === moduleFilter : true;
      const matchesAction = actionFilter ? log.action === actionFilter : true;
      return matchesModule && matchesAction && matchesSearch(log, searchTerm);
    });
  }, [searchTerm, moduleFilter, actionFilter]);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, moduleFilter, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (_, value) => setCurrentPage(value);
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) { alert("No logs to export."); return; }
    const headers = ["Timestamp", "User", "Action", "Module", "Record", "Detail"];
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      `${log.user.name} (${log.user.id})`,
      log.action, log.module, log.record, log.detail,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `audit_log_export_${new Date().toISOString().slice(0, 19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionColor = {
    APPROVED: "#16a34a",
    GRN_COMPLETE: "#14b8a6",
    ISSUE: "#f59e0b",
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.75,
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1, md: 0 },
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            Audit Log
          </Typography>
          
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {/* Module filter */}
         

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search audit log…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm("")}
                    disableRipple
                    sx={{ p: 0.5, color: "#9ca3af", "&:hover": { color: "#374151" } }}
                  >
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: { xs: "100%", md: 240 },
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
 <Box sx={{ minWidth: 130 }}>
            <Select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              displayEmpty
              size="small"
              fullWidth
              sx={selectSx}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All Modules</MenuItem>
              <MenuItem value="PO" sx={{ fontSize: 13 }}>PO</MenuItem>
              <MenuItem value="GRN" sx={{ fontSize: 13 }}>GRN</MenuItem>
              <MenuItem value="StockIssue" sx={{ fontSize: 13 }}>StockIssue</MenuItem>
            </Select>
          </Box>

          {/* Action filter */}
          <Box sx={{ minWidth: 148 }}>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              displayEmpty
              size="small"
              fullWidth
              sx={selectSx}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All Actions</MenuItem>
              <MenuItem value="APPROVED" sx={{ fontSize: 13 }}>APPROVED</MenuItem>
              <MenuItem value="GRN_COMPLETE" sx={{ fontSize: 13 }}>GRN_COMPLETE</MenuItem>
              <MenuItem value="ISSUE" sx={{ fontSize: 13 }}>ISSUE</MenuItem>
            </Select>
          </Box>

          {/* Export button */}
          <Button
            onClick={handleExportCSV}
            startIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            }
            sx={{
              height: 36,
              px: "14px",
              borderRadius: "8px",
              border: "1px solid #015DFF",
              color: "#015DFF",
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              bgcolor: "#fff",
              boxShadow: "none",
              gap: "6px",
              minWidth: 0,
              whiteSpace: "nowrap",
              "& .MuiButton-startIcon": { mr: 0 },
              "&:hover": { border: "1px solid #015DFF", bgcolor: "#EFF4FF", boxShadow: "none" },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

    
      {/* ── Table ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: "1px solid #f0f0f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ overflowX: { xs: "auto", md: "visible" } }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ background: "#EBF1FE" }}>
                {["Timestamp", "User", "Action", "Module", "Record", "Detail"].map((head) => (
                  <TableCell key={head} sx={thSx}>{head}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#9ca3af", fontSize: 13 }}>
                    No audit entries match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log, idx) => (
                  <TableRow
                    key={log.id}
                    sx={{
                      background: "#fff",
                      "&:hover": { background: "#fafafa" },
                      "& td": {
                        borderBottom: idx < paginatedLogs.length - 1 ? "1px solid #f3f4f6" : "none",
                      },
                    }}
                  >
                    <TableCell sx={{ ...tdSx, minWidth: 140 }}>
                      <Typography sx={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>
                        {log.timestamp}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ ...tdSx, minWidth: 120 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                        {log.user.name}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                        {log.user.id}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ ...tdSx, minWidth: 120 }}>
                      <Box
                        sx={{
                          display: "inline-block",
                          fontSize: 10,
                          px: 1.2,
                          py: 0.3,
                          borderRadius: "12px",
                          fontWeight: 700,
                          color: "#fff",
                          background: actionColor[log.action] || "#6b7280",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.action}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ ...tdSx, minWidth: 90 }}>
                      <Typography sx={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                        {log.module}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ ...tdSx, minWidth: 130 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
                        {log.record}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ ...tdSx }}>
                      <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                        {log.detail}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Pagination ── */}
      {filteredLogs.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            mt: 2.5,
            pt: 1.5,
            pb: 0.75,
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              sx={{
                minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb",
                color: currentPage === 1 ? "#d1d5db" : "#374151",
                "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </Button>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              shape="rounded"
              size="small"
              hidePrevButton
              hideNextButton
              siblingCount={1}
              boundaryCount={1}
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: "5px", fontSize: 11, fontWeight: 500, minWidth: 28, height: 28,
                  border: "1px solid #e5e7eb", color: "#374151",
                  "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                },
                "& .Mui-selected": {
                  background: "#015DFF !important", color: "#fff", border: "1px solid #015DFF",
                  "&:hover": { background: "#0147CC !important" },
                },
              }}
            />
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              sx={{
                minWidth: 28, height: 28, p: 0, borderRadius: "5px", border: "1px solid #e5e7eb",
                color: currentPage === totalPages ? "#d1d5db" : "#374151",
                "&:hover": { background: "#f9fafb", borderColor: "#d1d5db" },
                "&.Mui-disabled": { background: "#f9fafb", borderColor: "#e5e7eb" },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AuditLog;