import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Trash2, UserPlus, Building2, Home, ShoppingBag, UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

const STATUS_OPTIONS = [
  { value: 'active', label: '🟢 Active', desc: 'Ownership is valid — sell & buy allowed' },
  { value: 'inactive', label: '🔴 Inactive', desc: 'Property has an issue — no transactions' },
  { value: 'case', label: '⚖️ Case', desc: 'Legal dispute — handle in Cases section' },
  { value: 'pending', label: '🟡 Pending', desc: 'Verification pending — assign only' },
];

const PLOT_SIZE_OPTIONS = ['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', 'Custom Size'];

const PLOT_DIMENSIONS = {
  '5 Marla': { width: 25, length: 45 },
  '10 Marla': { width: 35, length: 65 },
  '1 Kanal': { width: 50, length: 90 },
  '2 Kanal': { width: 100, length: 90 },
};

const FILTERS = [
  { id: 'all', label: 'All Properties' },
  { id: 'available', label: 'No Owner Yet' },
  { id: 'owned', label: 'Has Owner' },
  { id: 'sale_pending', label: 'Sale Pending' },
];

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

const ownerInitials = (name) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const getMarketStatus = (p) => {
  if (!p.currentOwner) return 'available';
  return p.marketStatus || 'owned';
};

export default function Properties() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ customerId: '', purchaseDate: '', ownershipDetails: '' });
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', search],
    queryFn: () => api.get(`/properties?search=${search}&limit=100`).then((r) => r.data.data),
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.get('/blocks').then((r) => r.data.data),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get('/customers?limit=200').then((r) => r.data.data),
  });

  const stats = useMemo(() => ({
    total: properties.length,
    available: properties.filter((p) => !p.currentOwner).length,
    owned: properties.filter((p) => p.currentOwner && getMarketStatus(p) === 'owned').length,
    salePending: properties.filter((p) => getMarketStatus(p) === 'sale_pending').length,
  }), [properties]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const market = getMarketStatus(p);
      if (filter === 'available') return !p.currentOwner;
      if (filter === 'owned') return !!p.currentOwner && market !== 'sale_pending';
      if (filter === 'sale_pending') return market === 'sale_pending';
      return true;
    });
  }, [properties, filter]);

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
      queryClient.invalidateQueries(['blocks']);
      toast.success('Property created — status is set permanently');
      setShowModal(false);
      setForm(emptyForm());
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/properties/${id}/assign`, data),
    onSuccess: (_, { customerName }) => {
      queryClient.invalidateQueries(['properties']);
      queryClient.invalidateQueries(['customers-list']);
      toast.success(`Property assigned to ${customerName}`);
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

  const canAssignProperty = (status) => ['active', 'pending'].includes(status);
  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === form.status);

  const handleAssign = (e) => {
    e.preventDefault();
    const customer = customers.find((c) => c._id === assignForm.customerId);
    assignMutation.mutate({
      id: assignModal._id,
      data: assignForm,
      customerName: customer?.fullName || 'customer',
    });
  };

  return (
    <div>
      <PageHeader
        title="Property Management"
        subtitle="Create plots & houses, assign each property to one customer. Owner name and market status update automatically."
        action={
          <button onClick={() => { setForm(emptyForm()); setShowModal(true); }} className="admin-btn flex items-center gap-2">
            <Plus size={18} /> Add Property
          </button>
        }
      />

      <div className="prop-kpi-grid">
        {[
          { label: 'Total Properties', value: stats.total, icon: Building2, color: 'text-royal' },
          { label: 'No Owner Yet', value: stats.available, icon: UserX, color: 'text-sky-600' },
          { label: 'Owned', value: stats.owned, icon: Home, color: 'text-teal-600' },
          { label: 'Sale Pending', value: stats.salePending, icon: ShoppingBag, color: 'text-orange-600' },
        ].map((k) => (
          <div key={k.label} className="prop-kpi flex items-center justify-between gap-3">
            <div>
              <p className="prop-kpi-label">{k.label}</p>
              <p className="prop-kpi-value">{k.value}</p>
            </div>
            <k.icon className={`${k.color} opacity-80`} size={28} />
          </div>
        ))}
      </div>

      <div className="search-bar">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by number, block, owner, or ID..."
            className="admin-input pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="prop-filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`prop-filter-btn ${filter === f.id ? 'active' : ''}`}
          >
            {f.label}
            <span className="ml-1.5 opacity-80">
              ({f.id === 'all' ? stats.total : f.id === 'available' ? stats.available : f.id === 'owned' ? stats.owned : stats.salePending})
            </span>
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Block / Size</th>
                <th>Type</th>
                <th>Current Owner</th>
                <th>Market Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="admin-table-empty">Loading properties...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="admin-table-empty">No properties match this filter.</td></tr>
              ) : filtered.map((p) => {
                const market = getMarketStatus(p);
                const owner = p.currentOwner;
                return (
                  <tr key={p._id}>
                    <td>
                      <p className="cell-primary">{p.propertyNumber}</p>
                      <span className="cell-mono">{p.propertyId}</span>
                    </td>
                    <td>
                      <p className="font-semibold text-slate-800">{p.blockName}</p>
                      <p className="prop-meta">{p.plotSize}{p.price ? ` · PKR ${Number(p.price).toLocaleString()}` : ''}</p>
                    </td>
                    <td><StatusBadge status={p.propertyType} /></td>
                    <td>
                      {owner || p.ownerName ? (
                        <div className="prop-owner-card">
                          <div className="prop-owner-avatar">
                            {ownerInitials(p.ownerName || owner?.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-navy truncate">{p.ownerName || owner?.fullName}</p>
                            <p className="prop-meta">{owner?.email || owner?.phone || 'Owner assigned'}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="prop-owner-empty">
                          <UserX size={14} /> No owner assigned yet
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={market} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {!p.currentOwner && canAssignProperty(p.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModal(p);
                              setAssignForm({
                                customerId: '',
                                purchaseDate: new Date().toISOString().split('T')[0],
                                ownershipDetails: '',
                              });
                            }}
                            className="admin-action-btn text-emerald-600"
                            title="Assign to customer"
                          >
                            <UserPlus size={18} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${p.propertyNumber}?`)) deleteMutation.mutate(p._id);
                          }}
                          className="admin-action-btn text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="admin-modal-title">Add New Property</h2>
            <p className="admin-modal-desc mb-4">
              Set status once at creation. After creating, assign each property to a <strong>different customer</strong> using the assign button.
            </p>
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
                <select className="admin-input" value={form.plotSize} onChange={(e) => handlePlotSizeChange(e.target.value, setForm)}>
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
                <label className="admin-label">Property Status (permanent at creation)</label>
                <select className="admin-input" required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {selectedStatus && <p className="highlight-info mt-2">{selectedStatus.desc}</p>}
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
            <h2 className="admin-modal-title">Assign Owner</h2>
            <p className="admin-modal-desc">
              <strong>{assignModal.propertyNumber}</strong> — {assignModal.blockName}
              <br />
              <span className="text-amber-700 font-medium">Pick the correct customer — one owner per property.</span>
            </p>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="admin-label">Select Customer</label>
                <select
                  className="admin-input"
                  required
                  value={assignForm.customerId}
                  onChange={(e) => setAssignForm({ ...assignForm, customerId: e.target.value })}
                >
                  <option value="">Choose customer...</option>
                  {customers.map((c) => {
                    const count = c.properties?.length || 0;
                    return (
                      <option key={c._id} value={c._id}>
                        {c.fullName} — {c.email} ({count} propert{count === 1 ? 'y' : 'ies'})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="admin-label">Purchase Date</label>
                <input type="date" className="admin-input" required value={assignForm.purchaseDate}
                  onChange={(e) => setAssignForm({ ...assignForm, purchaseDate: e.target.value })} />
              </div>
              <textarea className="admin-input" placeholder="Ownership details (optional)" rows={2}
                value={assignForm.ownershipDetails}
                onChange={(e) => setAssignForm({ ...assignForm, ownershipDetails: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="admin-btn flex-1">Assign Owner</button>
                <button type="button" onClick={() => setAssignModal(null)} className="admin-btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
