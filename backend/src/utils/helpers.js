export const validateCNIC = (cnic) => {
  const cleaned = cnic.replace(/[-\s]/g, '');
  return /^\d{13}$/.test(cleaned);
};

export const formatCNIC = (cnic) => {
  const cleaned = cnic.replace(/[-\s]/g, '');
  if (cleaned.length !== 13) return cnic;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
};

export const PLOT_SIZES = ['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', 'Custom Size'];

export const PROPERTY_TYPES = ['plot', 'house', 'commercial'];

export const PROPERTY_STATUSES = ['active', 'pending', 'inactive', 'case'];

export const USER_ROLES = ['super_admin', 'admin', 'customer'];

export const CASE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export const DOCUMENT_TYPES = [
  'registry',
  'transfer_letter',
  'ownership_certificate',
  'noc',
  'image',
  'legal',
  'other',
];
