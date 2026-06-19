import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Building2, History, Search, ShoppingCart, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import OwnershipRecordsPanel from '../components/OwnershipRecordsPanel';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('properties');
  const [data, setData] = useState({ current: [], past: [], saleRequests: [] });
  const [lookup, setLookup] = useState({ propertyNumber: '', blockName: '' });
  const [lookupResult, setLookupResult] = useState(null);
  const [ownerLookup, setOwnerLookup] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.get('/properties/my-properties')
      .then((r) => setData(r.data.data || { current: [], past: [], saleRequests: [] }))
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  if (!user?.token) return <Navigate to="/login" replace />;

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookup.propertyNumber || !lookup.blockName) {
      toast.error('Please enter plot number and block name');
      return;
    }
    try {
      const { data: res } = await api.get('/sales/lookup', { params: lookup });
      setLookupResult(res.data);
    } catch {
      toast.error('Property not found');
      setLookupResult(null);
    }
  };

  const handleBuyRequest = async (propertyId) => {
    try {
      await api.post('/sales/request', { propertyId });
      toast.success('Buy request sent to admin — seller/buyer approval pending');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const tabs = [
    { id: 'properties', label: 'My Properties', icon: Building2 },
    { id: 'owners', label: 'Owner History', icon: Users },
    { id: 'sold', label: 'Sold / Past', icon: History },
    { id: 'sales', label: 'Buy/Sell Requests', icon: ShoppingCart },
    { id: 'lookup', label: 'Find My Plot', icon: Search },
  ];

  return (
    <div className="pt-28 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-navy">Welcome, {user.name}</h1>
          <p className="text-gray-500">View your properties, buy/sell history, and ownership dates</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Current Properties', value: data.current?.length || 0 },
            { label: 'Sold / Past', value: data.past?.length || 0 },
            { label: 'Pending Sales', value: data.saleRequests?.length || 0 },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-royal">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-royal text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="glass-card p-6">
          {loading && <p className="text-center text-gray-400 py-10">Loading...</p>}

          {!loading && activeTab === 'properties' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-navy mb-4">Current Owned Properties</h3>
              {!data.current?.length ? (
                <p className="text-gray-500 text-center py-10">No properties assigned yet</p>
              ) : data.current.map((p) => (
                <div key={p._id} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-navy text-lg">{p.propertyNumber} — {p.blockName}</h4>
                      <p className="text-sm text-gray-500">{p.plotSize} • {p.propertyType}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>Start: <strong>{formatDate(p.ownershipStartDate || p.purchaseDate)}</strong></span>
                      </div>
                      {p.saleInfo && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100 text-sm">
                          <p className="font-semibold text-orange-800">Sale Pending — Admin Approval</p>
                          <p><span className="text-red-600">Seller:</span> {p.saleInfo.seller}</p>
                          <p><span className="text-emerald-600">Buyer:</span> {p.saleInfo.buyer}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={p.status} />
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerLookup({ blockName: p.blockName, propertyNumber: p.propertyNumber });
                          setActiveTab('owners');
                        }}
                        className="text-royal text-sm font-medium hover:underline flex items-center gap-1"
                      >
                        <Users size={14} /> View All Owners
                      </button>
                      <Link to={`/properties/${p._id}`} className="text-gray-500 text-sm hover:underline">View Details</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'owners' && (
            <div>
              <h3 className="text-lg font-bold text-navy mb-2">Property Owner History</h3>
              <p className="text-sm text-gray-500 mb-6">
                See how many owners your plot or house has had — select block and number below.
              </p>
              <OwnershipRecordsPanel
                key={ownerLookup ? `${ownerLookup.blockName}-${ownerLookup.propertyNumber}` : 'manual'}
                initialBlock={ownerLookup?.blockName || ''}
                initialPlot={ownerLookup?.propertyNumber || ''}
                autoFetch={!!ownerLookup}
              />
            </div>
          )}

          {!loading && activeTab === 'sold' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-navy mb-4">Sold / Past Properties</h3>
              {!data.past?.length ? (
                <p className="text-gray-500 text-center py-10">No past ownership records</p>
              ) : data.past.map((period) => (
                <div key={period._id} className="p-5 bg-gray-50 rounded-xl border-l-4 border-gold">
                  <h4 className="font-bold text-navy">{period.propertyNumber} — {period.blockName}</h4>
                  <p className="text-sm text-gray-500 capitalize">{period.propertyType}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <p className="text-gray-500 text-xs">Start Date (Buy)</p>
                      <p className="font-semibold text-emerald-700">{formatDate(period.startDate)}</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <p className="text-gray-500 text-xs">End Date (Sold)</p>
                      <p className="font-semibold text-red-700">{formatDate(period.endDate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'sales' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-navy mb-4">Buy / Sell Requests</h3>
              {!data.saleRequests?.length ? (
                <p className="text-gray-500 text-center py-10">No pending sale requests</p>
              ) : data.saleRequests.map((r) => (
                <div key={r._id} className="p-5 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="font-mono text-xs text-royal">{r.requestNumber}</p>
                  <h4 className="font-bold text-navy">{r.property?.propertyNumber} — {r.property?.blockName}</h4>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Seller: {r.sellerName}</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Buyer: {r.buyerName}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Status: {r.status} — Admin approval pending</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'lookup' && (
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">Find My Property</h3>
              <form onSubmit={handleLookup} className="flex flex-col md:flex-row gap-3 mb-6">
                <input className="input-field flex-1" placeholder="Plot / House Number (e.g. A-101)" required
                  value={lookup.propertyNumber} onChange={(e) => setLookup({ ...lookup, propertyNumber: e.target.value })} />
                <input className="input-field flex-1" placeholder="Block Name (e.g. Block A)" required
                  value={lookup.blockName} onChange={(e) => setLookup({ ...lookup, blockName: e.target.value })} />
                <button type="submit" className="btn-primary px-6">Search</button>
              </form>

              {lookupResult && (
                <div className="space-y-4">
                  {lookupResult.periods?.length > 0 ? lookupResult.periods.map((period) => (
                    <div key={period._id} className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-bold">{period.propertyNumber} — {period.blockName}</h4>
                      <p className="text-sm">Start: {formatDate(period.startDate)} | End: {formatDate(period.endDate) || 'Current Owner'}</p>
                      <StatusBadge status={lookupResult.property?.status} />
                    </div>
                  )) : (
                    <p className="text-gray-500">No ownership record found for this plot</p>
                  )}

                  {lookupResult.saleInfo && (
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <p className="font-semibold">Sale in Progress</p>
                      <p>Seller: {lookupResult.saleInfo.seller} | Buyer: {lookupResult.saleInfo.buyer}</p>
                    </div>
                  )}

                  {lookupResult.property && !lookupResult.isOwner && lookupResult.property.currentOwner && lookupResult.property.marketStatus !== 'sale_pending' && (
                    <button onClick={() => handleBuyRequest(lookupResult.property._id)} className="btn-gold">
                      Want to buy this property? Submit a request
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
