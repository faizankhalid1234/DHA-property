import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Building2, Search, User, Phone, Info, LogOut, Users } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/properties', label: 'Properties', icon: Building2 },
  { path: '/verify', label: 'Verify', icon: Search },
  { path: '/ownership-history', label: 'Owner History', icon: Users },
  { path: '/about', label: 'About', icon: Info },
  { path: '/contact', label: 'Contact', icon: Phone },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onHero = location.pathname === '/' && !scrolled;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass-nav shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl luxury-gradient flex items-center justify-center">
              <span className="text-gold font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className={`font-bold text-lg ${onHero ? 'text-white' : 'nav-title-scrolled'}`}>DHA Housing</h1>
              <p className={`text-xs ${onHero ? 'text-gold-light' : 'nav-subtitle-scrolled'}`}>Scheme Management</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.path
                    ? 'text-gold bg-white/10 dark:bg-slate-800/80'
                    : onHero ? 'text-white/90 hover:text-gold' : 'nav-link-scrolled'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle inverted={onHero} />
            {user && (
              <>
                <Link to="/dashboard" className="btn-gold text-sm px-4 py-2 flex items-center gap-2">
                  <User size={16} /> Dashboard
                </Link>
                <button onClick={() => dispatch(logout())} className="text-red-400 hover:text-red-300 p-2">
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle inverted={onHero} />
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? (
                <X className={onHero ? 'text-white' : 'nav-title-scrolled'} />
              ) : (
                <Menu className={onHero ? 'text-white' : 'nav-title-scrolled'} />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-nav border-t"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link"
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <hr className="my-2 dark:border-slate-700" />
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="mobile-nav-link">
                    <User size={18} /> Dashboard
                  </Link>
                  <button onClick={() => { dispatch(logout()); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-red-500 w-full">
                    <LogOut size={18} /> Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
