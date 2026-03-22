import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your inventory' },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/transactions': { title: 'Transactions', subtitle: 'Sales and purchase records' },
  '/suppliers': { title: 'Suppliers', subtitle: 'Manage supplier relationships' },
  '/customers': { title: 'Customers', subtitle: 'Customer directory and history' },
  '/reports': { title: 'Reports', subtitle: 'Analytics and insights' },
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'StockFlow', subtitle: '' };
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 28px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{pageInfo.title}</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{pageInfo.subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{timeStr}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dateStr}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: user?.role === 'admin' ? 'var(--accent)' : 'var(--success)',
                marginRight: 4,
              }} />
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
