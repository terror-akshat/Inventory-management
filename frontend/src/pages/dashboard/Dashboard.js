import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 900, marginTop: 6, letterSpacing: '-0.03em' }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</p>}
      </div>
      <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 14, fontWeight: 700, color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><p>Failed to load dashboard.</p></div>;

  const { stats, lowStockProducts, recentTransactions, topProducts, chartData } = data;

  // Process chart data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartMap = {};
  (chartData || []).forEach(d => {
    const key = `${months[d._id.month - 1]} ${d._id.year}`;
    if (!chartMap[key]) chartMap[key] = { name: key, sales: 0, purchases: 0 };
    if (d._id.type === 'sale') chartMap[key].sales = Math.round(d.total);
    else chartMap[key].purchases = Math.round(d.total);
  });
  const chartArr = Object.values(chartMap);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Products" value={stats.totalProducts} icon="◫" color="var(--accent)" sub={`Stock value: $${(stats.totalStockValue || 0).toLocaleString()}`} />
        <StatCard label="Monthly Revenue" value={`$${(stats.monthlyRevenue || 0).toLocaleString()}`} icon="◈" color="var(--success)" sub={`${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}% vs last month`} />
        <StatCard label="Low Stock Items" value={stats.lowStockCount} icon="⚠" color="var(--warning)" sub="Needs restocking" />
        <StatCard label="Total Customers" value={stats.totalCustomers} icon="◎" color="var(--purple)" sub={`${stats.totalSuppliers} suppliers`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 15 }}>Revenue vs Purchases</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartArr}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="purchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" name="Revenue" stroke="#3b82f6" fill="url(#sales)" strokeWidth={2} />
              <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#8b5cf6" fill="url(#purchases)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 15 }}>Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalSold" name="Units Sold" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Low Stock Alert */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>⚠ Low Stock Alert</h3>
            <Link to="/products?lowStock=true" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>View all →</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>All stock levels are fine ✓</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.sku}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: p.quantity === 0 ? 'var(--danger)' : 'var(--warning)' }}>{p.quantity}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {p.lowStockThreshold} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Recent Transactions</h3>
            <Link to="/transactions" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>View all →</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>No transactions yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentTransactions.map(t => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${t.type === 'sale' ? 'badge-success' : 'badge-purple'}`}>{t.type}</span>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{t.customer?.name || t.supplier?.name || '—'}</p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: t.type === 'sale' ? 'var(--success)' : 'var(--text-primary)' }}>
                    {t.type === 'sale' ? '+' : '-'}${t.totalAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
