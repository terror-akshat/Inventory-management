import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', category: '', quantity: '', price: '', costPrice: '', supplier: '', lowStockThreshold: 10, description: '', unit: 'pcs', sku: '', expiryDate: '' };

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', category: '', lowStock: '', sort: '-createdAt' });
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/suppliers', { params: { limit: 100 } }).then(r => setSuppliers(r.data.suppliers || []));
    api.get('/products/categories').then(r => setCategories(r.data.categories || []));
  }, []);

  const openAdd = () => { setForm(emptyForm); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (p) => {
    setForm({ ...emptyForm, ...p, supplier: p.supplier?._id || '', expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : '' });
    setModal({ open: true, mode: 'edit', data: p });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.supplier) delete payload.supplier;
      if (!payload.expiryDate) delete payload.expiryDate;
      if (modal.mode === 'add') {
        await api.post('/products', payload);
        toast.success('Product created!');
      } else {
        await api.put(`/products/${modal.data._id}`, payload);
        toast.success('Product updated!');
      }
      setModal({ open: false });
      fetchProducts(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts(pagination.page);
    } catch { toast.error('Failed to delete'); }
  };

  const f = (key, val) => setFilters(p => ({ ...p, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">{pagination.total} total products</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input className="form-input" placeholder="Search products..." value={filters.search} onChange={e => f('search', e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filters.category} onChange={e => f('category', e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={filters.lowStock} onChange={e => f('lowStock', e.target.value)}>
          <option value="">All Stock</option>
          <option value="true">Low Stock</option>
        </select>
        <select className="form-select" style={{ width: 160 }} value={filters.sort} onChange={e => f('sort', e.target.value)}>
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="name">Name A-Z</option>
          <option value="quantity">Qty Low-High</option>
          <option value="-quantity">Qty High-Low</option>
          <option value="price">Price Low-High</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th><th>SKU</th><th>Category</th>
                <th>Qty</th><th>Price</th><th>Supplier</th><th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No products found</td></tr>
              ) : products.map(p => {
                const isLow = p.quantity <= p.lowStockThreshold;
                return (
                  <tr key={p._id}>
                    <td>
                      <p style={{ fontWeight: 600 }}>{p.name}</p>
                      {p.expiryDate && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Exp: {new Date(p.expiryDate).toLocaleDateString()}</p>}
                    </td>
                    <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{p.sku}</code></td>
                    <td><span className="badge badge-info">{p.category}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: isLow ? 'var(--warning)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {p.quantity} {p.unit}
                      </span>
                      {isLow && <p style={{ fontSize: 11, color: 'var(--warning)' }}>⚠ Low</p>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${p.price}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.supplier?.name || '—'}</td>
                    <td><span className={`badge ${p.quantity === 0 ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>{p.quantity === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p._id)}>Del</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {products.length} of {pagination.total}</span>
          <button className="page-btn" disabled={pagination.page === 1} onClick={() => fetchProducts(pagination.page - 1)}>‹ Prev</button>
          {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
            const pg = i + 1;
            return <button key={pg} className={`page-btn ${pagination.page === pg ? 'active' : ''}`} onClick={() => fetchProducts(pg)}>{pg}</button>;
          })}
          <button className="page-btn" disabled={pagination.page === pagination.pages} onClick={() => fetchProducts(pagination.page + 1)}>Next ›</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal({ open: false })}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">{modal.mode === 'add' ? 'Add Product' : 'Edit Product'}</h3>
              <button className="modal-close" onClick={() => setModal({ open: false })}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Category *</label>
                    <input className="form-input" list="cat-list" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required />
                    <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div className="form-group"><label className="form-label">Quantity *</label><input className="form-input" type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Unit</label><input className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="pcs" /></div>
                  <div className="form-group"><label className="form-label">Selling Price *</label><input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Cost Price</label><input className="form-input" type="number" step="0.01" min="0" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Low Stock Threshold</label><input className="form-input" type="number" min="0" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Expiry Date</label><input className="form-input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
                  <div className="form-group full-width"><label className="form-label">Supplier</label>
                    <select className="form-select" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                      <option value="">No Supplier</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group full-width"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'add' ? 'Create Product' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3 className="modal-title">Confirm Delete</h3></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this product? This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
