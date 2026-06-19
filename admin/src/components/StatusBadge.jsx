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

export default function StatusBadge({ status, label }) {
  const key = status?.toLowerCase?.() || 'pending';
  const text = label || status?.replace(/_/g, ' ') || '—';

  return (
    <span className={`status-pill ${styles[key] || 'badge-pending'}`}>
      {text}
    </span>
  );
}
