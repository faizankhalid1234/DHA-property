import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  Users, Building2, Home, DollarSign,
  Grid3X3, ShoppingCart, ChevronRight, Activity,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: '13px',
  },
};

function KpiCard({ icon: Icon, label, value, gradient, accent }) {
  return (
    <div className={`dash-kpi ${accent}`}>
      <div className="dash-kpi-glow" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="dash-kpi-label">{label}</p>
          <p className="dash-kpi-value">{value}</p>
        </div>
        <div className={`dash-kpi-icon bg-gradient-to-br ${gradient}`}>
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children, empty }) {
  return (
    <div className="dash-chart-card">
      <div className="dash-chart-header">
        <div className="flex items-center gap-3">
          <div className="dash-chart-icon"><Icon size={18} /></div>
          <div>
            <h3 className="font-bold text-navy">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      {empty ? (
        <div className="dash-empty">
          <Activity size={32} className="text-slate-300 mb-2" />
          <p>No data yet</p>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2">{children}</div>
      )}
    </div>
  );
}

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dash-skeleton h-40 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="dash-skeleton h-28" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="dash-skeleton h-72" />
          <div className="dash-skeleton h-72" />
        </div>
      </div>
    );
  }

  const { overview, statusDistribution, propertyByBlock, monthlyRegistrations, recentCustomers, recentActivities } = data || {};

  const statusData = statusDistribution?.map((s) => ({
    name: s._id?.charAt(0).toUpperCase() + s._id?.slice(1) || 'Unknown',
    value: s.count,
  })) || [];

  const blockData = propertyByBlock?.map((b) => ({
    name: b._id?.length > 12 ? `${b._id.slice(0, 10)}…` : b._id,
    fullName: b._id,
    properties: b.count,
  })) || [];

  const regData = monthlyRegistrations?.map((m) => ({
    month: m._id?.slice(5) || m._id,
    customers: m.count,
  })) || [];

  const quickLinks = [
    { to: '/properties', label: 'Properties', icon: Building2, desc: 'Manage plots & houses' },
    { to: '/customers', label: 'Customers', icon: Users, desc: 'Add & verify owners' },
    { to: '/blocks', label: 'Blocks', icon: Grid3X3, desc: 'Housing blocks' },
    { to: '/sales', label: 'Property Sales', icon: ShoppingCart, desc: 'Approve pending sales' },
  ];

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="dash-page">
      {/* Hero welcome */}
      <div className="dash-hero">
        <div className="dash-hero-pattern" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{today}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-blue-100/80 mt-2 max-w-xl">
              DHA Housing Scheme — live overview of properties, customers, and system activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to} className="dash-quick-link">
                <link.icon size={16} />
                {link.label}
                <ChevronRight size={14} className="opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <KpiCard icon={Users} label="Total Customers" value={overview?.totalCustomers || 0} gradient="from-blue-500 to-blue-700" accent="dash-kpi-blue" />
        <KpiCard icon={Building2} label="Total Properties" value={overview?.totalProperties || 0} gradient="from-amber-400 to-amber-600" accent="dash-kpi-gold" />
        <KpiCard
          icon={Home}
          label="Plots & Houses"
          value={`${overview?.totalPlots || 0} / ${overview?.totalHouses || 0}`}
          gradient="from-emerald-500 to-teal-600"
          accent="dash-kpi-green"
        />
        <KpiCard
          icon={DollarSign}
          label="Portfolio Value"
          value={`PKR ${((overview?.totalRevenue || 0) / 1e6).toFixed(1)}M`}
          gradient="from-violet-500 to-indigo-600"
          accent="dash-kpi-purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Status Distribution" subtitle="Breakdown by property status" icon={Activity} empty={!statusData.length}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Properties by Block" subtitle="Top blocks by count" icon={Grid3X3} empty={!blockData.length}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={blockData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''} />
              <Bar dataKey="properties" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Registrations + Recent customers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <ChartCard title="New Customer Registrations" subtitle="Last 6 months" icon={Users} empty={!regData.length}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={regData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip {...CHART_TOOLTIP} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#d4af37"
                  strokeWidth={3}
                  dot={{ fill: '#d4af37', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#172554' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="dash-chart-icon"><Users size={18} /></div>
                <div>
                  <h3 className="font-bold text-navy">Recent Customers</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Latest registrations</p>
                </div>
              </div>
              <Link to="/customers" className="text-xs font-semibold text-royal hover:underline">View all</Link>
            </div>
          </div>
          <div className="space-y-1">
            {!recentCustomers?.length ? (
              <div className="dash-empty py-8"><p>No customers yet</p></div>
            ) : recentCustomers.map((c) => (
              <div key={c._id} className="dash-customer-row">
                <div className="dash-avatar">{initials(c.fullName)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{c.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{c.email}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(c.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="dash-chart-card">
        <div className="dash-chart-header">
          <div className="flex items-center gap-3">
            <div className="dash-chart-icon"><Activity size={18} /></div>
            <div>
              <h3 className="font-bold text-navy">Recent Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest system actions</p>
            </div>
          </div>
        </div>
        {!recentActivities?.length ? (
          <div className="dash-empty py-8"><p>No activity recorded yet</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.slice(0, 8).map((a, i) => (
              <div key={a._id} className="dash-activity-row">
                <div className="dash-activity-dot" style={{ opacity: 1 - i * 0.08 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-navy">{a.userName || 'System'}</span>
                    {' '}<span className="text-slate-500">{a.action}</span>{' '}
                    <span className="font-medium">{a.resource}</span>
                  </p>
                </div>
                <time className="text-xs text-slate-400 shrink-0">
                  {new Date(a.createdAt).toLocaleString('en-PK', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
