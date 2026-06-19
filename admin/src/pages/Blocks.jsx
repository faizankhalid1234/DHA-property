import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Blocks() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const queryClient = useQueryClient();

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.get('/blocks').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/blocks', data),
    onSuccess: () => { queryClient.invalidateQueries(['blocks']); toast.success('Block created'); setShowModal(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Block Management</h1>
          <p className="text-gray-500">Manage housing blocks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="admin-btn flex items-center gap-2">
          <Plus size={18} /> Add Block
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <p>Loading...</p> : blocks.map((block) => (
          <div key={block._id} className="stat-card">
            <h3 className="text-lg font-bold text-navy">{block.name}</h3>
            <p className="text-xs text-gray-400 mb-4">{block.description}</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-lg font-bold text-royal">{block.totalPlots || 0}</p>
                <p className="text-xs text-gray-500">Plots</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2">
                <p className="text-lg font-bold text-emerald-600">{block.totalHouses || 0}</p>
                <p className="text-xs text-gray-500">Houses</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="text-lg font-bold text-amber-600">{block.availableProperties || 0}</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-lg font-bold text-red-600">{block.soldProperties || 0}</p>
                <p className="text-xs text-gray-500">Sold</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Block</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3">
              <input className="admin-input" placeholder="Block Name (e.g. Block A)" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <textarea className="admin-input" placeholder="Description" rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
