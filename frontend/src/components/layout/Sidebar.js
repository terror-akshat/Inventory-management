import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/dashboard', icon: '▦', label: 'Dashboard' },
  { path: '/products', icon: '◫', label: 'Products' },
  { path: '/transactions', icon: '⇄', label: 'Transactions' },
  { path: '/suppliers', icon: '◉', label: 'Suppliers' },
  { path: '/customers', icon: '◎', label: 'Customers' },
  { path: '/reports', icon: '◈', label: 'Reports' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: collapsed ? 68 : 240,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      flexShrink: 0, position: 'relative', zIndex: 10
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        justifyContent: collapsed ? 'center' : 'flex-start'
      }}>
        <div style={{
          width: 36, height: 36, background: 'var(--accent)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 20px var(--accent-glow)'
        }}>S</div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>StockFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Inventory System</div>
          </div>
        )}
      </div>

      {/* Toggle btn */}
      <button onClick={() => setCollapsed(!collapsed)} style={{
        position: 'absolute', right: -12, top: 72,
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        color: 'var(--text-secondary)', fontSize: 12, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--transition)', zIndex: 20,
      }}>{collapsed ? '›' : '‹'}</button>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV.map(item => (
          <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '11px 0' : '11px 18px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            margin: '2px 8px', borderRadius: 'var(--radius-sm)',
            color: isActive ? '#fff' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent)' : 'transparent',
            fontWeight: 600, fontSize: 14,
            transition: 'all var(--transition)',
            boxShadow: isActive ? '0 0 14px var(--accent-glow)' : 'none',
          })}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 16px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-hover)', marginBottom: 8
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
            }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={{
          width: '100%', padding: collapsed ? '10px 0' : '9px 12px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-sm)', color: 'var(--danger)',
          fontSize: 13, fontWeight: 600, display: 'flex',
          alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all var(--transition)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        >
          <span style={{ fontSize: 16 }}>⎋</span>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
