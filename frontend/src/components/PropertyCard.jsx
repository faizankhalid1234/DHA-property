import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Maximize2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function PropertyCard({ property, index = 0 }) {
  const image = property.images?.[0]?.url ||
    `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass-card overflow-hidden group hover:shadow-2xl transition-all duration-500"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={image}
          alt={property.propertyNumber}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          <StatusBadge status={property.status} />
        </div>
        <div className="absolute top-4 right-4 bg-navy/80 text-gold px-3 py-1 rounded-lg text-sm font-semibold capitalize">
          {property.propertyType}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-royal text-sm mb-2">
          <MapPin size={14} />
          <span>{property.blockName}</span>
        </div>
        <h3 className="text-xl font-bold text-navy mb-2">{property.propertyNumber}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{property.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gold">
              PKR {(property.price / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Maximize2 size={12} /> {property.plotSize}
            </p>
          </div>
          <Link
            to={`/properties/${property._id}`}
            className="btn-primary text-sm px-4 py-2"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
