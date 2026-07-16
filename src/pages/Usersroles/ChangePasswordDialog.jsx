import { useState } from "react";
import {
  Dialog, DialogContent, Box, Typography, TextField,
  Button, IconButton, InputAdornment, Alert,
} from "@mui/material";
import { Close, Visibility, VisibilityOff, Lock } from "@mui/icons-material";
import { useAuth } from "../../contexts/Authcontext";

export default function ChangePasswordDialog({ open, onClose, user }) {
  const { updateUser, currentUser, setCurrentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleChangePassword = () => {
    setError("");
    setSuccess("");

    if (!currentPassword.trim()) {
      setError("Current password is required");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      updateUser(user.id, { password: newPassword });
      
      if (currentUser && currentUser.id === user.id) {
        const updatedUser = { ...currentUser, password: newPassword };
        setCurrentUser(updatedUser);
        localStorage.setItem("current_user", JSON.stringify(updatedUser));
      }
      
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
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
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          bgcolor: "#F8FAFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              bgcolor: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock sx={{ color: "#D97706", fontSize: 16 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Change Password
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            color: "#9ca3af",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            width: 26,
            height: 26,
            "&:hover": { background: "#f3f4f6" },
          }}
        >
          <Close sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* Body */}
      <DialogContent sx={{ px: "20px", py: "16px", bgcolor: "#fff" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: "8px", fontSize: 12, py: 0 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 1.5, borderRadius: "8px", fontSize: 12, py: 0 }}>
            {success}
          </Alert>
        )}

        {/* Current Password Field */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6B7280",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              mb: 0.5,
            }}
          >
            Current Password
          </Typography>
          <TextField
            fullWidth
            size="small"
            type={showCurrent ? "text" : "password"}
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowCurrent(!showCurrent)}
                    edge="end"
                    sx={{ color: "#9ca3af", p: 0.5 }}
                  >
                    {showCurrent ? (
                      <VisibilityOff sx={{ fontSize: 16 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: 12,
                bgcolor: "#F9FAFB",
                "& fieldset": { borderColor: "#E5E7EB" },
                "&:hover fieldset": { borderColor: "#D97706" },
                "&.Mui-focused fieldset": { borderColor: "#D97706", borderWidth: "1.5px" },
              },
              "& .MuiInputBase-input": { py: "6px", px: "10px" },
            }}
          />
        </Box>

        {/* New Password Field */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6B7280",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              mb: 0.5,
            }}
          >
            New Password
          </Typography>
          <TextField
            fullWidth
            size="small"
            type={showNew ? "text" : "password"}
            placeholder="New password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowNew(!showNew)}
                    edge="end"
                    sx={{ color: "#9ca3af", p: 0.5 }}
                  >
                    {showNew ? (
                      <VisibilityOff sx={{ fontSize: 16 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: 12,
                bgcolor: "#F9FAFB",
                "& fieldset": { borderColor: "#E5E7EB" },
                "&:hover fieldset": { borderColor: "#D97706" },
                "&.Mui-focused fieldset": { borderColor: "#D97706", borderWidth: "1.5px" },
              },
              "& .MuiInputBase-input": { py: "6px", px: "10px" },
            }}
          />
        </Box>

        {/* Confirm New Password Field */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6B7280",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              mb: 0.5,
            }}
          >
            Confirm Password
          </Typography>
          <TextField
            fullWidth
            size="small"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowConfirm(!showConfirm)}
                    edge="end"
                    sx={{ color: "#9ca3af", p: 0.5 }}
                  >
                    {showConfirm ? (
                      <VisibilityOff sx={{ fontSize: 16 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: 12,
                bgcolor: "#F9FAFB",
                "& fieldset": { borderColor: "#E5E7EB" },
                "&:hover fieldset": { borderColor: "#D97706" },
                "&.Mui-focused fieldset": { borderColor: "#D97706", borderWidth: "1.5px" },
              },
              "& .MuiInputBase-input": { py: "6px", px: "10px" },
            }}
          />
        </Box>

        {/* Password Requirements - Compact */}
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: "#FEF3C7",
            borderRadius: "8px",
            border: "1px solid #FDE68A",
          }}
        >
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#92400E", mb: 0.5 }}>
            💡 Requirements:
          </Typography>
          <Typography sx={{ fontSize: 10, color: "#B45309" }}>• Minimum 6 characters • Different from current</Typography>
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          px: "20px",
          py: "12px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          background: "#fff",
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: "#374151",
            textTransform: "none",
            borderRadius: "8px",
            px: "16px",
            py: "5px",
            border: "1px solid #e5e7eb",
            background: "#fff",
            "&:hover": { background: "#f9fafb" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleChangePassword}
          disabled={loading}
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            textTransform: "none",
            borderRadius: "8px",
            px: "20px",
            py: "5px",
            background: "#D97706",
            boxShadow: "0 1px 4px rgba(217, 119, 6, 0.3)",
            "&:hover": { background: "#B45309" },
            "&.Mui-disabled": { opacity: 0.6 },
          }}
        >
          {loading ? "Updating..." : "Update"}
        </Button>
      </Box>
    </Dialog>
  );
}