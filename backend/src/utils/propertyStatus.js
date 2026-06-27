export const PROPERTY_STATUSES = ['active', 'pending', 'inactive', 'case'];

export const canSellOrBuy = (status) => status === 'active';

export const canAssign = (status) => ['active', 'pending'].includes(status);

export const statusMessage = (status, action = 'sell') => {
  const labels = {
    active: 'Active',
    pending: 'Pending verification',
    inactive: 'Inactive',
    case: 'Under legal case',
  };
  const label = labels[status] || status;
  if (action === 'assign') {
    return `Cannot assign — property status is ${label}. Set status to Active or Pending first.`;
  }
  return `Cannot ${action} — property status is ${label}. Only Active properties can be sold or bought.`;
};
