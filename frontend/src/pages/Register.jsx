import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerCustomer } from '../store/authSlice';
import AuthLayout from '../components/AuthLayout';

const validateCNIC = (cnic) => /^\d{13}$/.test(cnic.replace(/[-\s]/g, ''));

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    fatherName: '',
    cnic: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);

  if (user?.token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateCNIC(form.cnic)) {
      toast.error('CNIC must be 13 digits — e.g. 42101-1234567-1');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      const { confirmPassword, ...data } = form;
      const result = await dispatch(registerCustomer(data)).unwrap();
      if (result?.token) {
        toast.success('Account created! Welcome!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Registration failed');
    }
  };

  const fields = [
    ['fullName', 'Full Name', 'text', 'Ahmed Khan'],
    ['fatherName', 'Father Name', 'text', 'Muhammad Khan'],
    ['cnic', 'CNIC (13 digits)', 'text', '42101-1234567-1'],
    ['phone', 'Phone Number', 'tel', '03001234567'],
    ['email', 'Email', 'email', 'your@email.com'],
    ['address', 'Address', 'text', 'House 123, Karachi'],
  ];

  return (
    <AuthLayout title="Create Account" subtitle="DHA Housing customer registration">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        <div className="text-center mb-4">
          <UserPlus className="mx-auto text-gold mb-2" size={32} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map(([key, label, type, placeholder]) => (
            <div key={key}>
              <label className="label-text mb-1">{label}</label>
              <input
                type={type}
                required
                className="input-field"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          <div>
            <label className="label-text mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                className="input-field pr-12"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-faint">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label-text mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full mt-2">
            {loading ? 'Creating Account...' : 'Register Now'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-gold font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
