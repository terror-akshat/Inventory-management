import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', email: '', phone: '', contactPerson: '', notes: '', address: { street: '', city: '', state: '', country: '', zipCode: '' } };

export default function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchSuppliers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/suppliers', { params: { page, limit: 10, search: search || undefined } });
      setSuppliers(data.suppliers);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openAdd = () => { setForm(emptyForm); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (s) => { setForm({ ...emptyForm, ...s, address: { ...emptyForm.address, ...(s.address || {}) } }); setModal({ open: true, mode: 'edit', data: s }); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'add') { await api.post('/suppliers', form); toast.success('Supplier added!'); }
      else { await api.put(`/suppliers/${modal.data._id}`, form); toast.success('Supplier updated!'); }
      setModal({ open: false }); fetchSuppliers(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/suppliers/${deleteId}`); toast.success('Supplier deleted'); setDeleteId(null); fetchSuppliers(pagination.page); }
    catch { toast.error('Failed to delete'); }
  };

  const setAddr = (key, val) => setForm(f => ({ ...f, address: { ...f.address, [key]: val } }));

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Suppliers</h2><p className="page-subtitle">{pagination.total} suppliers</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add Supplier</button>}
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input className="form-input" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>City</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No suppliers found</td></tr>
              ) : suppliers.map(s => (
                <tr key={s._id}>
                  <td><p style={{ fontWeight: 600 }}>{s.name}</p></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.contactPerson || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.email || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.phone || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.address?.city || '—'}</td>
                  {isAdmin && (
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(s._id)}>Del</button>
                    </div></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {suppliers.length} of {pagination.total}</span>
          <button className="page-btn" disabled={pagination.page === 1} onClick={() => fetchSuppliers(pagination.page - 1)}>‹ Prev</button>
          <button className="page-btn" disabled={pagination.page === pagination.pages} onClick={() => fetchSuppliers(pagination.page + 1)}>Next ›</button>
        </div>
      )}

      {modal.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal({ open: false })}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal.mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h3>
              <button className="modal-close" onClick={() => setModal({ open: false })}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width"><label className="form-label">Company Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group full-width"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.address.city} onChange={e => setAddr('city', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Country</label><input className="form-input" value={form.address.country} onChange={e => setAddr('country', e.target.value)} /></div>
                  <div className="form-group full-width"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3 className="modal-title">Confirm Delete</h3></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>Delete this supplier? This action cannot be undone.</p></div>
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
