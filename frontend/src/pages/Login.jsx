import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '../store/authSlice';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);

  if (user?.token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      toast.error('Email aur password likhein');
      return;
    }
    try {
      const result = await dispatch(loginUser(form)).unwrap();
      if (result?.token) {
        toast.success('Login successful!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Login failed');
    }
  };

  return (
    <AuthLayout title="Customer Login" subtitle="Apna DHA Housing account access karein">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-royal flex items-center justify-center">
            <LogIn className="text-gold" size={26} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="input-field"
              placeholder="ahmed@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="input-field pr-12"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-gray-400 hover:text-navy"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Account nahi hai?{' '}
          <Link to="/register" className="text-gold font-semibold hover:underline">
            Register karein
          </Link>
        </p>

        <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-gray-600 border border-blue-100">
          <strong>Demo Login:</strong><br />
          Email: ahmed@example.com<br />
          Password: Customer@123
        </div>
      </motion.div>
    </AuthLayout>
  );
}
