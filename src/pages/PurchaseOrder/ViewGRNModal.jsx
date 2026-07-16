import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const getConditionColor = (condition) => {
  const colors = {
    "Good": { bg: "#f0fdf4", color: "#10b981", border: "#bbf7d0" },
    "Short Delivery": { bg: "#fef3c7", color: "#f59e0b", border: "#fde68a" },
    "Short Close": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    "Damaged": { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
    "Cold Chain Breach": { bg: "#fce7f3", color: "#db2777", border: "#fbcfe8" },
    "Wrong Item": { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff" },
    "Expiry": { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  };
  return colors[condition] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
};

const thSx = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  letterSpacing: "0.04em",
  py: "8px",
  px: "10px",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  bgcolor: "#f9fafb",
};

const tdSx = {
  fontSize: 12,
  py: "8px",
  px: "10px",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

export default function ViewGRNModal({ open, onClose, grns = [], po = null }) {
  const [expandedGRN, setExpandedGRN] = useState(null);

  if (!po) return null;

  const goodGRNs = grns.filter((g) => g.condition === "Good");
  const shortDeliveryGRNs = grns.filter((g) => g.condition === "Short Delivery");
  const shortCloseGRNs = grns.filter((g) => g.condition === "Short Close");
  const discrepancyGRNs = grns.filter(
    (g) => !["Good", "Short Delivery", "Short Close"].includes(g.condition)
  );

  const totalValue = grns.reduce((sum, g) => {
    const val = parseFloat(g.totalValue?.replace(/[$,]/g, "") || 0);
    return sum + val;
  }, 0);

  const renderGRNSection = (title, grnList, icon, color) => {
    if (grnList.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        {/* Section header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            mb: "10px",
            pb: "8px",
            borderBottom: `2px solid ${color.border}`,
          }}
        >
          {icon}
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
            {title}
          </Typography>
          <Chip
            label={grnList.length}
            size="small"
            sx={{
              height: 18,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: color.bg,
              color: color.color,
              border: `1px solid ${color.border}`,
              "& .MuiChip-label": { px: "6px" },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {grnList.map((grn) => {
            const isExpanded = expandedGRN === grn.id;
            return (
              <Box
                key={grn.id}
                sx={{
                  border: `1px solid ${isExpanded ? color.border : "#e5e7eb"}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                  transition: "border-color 0.15s",
                }}
              >
                {/* GRN row header */}
                <Box
                  onClick={() => setExpandedGRN(isExpanded ? null : grn.id)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    alignItems: "center",
                    gap: "12px",
                    px: "14px",
                    py: "10px",
                    bgcolor: isExpanded ? color.bg : "#fff",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: color.bg },
                  }}
                >
                  {/* GRN ID + meta */}
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                      {grn.id}
                    </Typography>
                    <Box sx={{ display: "flex", gap: "10px", mt: "2px", flexWrap: "wrap" }}>
                      {grn.receivedBy && (
                        <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                          Received by: <strong>{grn.receivedBy}</strong>
                        </Typography>
                      )}
                      {grn.receivedDate && (
                        <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                          {grn.receivedDate}
                        </Typography>
                      )}
                      {grn.items != null && (
                        <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                          {grn.items} item{grn.items !== 1 ? "s" : ""}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Condition chip */}
                  <Chip
                    label={grn.condition || "—"}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: color.bg,
                      color: color.color,
                      border: `1px solid ${color.border}`,
                      "& .MuiChip-label": { px: "8px" },
                    }}
                  />

                  {/* Status chip */}
                  <Chip
                    label={grn.status || "—"}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor:
                        grn.status === "Approved" || grn.status === "Completed"
                          ? "#f0fdf4"
                          : grn.status === "Pending"
                          ? "#fffbeb"
                          : "#f3f4f6",
                      color:
                        grn.status === "Approved" || grn.status === "Completed"
                          ? "#10b981"
                          : grn.status === "Pending"
                          ? "#f59e0b"
                          : "#6b7280",
                      border: "1px solid transparent",
                      "& .MuiChip-label": { px: "8px" },
                    }}
                  />

                  {/* Expand toggle */}
                  <Box sx={{ color: "#9ca3af", display: "flex", alignItems: "center" }}>
                    {isExpanded ? (
                      <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                    )}
                  </Box>
                </Box>

                {/* Expanded detail */}
                {isExpanded && (
                  <Box
                    sx={{
                      px: "14px",
                      pb: "14px",
                      pt: "4px",
                      bgcolor: "#fafafa",
                      borderTop: `1px solid ${color.border}`,
                    }}
                  >
                    {/*  items table */}
                    {grn.lineItems?.length > 0 && (
                      <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                          mt: "10px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={thSx}>Item</TableCell>
                              <TableCell align="center" sx={{ ...thSx, width: 68 }}>PO Qty</TableCell>
                              <TableCell align="center" sx={{ ...thSx, width: 68 }}>Rcv Qty</TableCell>
                              <TableCell align="center" sx={{ ...thSx, width: 90 }}>Lot #</TableCell>
                              <TableCell align="center" sx={{ ...thSx, width: 88 }}>Expiry</TableCell>
                              <TableCell align="center" sx={{ ...thSx, width: 80 }}>Unit Cost</TableCell>
                              <TableCell align="center" sx={{ ...thSx, width: 88 }}>Condition</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {grn.lineItems.map((item, idx) => {
                              const cc = getConditionColor(item.condition);
                              return (
                                <TableRow
                                  key={idx}
                                  sx={{ "&:last-child td": { borderBottom: "none" }, "&:hover": { bgcolor: "#f9fafb" } }}
                                >
                                  <TableCell sx={tdSx}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                                      {item.item}
                                    </Typography>
                                    {item.ndc && (
                                      <Typography sx={{ fontSize: 10, color: "#9ca3af", mt: "1px" }}>
                                        NDC: {item.ndc}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center" sx={{ ...tdSx, color: "#6b7280" }}>
                                    {item.poQty}
                                  </TableCell>
                                  <TableCell align="center" sx={{ ...tdSx, fontWeight: 700, color: "#111827" }}>
                                    {item.rcvQty}
                                  </TableCell>
                                  <TableCell align="center" sx={{ ...tdSx, color: "#6b7280" }}>
                                    {item.lotNo || "—"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ ...tdSx, color: "#6b7280" }}>
                                    {item.expiry || "—"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ ...tdSx, color: "#111827" }}>
                                    ${item.unitCost}
                                  </TableCell>
                                  <TableCell align="center" sx={tdSx}>
                                    {item.condition ? (
                                      <Chip
                                        label={item.condition}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: 10,
                                          fontWeight: 600,
                                          bgcolor: cc.bg,
                                          color: cc.color,
                                          border: `1px solid ${cc.border}`,
                                          "& .MuiChip-label": { px: "6px" },
                                        }}
                                      />
                                    ) : (
                                      <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>—</Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    {/* Short close reasons */}
                    {grn.shortCloseReasons?.length > 0 && (
                      <Box
                        sx={{
                          mt: "10px",
                          p: "10px 12px",
                          bgcolor: "#fff7ed",
                          borderRadius: "8px",
                          border: "1px solid #fed7aa",
                        }}
                      >
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#c2410c", mb: "4px" }}>
                          Short Close Reasons
                        </Typography>
                        {grn.shortCloseReasons.map((reason, idx) => (
                          <Typography key={idx} sx={{ fontSize: 11, color: "#9a3412" }}>
                            • {reason}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {/* Remarks + meta row */}
                    <Box
                      sx={{
                        mt: "10px",
                        display: "grid",
                        gridTemplateColumns: grn.remarks ? "1fr 1fr" : "1fr",
                        gap: "10px",
                      }}
                    >
                      {grn.remarks && (
                        <Box
                          sx={{
                            p: "10px 12px",
                            bgcolor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        >
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "4px" }}>
                            Remarks
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#374151" }}>{grn.remarks}</Typography>
                        </Box>
                      )}
                      {grn.totalValue && (
                        <Box
                          sx={{
                            p: "10px 12px",
                            bgcolor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        >
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: "4px" }}>
                            GRN Value
                          </Typography>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                            {grn.totalValue}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          maxHeight: "88vh",
          maxWidth: "680px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: "20px",
          pt: "16px",
          pb: "12px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LocalShippingOutlinedIcon sx={{ fontSize: 20, color: "#2563eb" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
              GRN Details
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: "1px" }}>
              PO: {po.id} · {grns.length} GRN{grns.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disableRipple
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            width: 30,
            height: 30,
            "&:hover": { bgcolor: "#f3f4f6", color: "#374151" },
            "&:focus": { outline: "none" },
          }}
        >
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          px: "20px",
          py: "16px",
          overflowY: "auto",
          flex: 1,
          scrollbarWidth: "thin",
          scrollbarColor: "#d1d5db transparent",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "4px" },
          "&::-webkit-scrollbar-thumb:hover": { background: "#94a3b8" },
        }}
      >
        {grns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 36, color: "#e5e7eb", mb: 1 }} />
            <Typography sx={{ fontSize: 14, color: "#9ca3af" }}>
              No GRNs created for this PO yet
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Summary strip */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1px",
                mb: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                overflow: "hidden",
                bgcolor: "#e5e7eb",
              }}
            >
              {[
                { label: "Total GRNs", value: grns.length },
                {
                  label: "Total Value",
                  value: totalValue.toLocaleString("en-US", { style: "currency", currency: "USD" }),
                },
                {
                  label: "Total Items",
                  value: grns.reduce((sum, g) => sum + (g.items || 0), 0),
                },
              ].map(({ label, value }) => (
                <Box
                  key={label}
                  sx={{ bgcolor: "#fff", px: "12px", py: "8px", textAlign: "center" }}
                >
                  <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: "2px" }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            {renderGRNSection(
              "Good Items",
              goodGRNs,
              <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#10b981" }} />,
              { bg: "#f0fdf4", color: "#10b981", border: "#bbf7d0" }
            )}

            {renderGRNSection(
              "Short Delivery",
              shortDeliveryGRNs,
              <WarningAmberIcon sx={{ fontSize: 16, color: "#f59e0b" }} />,
              { bg: "#fef3c7", color: "#f59e0b", border: "#fde68a" }
            )}

            {renderGRNSection(
              "Short Close",
              shortCloseGRNs,
              <BlockOutlinedIcon sx={{ fontSize: 16, color: "#ea580c" }} />,
              { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" }
            )}

            {renderGRNSection(
              "Discrepancies",
              discrepancyGRNs,
              <WarningAmberIcon sx={{ fontSize: 16, color: "#dc2626" }} />,
              { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" }
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}