import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

export default function Verify() {
  const [form, setForm] = useState({ fullName: '', cnic: '', propertyNumber: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/properties/verify', form);
      setResult(data);
      if (data.verified) toast.success('Property verified successfully!');
      else toast.error(data.message);
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl luxury-gradient flex items-center justify-center">
            <Shield className="text-gold" size={36} />
          </div>
          <h1 className="section-title">Property <span className="gradient-text">Verification</span></h1>
          <p className="text-gray-500">Verify property ownership instantly using CNIC and property number</p>
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
              <label className="block text-sm font-medium text-navy mb-2">Full Name</label>
              <input type="text" required className="input-field" placeholder="Enter full name as per CNIC"
                value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-2">CNIC Number</label>
              <input type="text" required className="input-field" placeholder="42101-1234567-1"
                value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-navy mb-2">Plot / House Number</label>
              <input type="text" required className="input-field" placeholder="e.g. A-101, EB-201"
                value={form.propertyNumber} onChange={(e) => setForm({ ...form, propertyNumber: e.target.value })} />
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
            className={`glass-card p-8 border-2 ${result.verified ? 'border-emerald-200' : 'border-red-200'}`}
          >
            <div className="flex items-center gap-3 mb-6">
              {result.verified ? (
                <CheckCircle className="text-emerald-500" size={32} />
              ) : (
                <XCircle className="text-red-500" size={32} />
              )}
              <div>
                <h3 className="text-xl font-bold text-navy">
                  {result.verified ? 'Ownership Verified' : 'Verification Failed'}
                </h3>
                {!result.verified && <p className="text-red-500 text-sm">{result.message}</p>}
              </div>
            </div>

            {result.verified && result.data && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={result.data.status} />
                </div>
                {[
                  ['Owner Name', result.data.ownerName],
                  ['Property Number', result.data.propertyNumber],
                  ['Property ID', result.data.propertyId],
                  ['Block', result.data.blockName],
                  ['Sector', result.data.sectorName],
                  ['Type', result.data.propertyType],
                  ['Size', result.data.plotSize],
                  ['Dimensions', `${result.data.width} x ${result.data.length} ft`],
                  ['Total Area', `${result.data.totalArea} sq ft`],
                  ['Purchase Date', result.data.purchaseDate ? new Date(result.data.purchaseDate).toLocaleDateString() : 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-navy capitalize">{value}</span>
                  </div>
                ))}
                {result.data.status === 'case' && (
                  <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-xl text-purple-700">
                    <AlertTriangle size={18} />
                    <span className="text-sm">This property is involved in a legal case. Contact DHA administration.</span>
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
