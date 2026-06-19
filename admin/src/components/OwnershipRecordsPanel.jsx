import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Calendar, History } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from './StatusBadge';

function formatDate(d) {
  if (!d) return 'Present';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RecordsDisplay({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-5 mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <Users className="mx-auto text-royal mb-1" size={22} />
          <p className="text-2xl font-bold text-navy">{data.totalOwners}</p>
          <p className="text-xs text-slate-600 font-medium">Total Owners</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl md:col-span-3">
          <p className="font-bold text-navy text-lg">{data.property.propertyNumber} — {data.property.blockName}</p>
          <p className="text-sm text-slate-600 mt-1">
            {data.property.propertyType} • Current: <strong>{data.property.currentOwnerName}</strong>
          </p>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={data.property.status} />
            <StatusBadge status={data.property.marketStatus || 'available'} />
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><Users size={18} /> All Owners (History)</h4>
        {data.owners.length === 0 ? (
          <p className="text-slate-500 text-sm p-4 bg-slate-50 rounded-xl">No ownership records yet for this property.</p>
        ) : (
          <div className="space-y-3">
            {data.owners.map((o) => (
              <div
                key={`${o.order}-${o.ownerName}-${o.startDate}`}
                className={`p-4 rounded-xl border ${o.isCurrent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-royal bg-blue-100 px-2 py-0.5 rounded">Owner #{o.order}</span>
                    {o.isCurrent && <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Current</span>}
                    <p className="font-semibold text-navy mt-1">{o.ownerName}</p>
                    {o.phone && <p className="text-sm text-slate-600">{o.phone}</p>}
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(o.startDate)} → {o.isCurrent ? 'Present' : formatDate(o.endDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.history.length > 0 && (
        <div>
          <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><History size={18} /> Activity Log</h4>
          <div className="space-y-2">
            {data.history.map((h, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                <span className="font-semibold capitalize text-royal">{h.action.replace('_', ' ')}</span>
                <span className="text-slate-600"> — {h.ownerName}</span>
                {h.details && <p className="text-slate-500 mt-1">{h.details}</p>}
                <p className="text-xs text-slate-400 mt-1">{formatDate(h.date)} • by {h.performedBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnershipRecordsPanel({ initialBlock = '', initialPlot = '', autoFetch = false }) {
  const [blockName, setBlockName] = useState(initialBlock);
  const [propertyNumber, setPropertyNumber] = useState(initialPlot);
  const [searchParams, setSearchParams] = useState(autoFetch && initialBlock && initialPlot ? { blockName: initialBlock, propertyNumber: initialPlot } : null);

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.get('/blocks').then((r) => r.data.data),
  });

  const { data: records, isLoading, isError, error } = useQuery({
    queryKey: ['ownership-records', searchParams],
    queryFn: () => api.get('/properties/ownership-records', { params: searchParams }).then((r) => r.data.data),
    enabled: !!searchParams?.blockName && !!searchParams?.propertyNumber,
    retry: false,
  });

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!blockName.trim() || !propertyNumber.trim()) {
      toast.error('Please select block and enter plot/house number');
      return;
    }
    setSearchParams({ blockName: blockName.trim(), propertyNumber: propertyNumber.trim() });
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="admin-label">Block</label>
          <select className="admin-input" value={blockName} onChange={(e) => setBlockName(e.target.value)} required>
            <option value="">Select block...</option>
            {blocks.map((b) => (
              <option key={b._id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-label">Plot / House Number</label>
          <input
            className="admin-input"
            placeholder="e.g. A-101"
            value={propertyNumber}
            onChange={(e) => setPropertyNumber(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="admin-btn w-full flex items-center justify-center gap-2">
            <Search size={18} /> View All Records
          </button>
        </div>
      </form>

      {isLoading && <p className="admin-table-empty">Loading ownership records...</p>}
      {isError && (
        <p className="highlight-warn mt-4">{error?.response?.data?.message || 'Property not found'}</p>
      )}
      {records && <RecordsDisplay data={records} />}
    </div>
  );
}

export { RecordsDisplay };
