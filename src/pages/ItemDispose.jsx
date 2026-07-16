import { useState } from "react";
import { useAuth } from "../contexts/Authcontext";
import { getUserLocation, locationMatches } from "../utils/locationUtils";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const STORAGE_KEY = "tia_disposed_items";

const loadDisposed = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export default function ItemDispose() {
  const [items] = useState(loadDisposed);
  const [search, setSearch] = useState("");
  const { currentUser } = useAuth();
  const userLocation = getUserLocation(currentUser);
  const isAdminOrSuper =
    currentUser?.role === "admin" ||
    currentUser?.role === "location_manager_super";

  const visibleItems = items.filter((item) => {
    if (!userLocation || isAdminOrSuper) return true;
    return locationMatches(userLocation, item.location || item.locationCode || "");
  });

  const filteredItems = visibleItems.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.ndc?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.lot?.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const headers = ["Item Name", "NDC", "Category", "Location", "Lot No.", "UOM", "Qty", "Expiry Date", "Disposed On"];
    const rows = filteredItems.map((i) => [
      i.name, i.ndc || "—", i.category || "—", i.location || "—",
      i.lot || "—", i.uom || "—", i.qty,
      i.expiryFormatted || "—", i.disposedDate || "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "disposed_items.csv";
    a.click();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            Disposed Items
          </Typography>
        </Box>

        {/* Search + Export */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Search */}
          <Box sx={{ position: "relative" }}>
            <SearchOutlinedIcon sx={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: "#9ca3af", pointerEvents: "none",
            }} />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: 32,
                paddingLeft: 32,
                paddingRight: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 13,
                color: "#111827",
                outline: "none",
                fontFamily: "inherit",
                width: 200,
                backgroundColor: "#fff",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#015DFF")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </Box>

          {/* Export */}
          <Button
            onClick={handleExport}
            startIcon={<DownloadOutlinedIcon sx={{ fontSize: "14px !important" }} />}
            variant="outlined"
            disabled={filteredItems.length === 0}
            sx={{
              height: 32, px: "12px", borderRadius: "12px",
              border: "1px solid #015DFF", bgcolor: "#fff", color: "#015DFF",
              textTransform: "none", fontSize: 13, fontWeight: 600,
              "&:hover": { bgcolor: "#EFF4FF" },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Stat card */}
      <Box sx={{ display: "flex", gap: "12px", mb: "20px" }}>
        <Box sx={{ flex: 1, maxWidth: 220, bgcolor: "#fff", border: "1px solid #e5e7eb",
          borderRadius: "10px", px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "#ef4444",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DeleteOutlineOutlinedIcon sx={{ fontSize: 20, color: "#fff" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af",
              letterSpacing: "0.05em", textTransform: "uppercase", mb: 0.5 }}>
              Total Disposed
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
              {visibleItems.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small" sx={{ width: "100%", tableLayout: "auto" }}>
            <TableHead>
              <TableRow sx={{ background: "#EBF1FE" }}>
                {["Item Name", "NDC / SKU", "Category", "Location", "Lot No.", "UOM", "Qty", "Expiry Date", "Disposed On"].map((h) => (
                  <TableCell key={h} sx={{
                    fontSize: 11, fontWeight: 700, color: "#373B4D",
                    letterSpacing: "0.05em", py: "10px", px: "12px",
                    borderBottom: "none", borderRight: "1px solid #BED3FC",
                    whiteSpace: "nowrap", "&:last-child": { borderRight: "none" },
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: "center", color: "#9ca3af", fontSize: 13, border: "none" }}>
                    {search.trim()
                      ? "No items match your search."
                      : "No disposed items yet. Items disposed from Expiry Tracking will appear here."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, idx) => (
                  <TableRow key={`${item.id}-${idx}`} sx={{
                    background: "#fff", "&:hover": { background: "#fafafa" },
                    "& td": { borderBottom: idx < filteredItems.length - 1 ? "1px solid #f3f4f6" : "none",
                      py: "10px", px: "12px" },
                  }}>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{item.ndc || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: "#374151" }}>{item.category || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.location || "—"} size="small" sx={{
                        fontSize: 11, fontWeight: 600, color: "#7c3aed",
                        background: "#f5f3ff", border: "1px solid #ede9fe",
                        borderRadius: "6px", height: 22,
                      }} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: "#374151" }}>{item.lot || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      {item.uom ? (
                        <Chip label={item.uom} size="small" sx={{
                          fontSize: 11, fontWeight: 600, color: "#0284c7",
                          background: "#e0f2fe", border: "1px solid #bae6fd",
                          borderRadius: "6px", height: 22,
                        }} />
                      ) : <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
                        {item.qty}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
                        {item.expiryFormatted || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                        {item.disposedDate || "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}