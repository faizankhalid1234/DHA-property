import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Maximize2, Calendar, User } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then((r) => setProperty(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="pt-32 text-center text-muted page-bg min-h-screen">Loading...</div>;
  if (!property) return <div className="pt-32 text-center text-muted page-bg min-h-screen">Property not found</div>;

  const image = property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop';

  return (
    <div className="pt-28 pb-20 page-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <img src={image} alt={property.propertyNumber} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <StatusBadge status={property.status} />
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">{property.propertyNumber}</h1>
              <p className="text-gold">{property.blockName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-heading mb-4">Property Details</h2>
                <p className="text-body mb-6">{property.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Property ID', property.propertyId],
                    ['Type', property.propertyType],
                    ['Plot Size', property.plotSize],
                    ['Width', `${property.width} ft`],
                    ['Length', `${property.length} ft`],
                    ['Total Area', `${property.totalArea} sq ft`],
                    ['Location', property.location || 'DHA'],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 surface">
                      <p className="text-xs text-faint">{label}</p>
                      <p className="font-semibold text-heading capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {property.amenities?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-bold text-heading mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span key={a} className="px-3 py-1 bg-gold/10 dark:bg-gold/20 text-gold rounded-full text-sm">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <p className="text-3xl font-bold text-gold mb-1">PKR {property.price?.toLocaleString()}</p>
                <p className="text-faint text-sm mb-4">Property Price</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-body"><MapPin size={16} /> {property.blockName}</div>
                  <div className="flex items-center gap-2 text-body"><Maximize2 size={16} /> {property.plotSize}</div>
                  {property.purchaseDate && (
                    <div className="flex items-center gap-2 text-body">
                      <Calendar size={16} /> {new Date(property.purchaseDate).toLocaleDateString()}
                    </div>
                  )}
                  {property.ownerName && (
                    <div className="flex items-center gap-2 text-body"><User size={16} /> {property.ownerName}</div>
                  )}
                </div>
              </div>
              {property.qrCode && (
                <div className="glass-card p-6 text-center">
                  <h3 className="font-bold text-heading mb-3">QR Verification</h3>
                  <img src={property.qrCode} alt="QR Code" className="mx-auto w-40 h-40" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
