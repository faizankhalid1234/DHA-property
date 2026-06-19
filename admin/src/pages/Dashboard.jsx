import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { Users, Building2, Home, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-navy mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;

  const { overview, statusDistribution, propertyByBlock, monthlyRegistrations, recentCustomers, recentActivities } = data || {};

  const statusData = statusDistribution?.map((s) => ({
    name: s._id?.toUpperCase() || 'Unknown',
    value: s.count,
  })) || [];

  const blockData = propertyByBlock?.map((b) => ({
    name: b._id,
    properties: b.count,
  })) || [];

  const regData = monthlyRegistrations?.map((m) => ({
    month: m._id,
    customers: m.count,
  })) || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Super Admin Dashboard</h1>
        <p className="text-gray-500">DHA Housing Scheme Management Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users} label="Total Customers" value={overview?.totalCustomers || 0} color="from-blue-500 to-blue-600" />
        <StatCard icon={Building2} label="Total Properties" value={overview?.totalProperties || 0} color="from-gold to-amber-500" />
        <StatCard icon={Home} label="Total Plots" value={overview?.totalPlots || 0} color="from-emerald-500 to-teal-600" sub={`${overview?.totalHouses || 0} houses`} />
        <StatCard icon={DollarSign} label="Total Revenue" value={`PKR ${((overview?.totalRevenue || 0) / 1e6).toFixed(1)}M`} color="from-purple-500 to-indigo-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card flex items-center gap-3">
          <CheckCircle className="text-emerald-500" size={24} />
          <div><p className="text-sm text-gray-500">Active</p><p className="text-xl font-bold">{overview?.activeProperties || 0}</p></div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-amber-400" />
          <div><p className="text-sm text-gray-500">Pending</p><p className="text-xl font-bold">{overview?.pendingProperties || 0}</p></div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-red-400" />
          <div><p className="text-sm text-gray-500">Sold/Inactive</p><p className="text-xl font-bold">{overview?.soldProperties || 0}</p></div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <AlertTriangle className="text-purple-500" size={24} />
          <div><p className="text-sm text-gray-500">Under Case</p><p className="text-xl font-bold">{overview?.caseProperties || 0}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="stat-card">
          <h3 className="font-semibold text-navy mb-4">Property Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-semibold text-navy mb-4">Properties by Block</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={blockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="properties" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="stat-card lg:col-span-2">
          <h3 className="font-semibold text-navy mb-4">New Registrations (6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={regData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="customers" stroke="#d4af37" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-semibold text-navy mb-4">Recent Customers</h3>
          <div className="space-y-3">
            {recentCustomers?.map((c) => (
              <div key={c._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium">{c.fullName}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card mt-6">
        <h3 className="font-semibold text-navy mb-4">Recent Activities</h3>
        <div className="space-y-2">
          {recentActivities?.slice(0, 8).map((a) => (
            <div key={a._id} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
              <span><span className="font-medium">{a.userName}</span> — {a.action} on {a.resource}</span>
              <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
