import React, { useState, useEffect, useCallback } from 'react';
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
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ fontSize: 14, fontWeight: 700, color: entry.color || 'var(--accent)' }}>
          {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState({ salesData: [], summary: {} });
  const [stockData, setStockData] = useState({ products: [], categoryStats: [] });
  const [lowStockData, setLowStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    groupBy: 'day',
  });

  const fetchReport = useCallback(async (tab) => {
    setLoading(true);
    try {
      if (tab === 'sales') {
        const { data } = await api.get('/reports/sales', { params: dateRange });
        setSalesData(data);
      } else if (tab === 'stock') {
        const { data } = await api.get('/reports/stock');
        setStockData(data);
      } else if (tab === 'lowstock') {
        const { data } = await api.get('/reports/low-stock');
        setLowStockData(data.products || []);
      }
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const tabs = [
    { key: 'sales', label: 'Sales Report' },
    { key: 'stock', label: 'Stock Report' },
    { key: 'lowstock', label: 'Low Stock' },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartSales = salesData.salesData.map((entry) => ({
    name: dateRange.groupBy === 'month' ? `${months[entry._id.month - 1]} ${entry._id.year}` : `${entry._id.day}/${entry._id.month}`,
    revenue: entry.totalRevenue,
    orders: entry.count,
  }));

  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports and Analytics</h2>
          <p className="page-subtitle">Insights into your inventory performance</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-surface)', padding: 6, borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s',
              background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.key ? '0 0 12px var(--accent-glow)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <>
          {activeTab === 'sales' && (
            <div>
              <div className="filters-row" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">From</label>
                  <input className="form-input" type="date" value={dateRange.startDate} onChange={(event) => setDateRange((current) => ({ ...current, startDate: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <input className="form-input" type="date" value={dateRange.endDate} onChange={(event) => setDateRange((current) => ({ ...current, endDate: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Group By</label>
                  <select className="form-select" value={dateRange.groupBy} onChange={(event) => setDateRange((current) => ({ ...current, groupBy: event.target.value }))}>
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                  </select>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 22 }} onClick={() => fetchReport('sales')}>Apply</button>
                <button className="btn btn-secondary" style={{ marginTop: 22 }} onClick={() => exportCSV(chartSales, 'sales-report.csv')}>Export CSV</button>
              </div>

              <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                  { label: 'Total Revenue', value: formatCurrency(salesData.summary.totalRevenue || 0), color: 'var(--success)' },
                  { label: 'Total Orders', value: salesData.summary.totalOrders || 0, color: 'var(--accent)' },
                  { label: 'Avg Order Value', value: formatCurrency(salesData.summary.avgOrder || 0), color: 'var(--purple)' },
                ].map((summary) => (
                  <div className="card" key={summary.label} style={{ borderTop: `3px solid ${summary.color}` }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{summary.label}</p>
                    <p style={{ fontSize: 26, fontWeight: 900, marginTop: 8, color: summary.color }}>{summary.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Revenue Over Time</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartSales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Orders Per Period</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartSales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn-secondary" onClick={() => exportCSV(stockData.products.map((product) => ({ name: product.name, sku: product.sku, category: product.category, quantity: product.quantity, price: product.price })), 'stock-report.csv')}>Export CSV</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Stock by Category</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={stockData.categoryStats} dataKey="totalQuantity" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                        {stockData.categoryStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Stock Value by Category</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stockData.categoryStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis dataKey="_id" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={90} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="totalValue" name="Value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
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
                    {stockData.products.map((product) => (
                      <tr key={product._id}>
                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                        <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{product.sku}</code></td>
                        <td><span className="badge badge-info">{product.category}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{product.quantity}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(product.price)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(product.quantity * product.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lowstock' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="alert alert-warning" style={{ flex: 1, marginRight: 16 }}>
                  {lowStockData.length} products require restocking attention.
                </div>
                <button className="btn btn-secondary" onClick={() => exportCSV(lowStockData.map((product) => ({ name: product.name, sku: product.sku, quantity: product.quantity, threshold: product.lowStockThreshold, supplier: product.supplier?.name })), 'low-stock.csv')}>Export CSV</button>
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
                    {lowStockData.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                          <span className="badge badge-success" style={{ fontSize: 14 }}>All products are well stocked</span>
                        </td>
                      </tr>
                    ) : lowStockData.map((product) => (
                      <tr key={product._id}>
                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                        <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{product.sku}</code></td>
                        <td><span style={{ fontWeight: 800, color: product.quantity === 0 ? 'var(--danger)' : 'var(--warning)', fontFamily: 'var(--font-mono)' }}>{product.quantity}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{product.lowStockThreshold}</td>
                        <td><span className="badge badge-danger">-{Math.max(0, product.lowStockThreshold - product.quantity)}</span></td>
                        <td style={{ fontSize: 13 }}>{product.supplier?.name || '-'}</td>
                        <td style={{ fontSize: 12, color: 'var(--accent)' }}>{product.supplier?.phone || product.supplier?.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
