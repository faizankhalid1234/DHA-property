import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Sales() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales?status=pending').then((r) => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, saleDate }) => api.post(`/sales/${id}/approve`, { saleDate }),
    onSuccess: () => { queryClient.invalidateQueries(['sales', 'properties']); toast.success('Sale approved — new owner set'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => api.post(`/sales/${id}/reject`),
    onSuccess: () => { queryClient.invalidateQueries(['sales']); toast.success('Sale rejected'); },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-2">Pending Property Sales</h1>
      <p className="text-gray-500 mb-6">When two customers are involved in the same plot sale — approve seller/buyer here</p>

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="stat-card text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          No pending sale requests
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="stat-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm text-royal">{r.requestNumber}</p>
                  <h3 className="font-bold text-lg text-navy">
                    {r.property?.propertyNumber} — {r.property?.blockName}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg">
                      <strong>Seller:</strong> {r.sellerName}
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                      <strong>Buyer:</strong> {r.buyerName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Requested: {new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate({ id: r._id, saleDate: new Date().toISOString().split('T')[0] })}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                  >
                    <CheckCircle size={16} /> Approve & Transfer
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(r._id)}
                    className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
