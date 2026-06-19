import { motion } from 'framer-motion';
import { Shield, Award, Users, Building2 } from 'lucide-react';

export default function About() {
  return (
    <div className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="section-title">About <span className="gradient-text">DHA Housing</span></h1>
          <p className="text-gray-500 max-w-3xl mx-auto text-lg">
            Defence Housing Authority (DHA) is Pakistan's most prestigious housing scheme,
            providing secure, planned communities with world-class infrastructure and amenities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800" alt="DHA" className="w-full h-80 object-cover" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-navy mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To provide transparent, secure, and efficient property management services that protect
              the investments of thousands of families across Pakistan and overseas.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our digital platform ensures every property record is verified, every transfer is documented,
              and every customer can verify their ownership with confidence.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Secure Records', desc: 'Blockchain-ready ownership verification' },
            { icon: Award, title: '25+ Years', desc: 'Decades of housing excellence' },
            { icon: Users, title: '10,000+ Families', desc: 'Trusted by thousands nationwide' },
            { icon: Building2, title: '5,000+ Properties', desc: 'Plots, houses & commercial' },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6 text-center">
              <item.icon className="mx-auto text-gold mb-4" size={32} />
              <h3 className="font-bold text-navy mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
