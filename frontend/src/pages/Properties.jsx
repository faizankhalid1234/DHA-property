import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', propertyType: '', status: '', plotSize: '', blockName: '',
  });
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    api.get('/blocks').then((r) => setBlocks(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    api.get(`/properties?${params}`)
      .then((r) => setProperties(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="section-title">Explore <span className="gradient-text">Properties</span></h1>
          <p className="text-gray-500">Browse premium plots, houses, and commercial properties</p>
        </motion.div>

        <div className="glass-card p-6 mb-10">
          <div className="flex items-center gap-2 mb-4 text-navy font-semibold">
            <Filter size={18} /> Advanced Search
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by number, block, sector..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select className="input-field" value={filters.propertyType} onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}>
              <option value="">All Types</option>
              <option value="plot">Plots</option>
              <option value="house">Houses</option>
              <option value="commercial">Commercial</option>
            </select>
            <select className="input-field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <select className="input-field" value={filters.blockName} onChange={(e) => setFilters({ ...filters, blockName: e.target.value })}>
              <option value="">All Blocks</option>
              {blocks.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-96 animate-pulse bg-gray-200/50" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p>No properties found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, i) => (
              <PropertyCard key={property._id} property={property} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
