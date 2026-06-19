import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen luxury-gradient">
      <header className="p-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-white hover:text-gold transition-colors">
          <div className="w-9 h-9 rounded-lg bg-gold/20 flex items-center justify-center">
            <Building2 className="text-gold" size={18} />
          </div>
          <span className="font-bold">DHA Housing</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle inverted />
          <Link to="/" className="flex items-center gap-1 text-sm text-white/80 hover:text-gold">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {title && (
            <div className="text-center mb-6 text-white">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
