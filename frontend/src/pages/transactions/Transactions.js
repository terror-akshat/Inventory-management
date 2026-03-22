import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const emptyForm = { type: 'sale', items: [{ product: '', quantity: 1, unitPrice: '' }], customer: '', supplier: '', notes: '' };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    api.get('/products', { params: { limit: 200 } }).then(r => setProducts(r.data.products || []));
    api.get('/customers', { params: { limit: 200 } }).then(r => setCustomers(r.data.customers || []));
    api.get('/suppliers', { params: { limit: 200 } }).then(r => setSuppliers(r.data.suppliers || []));
  }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product: '', quantity: 1, unitPrice: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [key]: val };
    if (key === 'product') {
      const prod = products.find(p => p._id === val);
      if (prod) items[i].unitPrice = form.type === 'sale' ? prod.price : prod.costPrice;
    }
    setForm(f => ({ ...f, items }));
  };

  const total = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.items.some(i => !i.product || !i.quantity)) { toast.error('Fill all item fields'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        items: form.items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        customer: form.customer || undefined,
        supplier: form.supplier || undefined,
      };
      await api.post('/transactions', payload);
      toast.success('Transaction recorded!');
      setShowModal(false);
      setForm(emptyForm);
      fetchTransactions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const f = (key, val) => setFilters(p => ({ ...p, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Transactions</h2><p className="page-subtitle">{pagination.total} total records</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true); }}>+ New Transaction</button>
      </div>

      <div className="filters-row">
        <select className="form-select" style={{ width: 160 }} value={filters.type} onChange={e => f('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="sale">Sales</option>
          <option value="purchase">Purchases</option>
        </select>
        <input className="form-input" type="date" value={filters.startDate} onChange={e => f('startDate', e.target.value)} style={{ width: 160 }} />
        <input className="form-input" type="date" value={filters.endDate} onChange={e => f('endDate', e.target.value)} style={{ width: 160 }} />
        <button className="btn btn-secondary" onClick={() => setFilters({ type: '', startDate: '', endDate: '' })}>Clear</button>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Transaction ID</th><th>Type</th><th>Party</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions found</td></tr>
              ) : transactions.map(t => (
                <tr key={t._id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{t.transactionId}</code></td>
                  <td><span className={`badge ${t.type === 'sale' ? 'badge-success' : 'badge-purple'}`}>{t.type}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.customer?.name || t.supplier?.name || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{t.items?.length || 0} item(s)</td>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: t.type === 'sale' ? 'var(--success)' : 'var(--text-primary)' }}>
                    {t.type === 'sale' ? '+' : '-'}${t.totalAmount.toLocaleString()}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td><span className={`badge ${t.status === 'completed' ? 'badge-success' : t.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {transactions.length} of {pagination.total}</span>
          <button className="page-btn" disabled={pagination.page === 1} onClick={() => fetchTransactions(pagination.page - 1)}>‹ Prev</button>
          <button className="page-btn" disabled={pagination.page === pagination.pages} onClick={() => fetchTransactions(pagination.page + 1)}>Next ›</button>
        </div>
      )}

      {/* New Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 className="modal-title">New Transaction</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, customer: '', supplier: '' })}>
                      <option value="sale">Sale (Stock Out)</option>
                      <option value="purchase">Purchase (Stock In)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{form.type === 'sale' ? 'Customer' : 'Supplier'}</label>
                    {form.type === 'sale' ? (
                      <select className="form-select" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    ) : (
                      <select className="form-select" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label">Items *</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.items.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px auto', gap: 8, alignItems: 'center' }}>
                        <select className="form-select" value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name} (Qty: {p.quantity})</option>)}
                        </select>
                        <input className="form-input" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                        <input className="form-input" type="number" step="0.01" placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                        {form.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>×</button>}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Amount</span>
                  <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>${total.toFixed(2)}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Processing...' : 'Record Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
