import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, CheckCircle, XCircle, AlertTriangle, MapPin } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

export default function Verify() {
  const [form, setForm] = useState({ propertyNumber: '', blockName: '' });
  const [blocks, setBlocks] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/blocks').then((r) => setBlocks(r.data.data || [])).catch(() => {});
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!form.blockName || !form.propertyNumber.trim()) {
      toast.error('Please select a block and enter a plot/house number');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/properties/verify', form);
      setResult(data);
      if (data.verified) toast.success('Property verified!');
      else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen page-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl luxury-gradient flex items-center justify-center">
            <Shield className="text-gold" size={36} />
          </div>
          <h1 className="section-title">Property <span className="gradient-text">Verification</span></h1>
          <p className="text-muted">Verify a property using block and plot/house number</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleVerify}
          className="glass-card p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label-text mb-2">
                <MapPin size={14} className="inline mr-1" /> Block Name *
              </label>
              <select
                required
                className="input-field"
                value={form.blockName}
                onChange={(e) => setForm({ ...form, blockName: e.target.value })}
              >
                <option value="">Select a block</option>
                {blocks.map((b) => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text mb-2">Plot / House Number *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. A-101, EB-201"
                value={form.propertyNumber}
                onChange={(e) => setForm({ ...form, propertyNumber: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
            <Search size={18} /> {loading ? 'Verifying...' : 'Verify Property'}
          </button>
        </motion.form>

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-8 border-2 ${result.verified ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}`}
          >
            <div className="flex items-center gap-3 mb-6">
              {result.verified ? (
                <CheckCircle className="text-emerald-500" size={32} />
              ) : (
                <XCircle className="text-red-500" size={32} />
              )}
              <div>
                <h3 className="text-xl font-bold text-heading">
                  {result.verified ? 'Property Verified' : 'Not Found'}
                </h3>
                {!result.verified && <p className="text-red-500 text-sm">{result.message}</p>}
              </div>
            </div>

            {result.verified && result.data && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Status</span>
                  <StatusBadge status={result.data.status} />
                </div>

                {result.data.saleInfo && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/50 rounded-xl border border-orange-100 dark:border-orange-900">
                    <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Sale Pending — Seller / Buyer</p>
                    <p className="text-sm text-body"><span className="text-red-600 dark:text-red-400 font-medium">Seller:</span> {result.data.saleInfo.seller}</p>
                    <p className="text-sm text-body"><span className="text-emerald-600 dark:text-emerald-400 font-medium">Buyer:</span> {result.data.saleInfo.buyer}</p>
                  </div>
                )}

                {[
                  ['Owner', result.data.ownerName],
                  ['Property Number', result.data.propertyNumber],
                  ['Property ID', result.data.propertyId],
                  ['Block', result.data.blockName],
                  ['Type', result.data.propertyType],
                  ['Size', result.data.plotSize],
                  ['Dimensions', `${result.data.width} x ${result.data.length} ft`],
                  ['Total Area', `${result.data.totalArea} sq ft`],
                  ['Purchase Date', result.data.purchaseDate ? new Date(result.data.purchaseDate).toLocaleDateString() : 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-muted">{label}</span>
                    <span className="font-semibold text-heading capitalize">{value}</span>
                  </div>
                ))}

                {result.data.status === 'pending' && (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
                    <AlertTriangle size={18} />
                    <span className="text-sm">Verification pending — buy/sell is not allowed until status is Active.</span>
                  </div>
                )}
                {result.data.status === 'case' && (
                  <div className="flex items-center gap-2 p-4 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                    <AlertTriangle size={18} />
                    <span className="text-sm">Legal case — please contact DHA administration.</span>
                  </div>
                )}
                {result.data.status === 'inactive' && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900">
                    <AlertTriangle size={18} />
                    <span className="text-sm">This property has an issue — please verify carefully.</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
