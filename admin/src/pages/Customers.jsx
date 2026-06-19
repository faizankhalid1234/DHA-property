import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', address: '', password: '',
  });

  const emptyForm = { fullName: '', phone: '', email: '', address: '', password: '' };

  const formFields = [
    { key: 'fullName', label: 'Full Name', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'address', label: 'Address', required: true },
    { key: 'password', label: 'Password (optional)', required: false, type: 'password' },
  ];
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers?search=${search}&limit=500`).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer created');
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => api.patch(`/customers/${id}/verify`),
    onSuccess: () => { queryClient.invalidateQueries(['customers']); toast.success('Verified'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['customers']); toast.success('Deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Customer Management</h1>
          <p className="text-gray-500">Add, edit, and manage customers</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="admin-btn flex items-center gap-2">
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="stat-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="Search by name, email, phone..." className="admin-input pl-10"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Properties</th>
              <th className="pb-3 pr-4">Verified</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-10 text-center">Loading...</td></tr>
            ) : customers.map((c) => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{c.fullName}</td>
                <td className="py-3 pr-4">{c.phone}</td>
                <td className="py-3 pr-4">{c.email}</td>
                <td className="py-3 pr-4">{c.properties?.length || 0}</td>
                <td className="py-3 pr-4">
                  {c.isVerified ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14} /> Yes</span>
                  ) : (
                    <button onClick={() => verifyMutation.mutate(c._id)} className="text-amber-600 text-xs hover:underline">Verify</button>
                  )}
                </td>
                <td className="py-3">
                  <button onClick={() => deleteMutation.mutate(c._id)} className="text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Customer</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3">
              {formFields.map(({ key, label, required, type = 'text' }) => (
                <input
                  key={key}
                  className="admin-input"
                  placeholder={label}
                  type={type}
                  required={required}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ))}
              <div className="flex gap-3">
                <button type="submit" className="admin-btn flex-1">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
