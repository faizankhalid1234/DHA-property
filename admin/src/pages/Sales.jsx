import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Plus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function Sales() {
  const [showCreate, setShowCreate] = useState(false);
  const [saleForm, setSaleForm] = useState({ propertyId: '', buyerId: '', notes: '' });
  const [approveModal, setApproveModal] = useState(null);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['sales', 'pending'],
    queryFn: () => api.get('/sales', { params: { status: 'pending' } }).then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-for-sale'],
    queryFn: () => api.get('/properties?limit=200').then((r) => r.data.data),
    enabled: showCreate,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get('/customers?limit=200').then((r) => r.data.data),
    enabled: showCreate,
  });

  const ownedProperties = properties.filter(
    (p) => p.currentOwner && p.marketStatus !== 'sale_pending' && p.status === 'active'
  );

  const selectedProperty = properties.find((p) => p._id === saleForm.propertyId);
  const ownerId = (selectedProperty?.currentOwner?._id || selectedProperty?.currentOwner)?.toString();
  const buyerOptions = customers.filter((c) => !ownerId || c._id.toString() !== ownerId);

  const approveMutation = useMutation({
    mutationFn: ({ id, saleDate: date, notes }) =>
      api.post(`/sales/${id}/approve`, { saleDate: date, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['properties']);
      toast.success('Sale approved — ownership transferred');
      setApproveModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => api.post(`/sales/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['properties']);
      toast.success('Sale request rejected');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Reject failed'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/sales/admin', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['properties']);
      toast.success('Sale request created — approve to complete transfer');
      setShowCreate(false);
      setSaleForm({ propertyId: '', buyerId: '', notes: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create sale'),
  });

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      <PageHeader
        title="Property Sales"
        subtitle="Approve user sale requests or create a sale between customers. Admin cannot edit ownership history directly."
        action={
          <button onClick={() => setShowCreate(true)} className="admin-btn flex items-center gap-2">
            <Plus size={18} /> Create Sale
          </button>
        }
      />

      <div className="admin-table-wrap">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Property</th>
                <th>Seller</th>
                <th>Buyer</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="admin-table-empty">Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    <ShoppingCart className="mx-auto mb-2 text-slate-300" size={32} />
                    No pending sale requests
                  </td>
                </tr>
              ) : requests.map((r) => (
                <tr key={r._id}>
                  <td><span className="cell-mono">{r.requestNumber}</span></td>
                  <td>
                    <p className="cell-primary">{r.property?.propertyNumber}</p>
                    <span className="text-xs text-slate-500">{r.property?.blockName}</span>
                  </td>
                  <td>
                    <p className="font-medium text-slate-800">{r.sellerName}</p>
                    <span className="text-xs text-slate-500">{r.seller?.email}</span>
                  </td>
                  <td>
                    <p className="font-medium text-slate-800">{r.buyerName}</p>
                    <span className="text-xs text-slate-500">{r.buyer?.email}</span>
                  </td>
                  <td><StatusBadge status={r.requestedBy} label={r.requestedBy} /></td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setApproveModal(r);
                          setSaleDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="admin-action-btn text-emerald-600"
                        title="Approve sale"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Reject sale ${r.requestNumber}?`)) {
                            rejectMutation.mutate(r._id);
                          }
                        }}
                        className="admin-action-btn text-red-500"
                        title="Reject sale"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-lg">
            <h2 className="admin-modal-title">Create Sale Request</h2>
            <p className="admin-modal-desc">
              Select a property and buyer. The current owner will be the seller. Approve after creating to transfer ownership.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(saleForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="admin-label">Property (must have owner)</label>
                <select
                  className="admin-input"
                  required
                  value={saleForm.propertyId}
                  onChange={(e) => setSaleForm({ propertyId: e.target.value, buyerId: '', notes: saleForm.notes })}
                >
                  <option value="">Choose property...</option>
                  {ownedProperties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.propertyNumber} — {p.blockName} (Owner: {p.ownerName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Buyer (customer)</label>
                <select
                  className="admin-input"
                  required
                  value={saleForm.buyerId}
                  onChange={(e) => setSaleForm({ ...saleForm, buyerId: e.target.value })}
                >
                  <option value="">Choose buyer...</option>
                  {buyerOptions.map((c) => (
                    <option key={c._id} value={c._id}>{c.fullName} — {c.email}</option>
                  ))}
                </select>
              </div>
              <textarea
                className="admin-input"
                placeholder="Notes (optional)"
                rows={2}
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
              />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="admin-btn flex-1" disabled={createMutation.isPending}>
                  Create Request
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="admin-btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {approveModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-md">
            <h2 className="admin-modal-title">Approve Sale</h2>
            <p className="admin-modal-desc mb-4">
              <strong>{approveModal.requestNumber}</strong><br />
              {approveModal.property?.propertyNumber} — {approveModal.property?.blockName}<br />
              <span className="text-red-600">Seller:</span> {approveModal.sellerName}<br />
              <span className="text-emerald-600">Buyer:</span> {approveModal.buyerName}
            </p>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Sale / Transfer Date</label>
                <input
                  type="date"
                  className="admin-input"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="admin-btn flex-1"
                  disabled={approveMutation.isPending}
                  onClick={() =>
                    approveMutation.mutate({
                      id: approveModal._id,
                      saleDate,
                      notes: `Approved by admin on ${saleDate}`,
                    })
                  }
                >
                  Confirm Transfer
                </button>
                <button type="button" onClick={() => setApproveModal(null)} className="admin-btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
