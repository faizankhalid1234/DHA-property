import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import OwnershipRecordsPanel from '../components/OwnershipRecordsPanel';

export default function OwnershipHistory() {
  return (
    <div className="pt-28 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-royal" size={28} />
            <h1 className="text-3xl font-bold text-navy">Ownership Records</h1>
          </div>
          <p className="text-gray-500">
            Select your block and plot/house number to see all past and current owners.
          </p>
        </motion.div>

        <div className="glass-card p-6">
          <OwnershipRecordsPanel />
        </div>
      </div>
    </div>
  );
}
