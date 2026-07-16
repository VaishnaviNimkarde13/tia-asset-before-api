import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
  TextField,
  Alert,
} from "@mui/material";
import { Lock, Edit, ArrowBack } from "@mui/icons-material";
import { useAuth } from "../contexts/Authcontext";
import { useNavigate } from "react-router-dom";
import ChangePasswordDialog from "./Usersroles/ChangePasswordDialog";

export default function UserSettings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (!currentUser) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">Please log in to access settings</Typography>
      </Box>
    );
  }

  const roleLabel = currentUser.role
    ?.replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: { xs: 2, sm: 2.5, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            textTransform: "none",
            color: "#2563eb",
            "&:hover": { bgcolor: "#EFF6FF" },
          }}
        ></Button>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
            Account Settings
          </Typography>
        </Box>
      </Box>

      {/* Profile Card */}
      <Card
        sx={{
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          mb: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: "#111827",
              mb: 2,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Profile Information
          </Typography>

          <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
            <Avatar
              sx={{
                width: { xs: 64, md: 80 },
                height: { xs: 64, md: 80 },
                bgcolor: currentUser.avatarBg || "#6D28D9",
                fontSize: 28,
                fontWeight: 700,
                alignSelf: { xs: "center", sm: "flex-start" },
              }}
            >
              {currentUser.initials || "?"}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      mb: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Full Name
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {currentUser.name || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      mb: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Username
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {currentUser.username || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      mb: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Email
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {currentUser.email || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      mb: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Role
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {roleLabel || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      mb: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Location
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {currentUser.locationName || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      mb: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Department
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {currentUser.department || "—"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Change Password Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: { xs: 1.5, sm: 2 },
              mt: 2,
              bgcolor: "#F9FAFB",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1.5, sm: 0 },
            }}
          >
            <Box>
              <Typography
                sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
              >
                Change Password
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.5 }}>
                Update your account password regularly for security
              </Typography>
            </Box>
            <Button
              startIcon={<Lock sx={{ fontSize: 16 }} />}
              onClick={() => setChangePasswordOpen(true)}
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                bgcolor: "#D97706",
                borderRadius: "8px",
                px: 2,
                py: 1,
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#B45309" },
              }}
            >
              Change Password
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        user={currentUser}
      />
    </Box>
  );
}