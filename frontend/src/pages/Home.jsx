import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Building2, Users, Award, ChevronRight, Star } from 'lucide-react';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/properties/featured').then((r) => setFeatured(r.data.data)).catch(() => {});
    api.get('/dashboard/public-stats').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  const testimonials = [
    { name: 'Ahmed Khan', role: 'Property Owner', text: 'The verification system gave me complete peace of mind before purchasing my plot in Block A.', rating: 5 },
    { name: 'Fatima Ali', role: 'Executive Block Resident', text: 'DHA Housing Scheme management is world-class. Everything is transparent and secure.', rating: 5 },
    { name: 'Hassan Raza', role: 'Investor', text: 'Best real estate platform in Pakistan. The ownership records are always up to date.', rating: 5 },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center luxury-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-royal/80 to-navy/90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-40">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <span className="inline-block px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium mb-6 border border-gold/30">
              🏆 Pakistan's Premier Housing Authority
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Secure Your Future With{' '}
              <span className="gradient-text">DHA Housing Scheme</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Experience luxury living with verified ownership, transparent records, and world-class property management.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/properties" className="btn-gold flex items-center gap-2">
                Explore Properties <ChevronRight size={18} />
              </Link>
              <Link to="/verify" className="btn-outline flex items-center gap-2">
                <Shield size={18} /> Verify Property
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream to-transparent" />
      </section>

      {/* Stats */}
      <section className="py-20 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Building2, label: 'Total Properties', value: stats.totalProperties || '5000+', color: 'from-royal to-blue-600' },
              { icon: Users, label: 'Happy Customers', value: stats.totalCustomers || '10000+', color: 'from-gold to-amber-500' },
              { icon: Shield, label: 'Verified Records', value: stats.activeProperties || '4500+', color: 'from-emerald-500 to-teal-600' },
              { icon: Award, label: 'Years of Excellence', value: stats.yearsOfExcellence || '25+', color: 'from-purple-500 to-indigo-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="text-white" size={24} />
                </div>
                <h3 className="text-3xl font-bold text-navy">{stat.value}</h3>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Featured <span className="gradient-text">Properties</span></h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Discover premium plots, houses, and commercial properties in DHA's most sought-after blocks.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((property, i) => (
              <PropertyCard key={property._id} property={property} index={i} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
              View All Properties <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Verification CTA */}
      <section className="py-20 luxury-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-10 md:p-16 text-center border-gold/20">
            <Search className="mx-auto text-gold mb-6" size={48} />
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Verify Property Ownership Instantly</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Enter your CNIC and property number to verify ownership before making any investment decision. Our secure verification system protects your investment.
            </p>
            <Link to="/verify" className="btn-gold inline-flex items-center gap-2">
              <Shield size={18} /> Start Verification
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">What Our <span className="gradient-text">Customers Say</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} className="text-gold fill-gold" />)}
                </div>
                <p className="text-gray-600 italic mb-6">"{t.text}"</p>
                <div>
                  <p className="font-bold text-navy">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
