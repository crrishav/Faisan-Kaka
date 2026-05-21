export const normalizeMoneyValue = (value, fallbackText = '') => {
  const direct = Number(value);
  if (Number.isFinite(direct) && direct >= 1) {
    return direct;
  }

  const fromFallback = Number(String(fallbackText || '').replace(/[^\d.]/g, ''));
  if (Number.isFinite(fromFallback) && fromFallback >= 1) {
    return fromFallback;
  }

  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }

  return Number.isFinite(fromFallback) ? fromFallback : 0;
};
