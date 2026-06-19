import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="luxury-gradient text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Building2 className="text-gold" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">DHA Housing Scheme</h3>
                <p className="text-gold text-sm">Secure Your Future</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-md">
              Pakistan's premier housing scheme management platform. Verify property ownership,
              manage investments, and secure your family's future with DHA.
            </p>
          </div>
          <div>
            <h4 className="text-gold font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/properties" className="hover:text-gold transition-colors">Properties</Link></li>
              <li><Link to="/verify" className="hover:text-gold transition-colors">Verify Property</Link></li>
              <li><Link to="/about" className="hover:text-gold transition-colors">About DHA</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gold font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2"><Phone size={14} className="text-gold" /> +92 300 1234567</li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-gold" /> info@dha-housing.com</li>
              <li className="flex items-center gap-2"><MapPin size={14} className="text-gold" /> DHA Phase 1, Karachi</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} DHA Housing Scheme Management System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
