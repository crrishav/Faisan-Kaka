export const EKART_TRACKING_BASE = 'https://ekartlogistics.com/ekartlogistics-web/shipmenttrack/';

export const RETURN_STATUS_OPTIONS = [
  'No Return',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Returned',
];

export const RETURN_REASON_OPTIONS = [
  'Size issue (Too large / Too small)',
  'Damaged item / Defective quality',
  'Wrong item received',
  'Color / Design not as pictured',
  'Changed my mind / No longer needed',
  'Other (Please specify below)',
];

export const normalizeText = (value) => String(value ?? '').trim();

export const normalizeOrderIdInput = (value) => normalizeText(value)
  .replace(/^#/, '')
  .replace(/^ord-/i, '')
  .toUpperCase();

export const normalizePhoneInput = (value) => normalizeText(value).replace(/\s+/g, '');

export const normalizeReturnStatus = (value) => {
  const status = normalizeText(value);
  if (!status || status === 'Pending') return 'No Return';
  if (status === 'Pending Approval') return status;
  if (RETURN_STATUS_OPTIONS.includes(status)) return status;
  return 'No Return';
};

export const buildEkartTrackingUrl = (trackingId) => {
  const normalized = normalizeText(trackingId);
  if (!normalized) return '';
  return `${EKART_TRACKING_BASE}${encodeURIComponent(normalized)}`;
};

export const isReturnEligibleStatus = (status) => {
  const normalized = normalizeText(status).toLowerCase();
  return normalized === 'delivered' || normalized === 'shipped';
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);