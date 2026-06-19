import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Cases() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ propertyId: '', title: '', description: '', caseType: 'other', priority: 'medium' });
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.get('/cases').then((r) => r.data.data),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => api.get('/properties?limit=100').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/cases', data),
    onSuccess: () => { queryClient.invalidateQueries(['cases']); toast.success('Case registered'); setShowModal(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }) => api.post(`/cases/${id}/resolve`, { resolution }),
    onSuccess: () => { queryClient.invalidateQueries(['cases']); toast.success('Case resolved'); },
  });

  const statusColors = { open: 'bg-red-100 text-red-700', in_progress: 'bg-amber-100 text-amber-700', resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-gray-100 text-gray-700' };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Case Management</h1>
          <p className="text-gray-500">Legal disputes and ownership conflicts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="admin-btn flex items-center gap-2">
          <Plus size={18} /> Register Case
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? <p>Loading...</p> : cases.length === 0 ? (
          <div className="stat-card text-center py-10 text-gray-400">No cases registered</div>
        ) : cases.map((c) => (
          <div key={c._id} className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-royal">{c.caseNumber}</span>
                  <span className={`status-badge ${statusColors[c.status]}`}>{c.status}</span>
                  <span className="text-xs text-gray-400 capitalize">{c.priority} priority</span>
                </div>
                <h3 className="font-bold text-navy">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Property: {c.property?.propertyNumber} - {c.property?.blockName}
                </p>
              </div>
              {c.status !== 'resolved' && (
                <button onClick={() => resolveMutation.mutate({ id: c._id, resolution: 'Resolved by admin' })}
                  className="text-sm text-emerald-600 hover:underline">Resolve</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Register Case</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3">
              <select className="admin-input" required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
                <option value="">Select Property</option>
                {properties.map((p) => <option key={p._id} value={p._id}>{p.propertyNumber} - {p.blockName}</option>)}
              </select>
              <input className="admin-input" placeholder="Case Title" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="admin-input" placeholder="Description" required rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select className="admin-input" value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })}>
                <option value="legal_dispute">Legal Dispute</option>
                <option value="fraud">Fraud</option>
                <option value="ownership_conflict">Ownership Conflict</option>
                <option value="court_case">Court Case</option>
                <option value="other">Other</option>
              </select>
              <div className="flex gap-3">
                <button type="submit" className="admin-btn flex-1">Register</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
