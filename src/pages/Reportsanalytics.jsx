
import { Box, Typography, Button, Stack, Paper } from "@mui/material";
import { FileDownload } from "@mui/icons-material";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";

const btnPrimary = {
  height: 28, px: "10px", borderRadius: "10px",
  bgcolor: "#015DFF", color: "#fff",
  textTransform: "none", fontSize: 12, fontWeight: 600,
  boxShadow: "none", gap: "6px", minWidth: 0,
  "& .MuiButton-startIcon": { mr: 0, fontSize: 14 },
  "&:hover": { bgcolor: "#0147CC", boxShadow: "none" },
};

const btnOutlined = {
  height: 28, px: "10px", borderRadius: "10px",
  border: "1px solid #015DFF", bgcolor: "#fff", color: "#015DFF",
  textTransform: "none", fontSize: 12, fontWeight: 600,
  boxShadow: "none", gap: "6px", minWidth: 0,
  "& .MuiButton-startIcon": { mr: 0, fontSize: 14 },
  "&:hover": { border: "1px solid #015DFF", bgcolor: "#EFF4FF", boxShadow: "none" },
};

// ── Chart Data ────────────────────────────────────────────────────────────────
const MONTHLY_SPEND = [
  { month:"Sep", value:48500 }, { month:"Oct", value:51200 },
  { month:"Nov", value:63800 }, { month:"Dec", value:56400 },
  { month:"Jan", value:54200 }, { month:"Feb", value:60100 },
  { month:"Mar", value:68700 },
];
const STOCK_BY_LOCATION = [
  { loc:"MACH-01", value:2850 }, { loc:"CWS-01",  value:320  },
  { loc:"ASC-01",  value:180  }, { loc:"UCC-01",  value:1100 },
  { loc:"WCH-01",  value:950  }, { loc:"CLAB-01", value:640  },
];
const ISSUE_BY_DEPT = [
  { dept:"MACH-01", value:1 }, { dept:"CWS-01",  value:1 },
  { dept:"ASC-01",  value:5 }, { dept:"UCC-01",  value:1 },
  { dept:"WCH-01",  value:1 }, { dept:"CLAB-01", value:0 },
];
const PO_STATUS = [
  { name:"Draft",    value:14, color:"#2563EB" },
  { name:"Pending",  value:31, color:"#F59E0B" },
  { name:"Approved", value:22, color:"#0EA5E9" },
  { name:"Received", value:18, color:"#16A34A" },
];

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data  = payload[0];
  const total = PO_STATUS.reduce((sum, s) => sum + s.value, 0);
  const pct   = Math.round((data.value / total) * 100);
  return (
    <Box sx={{ bgcolor:"#fff", border:"1px solid #e5e7eb", borderRadius:"6px", px:1, py:0.5, boxShadow:"0 2px 6px rgba(0,0,0,0.08)", fontSize:11, fontWeight:700, color:data.payload.color }}>
      {pct}%
    </Box>
  );
};

const statCards = [
  { label:"Inventory Turnover", value:"8.4×",  sub:"vs 7.2× prior year",       iconBg:"#10b981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  { label:"Fill Rate",          value:"97.8%", sub:"↑ 0.4% vs last month",      iconBg:"#2563eb", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
  { label:"Waste / Shrinkage",  value:"$4,820",sub:"↑ $620 due to expiries",    iconBg:"#ef4444", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg> },
  { label:"Stockout Events",    value:"3",     sub:"↑ 1 vs last month",          iconBg:"#f59e0b", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
];

function SectionCard({ title, subtitle, children }) {
  return (
    <Paper elevation={0} sx={{ border:"1px solid #f0f0f0", borderRadius:"12px", boxShadow:"0 1px 2px rgba(0,0,0,0.03)", overflow:"hidden", bgcolor:"#fff" }}>
      <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", px:"20px", py:"10px", borderBottom:"1px solid #f3f4f6", background:"#fafafa" }}>
        <Box>
          <Typography sx={{ fontWeight:700, fontSize:14, color:"#111827", letterSpacing:"0.03em" }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize:10, color:"#9ca3af", mt:0.1 }}>{subtitle}</Typography>}
        </Box>
      </Box>
      <Box sx={{ p:1.5 }}>{children}</Box>
    </Paper>
  );
}

function CustomTooltip({ active, payload, label, prefix="$", suffix="" }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor:"#fff", border:"1px solid #e5e7eb", borderRadius:"6px", px:1, py:0.5, boxShadow:"0 2px 6px rgba(0,0,0,0.08)" }}>
      <Typography sx={{ fontSize:10, fontWeight:700, color:"#6b7280", mb:0.2 }}>{label}</Typography>
      <Typography sx={{ fontSize:12, fontWeight:700, color:"#111827" }}>
        {prefix}{typeof payload[0].value === "number" && prefix === "$" ? payload[0].value.toLocaleString() : payload[0].value}{suffix}
      </Typography>
    </Box>
  );
}

function downloadCSV(filename, headers, rows) {
  const content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type:"text/csv" })); a.download = filename; a.click();
}
function exportInventoryCSV() { downloadCSV("inventory-report.csv", ["Location","Stock Value ($)"], STOCK_BY_LOCATION.map((r) => [r.loc, r.value])); }
function exportPOCSV()        { downloadCSV("po-status-report.csv", ["Status","Count"],             PO_STATUS.map((r) => [r.name, r.value])); }
function exportFullReport() {
  const sections = ["=== MONTHLY SPEND TREND ===","Month,Spend ($)",...MONTHLY_SPEND.map(r=>`${r.month},${r.value}`),"","=== STOCK VALUE BY LOCATION ===","Location,Value ($)",...STOCK_BY_LOCATION.map(r=>`${r.loc},${r.value}`),"","=== ISSUE VOLUME BY DEPARTMENT ===","Department,Issues",...ISSUE_BY_DEPT.map(r=>`${r.dept},${r.value}`),"","=== PO STATUS BREAKDOWN ===","Status,Count",...PO_STATUS.map(r=>`${r.name},${r.value}`)].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([sections], { type:"text/csv" })); a.download = "full-report-fy2026.csv"; a.click();
}

export default function Reports() {
  return (
    <Box sx={{ p: 0.5 }}>
      {/* Title row */}
      <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", mb:"12px" }}>
        <Typography sx={{ fontSize:18, fontWeight:700, color:"#111827" }}>Reports &amp; Analytics</Typography>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<FileDownload sx={{ fontSize:14 }} />} variant="outlined" onClick={exportInventoryCSV} sx={btnOutlined}>
            Inventory
          </Button>
          <Button startIcon={<FileDownload sx={{ fontSize:14 }} />} variant="outlined" onClick={exportPOCSV} sx={btnOutlined}>
            PO CSV
          </Button>
          <Button startIcon={<FileDownload sx={{ fontSize:14 }} />} variant="contained" onClick={exportFullReport} sx={btnPrimary}>
            Full Report
          </Button>
        </Stack>
      </Box>

      {/* Stat Cards - Compact */}
      <Box sx={{ display:"flex", gap:"10px", mb:"12px" }}>
        {statCards.map((s) => (
          <Box key={s.label} sx={{ flex:1, bgcolor:"#fff", border:"1px solid #e5e7eb", borderRadius:"8px", px:1.5, py:1, display:"flex", alignItems:"center", gap:1 }}>
            <Box sx={{ width:34, height:34, borderRadius:"40%", bgcolor:s.iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.icon}</Box>
            <Box sx={{ minWidth:0 }}>
              <Typography sx={{ fontSize:12, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", mb:0.3 }}>{s.label}</Typography>
              <Box sx={{ display:"flex", alignItems:"baseline", gap:0.3, flexWrap:"wrap" }}>
                <Typography sx={{ fontSize: typeof s.value === "string" && s.value.length > 6 ? 14 : 18, fontWeight:700, color:"#111827", lineHeight:1.1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize:9, fontWeight:500, color:"#6b7280" }}>{s.sub}</Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Charts Row 1 - Tighter */}
      <Box sx={{ display:"flex", gap:1.5, mb:1.5, minWidth:0 }}>
        <Box sx={{ flex:"0 0 58%", minWidth:0 }}>
          <SectionCard title="Monthly Spend Trend" subtitle="Sep–Mar 2026">
            <Box sx={{ width:"100%", height:170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_SPEND} margin={{ top:5, right:0, left:-10, bottom:0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize:9, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40000,70000]} ticks={[45000,55000,65000]} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize:8, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={35} />
                  <RTooltip content={<CustomTooltip prefix="$" />} />
                  <Area type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} fill="url(#spendGrad)" dot={{ r:3, fill:"#0EA5E9", strokeWidth:0 }} activeDot={{ r:4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Box>
        <Box sx={{ flex:"1 1 0", minWidth:0 }}>
          <SectionCard title="Stock Value by Location" subtitle="On-hand value ($)">
            <Box sx={{ width:"100%", height:170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STOCK_BY_LOCATION} margin={{ top:5, right:0, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f3f4f6" />
                  <XAxis dataKey="loc" tick={{ fontSize:9, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,3000]} ticks={[1000,2000,3000]} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize:8, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={35} />
                  <RTooltip content={<CustomTooltip prefix="$" />} />
                  <Bar dataKey="value" radius={[3,3,0,0]}>
                    {STOCK_BY_LOCATION.map((_, i) => <Cell key={i} fill={["#7C3AED","#0EA5E9","#6B7280","#16A34A","#F87171","#F59E0B"][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Box>
      </Box>

      {/* Charts Row 2 */}
      <Box sx={{ display:"flex", gap:1.5, minWidth:0 }}>
        <Box sx={{ flex:"0 0 58%", minWidth:0 }}>
          <SectionCard title="Issue Volume by Department" subtitle="Stock issues per dept">
            <Box sx={{ width:"100%", height:170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ISSUE_BY_DEPT} margin={{ top:5, right:0, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f3f4f6" />
                  <XAxis dataKey="dept" tick={{ fontSize:9, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} domain={[0,6]} ticks={[0,2,4,6]} tick={{ fontSize:8, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={20} />
                  <RTooltip content={<CustomTooltip prefix="" suffix=" issues" />} />
                  <Bar dataKey="value" fill="#F59E0B" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Box>
        <Box sx={{ flex:"1 1 0", minWidth:0 }}>
          <SectionCard title="PO Status Breakdown" subtitle="Purchase order distribution">
            <Box sx={{ display:"flex", alignItems:"center", justifyContent:"center", gap:2, height:170 }}>
              <Box sx={{ width:110, height:110, flexShrink:0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PO_STATUS} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {PO_STATUS.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack spacing={0.6}>
                {PO_STATUS.map((s) => (
                  <Box key={s.name} sx={{ display:"flex", alignItems:"center", gap:0.6 }}>
                    <Box sx={{ width:10, height:10, borderRadius:"2px", bgcolor:s.color, flexShrink:0 }} />
                    <Typography sx={{ fontSize:10, color:"#6b7280", fontWeight:400 }}>{s.name}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}