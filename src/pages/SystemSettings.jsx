import React, { useState, useEffect } from "react";
import { usePermissions } from "../hooks/usePermissions";
import {
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    height: "32px",
    borderRadius: "8px",
    fontSize: "13px",
    backgroundColor: "#fff",
    "& fieldset": {
      borderColor: "#e5e7eb",
    },
    "&:hover fieldset": {
      borderColor: "#d1d5db",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#015DFF",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "12px",
    color: "#6b7280",
  },
  "& input[type=number]::-webkit-outer-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "& input[type=number]::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "& input[type=number]": {
    MozAppearance: "textfield",
  },
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  mb: 0.5,
};

const SystemSettings = () => {
  const initialFacilityName = "St. Mary's Regional Medical Center";
  const initialNpiNumber = "1234567890";
  const initialDeaRegistration = "AS1234563";
  const initialStateLicense = "IL-HOSP-2024-04821";

  const initialLowStockThreshold = 20;
  const initialExpiryWarningDays = 60;
  const initialAutoReorder = "Yes — Create draft PO";
  const initialAlertEmail = "inventory@stmarys.org";

  const [facilityName, setFacilityName] = useState("");
  const [npiNumber, setNpiNumber] = useState("");
  const [deaRegistration, setDeaRegistration] = useState("");
  const [stateLicense, setStateLicense] = useState("");

  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [expiryWarningDays, setExpiryWarningDays] = useState("");
  const [autoReorder, setAutoReorder] = useState("");
  const [alertEmail, setAlertEmail] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    const findScrollableParent = (element) => {
      while (element) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };

    const container = findScrollableParent(
      document.querySelector(".MuiBox-root")?.parentElement,
    );
    if (container) {
      container.style.overflowY = "hidden";
    }

    return () => {
      if (container) {
        container.style.overflowY = "auto";
      }
    };
  }, []);

  const { can } = usePermissions();
  const handleSave = () => {
    if (!can?.edit_system_settings) return;
    const settings = {
      facilityName,
      npiNumber,
      deaRegistration,
      stateLicense,
      lowStockThreshold,
      expiryWarningDays,
      autoReorder,
      alertEmail,
    };

    console.log("Saved settings:", settings);
    setSnackbarMessage("Settings saved successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleCancel = () => {
    setFacilityName("");
    setNpiNumber("");
    setDeaRegistration("");
    setStateLicense("");
    setLowStockThreshold("");
    setExpiryWarningDays("");
    setAutoReorder("");
    setAlertEmail("");

    setSnackbarMessage("Changes discarded");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
          System Settings
        </Typography>
      </Box>

      {/* FACILITY INFO CARD */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          mb: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#373B4D", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Facility Info
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>Facility Name</Typography>
                <TextField
                  fullWidth
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  size="small"
                  placeholder={initialFacilityName}
                  sx={inputStyles}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>NPI Number</Typography>
                <TextField
                  fullWidth
                  value={npiNumber}
                  onChange={(e) => setNpiNumber(e.target.value)}
                  size="small"
                  placeholder={initialNpiNumber}
                  sx={inputStyles}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>DEA Registration</Typography>
                <TextField
                  fullWidth
                  value={deaRegistration}
                  onChange={(e) => setDeaRegistration(e.target.value)}
                  size="small"
                  placeholder={initialDeaRegistration}
                  sx={inputStyles}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>State License</Typography>
                <TextField
                  fullWidth
                  value={stateLicense}
                  onChange={(e) => setStateLicense(e.target.value)}
                  size="small"
                  placeholder={initialStateLicense}
                  sx={inputStyles}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* ALERT THRESHOLDS CARD */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          mb: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#373B4D", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Alert Thresholds
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>
                  Low Stock Threshold (%)
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  size="small"
                  placeholder={String(initialLowStockThreshold)}
                  sx={inputStyles}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>
                  Expiry Warning (Days)
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  value={expiryWarningDays}
                  onChange={(e) => setExpiryWarningDays(e.target.value)}
                  size="small"
                  placeholder={String(initialExpiryWarningDays)}
                  sx={inputStyles}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>Auto-Reorder at Par</Typography>
                <TextField
                  select
                  fullWidth
                  value={autoReorder}
                  onChange={(e) => setAutoReorder(e.target.value)}
                  size="small"
                  placeholder={initialAutoReorder}
                  sx={inputStyles}
                >
                  <MenuItem
                    value="Yes — Create draft PO"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    Yes — Create draft PO
                  </MenuItem>
                  <MenuItem value="Alert only" sx={{ fontSize: "0.875rem" }}>
                    Alert only
                  </MenuItem>
                  <MenuItem value="No" sx={{ fontSize: "0.875rem" }}>
                    No
                  </MenuItem>
                </TextField>
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Box>
                <Typography sx={labelStyle}>Alert Email</Typography>
                <TextField
                  fullWidth
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  size="small"
                  placeholder={initialAlertEmail}
                  sx={inputStyles}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          sx={{
            textTransform: "none",
            fontSize: "13px",
            px: 2,
            height: 32,
            borderRadius: "8px",
            color: "#374151",
            borderColor: "#d1d5db",
            "&:hover": { bgcolor: "#f9fafb" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{
            fontWeight: 700,
            borderRadius: "8px",
            px: 2,
            height: 32,
            fontSize: 13,
            bgcolor: "#015DFF",
            "&:hover": { bgcolor: "#014ACC" },
          }}
          disabled={!can?.edit_system_settings}
          title={
            !can?.edit_system_settings
              ? "You do not have permission to edit system settings."
              : undefined
          }
        >
          Save
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemSettings;