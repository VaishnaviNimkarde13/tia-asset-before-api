import React, { useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  FormControl, InputAdornment, IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLE_PERMISSIONS } from "../contexts/Authcontext";

const TrustBadge = ({ icon, line1, line2 }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#fff" }}>
    <Box sx={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.2 }}>{line1}</Typography>
      <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.2 }}>{line2}</Typography>
    </Box>
  </Box>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0L0 5.625V17.0438C0 26.5125 6.39375 35.3438 15 37.5C23.6063 35.3438 30 26.5125 30 17.0438V5.625L15 0ZM26.25 17.0438C26.25 24.5438 21.4688 31.4813 15 33.6C8.53125 31.4813 3.75 24.5625 3.75 17.0438V8.23125L15 4.0125L26.25 8.23125V17.0438Z" fill="#F2F2F7" />
  </svg>
);

// Tia-Asset Logo Component
const TiaAssetLogo = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
    <Box sx={{
      width: 48,
      height: 48,
      background: "linear-gradient(135deg, #015DFF 0%, #0B2F6B 100%)",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 12px rgba(1, 93, 255, 0.2)"
    }}>
      <Typography sx={{ fontSize: "28px" }}>🏥</Typography>
    </Box>
    <Box>
      <Typography sx={{ 
        fontSize: "1.6rem", 
        fontWeight: 700, 
        color: "#111827",
        letterSpacing: "-0.5px"
      }}>
        Tia-<span style={{ color: "#015DFF" }}>Asset</span>
      </Typography>
    </Box>
  </Box>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [errorMsg, setErrorMsg]         = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

const handleLogin = async (e) => {
  e.preventDefault();

  const result = await login(username, password);

  if (result.success) {
    console.log("Logged User:", result.user);

    const defaultRoute = ROLE_PERMISSIONS[result.user.role]?.defaultRoute || "/admin/dashboard";
    navigate(defaultRoute);
  } else {
    setErrorMsg(result.message);
    setTimeout(() => setErrorMsg(""), 3000);
  }
};

  const FIELD_SX = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px", fontSize: "0.9rem", background: "#fff",
      "& fieldset": { borderColor: "#e5e7eb" },
      "&:hover fieldset": { borderColor: "#9ca3af" },
      "&.Mui-focused fieldset": { borderColor: "#015DFF" },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter" }}>
      <Paper sx={{ width: "900px", height: "540px", display: "flex", borderRadius: "0px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>

        {/* LEFT: FORM */}
        <Box sx={{ width: "47%", p: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#f5f7fa" }}>
          
          {/* Tia-Asset Logo */}
          <TiaAssetLogo />

          <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, color: "#111827", mb: 2, mt: 4 }}>Login</Typography>

          {errorMsg && (
            <Typography sx={{ color: "#ef4444", fontSize: "0.8rem", mb: 1.5 }}>{errorMsg}</Typography>
          )}

          <form onSubmit={handleLogin}>
            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 400, color: "#718096", mb: 0.8 }}>Username</Typography>
              <TextField
                placeholder="Enter your username"
                size="small"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={FIELD_SX}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 400, color: "#718096", mb: 0.8 }}>Password</Typography>
              <TextField
                type={showPassword ? "text" : "password"}
                placeholder="@#*%"
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ ...FIELD_SX, "& .MuiOutlinedInput-root": { ...FIELD_SX["& .MuiOutlinedInput-root"], mb: 3 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword
                          ? <VisibilityOff sx={{ fontSize: "1.1rem", color: "#9ca3af" }} />
                          : <Visibility   sx={{ fontSize: "1.1rem", color: "#9ca3af" }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <Button fullWidth variant="contained" type="submit"
              sx={{ borderRadius: "10px", height: "40px", background: "#015DFF", textTransform: "none", fontWeight: 600, fontSize: "0.9rem" }}>
              Sign in
            </Button>
          </form>
        </Box>

        {/* RIGHT: IMAGE PANEL */}
        <Box sx={{ width: "53%", position: "relative", overflow: "hidden", backgroundColor: "#0B2F6B" }}>
          <Box component="img" src="/images/right.png" alt="Doctor"
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <Box sx={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to bottom, rgba(29,111,222,0) 0%, rgba(29,111,222,0.15) 20%, rgba(29,111,222,0.45) 40%, rgba(21,101,255,0.75) 60%, rgba(21,101,255,0.85) 80%, rgba(21,101,255,0.9) 100%)`,
          }} />
          <Box sx={{ position: "absolute", bottom: 40, left: 0, right: 0, px: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: "1.45rem", fontWeight: 700, color: "#fff", lineHeight: 1.35, mb: 1 }}>
              More time for care.<br />Less time on notes.
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", mb: 2.5, lineHeight: 1.6 }}>
              An AI scribe that captures notes, summaries, and follow-ups<br />
              in real time—so you can focus on care, not documentation.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
              <TrustBadge icon={<ShieldIcon />} line1="HIPAA"   line2="compliant"  />
              <TrustBadge icon={<ShieldIcon />} line1="256-bit" line2="encryption" />
              <TrustBadge icon={<ShieldIcon />} line1="SOC2"    line2="Certified"  />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;