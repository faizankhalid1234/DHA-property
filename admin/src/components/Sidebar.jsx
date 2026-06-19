import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Grid3X3, ArrowRightLeft,
  Scale, FileText, BarChart3, Bell, LogOut, Menu, X, Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/properties', label: 'Properties', icon: Building2 },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/blocks', label: 'Blocks', icon: Grid3X3 },
  { path: '/transfers', label: 'Transfers', icon: ArrowRightLeft },
  { path: '/sales', label: 'Pending Sales', icon: Bell },
  { path: '/cases', label: 'Cases', icon: Scale },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-navy text-white rounded-lg">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-white transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <Shield className="text-gold" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-sm">DHA Admin</h1>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2 truncate">{user?.email}</div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setOpen(false)} />}
    </>
  );
}
