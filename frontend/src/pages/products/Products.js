import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';

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
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/suppliers', { params: { limit: 100 } }).then((response) => setSuppliers(response.data.suppliers || []));
    api.get('/products/categories').then((response) => setCategories(response.data.categories || []));
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'add', data: null });
  };

  const openEdit = (product) => {
    setForm({
      ...emptyForm,
      ...product,
      supplier: product.supplier?._id || '',
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
    });
    setModal({ open: true, mode: 'edit', data: product });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.supplier) delete payload.supplier;
      if (!payload.expiryDate) delete payload.expiryDate;

      if (modal.mode === 'add') {
        await api.post('/products', payload);
        toast.success('Product created');
      } else {
        await api.put(`/products/${modal.data._id}`, payload);
        toast.success('Product updated');
      }

      setModal({ open: false });
      fetchProducts(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts(pagination.page);
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">{pagination.total} total products</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <span className="search-icon">Search</span>
          <input className="form-input" placeholder="Search products..." value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
          <option value="">All Categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={filters.lowStock} onChange={(event) => updateFilter('lowStock', event.target.value)}>
          <option value="">All Stock</option>
          <option value="true">Low Stock</option>
        </select>
        <select className="form-select" style={{ width: 160 }} value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="name">Name A-Z</option>
          <option value="quantity">Qty Low-High</option>
          <option value="-quantity">Qty High-Low</option>
          <option value="price">Price Low-High</option>
        </select>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Supplier</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No products found</td></tr>
              ) : products.map((product) => {
                const isLow = product.quantity <= product.lowStockThreshold;
                return (
                  <tr key={product._id}>
                    <td>
                      <p style={{ fontWeight: 600 }}>{product.name}</p>
                      {product.expiryDate && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Exp: {new Date(product.expiryDate).toLocaleDateString()}</p>}
                    </td>
                    <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{product.sku}</code></td>
                    <td><span className="badge badge-info">{product.category}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: isLow ? 'var(--warning)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {product.quantity} {product.unit}
                      </span>
                      {isLow && <p style={{ fontSize: 11, color: 'var(--warning)' }}>Low stock</p>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{product.supplier?.name || '-'}</td>
                    <td><span className={`badge ${product.quantity === 0 ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>{product.quantity === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(product)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(product._id)}>Delete</button>
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

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {products.length} of {pagination.total}</span>
          <button className="page-btn" disabled={pagination.page === 1} onClick={() => fetchProducts(pagination.page - 1)}>Prev</button>
          {[...Array(Math.min(pagination.pages, 5))].map((_, index) => {
            const pageNumber = index + 1;
            return <button key={pageNumber} className={`page-btn ${pagination.page === pageNumber ? 'active' : ''}`} onClick={() => fetchProducts(pageNumber)}>{pageNumber}</button>;
          })}
          <button className="page-btn" disabled={pagination.page === pagination.pages} onClick={() => fetchProducts(pagination.page + 1)}>Next</button>
        </div>
      )}

      {modal.open && (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setModal({ open: false })}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">{modal.mode === 'add' ? 'Add Product' : 'Edit Product'}</h3>
              <button className="modal-close" onClick={() => setModal({ open: false })}>x</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Category *</label>
                    <input className="form-input" list="cat-list" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
                    <datalist id="cat-list">{categories.map((category) => <option key={category} value={category} />)}</datalist>
                  </div>
                  <div className="form-group"><label className="form-label">Quantity *</label><input className="form-input" type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Unit</label><input className="form-input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="pcs" /></div>
                  <div className="form-group"><label className="form-label">Selling Price (INR) *</label><input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Cost Price (INR)</label><input className="form-input" type="number" step="0.01" min="0" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Low Stock Threshold</label><input className="form-input" type="number" min="0" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Expiry Date</label><input className="form-input" type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} /></div>
                  <div className="form-group full-width"><label className="form-label">Supplier</label>
                    <select className="form-select" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })}>
                      <option value="">No Supplier</option>
                      {suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group full-width"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
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
