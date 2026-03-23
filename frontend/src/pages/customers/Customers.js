import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';

const emptyForm = { name: '', email: '', phone: '', notes: '', address: { street: '', city: '', state: '', country: '' } };

export default function Customers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers', { params: { page, limit: 10, search: search || undefined } });
      setCustomers(data.customers);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'add', data: null });
  };

  const openEdit = (customer) => {
    setForm({ ...emptyForm, ...customer, address: { ...emptyForm.address, ...(customer.address || {}) } });
    setModal({ open: true, mode: 'edit', data: customer });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/customers', form);
        toast.success('Customer added');
      } else {
        await api.put(`/customers/${modal.data._id}`, form);
        toast.success('Customer updated');
      }
      setModal({ open: false });
      fetchCustomers(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${deleteId}`);
      toast.success('Customer deleted');
      setDeleteId(null);
      fetchCustomers(pagination.page);
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const setAddressField = (key, value) => setForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Customers</h2><p className="page-subtitle">{pagination.total} customers</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <span className="search-icon">Search</span>
          <input className="form-input" placeholder="Search customers..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Total Spent</th><th>Purchases</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No customers found</td></tr>
              ) : customers.map((customer) => (
                <tr key={customer._id}>
                  <td><p style={{ fontWeight: 600 }}>{customer.name}</p></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{customer.email || '-'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{customer.phone || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{customer.address?.city || '-'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(customer.totalSpent || 0)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{customer.totalPurchases || 0}</td>
                  {isAdmin && (
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(customer)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(customer._id)}>Delete</button>
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
          <span className="pagination-info">Showing {customers.length} of {pagination.total}</span>
          <button className="page-btn" disabled={pagination.page === 1} onClick={() => fetchCustomers(pagination.page - 1)}>Prev</button>
          <button className="page-btn" disabled={pagination.page === pagination.pages} onClick={() => fetchCustomers(pagination.page + 1)}>Next</button>
        </div>
      )}

      {modal.open && (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setModal({ open: false })}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal.mode === 'add' ? 'Add Customer' : 'Edit Customer'}</h3>
              <button className="modal-close" onClick={() => setModal({ open: false })}>x</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
                  <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.address.city} onChange={(event) => setAddressField('city', event.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Country</label><input className="form-input" value={form.address.country} onChange={(event) => setAddressField('country', event.target.value)} /></div>
                  <div className="form-group full-width"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
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
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>Delete this customer? This cannot be undone.</p></div>
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
