import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, UserPlus, Lock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import OwnershipRecordsPanel from '../components/OwnershipRecordsPanel';

const STATUS_OPTIONS = [
  { value: 'active', label: '🟢 Active', desc: 'Ownership is valid' },
  { value: 'inactive', label: '🔴 Inactive', desc: 'Property has an issue or problem' },
  { value: 'case', label: '⚖️ Case', desc: 'Legal dispute — handle in Cases section' },
  { value: 'pending', label: '🟡 Pending', desc: 'Verification or documentation pending' },
];

const PLOT_SIZE_OPTIONS = ['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', 'Custom Size'];

/** Standard DHA plot dimensions (width × length in feet) */
const PLOT_DIMENSIONS = {
  '5 Marla': { width: 25, length: 45 },
  '10 Marla': { width: 35, length: 65 },
  '1 Kanal': { width: 50, length: 90 },
  '2 Kanal': { width: 100, length: 90 },
};

const emptyForm = () => {
  const dims = PLOT_DIMENSIONS['5 Marla'];
  return {
    propertyNumber: '', propertyType: 'plot', blockName: '',
    plotSize: '5 Marla', width: String(dims.width), length: String(dims.length),
    price: '', status: 'active', description: '',
  };
};

const handlePlotSizeChange = (plotSize, setForm) => {
  const dims = PLOT_DIMENSIONS[plotSize];
  setForm((prev) => ({
    ...prev,
    plotSize,
    ...(dims ? { width: String(dims.width), length: String(dims.length) } : {}),
  }));
};

export default function Properties() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [recordsModal, setRecordsModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ customerId: '', purchaseDate: '', ownershipDetails: '' });
  const [form, setForm] = useState(emptyForm);
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
      setForm(emptyForm());
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

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      queryClient.invalidateQueries(['blocks']);
      toast.success('Deleted');
    },
  });

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === form.status);

  return (
    <div>
      <PageHeader
        title="Property Management"
        subtitle="Add properties, assign owners, and view complete ownership history."
        action={
          <button onClick={() => { setForm(emptyForm()); setShowModal(true); }} className="admin-btn flex items-center gap-2">
            <Plus size={18} /> Add Property
          </button>
        }
      />

      <div className="search-bar">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input type="text" placeholder="Search by number, block, or ID..." className="admin-input pl-11" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Block</th>
              <th>Type</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Market</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="admin-table-empty">Loading...</td></tr>
            ) : properties.length === 0 ? (
              <tr><td colSpan={7} className="admin-table-empty">No properties yet. Click Add Property to create one.</td></tr>
            ) : properties.map((p) => (
              <tr key={p._id}>
                <td>
                  <p className="cell-primary">{p.propertyNumber}</p>
                  <span className="cell-mono">{p.propertyId}</span>
                </td>
                <td><span className="font-medium text-slate-800">{p.blockName}</span></td>
                <td><StatusBadge status={p.propertyType} label={p.propertyType} /></td>
                <td>
                  {p.ownerName ? (
                    <span className="font-medium text-slate-800">{p.ownerName}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    {p.statusLocked && <Lock size={14} className="text-slate-400" title="Status locked" />}
                  </div>
                </td>
                <td><StatusBadge status={p.marketStatus || 'available'} /></td>
                <td>
                  <div className="flex gap-1">
                    {!p.currentOwner && (
                      <button onClick={() => { setAssignModal(p); setAssignForm({ customerId: '', purchaseDate: new Date().toISOString().split('T')[0], ownershipDetails: '' }); }}
                        className="admin-action-btn text-emerald-600" title="Assign to customer">
                        <UserPlus size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => setRecordsModal(p)}
                      className="admin-action-btn text-blue-600"
                      title="View all ownership records"
                    >
                      <Users size={18} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(p._id)} className="admin-action-btn text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="admin-modal-title">Add New Property</h2>
            <p className="highlight-warn mb-4 flex items-center gap-2"><Lock size={14} /> Status cannot be changed once set</p>
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
                <select
                  className="admin-input"
                  value={form.plotSize}
                  onChange={(e) => handlePlotSizeChange(e.target.value, setForm)}
                >
                  {PLOT_SIZE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input className="admin-input" type="number" placeholder="Price (PKR)" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <input className="admin-input" type="number" placeholder="Width (ft)" value={form.width}
                  onChange={(e) => setForm({ ...form, plotSize: 'Custom Size', width: e.target.value })} />
                <input className="admin-input" type="number" placeholder="Length (ft)" value={form.length}
                  onChange={(e) => setForm({ ...form, plotSize: 'Custom Size', length: e.target.value })} />
              </div>

              <div>
                <label className="admin-label">Property Status (Permanent)</label>
                <select className="admin-input" required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {selectedStatus && (
                  <p className="highlight-info mt-2">{selectedStatus.desc}</p>
                )}
              </div>

              <textarea className="admin-input" placeholder="Description" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="admin-btn flex-1">Create Property</button>
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-md">
            <h2 className="admin-modal-title">Assign Property</h2>
            <p className="admin-modal-desc">
              <strong>{assignModal.propertyNumber}</strong> — {assignModal.blockName}
              <span className="ml-2"><StatusBadge status={assignModal.status} /></span>
            </p>
            <form onSubmit={(e) => { e.preventDefault(); assignMutation.mutate({ id: assignModal._id, data: assignForm }); }} className="space-y-4">
              <div>
                <label className="admin-label">Select Customer</label>
                <select className="admin-input" required value={assignForm.customerId} onChange={(e) => setAssignForm({ ...assignForm, customerId: e.target.value })}>
                  <option value="">Choose customer...</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.fullName} — {c.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Purchase Date</label>
                <input type="date" className="admin-input" required value={assignForm.purchaseDate}
                  onChange={(e) => setAssignForm({ ...assignForm, purchaseDate: e.target.value })} />
              </div>
              <textarea className="admin-input" placeholder="Ownership details (optional)" rows={2} value={assignForm.ownershipDetails}
                onChange={(e) => setAssignForm({ ...assignForm, ownershipDetails: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="admin-btn flex-1">Assign Owner</button>
                <button type="button" onClick={() => setAssignModal(null)} className="admin-btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recordsModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="admin-modal-title">Ownership Records</h2>
            <p className="admin-modal-desc mb-2">
              <strong>{recordsModal.propertyNumber}</strong> — {recordsModal.blockName}
            </p>
            <OwnershipRecordsPanel
              key={`${recordsModal.blockName}-${recordsModal.propertyNumber}`}
              initialBlock={recordsModal.blockName}
              initialPlot={recordsModal.propertyNumber}
              autoFetch
            />
            <div className="mt-6">
              <button type="button" onClick={() => setRecordsModal(null)} className="admin-btn-outline w-full">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
