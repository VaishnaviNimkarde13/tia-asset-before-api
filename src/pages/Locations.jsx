import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Snackbar, Alert,
  Tooltip, Stack, Dialog, DialogContent, TextField,
  MenuItem, Select, Grid, CardContent, InputAdornment,
  Checkbox, FormControlLabel,
} from "@mui/material";
import { Add, Edit, Delete, Close, LocationOn, Business, Search } from "@mui/icons-material";
import ClearIcon from "@mui/icons-material/Clear";
import AddLocationModal from "./Admin/Addlocationmodal";
import AddDepartmentModal from "./Admin/AddDepartmentModal";

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius:"8px", fontSize:13, bgcolor:"#F9FAFB",
    "& fieldset":{ borderColor:"#E5E7EB" },
    "&:hover fieldset":{ borderColor:"#9CA3AF" },
    "&.Mui-focused fieldset":{ borderColor:"#7C3AED" },
  },
};
const FIELD_LABEL_SX = { fontSize:11, fontWeight:700, color:"#6B7280", letterSpacing:0.5, textTransform:"uppercase", mb:0.5 };
const SELECT_SX = {
  borderRadius:"8px", fontSize:13, bgcolor:"#F9FAFB",
  "& fieldset":{ borderColor:"#E5E7EB" },
  "&:hover fieldset":{ borderColor:"#9CA3AF" },
  "&.Mui-focused fieldset":{ borderColor:"#7C3AED" },
};

function StatCard({ label, count, sub, iconEl, iconBg }) {
  return (
    <Box sx={{ flex:1, bgcolor:"#fff", border:"1px solid #e5e7eb", borderRadius:"10px",
      px:{ xs:0.75, sm:1, md:1.25 }, py:{ xs:0.5, sm:0.75, md:1 }, minWidth:0,
      display:"flex", alignItems:"center", gap:{ xs:0.5, sm:0.75, md:1 } }}>
      <Box sx={{ width:{ xs:32, sm:36, md:40 }, height:{ xs:32, sm:36, md:40 }, borderRadius:"50%",
        bgcolor:iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {iconEl}
      </Box>
      <Box>
        <Typography sx={{ fontSize:{ xs:9, sm:10, md:11 }, fontWeight:600, color:"#9ca3af",
          letterSpacing:"0.05em", textTransform:"uppercase", mb:{ xs:0.25, sm:0.375, md:0.5 } }}>
          {label}
        </Typography>
        <Box sx={{ display:"flex", alignItems:"baseline", gap:{ xs:0.25, sm:0.5, md:0.75 } }}>
          <Typography sx={{ fontSize:{ xs:14, sm:18, md:20 }, fontWeight:700, color:"#111827", lineHeight:1.2 }}>
            {count}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize:{ xs:9, sm:10, md:11 }, fontWeight:500, color:"#6b7280", whiteSpace:"nowrap" }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function EditLocationDialog({ open, onClose, loc, onSave }) {
  const l = loc || {};
  const init = { name:l.name||"", inCharge:l.inCharge||"", phone:l.phone||"", address:l.address||"", sub:l.sub||"" };
  const [form, setForm] = useState(init);
  const handleEnter = () => setForm({ name:l.name||"", inCharge:l.inCharge||"", phone:l.phone||"", address:l.address||"", sub:l.sub||"" });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      TransitionProps={{ onEnter: handleEnter }}
      PaperProps={{ sx:{ borderRadius:"14px", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" } }}>
      <Box sx={{ px:"24px", pt:"20px", pb:"16px", display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", borderBottom:"1px solid #f3f4f6", flexShrink:0 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <Box sx={{ width:38, height:38, borderRadius:"10px", bgcolor:"#FFF1F2",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <LocationOn sx={{ color:"#E11D48", fontSize:22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize:16, fontWeight:700, color:"#111827" }}>Edit Location</Typography>
            <Typography sx={{ fontSize:12, color:"#9ca3af", mt:"1px" }}>Update facility details</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color:"#9ca3af", border:"1px solid #e5e7eb", borderRadius:"8px", width:30, height:30, "&:hover":{ background:"#f3f4f6" } }}>
          <Close sx={{ fontSize:15 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ px:"24px", py:"20px", overflowY:"auto", maxHeight:"70vh",
        "&::-webkit-scrollbar":{ width:4 }, "&::-webkit-scrollbar-thumb":{ background:"#d1d5db", borderRadius:4 } }}>
        <Box sx={{ mb:1.5 }}>
          <Typography sx={FIELD_LABEL_SX}>Location Name</Typography>
          <TextField fullWidth size="small" value={form.name} onChange={set("name")} sx={FIELD_SX} />
        </Box>
        <Grid container spacing={1.5} sx={{ mb:1.5 }}>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>In-Charge</Typography>
            <TextField fullWidth size="small" value={form.inCharge} onChange={set("inCharge")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Phone</Typography>
            <TextField fullWidth size="small" value={form.phone} onChange={set("phone")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={FIELD_LABEL_SX}>Address / Wing / Floor</Typography>
            <TextField fullWidth size="small" value={form.address} onChange={set("address")} sx={FIELD_SX} />
          </Grid>
        </Grid>
        <Typography sx={FIELD_LABEL_SX}>Notes / Description</Typography>
        <TextField fullWidth multiline rows={2} size="small" value={form.sub} onChange={set("sub")}
          placeholder="Storage conditions, access..."
          sx={{ "& .MuiOutlinedInput-root":{ fontSize:13, borderRadius:"8px", bgcolor:"#f9fafb",
            "& fieldset":{ borderColor:"#e5e7eb" }, "&.Mui-focused fieldset":{ borderColor:"#7C3AED" } } }} />
      </DialogContent>
      <Box sx={{ px:"24px", py:"16px", borderTop:"1px solid #f3f4f6", display:"flex",
        alignItems:"center", justifyContent:"flex-end", gap:"10px", background:"#fff", flexShrink:0 }}>
        <Button onClick={onClose}
          sx={{ fontSize:13, fontWeight:600, color:"#374151", textTransform:"none", borderRadius:"8px",
            px:"20px", py:"9px", border:"1px solid #e5e7eb", "&:hover":{ background:"#f9fafb" } }}>
          Cancel
        </Button>
        <Button onClick={() => { onSave(l.id, form); onClose(); }}
          sx={{ fontSize:13, fontWeight:600, color:"#fff", textTransform:"none", borderRadius:"8px",
            px:"20px", py:"9px", background:"#7C3AED", boxShadow:"0 2px 8px rgba(124,58,237,0.25)",
            "&:hover":{ background:"#6D28D9" } }}>
          Save Changes
        </Button>
      </Box>
    </Dialog>
  );
}

const C = {
  bg:            "#F5F6FA",
  border:        "#E5E7EB",
  textPrimary:   "#111827",
  textSecondary: "#6B7280",
  primary:       "#1976D2",
};

const SEED_LOCATIONS = [
  { id:"LOC-01", code:"LOC-01", codeBg:"#EFF6FF", codeColor:"#1D4ED8", codeBorder:"#BFDBFE", codeAccent:"#1976D2", name:"Main Acute Care Hospital", sub:"Main acute care facility", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-02", code:"LOC-02", codeBg:"#FFF7ED", codeColor:"#C2410C", codeBorder:"#FED7AA", codeAccent:"#EA580C", name:"Central Warehouse & Stores", sub:"Central warehouse and storage facility", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-03", code:"LOC-03", codeBg:"#F5F3FF", codeColor:"#6D28D9", codeBorder:"#DDD6FE", codeAccent:"#7C3AED", name:"Ambulatory Surgery Center", sub:"Outpatient surgical procedures", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-04", code:"LOC-04", codeBg:"#FEF2F2", codeColor:"#DC2626", codeBorder:"#FECACA", codeAccent:"#DC2626", name:"Urgent Care Center", sub:"Urgent and walk-in care", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-05", code:"LOC-05", codeBg:"#FDF2F8", codeColor:"#9D174D", codeBorder:"#FBCFE8", codeAccent:"#BE185D", name:"Women's & Children's Hospital", sub:"Women and pediatric services", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-06", code:"LOC-06", codeBg:"#E0F2FE", codeColor:"#0369A1", codeBorder:"#BAE6FD", codeAccent:"#0284C7", name:"Core Laboratory", sub:"Centralized laboratory services", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-07", code:"LOC-07", codeBg:"#EDE9FE", codeColor:"#6D28D9", codeBorder:"#DDD6FE", codeAccent:"#7C3AED", name:"Outpatient Imaging Center", sub:"Radiology and imaging services", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-08", code:"LOC-08", codeBg:"#FFF1F2", codeColor:"#BE123C", codeBorder:"#FECDD3", codeAccent:"#E11D48", name:"Blood Bank", sub:"Blood collection and storage", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-09", code:"LOC-09", codeBg:"#F0FDF4", codeColor:"#15803D", codeBorder:"#BBF7D0", codeAccent:"#16A34A", name:"Retail / Discharge Pharmacy", sub:"Retail and discharge pharmacy", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
  { id:"LOC-10", code:"LOC-10", codeBg:"#FDF4FF", codeColor:"#86198F", codeBorder:"#F0ABFC", codeAccent:"#A21CAF", name:"Specialty Pharmacy", sub:"Specialty drug dispensing", inCharge:"Admin", phone:"", address:"", users:1, status:"Active" },
];

const CODE_PALETTE = [
  { bg:"#F5F3FF", color:"#6D28D9", border:"#DDD6FE", accent:"#7C3AED" },
  { bg:"#FFF1F2", color:"#BE123C", border:"#FECDD3", accent:"#E11D48" },
  { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", accent:"#16A34A" },
  { bg:"#EFF6FF", color:"#1D4ED8", border:"#BFDBFE", accent:"#1976D2" },
];

const SEED_DEPARTMENTS = [
  { id:"DEPT-01", code:"DEPT-01", codeBg:"#FFF1F2", codeColor:"#BE123C", codeBorder:"#FECDD3", name:"Central Store", type:"Clinical", inCharge:"Store Manager", phone:"Ext 100", location:"Main Acute Care Hospital", notes:"Main inventory storage", isStore:true, isDefaultStore:false, status:"Active" },
  { id:"DEPT-02", code:"DEPT-02", codeBg:"#F0FDF4", codeColor:"#15803D", codeBorder:"#BBF7D0", name:"Pharmacy", type:"Surgical", inCharge:"Pharmacist", phone:"Ext 101", location:"Central Warehouse & Stores", notes:"Medicine dispensing", isStore:false, isDefaultStore:false, status:"Active" },
  { id:"DEPT-03", code:"DEPT-03", codeBg:"#F0F9FF", codeColor:"#0369A1", codeBorder:"#BAE6FD", name:"Laboratory", type:"Diagnostic", inCharge:"Lab Head", phone:"Ext 102", location:"Main Acute Care Hospital", notes:"Testing and diagnostics", isStore:false, isDefaultStore:false, status:"Active" },
];

const DEPT_CODE_PALETTE = [
  { bg:"#F5F3FF", color:"#6D28D9", border:"#DDD6FE" },
  { bg:"#FFF1F2", color:"#BE123C", border:"#FECDD3" },
  { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0" },
  { bg:"#EFF6FF", color:"#1D4ED8", border:"#BFDBFE" },
  { bg:"#FFF7ED", color:"#C2410C", border:"#FED7AA" },
  { bg:"#F0F9FF", color:"#0369A1", border:"#BAE6FD" },
];

function EditDepartmentDialog({ open, onClose, dept, onSave }) {
  const d = dept || {};
  const init = {
    name: d.name||"", type: d.type||"Clinical",
    inCharge: d.inCharge||"", phone: d.phone||"",
    location: d.location||"", notes: d.notes||"",
    isStore: !!d.isStore, isDefaultStore: !!d.isDefaultStore,
  };
  const [form, setForm] = useState(init);
  const handleEnter = () => setForm({
    name: d.name||"", type: d.type||"Clinical",
    inCharge: d.inCharge||"", phone: d.phone||"",
    location: d.location||"", notes: d.notes||"",
    isStore: !!d.isStore, isDefaultStore: !!d.isDefaultStore,
  });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const DEPT_TYPES = ["Clinical","Surgical","Diagnostic","Pharmacy","Administrative","Support Services","Emergency","Outpatient"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      TransitionProps={{ onEnter: handleEnter }}
      PaperProps={{ sx:{ borderRadius:"14px", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" } }}>
      <Box sx={{ px:"24px", pt:"20px", pb:"16px", display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", borderBottom:"1px solid #f3f4f6", flexShrink:0 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <Box sx={{ width:38, height:38, borderRadius:"10px", bgcolor:"#eff6ff",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Business sx={{ color:"#2563eb", fontSize:22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize:16, fontWeight:700, color:"#111827" }}>Edit Department</Typography>
            <Typography sx={{ fontSize:12, color:"#9ca3af", mt:"1px" }}>Update department details</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color:"#9ca3af", border:"1px solid #e5e7eb", borderRadius:"8px", width:30, height:30, "&:hover":{ background:"#f3f4f6" } }}>
          <Close sx={{ fontSize:15 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px:"24px", py:"20px", overflowY:"auto", maxHeight:"70vh",
        "&::-webkit-scrollbar":{ width:4 }, "&::-webkit-scrollbar-thumb":{ background:"#d1d5db", borderRadius:4 } }}>
        <Box sx={{ mb:1.5 }}>
          <Typography sx={FIELD_LABEL_SX}>Department Name</Typography>
          <TextField fullWidth size="small" value={form.name} onChange={set("name")} sx={FIELD_SX} />
        </Box>
        <Grid container spacing={1.5} sx={{ mb:1.5 }}>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Type</Typography>
            <Select fullWidth size="small" value={form.type} onChange={set("type")} sx={SELECT_SX}>
              {DEPT_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize:13 }}>{t}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Head / In-Charge</Typography>
            <TextField fullWidth size="small" value={form.inCharge} onChange={set("inCharge")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Phone</Typography>
            <TextField fullWidth size="small" value={form.phone} onChange={set("phone")} sx={FIELD_SX} />
          </Grid>
          <Grid item xs={6}>
            <Typography sx={FIELD_LABEL_SX}>Location / Floor / Wing</Typography>
            <TextField fullWidth size="small" value={form.location} onChange={set("location")} sx={FIELD_SX} />
          </Grid>
        </Grid>
        <Typography sx={FIELD_LABEL_SX}>Notes</Typography>
        <TextField fullWidth multiline rows={2} size="small" value={form.notes} onChange={set("notes")}
          placeholder="Specialisation, bed count, operating hours..."
          sx={{ "& .MuiOutlinedInput-root":{ fontSize:13, borderRadius:"8px", bgcolor:"#f9fafb",
            "& fieldset":{ borderColor:"#e5e7eb" }, "&.Mui-focused fieldset":{ borderColor:"#2563eb" } } }} />

        <Box sx={{ borderTop:"1px dashed #e5e7eb", mt:"16px", mb:"16px" }} />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.isStore}
              onChange={(e) => setForm(p => ({
                ...p,
                isStore: e.target.checked,
                isDefaultStore: e.target.checked ? p.isDefaultStore : false,
              }))}
              size="small"
              sx={{ color:"#d1d5db", "&.Mui-checked":{ color:"#16a34a" }, p:"4px" }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontSize:13, fontWeight:600, color:"#374151", lineHeight:1.3 }}>Is Store</Typography>
              <Typography sx={{ fontSize:11, color:"#9ca3af" }}>This department acts as a store</Typography>
            </Box>
          }
          sx={{ ml:0, alignItems:"flex-start", gap:"4px", mb:"10px" }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.isDefaultStore}
              onChange={(e) => setForm(p => ({ ...p, isDefaultStore: e.target.checked }))}
              size="small"
              sx={{ color:"#d1d5db", "&.Mui-checked":{ color:"#2563eb" }, p:"4px" }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontSize:13, fontWeight:600, color:"#374151", lineHeight:1.3 }}>Is Default Store</Typography>
              <Typography sx={{ fontSize:11, color:"#9ca3af" }}>Set as the default store for this location</Typography>
            </Box>
          }
          sx={{ ml:0, alignItems:"flex-start", gap:"4px" }}
        />
      </DialogContent>

      <Box sx={{ px:"24px", py:"16px", borderTop:"1px solid #f3f4f6", display:"flex",
        alignItems:"center", justifyContent:"flex-end", gap:"10px", background:"#fff", flexShrink:0 }}>
        <Button onClick={onClose}
          sx={{ fontSize:13, fontWeight:600, color:"#374151", textTransform:"none", borderRadius:"8px",
            px:"20px", py:"9px", border:"1px solid #e5e7eb", "&:hover":{ background:"#f9fafb" } }}>
          Cancel
        </Button>
        <Button onClick={() => { onSave(d.id, form); onClose(); }}
          sx={{ fontSize:13, fontWeight:600, color:"#fff", textTransform:"none", borderRadius:"8px",
            px:"20px", py:"9px", background:"#2563eb", boxShadow:"0 2px 8px rgba(37,99,235,0.25)",
            "&:hover":{ background:"#1d4ed8" } }}>
          Save Changes
        </Button>
      </Box>
    </Dialog>
  );
}

export default function Locations() {
  const [locations, setLocations] = useState(() => {
    try { const saved = localStorage.getItem("tia_locations"); if (saved) return JSON.parse(saved); } catch {}
    return SEED_LOCATIONS;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editLoc,   setEditLoc]   = useState(null);
  const [editOpen,  setEditOpen]  = useState(false);
  const [toast,     setToast]     = useState({ open:false, msg:"", severity:"success" });

  const [departments, setDepartments] = useState(() => {
    try { const saved = localStorage.getItem("tia_departments"); if (saved) return JSON.parse(saved); } catch {}
    return SEED_DEPARTMENTS;
  });

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editDept,      setEditDept]      = useState(null);
  const [editDeptOpen,  setEditDeptOpen]  = useState(false);
  const [activeTab,     setActiveTab]     = useState(0);
  const [searchQuery,   setSearchQuery]   = useState("");

  useEffect(() => {
    localStorage.setItem("tia_locations", JSON.stringify(locations));
    window.dispatchEvent(new Event("locationsUpdated"));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem("tia_departments", JSON.stringify(departments));
    window.dispatchEvent(new Event("departmentsUpdated"));
  }, [departments]);

  useEffect(() => { setSearchQuery(""); }, [activeTab]);

  const showToast = (msg, severity = "success") => setToast({ open:true, msg, severity });

  const q = searchQuery.trim().toLowerCase();
  const filteredLocations = locations.filter((loc) => !q || (
    loc.name?.toLowerCase().includes(q) || loc.code?.toLowerCase().includes(q) ||
    loc.inCharge?.toLowerCase().includes(q) || loc.address?.toLowerCase().includes(q)
  ));
  const filteredDepartments = departments.filter((dept) => !q || (
    dept.name?.toLowerCase().includes(q) || dept.code?.toLowerCase().includes(q) ||
    dept.type?.toLowerCase().includes(q) || dept.inCharge?.toLowerCase().includes(q) ||
    dept.location?.toLowerCase().includes(q)
  ));

  const activeLocations   = locations.filter(l => l.status === "Active").length;
  const activeDepartments = departments.filter(d => d.status === "Active").length;
  const totalUsers        = locations.reduce((s, l) => s + (l.users || 0), 0);

  const locStatCards = [
    { label:"Total Locations", count:locations.length, sub:`${activeLocations} active`, iconBg:"#3b82f6",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { label:"Active Locations", count:activeLocations, sub:"Currently operational", iconBg:"#10b981",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { label:"Departments", count:departments.length, sub:`${activeDepartments} active`, iconBg:"#8b5cf6",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
    { label:"Total Users", count:totalUsers, sub:"Across all locations", iconBg:"#f59e0b",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];

  const deptStatCards = [
    { label:"Total Departments", count:departments.length, sub:`${activeDepartments} active`, iconBg:"#8b5cf6",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
    { label:"Active", count:activeDepartments, sub:"Currently running", iconBg:"#10b981",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { label:"Locations Covered", count:[...new Set(departments.map(d => d.location).filter(Boolean))].length, sub:"Unique locations", iconBg:"#3b82f6",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { label:"Dept Types", count:[...new Set(departments.map(d => d.type).filter(Boolean))].length, sub:"Unique categories", iconBg:"#f59e0b",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  ];

  const currentStatCards = activeTab === 0 ? locStatCards : deptStatCards;

  const handleSave = (form) => {
    const codeStr = form.code.replace(/[^A-Za-z0-9-]/g,"").toUpperCase();
    const palette = CODE_PALETTE[locations.length % CODE_PALETTE.length];
    setLocations(p => [...p, { id:codeStr, code:codeStr, codeBg:palette.bg, codeColor:palette.color, codeBorder:palette.border, codeAccent:palette.accent, name:form.name, sub:form.notes||"", inCharge:form.inCharge||"-", phone:form.phone||"-", address:form.address||"-", users:0, status:"Active" }]);
    setModalOpen(false);
    showToast(`"${form.name}" added successfully.`);
  };

  const handleEditSave = (id, form) => {
    setLocations(p => p.map(l => l.id !== id ? l : { ...l, name:form.name||l.name, inCharge:form.inCharge||l.inCharge, phone:form.phone||l.phone, address:form.address||l.address, sub:form.sub||l.sub }));
    showToast("Location updated successfully.");
  };

  const handleDelete = (id) => {
    setLocations(p => p.filter(l => l.id !== id));
    showToast("Location removed.", "warning");
  };

  const handleDeptSave = (form) => {
    const codeStr = form.code.replace(/[^A-Za-z0-9-]/g,"").toUpperCase();
    const palette = DEPT_CODE_PALETTE[departments.length % DEPT_CODE_PALETTE.length];
    setDepartments(p => [...p, {
      id:codeStr, code:codeStr, codeBg:palette.bg, codeColor:palette.color, codeBorder:palette.border,
      name:form.name, type:form.type, inCharge:form.inCharge||"-", phone:form.phone||"-",
      location:form.location||"-", notes:form.notes||"",
      isStore:!!form.isStore, isDefaultStore:!!form.isDefaultStore, status:"Active",
    }]);
    setDeptModalOpen(false);
    showToast(`"${form.name}" department added successfully.`);
  };

  const handleDeptEditSave = (id, form) => {
    setDepartments(p => p.map(d => d.id !== id ? d : {
      ...d,
      name:     form.name     !== undefined ? form.name     : d.name,
      type:     form.type     !== undefined ? form.type     : d.type,
      inCharge: form.inCharge !== undefined ? form.inCharge : d.inCharge,
      phone:    form.phone    !== undefined ? form.phone    : d.phone,
      location: form.location !== undefined ? form.location : d.location,
      notes:    form.notes    !== undefined ? form.notes    : d.notes,
      isStore:        form.isStore        !== undefined ? form.isStore        : d.isStore,
      isDefaultStore: form.isDefaultStore !== undefined ? form.isDefaultStore : d.isDefaultStore,
    }));
    showToast("Department updated successfully.");
  };

  const handleDeptDelete = (id) => {
    setDepartments(p => p.filter(d => d.id !== id));
    showToast("Department removed.", "warning");
  };

  const thSx = { fontWeight:600, fontSize:11, color:"#373B4D", letterSpacing:"0.04em", py:"11px", px:"14px", borderBottom:"1px solid #f3f4f6", whiteSpace:"nowrap" };

  return (
    <Box>
      <Box sx={{ maxWidth:"1400px", mx:"auto" }}>
        {/* Header */}
        <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          mb:{ xs:1.25, sm:1.5, md:1.75 }, gap:1, flexWrap:"wrap" }}>
          <Typography sx={{ fontSize:{ xs:18, sm:20, md:20 }, fontWeight:700, color:"#111827", flexShrink:0 }}>
            Locations / Departments
          </Typography>
          <Box sx={{ display:"flex", alignItems:"center", gap:1, flexWrap:"wrap", flex:1, justifyContent:"flex-end" }}>
            <TextField
              size="small"
              placeholder={activeTab === 0 ? "Search locations…" : "Search departments…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize:16, color:"#9ca3af" }} /></InputAdornment>,
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")} disableRipple
                      sx={{ p:0.5, color:"#9ca3af", "&:hover":{ color:"#374151" } }}>
                      <ClearIcon sx={{ fontSize:14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ width:{ xs:"100%", md:240 }, "& .MuiOutlinedInput-root":{ fontSize:13, borderRadius:"8px", bgcolor:"#fff", height:36,
                "& fieldset":{ borderColor:"#e5e7eb" }, "&:hover fieldset":{ borderColor:"#9ca3af" },
                "&.Mui-focused fieldset":{ borderColor:"#2563eb", borderWidth:"1.5px" } } }}
            />
            {activeTab === 0 ? (
              <Button startIcon={<Add sx={{ fontSize:16 }} />} variant="contained" onClick={() => setModalOpen(true)}
                sx={{ background:"#2563eb", color:"#fff", borderRadius:"8px", px:1.875, height:36, fontSize:13, fontWeight:500, textTransform:"none", boxShadow:"0 1px 4px rgba(37,99,235,0.25)", whiteSpace:"nowrap", "&:hover":{ background:"#1d4ed8" } }}>
                Add Location
              </Button>
            ) : (
              <Button startIcon={<Add sx={{ fontSize:16 }} />} variant="contained" onClick={() => setDeptModalOpen(true)}
                sx={{ background:"#2563eb", color:"#fff", borderRadius:"8px", px:1.875, height:36, fontSize:13, fontWeight:500, textTransform:"none", boxShadow:"0 1px 4px rgba(37,99,235,0.25)", whiteSpace:"nowrap", "&:hover":{ background:"#1d4ed8" } }}>
                Add Department
              </Button>
            )}
          </Box>
        </Box>

        {/* Stat Cards */}
        <Box sx={{ display:"flex", gap:{ xs:0.5, sm:0.75, md:1 }, mb:{ xs:0.875, sm:1.125, md:1.375 }, flexWrap:{ xs:"wrap", md:"nowrap" } }}>
          {currentStatCards.map((s) => (
            <StatCard key={s.label} label={s.label} count={s.count} sub={s.sub} iconBg={s.iconBg} iconEl={s.icon} />
          ))}
        </Box>

        {/* Tabs */}
        <Box sx={{ display:"flex", gap:"4px", mb:"20px", p:"4px", bgcolor:"#f3f4f6", borderRadius:"10px", width:"fit-content" }}>
          {[
            { label:"Locations",   icon:<LocationOn sx={{ fontSize:15 }} /> },
            { label:"Departments", icon:<Business   sx={{ fontSize:15 }} /> },
          ].map((tab, i) => (
            <Box key={tab.label} onClick={() => setActiveTab(i)}
              sx={{ display:"flex", alignItems:"center", gap:"6px", px:"16px", py:"7px", borderRadius:"8px",
                cursor:"pointer", transition:"all 0.15s",
                bgcolor:   activeTab === i ? "#fff" : "transparent",
                boxShadow: activeTab === i ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                color:     activeTab === i ? "#111827" : "#6b7280",
                "&:hover":{ color:"#111827", bgcolor: activeTab === i ? "#fff" : "#e9eaec" } }}>
              {tab.icon}
              <Typography sx={{ fontSize:13, fontWeight: activeTab === i ? 600 : 500 }}>{tab.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Search badge */}
        {searchQuery && (
          <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:1.25, px:1.25, py:0.75, borderRadius:"8px",
            bgcolor:"#eff6ff", border:"1px solid #bfdbfe", width:"fit-content" }}>
            <Box sx={{ width:7, height:7, borderRadius:"50%", bgcolor:"#2563eb", flexShrink:0 }} />
            <Typography sx={{ fontSize:12, fontWeight:600, color:"#2563eb" }}>
              {activeTab === 0 ? filteredLocations.length : filteredDepartments.length}{" "}
              {activeTab === 0 ? "location" : "department"}
              {(activeTab === 0 ? filteredLocations.length : filteredDepartments.length) !== 1 ? "s" : ""}{" "}
              for "{searchQuery}"
            </Typography>
            <IconButton size="small" onClick={() => setSearchQuery("")} disableRipple
              sx={{ p:0.5, color:"#9ca3af", ml:0.5, "&:hover":{ color:"#374151" } }}>
              <ClearIcon sx={{ fontSize:13 }} />
            </IconButton>
          </Box>
        )}

        {/* Locations Tab */}
        {activeTab === 0 && (
          <Paper elevation={0} sx={{ borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <Table size="small" sx={{ width:"100%", tableLayout:"fixed" }}>
              <TableHead>
                <TableRow sx={{ bgcolor:"#EBF1FE" }}>
                  {["Code","Name","In-Charge","Phone","Address","Users","Status","Actions"].map((h, i, arr) => (
                    <TableCell key={h} sx={{ ...thSx, borderRight: i < arr.length-1 ? "1px solid #BED3FC" : "none" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLocations.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py:5, fontSize:13, color:C.textSecondary }}>
                    {searchQuery ? `No locations match "${searchQuery}"` : "No locations found."}
                  </TableCell></TableRow>
                )}
                {filteredLocations.map((loc, idx) => (
                  <TableRow key={loc.id} sx={{ bgcolor:"#fff", "&:hover":{ bgcolor:"#f8faff" }, transition:"background 0.15s",
                    "& td":{ borderBottom: idx < filteredLocations.length-1 ? "1px solid #f3f4f6" : "none", py:"11px", px:"14px" } }}>
                    <TableCell><Chip label={loc.code} size="small" sx={{ bgcolor:loc.codeBg, color:loc.codeColor, border:`1px solid ${loc.codeBorder}`, fontWeight:700, fontSize:11, height:22 }} /></TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize:13, fontWeight:700, color:C.textPrimary, lineHeight:1.3 }}>{loc.name}</Typography>
                      {loc.sub && <Typography sx={{ fontSize:11, color:C.textSecondary, mt:0.1 }}>{loc.sub}</Typography>}
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textPrimary, fontWeight:500 }}>{loc.inCharge}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textSecondary }}>{loc.phone}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textSecondary }}>{loc.address}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textSecondary, fontWeight:600 }}>{loc.users}</Typography></TableCell>
                    <TableCell><Chip label="Active" size="small" sx={{ bgcolor:"#F0FDF4", color:"#16A34A", border:"1px solid #BBF7D0", fontWeight:700, fontSize:11, height:22 }} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditLoc(loc); setEditOpen(true); }}
                            sx={{ bgcolor:"#EFF6FF", color:"#1D4ED8", "&:hover":{ bgcolor:"#DBEAFE" }, width:26, height:26, borderRadius:"6px" }}>
                            <Edit sx={{ fontSize:13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => handleDelete(loc.id)}
                            sx={{ bgcolor:"#FEF2F2", color:"#DC2626", "&:hover":{ bgcolor:"#FEE2E2" }, width:26, height:26, borderRadius:"6px" }}>
                            <Delete sx={{ fontSize:13 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Departments Tab */}
        {activeTab === 1 && (
          <Paper elevation={0} sx={{ borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <Table size="small" sx={{ width:"100%", tableLayout:"fixed" }}>
              <TableHead>
                <TableRow sx={{ bgcolor:"#EBF1FE" }}>
                  {["Code","Name","Location","Type","Head / In-Charge","Phone","Status","Actions"].map((h, i, arr) => (
                    <TableCell key={h} sx={{ ...thSx, borderRight: i < arr.length-1 ? "1px solid #BED3FC" : "none" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDepartments.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py:5, fontSize:13, color:C.textSecondary }}>
                    {searchQuery ? `No departments match "${searchQuery}"` : "No departments found."}
                  </TableCell></TableRow>
                )}
                {filteredDepartments.map((dept, idx) => (
                  <TableRow key={dept.id} sx={{ bgcolor:"#fff", "&:hover":{ bgcolor:"#f8faff" }, transition:"background 0.15s",
                    "& td":{ borderBottom: idx < filteredDepartments.length-1 ? "1px solid #f3f4f6" : "none", py:"11px", px:"14px" } }}>
                    <TableCell><Chip label={dept.code} size="small" sx={{ bgcolor:dept.codeBg, color:dept.codeColor, border:`1px solid ${dept.codeBorder}`, fontWeight:700, fontSize:11, height:22 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display:"flex", alignItems:"center", gap:0.75, flexWrap:"wrap" }}>
                        <Typography sx={{ fontSize:13, fontWeight:700, color:C.textPrimary, lineHeight:1.3 }}>{dept.name}</Typography>
                        {dept.isStore && (
                          <Chip label="Store" size="small" sx={{ bgcolor:"#F0FDF4", color:"#16A34A", border:"1px solid #BBF7D0", fontWeight:700, fontSize:10, height:18 }} />
                        )}
                        {dept.isDefaultStore && (
                          <Chip label="Default Store" size="small" sx={{ bgcolor:"#EFF6FF", color:"#1D4ED8", border:"1px solid #BFDBFE", fontWeight:700, fontSize:10, height:18 }} />
                        )}
                      </Box>
                      {dept.notes && <Typography sx={{ fontSize:11, color:C.textSecondary, mt:0.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dept.notes}</Typography>}
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textSecondary }}>{dept.location}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textSecondary }}>{dept.type}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textPrimary, fontWeight:500 }}>{dept.inCharge}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize:12, color:C.textSecondary }}>{dept.phone}</Typography></TableCell>
                    <TableCell><Chip label="Active" size="small" sx={{ bgcolor:"#F0FDF4", color:"#16A34A", border:"1px solid #BBF7D0", fontWeight:700, fontSize:11, height:22 }} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditDept(dept); setEditDeptOpen(true); }}
                            sx={{ bgcolor:"#EFF6FF", color:"#1D4ED8", "&:hover":{ bgcolor:"#DBEAFE" }, width:26, height:26, borderRadius:"6px" }}>
                            <Edit sx={{ fontSize:13 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => handleDeptDelete(dept.id)}
                            sx={{ bgcolor:"#FEF2F2", color:"#DC2626", "&:hover":{ bgcolor:"#FEE2E2" }, width:26, height:26, borderRadius:"6px" }}>
                            <Delete sx={{ fontSize:13 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Modals */}
        <EditLocationDialog   open={editOpen}      onClose={() => setEditOpen(false)}     loc={editLoc}   onSave={handleEditSave}    />
        <AddLocationModal      open={modalOpen}     onClose={() => setModalOpen(false)}                    onSave={handleSave}         />
        <AddDepartmentModal    open={deptModalOpen} onClose={() => setDeptModalOpen(false)}                onSave={handleDeptSave}     locations={locations} />
        <EditDepartmentDialog  open={editDeptOpen}  onClose={() => setEditDeptOpen(false)} dept={editDept} onSave={handleDeptEditSave} />

        <Snackbar open={toast.open} autoHideDuration={3000}
          onClose={() => setToast(t => ({ ...t, open:false }))}
          anchorOrigin={{ vertical:"bottom", horizontal:"right" }}>
          <Alert severity={toast.severity} sx={{ borderRadius:"10px", fontWeight:600, fontSize:13 }}
            onClose={() => setToast(t => ({ ...t, open:false }))}>
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}