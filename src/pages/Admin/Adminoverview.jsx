import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  Snackbar,
  Alert,
  Stack,
  Avatar,
  Divider,
  CardContent,
} from "@mui/material";
import {
  ExpandMore,
  Settings,
  Group,
} from "@mui/icons-material";
import AddLocationModal from "./Addlocationmodal";

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  primary: "#1976D2",
  primaryDark: "#1256A0",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  accent: "#7C3AED",
};

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_LOCATIONS = [
  { id: "MACH-01", name: "Main Acute Care Hospital",   type: "HOSPITAL",      inCharge: "Admin",          users: 1, skus: 8, code: "MACH", phone: "", address: "" },
  { id: "CWS-01",  name: "Central Warehouse & Stores", type: "WAREHOUSE",     inCharge: "Admin",          users: 1, skus: 2, code: "CWS",  phone: "", address: "" },
  { id: "ASC-01",  name: "Ambulatory Surgery Center",  type: "SURGERY",       inCharge: "Dr. Kapoor",     users: 0, skus: 1, code: "ASC",  phone: "", address: "" },
  { id: "UCC-01",  name: "Urgent Care Center",         type: "URGENT CARE",   inCharge: "Dr. Mehra",      users: 1, skus: 2, code: "UCC",  phone: "", address: "" },
  { id: "WCH-01",  name: "Women's & Children's Hospital", type: "HOSPITAL",   inCharge: "Dr. Patel",      users: 0, skus: 2, code: "WCH",  phone: "", address: "" },
  { id: "CLAB-01", name: "Core Laboratory",            type: "LABORATORY",    inCharge: "T. Williams",    users: 0, skus: 0, code: "CLAB", phone: "", address: "" },
  { id: "OIC-01",  name: "Outpatient Imaging Center",  type: "IMAGING",       inCharge: "Admin",          users: 0, skus: 0, code: "OIC",  phone: "", address: "" },
  { id: "BB-01",   name: "Blood Bank",                 type: "BLOOD BANK",    inCharge: "Admin",          users: 0, skus: 0, code: "BB",   phone: "", address: "" },
  { id: "RDP-01",  name: "Retail / Discharge Pharmacy",type: "PHARMACY",      inCharge: "P. Chen, PharmD",users: 1, skus: 2, code: "RDP",  phone: "", address: "" },
  { id: "SP-01",   name: "Specialty Pharmacy",         type: "PHARMACY",      inCharge: "Admin",          users: 0, skus: 0, code: "SP",   phone: "", address: "" },
];

const SEED_USERS = [
  { id: "SA", name: "Sarah Anderson", role: "Manager",     roleBg: "#EFF6FF", roleColor: "#1D4ED8", location: "Central Store", initials: "SA", avatarBg: "#1976D2", status: "active"  },
  { id: "PC", name: "P. Chen",        role: "Pharmacist",  roleBg: "#F0FDF4", roleColor: "#15803D", location: "Pharmacy",      initials: "PC", avatarBg: "#059669", status: "active"  },
  { id: "IN", name: "ICU Nurse",      role: "Nurse",       roleBg: "#FAF5FF", roleColor: "#7E22CE", location: "ICU",           initials: "IN", avatarBg: "#7C3AED", status: "active"  },
  { id: "TW", name: "Tom Williams",   role: "Storekeeper", roleBg: "#FFF7ED", roleColor: "#C2410C", location: "Laboratory",    initials: "TW", avatarBg: "#DC2626", status: "blocked" },
];

// ── Location badge color ─────────────────────────────────────────────────────
const LOC_COLORS = {
  CS:  { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", accent: "#1976D2" },
  ICU: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", accent: "#EA580C" },
  ED:  { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", accent: "#DC2626" },
  PH:  { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", accent: "#16A34A" },
  OR:  { bg: "#FAF5FF", color: "#7E22CE", border: "#E9D5FF", accent: "#7C3AED" },
  LAB: { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD", accent: "#0284C7" },
};
const DEFAULT_LOC_COLOR = { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE", accent: "#7C3AED" };

// ── Location Card ─────────────────────────────────────────────────────────────
function LocationCard({ loc, isExpanded, onToggleExpand }) {
  const navigate = useNavigate();
  const c = LOC_COLORS[loc.code] || DEFAULT_LOC_COLOR;

  return (
    <Box sx={{ 
      bgcolor: "#fff", 
      border: `1px solid ${C.border}`, 
      borderLeft: `3px solid ${c.accent}`, 
      borderRadius: "8px", 
      p: 2, 
      display: "flex", 
      flexDirection: "column", 
      gap: 0.8,
      transition: "all 0.2s",
    }}>
      {/* ── Always visible header ── */}
      <Box
        onClick={onToggleExpand}
        sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: "pointer" }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: C.textPrimary }}>{loc.name}</Typography>
          <Typography sx={{ fontSize: 10, color: C.textSecondary, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", mt: 0.1 }}>{loc.type}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Chip label={loc.id} size="small" sx={{ bgcolor: c.bg, color: c.color, border: `1px solid ${c.border}`, fontWeight: 700, fontSize: 10, height: 20 }} />
          <ExpandMore sx={{ fontSize: 16, color: C.textSecondary, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
        </Box>
      </Box>

      {/* ── Collapsible detail ── */}
      {isExpanded && (
        <>
          <Divider sx={{ borderColor: C.border }} />

          {[
            { label: "In-Charge", value: loc.inCharge || "—" },
            { label: "Users",     value: loc.users },
            { label: "Item SKUs", value: loc.skus },
          ].map((f) => (
            <Box key={f.label} sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 12, color: C.textSecondary }}>{f.label}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{f.value}</Typography>
            </Box>
          ))}

          {loc.address && (
            <Typography sx={{ fontSize: 11, color: C.textSecondary, mt: 0.2, fontStyle: "italic" }}>
              📍 {loc.address}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
            <Button size="small" variant="outlined" onClick={() => navigate("/admin/locations")}
              sx={{ fontSize: 11, fontWeight: 600, textTransform: "none", borderRadius: "6px", border: `1px solid ${C.border}`, color: C.textSecondary, "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" }, px: 1.2, height: 26 }}>
              <Settings sx={{ fontSize: 12, mr: 0.4 }} /> Manage
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigate("/admin/users")}
              sx={{ fontSize: 11, fontWeight: 600, textTransform: "none", borderRadius: "6px", border: `1px solid ${C.border}`, color: C.textSecondary, "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" }, px: 1.2, height: 26 }}>
              <Group sx={{ fontSize: 12, mr: 0.4 }} /> Users
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

// ── Location Row Component ─────────────────────────────────────────────────────
function LocationRow({ locations, rowIndex, expandedRows, onToggleRow }) {
  const isExpanded = expandedRows[rowIndex] || false;
  
  const handleToggle = () => {
    onToggleRow(rowIndex);
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
        {locations.map((loc) => (
          <LocationCard 
            key={loc.id} 
            loc={loc} 
            isExpanded={isExpanded}
            onToggleExpand={handleToggle}
          />
        ))}
      </Box>
    </Box>
  );
}

// ── User Card ─────────────────────────────────────────────────────────────────
function UserCard({ user }) {
  const isBlocked = user.status === "blocked";

  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 2,
      p: "10px 16px", bgcolor: "#fff",
      border: `1px solid ${C.border}`, borderRadius: "8px",
      "&:hover": { bgcolor: "#F9FAFB" }, transition: "background 0.15s",
    }}>
      <Avatar sx={{ width: 38, height: 38, bgcolor: user.avatarBg, fontSize: 13, fontWeight: 700 }}>
        {user.initials}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{user.name}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.2 }}>
          <Chip
            label={user.role}
            size="small"
            sx={{ bgcolor: user.roleBg, color: user.roleColor, fontWeight: 600, fontSize: 10, height: 18, border: `1px solid ${user.roleColor}22` }}
          />
          <Typography sx={{ fontSize: 11, color: C.textSecondary }}>· {user.location}</Typography>
        </Box>
      </Box>

      {/* ── Status badge ── */}
      <Chip
        label={isBlocked ? "Blocked" : "Active"}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: 11,
          height: 22,
          borderRadius: "6px",
          bgcolor: isBlocked ? "#FEF2F2" : "#F0FDF4",
          color:   isBlocked ? "#DC2626"  : "#16A34A",
          border:  `1px solid ${isBlocked ? "#FECACA" : "#BBF7D0"}`,
          flexShrink: 0,
        }}
      />
    </Box>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState(SEED_LOCATIONS);
  const [users, setUsers]         = useState(SEED_USERS);
  const [addLocOpen,  setAddLocOpen]  = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });
  const [expandedRows, setExpandedRows] = useState({});

  const showToast = (msg, severity = "success") => setToast({ open: true, msg, severity });

  const activeCount = users.length;

  // Group locations into rows of 3
  const groupLocationsIntoRows = () => {
    const rows = [];
    for (let i = 0; i < locations.length; i += 3) {
      rows.push(locations.slice(i, i + 3));
    }
    return rows;
  };

  const locationRows = groupLocationsIntoRows();

  const handleToggleRow = (rowIndex) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };

  const handleSaveLocation = (form) => {
    const code = form.code.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 5);
    const exists = locations.filter((l) => l.code === code).length;
    const num = String(exists + 1).padStart(2, "0");
    const newLoc = {
      id: `${code}-${num}`,
      name: form.name,
      type: form.type.toUpperCase(),
      inCharge: form.inCharge || "—",
      phone: form.phone || "",
      address: form.address || "",
      notes: form.notes || "",
      users: 0,
      skus: 0,
      code,
    };
    setLocations((p) => [...p, newLoc]);
    setAddLocOpen(false);
    showToast(`"${form.name}" added to Locations.`);
  };

  // ── Stat cards config ──────────────────────────────────────────────────────
 const statCardsRow1 = [
  {
    label: "Active Users",
    value: activeCount,
    sub: "Total registered users",
    iconBg: "#7c3aed",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: "Locations",
    value: locations.length,
    sub: "Active facilities",
    iconBg: "#2563eb",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: "Suppliers",
    value: 4,
    sub: "Approved vendors",
    iconBg: "#16a34a",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
];

const statCardsRow2 = [
  {
    label: "Manufacturers",
    value: 8,
    sub: "Registered brands",
    iconBg: "#d97706",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    label: "Categories",
    value: 6,
    sub: "Product categories",
    iconBg: "#0284c7",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Documents",
    value: 7,
    sub: "1 expiring · 1 expired",
    iconBg: "#dc2626",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <line x1="9" y1="14" x2="15" y2="14"/>
      </svg>
    ),
  },
];

// Updated StatCard component with reduced height
function StatCard({ label, value, sub, iconBg, icon }) {
  return (
    <Box sx={{ 
      flex: 1, 
      bgcolor: "#fff", 
      border: "1px solid #e5e7eb", 
      borderRadius: "10px", 
      px: 1.5,  // reduced from 2
      py: 1,    // reduced from 1.5
      minWidth: 0, 
      display: "flex", 
      alignItems: "center", 
      gap: 1.25   // reduced from 1.5
    }}>
      <Box sx={{ 
        width: 36,   // reduced from 44
        height: 36,  // reduced from 44
        borderRadius: "50%", 
        bgcolor: iconBg, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        flexShrink: 0 
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ 
          fontSize: 10,    // reduced from 11
          fontWeight: 600, 
          color: "#9ca3af", 
          letterSpacing: "0.05em", 
          textTransform: "uppercase", 
          mb: 0.25         // reduced from 0.5
        }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography sx={{ 
            fontSize: 20,    // reduced from 22
            fontWeight: 700, 
            color: "#111827", 
            lineHeight: 1.2 
          }}>
            {value}
          </Typography>
          {sub && (
            <Typography sx={{ 
              fontSize: 10,    // reduced from 11
              fontWeight: 500, 
              color: "#6b7280", 
              whiteSpace: "nowrap" 
            }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

  const StatCardGRN = ({ label, value, sub, iconBg, icon }) => (
    <Box sx={{ flex: 1, bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", px: 2, py: 1.5, minWidth: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", mb: 0.5 }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
            {value}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap" }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );

  // ── Button styles ──────────────────────────────────────────────────────────
  const outlinedBtnSx = {
    height: 32,
    px: "12px",
    borderRadius: "12px",
    border: "1px solid #015DFF",
    color: "#015DFF",
    textTransform: "none",
    fontWeight: 600,
    fontSize: 13,
    bgcolor: "#fff",
    boxShadow: "none",
    gap: "8px",
    minWidth: 0,
    "& .MuiButton-startIcon": { mr: 0 },
    "&:hover": { border: "1px solid #015DFF", bgcolor: "#EFF4FF", boxShadow: "none" },
  };

  const containedBtnSx = {
    height: 32,
    px: "12px",
    borderRadius: "12px",
    bgcolor: "#015DFF",
    color: "#fff",
    textTransform: "none",
    fontWeight: 600,
    fontSize: 13,
    boxShadow: "none",
    gap: "8px",
    minWidth: 0,
    "& .MuiButton-startIcon": { mr: 0 },
    "&:hover": { bgcolor: "#0147CC", boxShadow: "none" },
  };

  return (
    <Box>
      <Box sx={{ maxWidth: "1400px", mx: "auto" }}>

        {/* Title row */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 22, color: C.textPrimary, letterSpacing: -0.3 }}>Admin Overview</Typography>
          </Box>

         
        </Box>

        {/* Stat Cards — 2 rows of 3 */}
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 }, mb: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
            {statCardsRow1.map((s) => <StatCardGRN key={s.label} {...s} />)}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {statCardsRow2.map((s) => <StatCardGRN key={s.label} {...s} />)}
          </Stack>
        </CardContent>

        {/* Locations - Multiple Rows */}
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 }, mb: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: C.textPrimary, letterSpacing: -0.2 }}>Locations</Typography>
            <Button size="small" endIcon={<ExpandMore sx={{ fontSize: 14 }} />} onClick={() => navigate("/admin/locations")}
              sx={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "none" }}>
              View All
            </Button>
          </Box>
          
          {locationRows.map((rowLocations, idx) => (
            <LocationRow
              key={idx}
              locations={rowLocations}
              rowIndex={idx}
              expandedRows={expandedRows}
              onToggleRow={handleToggleRow}
            />
          ))}
        </CardContent>

        {/* Users */}
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: C.textPrimary, letterSpacing: -0.2 }}>Users</Typography>
            <Button size="small" endIcon={<ExpandMore sx={{ fontSize: 14 }} />} onClick={() => navigate("/admin/users")}
              sx={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "none" }}>
              View All
            </Button>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
            {users.map((user) => <UserCard key={user.id} user={user} />)}
          </Box>
        </CardContent>

        {/* Modals */}
        <AddLocationModal open={addLocOpen} onClose={() => setAddLocOpen(false)} onSave={handleSaveLocation} />

        {/* Toast */}
        <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={toast.severity} sx={{ borderRadius: "10px", fontWeight: 600, fontSize: 13 }} onClose={() => setToast((t) => ({ ...t, open: false }))}>
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}