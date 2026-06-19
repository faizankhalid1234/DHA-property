import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, UserPlus, ArrowRightLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const STATUS_OPTIONS = [
  { value: 'active', label: '🟢 Active', desc: 'Ownership is valid' },
  { value: 'inactive', label: '🔴 Inactive', desc: 'Property has an issue or problem' },
  { value: 'case', label: '⚖️ Case', desc: 'Legal dispute — handle in Cases section' },
  { value: 'pending', label: '🟡 Pending', desc: 'Verification or documentation pending' },
];

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  inactive: 'bg-red-100 text-red-700',
  case: 'bg-purple-100 text-purple-700',
};

const marketColors = {
  available: 'bg-blue-100 text-blue-700',
  owned: 'bg-emerald-100 text-emerald-700',
  sale_pending: 'bg-orange-100 text-orange-700',
};

export default function Properties() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ customerId: '', purchaseDate: '', ownershipDetails: '' });
  const [transferForm, setTransferForm] = useState({ newOwnerId: '', transferDate: '', transferReason: '' });
  const [form, setForm] = useState({
    propertyNumber: '', propertyType: 'plot', blockName: '', sectorName: '',
    plotSize: '5 Marla', width: '', length: '', price: '', status: 'active', description: '',
  });
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', search],
    queryFn: () => api.get(`/properties?search=${search}&limit=50`).then((r) => r.data.data),
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.get('/blocks').then((r) => r.data.data),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get('/customers?limit=100').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const block = blocks.find((b) => b.name === data.blockName);
      return api.post('/properties', {
        ...data,
        block: block?._id,
        width: Number(data.width) || 0,
        length: Number(data.length) || 0,
        price: Number(data.price) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      toast.success('Property created — status locked permanently');
      setShowModal(false);
      setForm({ propertyNumber: '', propertyType: 'plot', blockName: '', sectorName: '', plotSize: '5 Marla', width: '', length: '', price: '', status: 'active', description: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/properties/${id}/assign`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      toast.success('Property assigned to customer');
      setAssignModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Assign failed'),
  });

  const transferMutation = useMutation({
    mutationFn: (data) => api.post('/transfers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['properties', 'transfers', 'sales']);
      toast.success('Ownership transferred');
      setTransferModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Transfer failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/properties/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['properties']); toast.success('Deleted'); },
  });

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === form.status);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Property Management</h1>
          <p className="text-gray-500">Add properties with permanent status • Assign & transfer ownership</p>
        </div>
        <button onClick={() => setShowModal(true)} className="admin-btn flex items-center gap-2">
          <Plus size={18} /> Add Property
        </button>
      </div>

      <div className="stat-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="Search properties..." className="admin-input pl-10" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-3">Number</th>
              <th className="pb-3 pr-3">Block</th>
              <th className="pb-3 pr-3">Type</th>
              <th className="pb-3 pr-3">Owner</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-3">Market</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="py-10 text-center text-gray-400">Loading...</td></tr>
            ) : properties.map((p) => (
              <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 pr-3">
                  <p className="font-medium">{p.propertyNumber}</p>
                  <p className="text-xs text-gray-400 font-mono">{p.propertyId}</p>
                </td>
                <td className="py-3 pr-3">{p.blockName}</td>
                <td className="py-3 pr-3 capitalize">{p.propertyType}</td>
                <td className="py-3 pr-3">{p.ownerName || <span className="text-gray-400">Unassigned</span>}</td>
                <td className="py-3 pr-3">
                  <span className={`status-badge ${statusColors[p.status]}`}>{p.status}</span>
                  {p.statusLocked && <Lock size={12} className="inline ml-1 text-gray-400" title="Locked" />}
                </td>
                <td className="py-3 pr-3">
                  <span className={`status-badge ${marketColors[p.marketStatus] || marketColors.available}`}>
                    {p.marketStatus?.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {!p.currentOwner && (
                      <button onClick={() => { setAssignModal(p); setAssignForm({ customerId: '', purchaseDate: new Date().toISOString().split('T')[0], ownershipDetails: '' }); }}
                        className="text-emerald-600 hover:text-emerald-800" title="Assign to customer">
                        <UserPlus size={16} />
                      </button>
                    )}
                    {p.currentOwner && (
                      <button onClick={() => { setTransferModal(p); setTransferForm({ newOwnerId: '', transferDate: new Date().toISOString().split('T')[0], transferReason: '' }); }}
                        className="text-blue-600 hover:text-blue-800" title="Transfer ownership">
                        <ArrowRightLeft size={16} />
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(p._id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-navy mb-1">Add New Property</h2>
            <p className="text-xs text-amber-600 mb-4 flex items-center gap-1"><Lock size={12} /> Status cannot be changed once set</p>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="admin-input" placeholder="Property Number *" required value={form.propertyNumber}
                  onChange={(e) => setForm({ ...form, propertyNumber: e.target.value })} />
                <select className="admin-input" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                  <option value="plot">Plot</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                </select>
                <select className="admin-input" required value={form.blockName} onChange={(e) => setForm({ ...form, blockName: e.target.value })}>
                  <option value="">Select Block *</option>
                  {blocks.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
                </select>
                <input className="admin-input" placeholder="Sector *" required value={form.sectorName}
                  onChange={(e) => setForm({ ...form, sectorName: e.target.value })} />
                <select className="admin-input" value={form.plotSize} onChange={(e) => setForm({ ...form, plotSize: e.target.value })}>
                  {['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', 'Custom Size'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <input className="admin-input" type="number" placeholder="Price (PKR)" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <input className="admin-input" type="number" placeholder="Width (ft)" value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })} />
                <input className="admin-input" type="number" placeholder="Length (ft)" value={form.length}
                  onChange={(e) => setForm({ ...form, length: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Property Status * (Permanent)</label>
                <select className="admin-input" required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {selectedStatus && (
                  <p className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded-lg">{selectedStatus.desc}</p>
                )}
              </div>

              <textarea className="admin-input" placeholder="Description" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className="admin-btn flex-1">Create Property</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-navy mb-4">Assign Property</h2>
            <p className="text-sm text-gray-500 mb-4">{assignModal.propertyNumber} — {assignModal.blockName} ({assignModal.status})</p>
            <form onSubmit={(e) => { e.preventDefault(); assignMutation.mutate({ id: assignModal._id, data: assignForm }); }} className="space-y-3">
              <select className="admin-input" required value={assignForm.customerId} onChange={(e) => setAssignForm({ ...assignForm, customerId: e.target.value })}>
                <option value="">Select Customer *</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.fullName} — {c.phone}</option>)}
              </select>
              <input type="date" className="admin-input" required value={assignForm.purchaseDate}
                onChange={(e) => setAssignForm({ ...assignForm, purchaseDate: e.target.value })} />
              <textarea className="admin-input" placeholder="Ownership details" rows={2} value={assignForm.ownershipDetails}
                onChange={(e) => setAssignForm({ ...assignForm, ownershipDetails: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className="admin-btn flex-1">Assign</button>
                <button type="button" onClick={() => setAssignModal(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-navy mb-4">Transfer Ownership</h2>
            <p className="text-sm text-gray-500 mb-2">{transferModal.propertyNumber} — {transferModal.blockName}</p>
            <p className="text-sm mb-4">Current Owner: <strong>{transferModal.ownerName}</strong></p>
            <form onSubmit={(e) => {
              e.preventDefault();
              transferMutation.mutate({ propertyId: transferModal._id, ...transferForm });
            }} className="space-y-3">
              <select className="admin-input" required value={transferForm.newOwnerId} onChange={(e) => setTransferForm({ ...transferForm, newOwnerId: e.target.value })}>
                <option value="">New Owner (Customer) *</option>
                {customers.filter((c) => c._id !== (transferModal.currentOwner?._id || transferModal.currentOwner)).map((c) => (
                  <option key={c._id} value={c._id}>{c.fullName} — {c.phone}</option>
                ))}
              </select>
              <input type="date" className="admin-input" required value={transferForm.transferDate}
                onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })} />
              <textarea className="admin-input" placeholder="Transfer reason" rows={2} value={transferForm.transferReason}
                onChange={(e) => setTransferForm({ ...transferForm, transferReason: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className="admin-btn flex-1">Transfer</button>
                <button type="button" onClick={() => setTransferModal(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
