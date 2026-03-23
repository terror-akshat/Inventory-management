import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';

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
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    api.get('/products', { params: { limit: 200 } }).then((response) => setProducts(response.data.products || []));
    api.get('/customers', { params: { limit: 200 } }).then((response) => setCustomers(response.data.customers || []));
    api.get('/suppliers', { params: { limit: 200 } }).then((response) => setSuppliers(response.data.suppliers || []));
  }, []);

  const addItem = () => setForm((current) => ({ ...current, items: [...current.items, { product: '', quantity: 1, unitPrice: '' }] }));
  const removeItem = (index) => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));

  const updateItem = (index, key, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [key]: value };

    if (key === 'product') {
      const product = products.find((entry) => entry._id === value);
      if (product) items[index].unitPrice = form.type === 'sale' ? product.price : product.costPrice;
    }

    setForm((current) => ({ ...current, items }));
  };

  const total = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0);

  const handleSave = async (event) => {
    event.preventDefault();
    if (form.items.some((item) => !item.product || !item.quantity)) {
      toast.error('Fill all item fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        items: form.items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
        customer: form.customer || undefined,
        supplier: form.supplier || undefined,
      };
      await api.post('/transactions', payload);
      toast.success('Transaction recorded');
      setShowModal(false);
      setForm(emptyForm);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Transactions</h2><p className="page-subtitle">{pagination.total} total records</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true); }}>+ New Transaction</button>
      </div>

      <div className="filters-row">
        <select className="form-select" style={{ width: 160 }} value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
          <option value="">All Types</option>
          <option value="sale">Sales</option>
          <option value="purchase">Purchases</option>
        </select>
        <input className="form-input" type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} style={{ width: 160 }} />
        <input className="form-input" type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} style={{ width: 160 }} />
        <button className="btn btn-secondary" onClick={() => setFilters({ type: '', startDate: '', endDate: '' })}>Clear</button>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Transaction ID</th><th>Type</th><th>Party</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions found</td></tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{transaction.transactionId}</code></td>
                  <td><span className={`badge ${transaction.type === 'sale' ? 'badge-success' : 'badge-purple'}`}>{transaction.type}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{transaction.customer?.name || transaction.supplier?.name || '-'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{transaction.items?.length || 0} item(s)</td>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: transaction.type === 'sale' ? 'var(--success)' : 'var(--text-primary)' }}>
                    {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.totalAmount)}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td><span className={`badge ${transaction.status === 'completed' ? 'badge-success' : transaction.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>{transaction.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Showing {transactions.length} of {pagination.total}</span>
          <button className="page-btn" disabled={pagination.page === 1} onClick={() => fetchTransactions(pagination.page - 1)}>Prev</button>
          <button className="page-btn" disabled={pagination.page === pagination.pages} onClick={() => fetchTransactions(pagination.page + 1)}>Next</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 className="modal-title">New Transaction</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, customer: '', supplier: '' })}>
                      <option value="sale">Sale (Stock Out)</option>
                      <option value="purchase">Purchase (Stock In)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{form.type === 'sale' ? 'Customer' : 'Supplier'}</label>
                    {form.type === 'sale' ? (
                      <select className="form-select" value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })}>
                        <option value="">Select Customer</option>
                        {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
                      </select>
                    ) : (
                      <select className="form-select" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })}>
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label">Items *</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.items.map((item, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 150px auto', gap: 8, alignItems: 'center' }}>
                        <select className="form-select" value={item.product} onChange={(event) => updateItem(index, 'product', event.target.value)} required>
                          <option value="">Select Product</option>
                          {products.map((product) => <option key={product._id} value={product._id}>{product.name} (Qty: {product.quantity})</option>)}
                        </select>
                        <input className="form-input" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} required />
                        <input className="form-input" type="number" step="0.01" placeholder="Unit Price (INR)" value={item.unitPrice} onChange={(event) => updateItem(index, 'unitPrice', event.target.value)} />
                        {form.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>Remove</button>}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Amount</span>
                  <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{formatCurrency(total)}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional notes..." />
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
