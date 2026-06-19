const statusConfig = {
  active: { label: 'Active', class: 'status-active', icon: '🟢' },
  pending: { label: 'Pending', class: 'status-pending', icon: '🟡' },
  inactive: { label: 'Inactive', class: 'status-inactive', icon: '🔴' },
  case: { label: 'Case', class: 'status-case', icon: '⚖️' },
  available: { label: 'Available', class: 'status-active', icon: '🟢' },
  owned: { label: 'Owned', class: 'status-pending', icon: '🏠' },
  sale_pending: { label: 'Sale Pending', class: 'status-pending', icon: '📋' },
  plot: { label: 'Plot', class: 'status-active', icon: '📐' },
  house: { label: 'House', class: 'status-active', icon: '🏠' },
  commercial: { label: 'Commercial', class: 'status-case', icon: '🏢' },
};

export default function StatusBadge({ status, label }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={config.class}>
      {config.icon} {label || config.label}
    </span>
  );
}

export function AdminStatusBadge({ status }) {
  const colors = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300',
    case: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300',
  };
  return (
    <span className={`status-badge px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}
