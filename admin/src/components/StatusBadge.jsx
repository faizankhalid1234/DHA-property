const styles = {
  active: 'badge-active',
  pending: 'badge-pending',
  inactive: 'badge-inactive',
  case: 'badge-case',
  available: 'badge-available',
  owned: 'badge-owned',
  sale_pending: 'badge-sale',
  plot: 'badge-available',
  house: 'badge-owned',
  commercial: 'badge-case',
};

const friendlyLabels = {
  available: 'Available',
  owned: 'Owned',
  sale_pending: 'Sale Pending',
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  case: 'Legal Case',
  plot: 'Plot',
  house: 'House',
  commercial: 'Commercial',
};

export default function StatusBadge({ status, label }) {
  const key = status?.toLowerCase?.() || 'pending';
  const text = label || friendlyLabels[key] || status?.replace(/_/g, ' ') || '—';

  return (
    <span className={`status-pill ${styles[key] || 'badge-pending'}`}>
      {text}
    </span>
  );
}
