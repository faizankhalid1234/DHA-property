const statusConfig = {
  active: { label: 'Active', class: 'status-active', icon: '🟢' },
  pending: { label: 'Pending', class: 'status-pending', icon: '🟡' },
  inactive: { label: 'Inactive', class: 'status-inactive', icon: '🔴' },
  case: { label: 'Case', class: 'status-case', icon: '⚖️' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={config.class}>
      {config.icon} {config.label}
    </span>
  );
}

export function AdminStatusBadge({ status }) {
  const colors = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    inactive: 'bg-red-100 text-red-700',
    case: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`status-badge ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}
