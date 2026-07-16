import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AddIcon from "@mui/icons-material/Add";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const stockStatusData = [
  { name: "In Stock", value: 68, color: "#22c55e" },
  { name: "Low Stock", value: 22, color: "#f97316" },
  { name: "Out of Stock", value: 10, color: "#ef4444" },
];

const stockByLocation = [
  { location: "Central", value: 4000 },
  { location: "ICU", value: 3500 },
  { location: "Emergency", value: 2800 },
  { location: "Pharmacy", value: 2200 },
  { location: "OR", value: 1800 },
  { location: "Laboratory", value: 1200 },
];

const categoryData = [
  { name: "Pharmaceuticals", value: 4200 },
  { name: "Surgical", value: 3800 },
  { name: "PPE", value: 2500 },
  { name: "Lab", value: 1900 },
  { name: "Equipment", value: 1400 },
  { name: "Wound", value: 900 },
];

const BAR_COLORS = [
  "#6366f1",
  "#a855f7",
  "#f59e0b",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
];

const stockItems = [
  {
    name: "Epinephrine 1mg/mL 10mL Vial",
    location: "CS-01 · Qty: 4 / PAR: 20",
    tags: [{ label: "Low Stock", color: "#f97316", bg: "#fff7ed" }],
  },
  {
    name: "Sodium Chloride 0.9% IV 1L",
    location: "CS-01 · Qty: 12 / PAR: 40",
    tags: [
      { label: "Low Stock", color: "#f97316", bg: "#fff7ed" },
      { label: "Expired", color: "#ef4444", bg: "#fef2f2" },
    ],
  },
  {
    name: "Morphine Sulfate 10mg/mL",
    location: "CS-01 · Qty: 18 / PAR: 10",
    tags: [
      { label: "In Stock", color: "#22c55e", bg: "#f0fdf4" },
      { label: "Expiring", color: "#f59e0b", bg: "#fffbeb" },
    ],
  },
  {
    name: "Epinephrine 1mg/mL 10mL Vial",
    location: "ICU-01 · Qty: 4 / PAR: 10",
    tags: [{ label: "Low Stock", color: "#f97316", bg: "#fff7ed" }],
  },
];

const formatToK = (value) => {
  return `$${(value / 1000).toFixed(1).replace(".0", "")}k`;
};

// ─── Stat Card (shrunken) ────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, accent }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "8px 12px",
        border: "1px solid #f0f0f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>
        {title}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          marginTop: 2,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: accent || "#111827",
          }}
        >
          {value}
        </p>
        {subtitle && (
          <span style={{ fontSize: 10, color: "#6b7280" }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}

// ─── Pending Card (shrunken) ─────────────────────────────────────────────────

function PendingCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "8px 12px",
        border: "1px solid #f0f0f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>
        {title}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          marginTop: 2,
        }}
      >
        <p
          style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}
        >
          {value}
        </p>
        {subtitle && (
          <span style={{ fontSize: 10, color: "#6b7280" }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: 8,
          padding: "8px 12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          fontSize: 13,
          fontWeight: 600,
          color: data.payload.color,
        }}
      >
        {data.value}%
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const navigate = useNavigate();

  return (
    <div>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Inventory Dashboard
          </h1>
        </div>
      </div>

      {/* ── Top KPI Row (shrunken gap) ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <StatCard
          title="Total SKUs"
          value="15"
          subtitle="2,019 units on hand"
        />
        <StatCard
          title="Stock Value"
          value="$3.8K"
          subtitle="At current unit cost"
        />
        <StatCard title="Low Stock" value="2,432" />
        <StatCard
          title="Expiry Alerts"
          value="4"
          subtitle="1 expired · 3 expiring ≤60d"
        />
      </div>

      {/* ── Pending Row (shrunken gap) ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <PendingCard
          title="Pending POs"
          value="1"
          subtitle="Awaiting approval"
        />
        <PendingCard
          title="Pending Transfers"
          value="1"
          subtitle="Awaiting approval"
        />
        <PendingCard
          title="Pending Issues"
          value="1"
          subtitle="Awaiting approval"
        />
        <PendingCard
          title="Open Replacements"
          value="1"
          subtitle="Awaiting approval"
        />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {/* Stock Status Donut (slightly smaller inner padding) */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 20px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            flex: 1,
            overflow: "visible",
            minHeight: 220,
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontWeight: 600,
              fontSize: 14,
              color: "#111827",
            }}
          >
            Stock Status
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <PieChart width={160} height={160}>
              <Pie
                data={stockStatusData}
                cx={80}
                cy={80}
                innerRadius={52}
                outerRadius={68}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                labelLine={false}
              >
                {stockStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <text
                x={80}
                y={72}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 22, fontWeight: 700, fill: "#111827" }}
              >
                3,986
              </text>
              <text
                x={80}
                y={92}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
              >
                PRODUCTS
              </text>
            </PieChart>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stockStatusData.map((s) => (
                <div
                  key={s.name}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    style={{
                      width: 80,
                      height: 26,
                      borderRadius: 5,
                      background: s.color,
                      fontSize: 10,
                      color: "#fff",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {s.name === "In Stock"
                      ? "IN STOCK"
                      : s.name === "Low Stock"
                        ? "LOW STOCK"
                        : "OUT OF STOCK"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Value by Location (reduced chart height) */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 20px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            flex: 2,
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontWeight: 600,
              fontSize: 14,
              color: "#111827",
            }}
          >
            Stock Value by Location
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={stockByLocation}
              barSize={16}
              margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="location"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 4500]}
                interval={0}
                ticks={[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000]}
                tickFormatter={(value) =>
                  `$${(value / 1000).toFixed(1).replace(".0", "")}k`
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: 12,
                }}
                formatter={(value) => [formatToK(value), "Value"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stockByLocation.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Row (reduced heights and padding) ── */}
      <div style={{ display: "flex", gap: 16 }}>
        {/* Category Distribution (reduced chart height) */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 20px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            flex: 2,
            minHeight: 210,
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontWeight: 600,
              fontSize: 14,
              color: "#111827",
            }}
          >
            Category Distribution
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={categoryData}
              barSize={16}
              margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 4500]}
                interval={0}
                ticks={[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000]}
                tickFormatter={(value) =>
                  `$${(value / 1000).toFixed(1).replace(".0", "")}k`
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: 12,
                }}
                formatter={(value) => [formatToK(value), "Value"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Status List (reduced padding, tighter items) */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 20px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            flex: 1,
            minWidth: 260,
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontWeight: 600,
              fontSize: 14,
              color: "#111827",
            }}
          >
            Stock Status
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stockItems.map((item, i) => (
              <div
                key={i}
                style={{
                  paddingBottom: i < stockItems.length - 1 ? 12 : 0,
                  borderBottom:
                    i < stockItems.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#111827",
                      flex: 1,
                    }}
                  >
                    {item.name}
                  </p>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {item.tags.map((tag) => (
                      <span
                        key={tag.label}
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: tag.color,
                          background: tag.bg,
                          borderRadius: 4,
                          padding: "2px 6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
                <p
                  style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}
                >
                  {item.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
