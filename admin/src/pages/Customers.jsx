import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, CheckCircle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', address: '',
  });

  const emptyForm = { fullName: '', phone: '', email: '', address: '' };

  const formFields = [
    { key: 'fullName', label: 'Full Name', required: true },
    { key: 'phone', label: 'Phone Number', required: true },
    { key: 'email', label: 'Email Address', required: true, type: 'email' },
    { key: 'address', label: 'Address', required: true },
  ];
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers?search=${search}&limit=500`).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['customers-list']);
      toast.success(res.data?.message || 'Customer created and verified');
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['customers']); toast.success('Deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      <PageHeader
        title="Customer Management"
        subtitle="Add customers by email — they are verified automatically. Customer registers on the website with the same email to set password."
        action={
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="admin-btn flex items-center gap-2">
            <Plus size={18} /> Add Customer
          </button>
        }
      />

      <div className="search-bar">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input type="text" placeholder="Search by name, email, or phone..." className="admin-input pl-11"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Properties</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="admin-table-empty">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="admin-table-empty">No customers yet. Click &quot;Add Customer&quot; to create one.</td></tr>
              ) : customers.map((c) => (
                <tr key={c._id}>
                  <td><span className="cell-primary">{c.fullName}</span></td>
                  <td><span className="font-medium text-slate-800">{c.phone}</span></td>
                  <td><span className="text-slate-600">{c.email}</span></td>
                  <td><span className="count-pill">{c.properties?.length || 0}</span></td>
                  <td>
                    {c.user ? (
                      <span className="status-pill badge-active inline-flex items-center gap-1.5">
                        <UserCheck size={14} /> Registered
                      </span>
                    ) : c.isVerified ? (
                      <span className="status-pill badge-active inline-flex items-center gap-1.5">
                        <CheckCircle size={14} /> Verified
                      </span>
                    ) : (
                      <span className="status-pill badge-pending">Added</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => deleteMutation.mutate(c._id)} className="admin-action-btn text-red-500" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-lg">
            <h2 className="admin-modal-title">Add New Customer</h2>
            <p className="admin-modal-desc">
              Enter customer details. Customer is <strong>verified automatically</strong> when you create them here.
              They register on the website using this email to set their password.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              {formFields.map(({ key, label, required, type = 'text' }) => (
                <div key={key}>
                  <label className="admin-label">{label}</label>
                  <input
                    className="admin-input"
                    placeholder={`Enter ${label.toLowerCase()}`}
                    type={type}
                    required={required}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="admin-btn flex-1">Create & Verify Customer</button>
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
