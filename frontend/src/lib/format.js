const pkr = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

/** formatPrice(1250) -> "Rs 1,250" */
export const formatPrice = (value) => `Rs ${pkr.format(Math.round(Number(value) || 0))}`;

/** Compact number for KPIs: 1.2M, 48.5k */
export const formatCompact = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Intl.DateTimeFormat('en-GB', opts).format(new Date(value)) : '';

export const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '';

/** "3 min ago", "yesterday", "12 Oct" */
export const timeAgo = (value) => {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 172800) return 'yesterday';
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return formatDate(value, { day: 'numeric', month: 'short' });
};

export const discountPercent = (price, compareAt) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

export const pluralize = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

export const shortOrderId = (order) => order?.orderNumber || `#${String(order?._id || '').slice(-6).toUpperCase()}`;

export const STATUS_LABELS = {
  processing: 'Processing',
  confirmed: 'Confirmed',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};
