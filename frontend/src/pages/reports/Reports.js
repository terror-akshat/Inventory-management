import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../services/api";

const COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: p.color || "var(--accent)",
          }}
        >
          {p.name}:{" "}
          {typeof p.value === "number" ?
            `$${p.value.toLocaleString()}`
          : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [salesData, setSalesData] = useState({ salesData: [], summary: {} });
  const [stockData, setStockData] = useState({
    products: [],
    categoryStats: [],
  });
  const [lowStockData, setLowStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    groupBy: "day",
  });

  const fetchReport = useCallback(
    async (tab) => {
      setLoading(true);
      try {
        if (tab === "sales") {
          const { data } = await api.get("/reports/sales", {
            params: dateRange,
          });
          setSalesData(data);
        } else if (tab === "stock") {
          const { data } = await api.get("/reports/stock");
          setStockData(data);
        } else if (tab === "lowstock") {
          const { data } = await api.get("/reports/low-stock");
          setLowStockData(data.products || []);
        }
      } catch {
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    },
    [dateRange],
  ); // 👈 IMPORTANT

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const tabs = [
    { key: "sales", label: "◈ Sales Report" },
    { key: "stock", label: "◫ Stock Report" },
    { key: "lowstock", label: "⚠ Low Stock" },
  ];

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const chartSales = salesData.salesData.map((d) => ({
    name:
      dateRange.groupBy === "month" ?
        `${months[d._id.month - 1]} ${d._id.year}`
      : `${d._id.day}/${d._id.month}`,
    revenue: d.totalRevenue,
    orders: d.count,
  }));

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [
      keys.join(","),
      ...data.map((row) =>
        keys.map((k) => JSON.stringify(row[k] ?? "")).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-subtitle">
            Insights into your inventory performance
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          background: "var(--bg-surface)",
          padding: 6,
          borderRadius: "var(--radius-sm)",
          width: "fit-content",
          border: "1px solid var(--border)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s",
              background: activeTab === t.key ? "var(--accent)" : "transparent",
              color: activeTab === t.key ? "#fff" : "var(--text-secondary)",
              boxShadow:
                activeTab === t.key ? "0 0 12px var(--accent-glow)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ?
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      : <>
          {/* SALES */}
          {activeTab === "sales" && (
            <div>
              <div className="filters-row" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">From</label>
                  <input
                    className="form-input"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((d) => ({ ...d, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <input
                    className="form-input"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((d) => ({ ...d, endDate: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Group By</label>
                  <select
                    className="form-select"
                    value={dateRange.groupBy}
                    onChange={(e) =>
                      setDateRange((d) => ({ ...d, groupBy: e.target.value }))
                    }
                  >
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 22 }}
                  onClick={() => fetchReport("sales")}
                >
                  Apply
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 22 }}
                  onClick={() => exportCSV(chartSales, "sales-report.csv")}
                >
                  ⤓ Export CSV
                </button>
              </div>

              {/* Summary cards */}
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                  {
                    label: "Total Revenue",
                    value: `$${(salesData.summary.totalRevenue || 0).toLocaleString()}`,
                    color: "var(--success)",
                  },
                  {
                    label: "Total Orders",
                    value: salesData.summary.totalOrders || 0,
                    color: "var(--accent)",
                  },
                  {
                    label: "Avg Order Value",
                    value: `$${(salesData.summary.avgOrder || 0).toFixed(2)}`,
                    color: "var(--purple)",
                  },
                ].map((s) => (
                  <div
                    className="card"
                    key={s.label}
                    style={{ borderTop: `3px solid ${s.color}` }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        marginTop: 8,
                        color: s.color,
                      }}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                }}
              >
                <div className="card">
                  <h3
                    style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}
                  >
                    Revenue Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartSales}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      />
                      <YAxis
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3
                    style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}
                  >
                    Orders Per Period
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartSales}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      />
                      <YAxis
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="orders"
                        name="Orders"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* STOCK */}
          {activeTab === "stock" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 16,
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    exportCSV(
                      stockData.products.map((p) => ({
                        name: p.name,
                        sku: p.sku,
                        category: p.category,
                        quantity: p.quantity,
                        price: p.price,
                      })),
                      "stock-report.csv",
                    )
                  }
                >
                  ⤓ Export CSV
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <div className="card">
                  <h3
                    style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}
                  >
                    Stock by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={stockData.categoryStats}
                        dataKey="totalQuantity"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ _id, percent }) =>
                          `${_id} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {stockData.categoryStats.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3
                    style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}
                  >
                    Stock Value by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stockData.categoryStats} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      />
                      <YAxis
                        dataKey="_id"
                        type="category"
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="totalValue"
                        name="Value"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.products.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>
                          <code
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {p.sku}
                          </code>
                        </td>
                        <td>
                          <span className="badge badge-info">{p.category}</span>
                        </td>
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                          }}
                        >
                          {p.quantity}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>
                          ${p.price}
                        </td>
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: "var(--success)",
                          }}
                        >
                          ${(p.quantity * p.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LOW STOCK */}
          {activeTab === "lowstock" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div
                  className="alert alert-warning"
                  style={{ flex: 1, marginRight: 16 }}
                >
                  ⚠ {lowStockData.length} products require restocking attention.
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    exportCSV(
                      lowStockData.map((p) => ({
                        name: p.name,
                        sku: p.sku,
                        quantity: p.quantity,
                        threshold: p.lowStockThreshold,
                        supplier: p.supplier?.name,
                      })),
                      "low-stock.csv",
                    )
                  }
                >
                  ⤓ Export CSV
                </button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Current Qty</th>
                      <th>Min Threshold</th>
                      <th>Shortage</th>
                      <th>Supplier</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockData.length === 0 ?
                      <tr>
                        <td
                          colSpan={7}
                          style={{ textAlign: "center", padding: 40 }}
                        >
                          <span
                            className="badge badge-success"
                            style={{ fontSize: 14 }}
                          >
                            ✓ All products are well stocked
                          </span>
                        </td>
                      </tr>
                    : lowStockData.map((p) => (
                        <tr key={p._id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>
                            <code
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                                color: "var(--text-secondary)",
                              }}
                            >
                              {p.sku}
                            </code>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 800,
                                color:
                                  p.quantity === 0 ?
                                    "var(--danger)"
                                  : "var(--warning)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {p.quantity}
                            </span>
                          </td>
                          <td
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {p.lowStockThreshold}
                          </td>
                          <td>
                            <span className="badge badge-danger">
                              -{Math.max(0, p.lowStockThreshold - p.quantity)}
                            </span>
                          </td>
                          <td style={{ fontSize: 13 }}>
                            {p.supplier?.name || "—"}
                          </td>
                          <td style={{ fontSize: 12, color: "var(--accent)" }}>
                            {p.supplier?.phone || p.supplier?.email || "—"}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      }
    </div>
  );
}
