import { useState, useEffect } from 'react';
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
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl md:col-span-3">
          <p className="font-bold text-navy text-lg">{data.property.propertyNumber} — {data.property.blockName}</p>
          <p className="text-sm text-gray-600 mt-1">
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
          <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-xl">No ownership records yet for this property.</p>
        ) : (
          <div className="space-y-3">
            {data.owners.map((o) => (
              <div
                key={`${o.order}-${o.ownerName}-${o.startDate}`}
                className={`p-4 rounded-xl border ${o.isCurrent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-royal bg-blue-100 px-2 py-0.5 rounded">Owner #{o.order}</span>
                    {o.isCurrent && <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Current</span>}
                    <p className="font-semibold text-navy mt-1">{o.ownerName}</p>
                    {o.phone && <p className="text-sm text-gray-600">{o.phone}</p>}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
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
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                <span className="font-semibold capitalize text-royal">{h.action.replace('_', ' ')}</span>
                <span className="text-gray-600"> — {h.ownerName}</span>
                {h.details && <p className="text-gray-500 mt-1">{h.details}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatDate(h.date)} • by {h.performedBy}</p>
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
  const [blocks, setBlocks] = useState([]);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/blocks').then((r) => setBlocks(r.data.data || [])).catch(() => {});
  }, []);

  const fetchRecords = async (params) => {
    setLoading(true);
    setError('');
    setRecords(null);
    try {
      const { data: res } = await api.get('/properties/ownership-records', { params });
      setRecords(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Property not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && initialBlock && initialPlot) {
      fetchRecords({ blockName: initialBlock, propertyNumber: initialPlot });
    }
  }, [autoFetch, initialBlock, initialPlot]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!blockName.trim() || !propertyNumber.trim()) {
      toast.error('Please select block and enter plot/house number');
      return;
    }
    fetchRecords({ blockName: blockName.trim(), propertyNumber: propertyNumber.trim() });
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
          <select className="input-field w-full" value={blockName} onChange={(e) => setBlockName(e.target.value)} required>
            <option value="">Select block...</option>
            {blocks.map((b) => (
              <option key={b._id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plot / House Number</label>
          <input
            className="input-field w-full"
            placeholder="e.g. A-101"
            value={propertyNumber}
            onChange={(e) => setPropertyNumber(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Search size={18} /> View All Records
          </button>
        </div>
      </form>

      {loading && <p className="text-center text-gray-400 py-6">Loading ownership records...</p>}
      {error && !loading && (
        <p className="text-orange-700 bg-orange-50 p-3 rounded-lg mt-4">{error}</p>
      )}
      {records && !loading && <RecordsDisplay data={records} />}
    </div>
  );
}

export { RecordsDisplay };
