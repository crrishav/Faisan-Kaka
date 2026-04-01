import { hasSupabaseConfig, supabase } from './supabaseClient.js';

const LOCAL_STORAGE_KEY = 'fk_coupons';
const LOCAL_REDEMPTION_LOG_KEY = 'fk_coupon_redemptions';
const LOCAL_ATTEMPT_LOG_KEY = 'fk_coupon_attempts';
const LOCAL_ABUSE_FLAG_KEY = 'fk_coupon_abuse_flags';
const LOCAL_CLIENT_ID_KEY = 'fk_coupon_client_id';
const IP_CACHE_KEY = 'fk_coupon_ip_cache';

const DEFAULT_PER_IP_REDEMPTION_LIMIT = 3;
const REDEMPTION_WINDOW_MS = 24 * 60 * 60 * 1000;
const ABUSE_WINDOW_MS = 30 * 60 * 1000;
const ABUSE_ATTEMPT_THRESHOLD = 5;
const MAX_LOCAL_LOG_SIZE = 500;

const nowIso = () => new Date().toISOString();

const readLocalCoupons = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalCoupons = (coupons) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(coupons));
  } catch {
    // Ignore localStorage write failures gracefully.
  }
};

const readJsonArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeJsonArray = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage write failures gracefully.
  }
};

const appendLocalLog = (key, entry) => {
  const current = readJsonArray(key);
  const next = [...current, entry].slice(-MAX_LOCAL_LOG_SIZE);
  writeJsonArray(key, next);
};

const ensureClientId = () => {
  try {
    const current = localStorage.getItem(LOCAL_CLIENT_ID_KEY);
    if (current) return current;
    const created = `anon-${crypto.randomUUID()}`;
    localStorage.setItem(LOCAL_CLIENT_ID_KEY, created);
    return created;
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
};

const withTimeout = async (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });
  const result = await Promise.race([promise, timeoutPromise]);
  clearTimeout(timeoutId);
  return result;
};

const getClientAddress = async () => {
  if (typeof window === 'undefined') return 'server';

  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (cached) return cached;
  } catch {
    // Ignore cache lookup failures.
  }

  const lookup = fetch('https://api.ipify.org?format=json')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => String(data?.ip || '').trim())
    .catch(() => '');

  const resolvedIp = await withTimeout(lookup, 1500);
  const address = resolvedIp || ensureClientId();

  try {
    sessionStorage.setItem(IP_CACHE_KEY, address);
  } catch {
    // Ignore cache write failures.
  }

  return address;
};

const recentSinceIso = (windowMs) => new Date(Date.now() - windowMs).toISOString();

const isWithinMs = (iso, windowMs) => {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= windowMs;
};

const flagAbuseLocally = ({ couponId = null, couponCode = '', ipAddress, reason, meta = {} }) => {
  appendLocalLog(LOCAL_ABUSE_FLAG_KEY, {
    id: crypto.randomUUID(),
    couponId,
    couponCode,
    ipAddress,
    reason,
    meta,
    createdAt: nowIso(),
  });
};

const flagAbuseInSupabase = async ({ couponId = null, couponCode = '', ipAddress, reason, meta = {} }) => {
  if (!hasSupabaseConfig || !supabase) return;
  await supabase.from('coupon_abuse_flags').insert({
    coupon_id: couponId,
    coupon_code: couponCode,
    ip_address: ipAddress,
    reason,
    meta,
  });
};

const flagCouponAbuse = async (payload) => {
  flagAbuseLocally(payload);
  await flagAbuseInSupabase(payload);
};

const countRecentLocalFailures = ({ ipAddress }) => {
  const attempts = readJsonArray(LOCAL_ATTEMPT_LOG_KEY);
  return attempts.filter(
    (entry) => entry?.ipAddress === ipAddress && entry?.outcome === 'failed' && isWithinMs(entry?.createdAt, ABUSE_WINDOW_MS)
  ).length;
};

const logValidationAttempt = ({ ipAddress, couponId = null, couponCode = '', outcome, reason = '', subtotal = 0, currency = 'ALL' }) => {
  appendLocalLog(LOCAL_ATTEMPT_LOG_KEY, {
    id: crypto.randomUUID(),
    ipAddress,
    couponId,
    couponCode,
    outcome,
    reason,
    subtotal: Number(subtotal || 0),
    currency,
    createdAt: nowIso(),
  });
};

const countRecentLocalSuccessfulRedemptions = ({ couponId, ipAddress }) => {
  const redemptions = readJsonArray(LOCAL_REDEMPTION_LOG_KEY);
  return redemptions.filter(
    (entry) =>
      entry?.couponId === couponId &&
      entry?.ipAddress === ipAddress &&
      entry?.status === 'success' &&
      isWithinMs(entry?.createdAt, REDEMPTION_WINDOW_MS)
  ).length;
};

const countRecentSupabaseSuccessfulRedemptions = async ({ couponId, ipAddress }) => {
  if (!hasSupabaseConfig || !supabase) return null;

  const { count, error } = await supabase
    .from('coupon_redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', couponId)
    .eq('ip_address', ipAddress)
    .eq('status', 'success')
    .gte('created_at', recentSinceIso(REDEMPTION_WINDOW_MS));

  if (error) return null;
  return Number(count || 0);
};

const checkPerIpRedemptionLimit = async ({ couponId, couponCode, ipAddress }) => {
  const limit = DEFAULT_PER_IP_REDEMPTION_LIMIT;
  let usageCount = countRecentLocalSuccessfulRedemptions({ couponId, ipAddress });

  const supabaseCount = await countRecentSupabaseSuccessfulRedemptions({ couponId, ipAddress });
  if (Number.isFinite(supabaseCount)) {
    usageCount = supabaseCount;
  }

  if (usageCount >= limit) {
    const reason = `Per-IP redemption limit reached (${limit} in 24h).`;
    await flagCouponAbuse({
      couponId,
      couponCode,
      ipAddress,
      reason,
      meta: {
        limit,
        windowHours: 24,
        usageCount,
      },
    });
    return { ok: false, reason };
  }

  return { ok: true, reason: '' };
};

const recordRedemptionEvent = async ({ couponId, couponCode, ipAddress, status, reason = '', subtotal = 0, total = 0, currency = 'ALL' }) => {
  appendLocalLog(LOCAL_REDEMPTION_LOG_KEY, {
    id: crypto.randomUUID(),
    couponId,
    couponCode,
    ipAddress,
    status,
    reason,
    subtotal: Number(subtotal || 0),
    total: Number(total || 0),
    currency,
    createdAt: nowIso(),
  });

  if (!hasSupabaseConfig || !supabase) return;

  await supabase.from('coupon_redemptions').insert({
    coupon_id: couponId,
    coupon_code: couponCode,
    ip_address: ipAddress,
    status,
    reason,
    subtotal_amount: Number(subtotal || 0),
    total_amount: Number(total || 0),
    currency,
  });
};

const toUpperCode = (value) => String(value || '').trim().toUpperCase();

const normalizeCoupon = (coupon) => {
  if (!coupon || typeof coupon !== 'object') return null;

  const nowIso = new Date().toISOString();
  const discountType = coupon.discount_type === 'fixed' ? 'fixed' : 'percent';

  return {
    id: coupon.id || coupon.code || crypto.randomUUID(),
    code: toUpperCode(coupon.code),
    description: String(coupon.description || '').trim(),
    discountType,
    discountValue: Number(coupon.discount_value ?? 0),
    minOrderAmount: Number(coupon.min_order_amount ?? 0),
    startsAt: coupon.starts_at || nowIso,
    expiresAt: coupon.expires_at || null,
    usageLimit:
      coupon.usage_limit === null || coupon.usage_limit === undefined
        ? null
        : Number(coupon.usage_limit),
    usedCount: Number(coupon.used_count ?? 0),
    isActive: Boolean(coupon.is_active ?? true),
    currency: ['INR', 'NPR', 'ALL'].includes(coupon.currency) ? coupon.currency : 'ALL',
    createdAt: coupon.created_at || nowIso,
    updatedAt: coupon.updated_at || nowIso,
  };
};

const mapToStorageShape = (coupon) => ({
  id: coupon.id,
  code: coupon.code,
  description: coupon.description,
  discount_type: coupon.discountType,
  discount_value: coupon.discountValue,
  min_order_amount: coupon.minOrderAmount,
  starts_at: coupon.startsAt,
  expires_at: coupon.expiresAt,
  usage_limit: coupon.usageLimit,
  used_count: coupon.usedCount,
  is_active: coupon.isActive,
  currency: coupon.currency,
  created_at: coupon.createdAt,
  updated_at: coupon.updatedAt,
});

const compareCoupons = (a, b) => {
  const aTime = new Date(a.createdAt || 0).getTime();
  const bTime = new Date(b.createdAt || 0).getTime();
  return bTime - aTime;
};

export const getCoupons = async () => {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      return (data || []).map(normalizeCoupon).filter(Boolean);
    }
  }

  return readLocalCoupons().map(normalizeCoupon).filter(Boolean).sort(compareCoupons);
};

const nowWithinWindow = (coupon) => {
  const now = Date.now();
  const startsAt = coupon.startsAt ? new Date(coupon.startsAt).getTime() : null;
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : null;

  if (startsAt && now < startsAt) {
    return { ok: false, reason: 'This coupon is not active yet.' };
  }
  if (expiresAt && now > expiresAt) {
    return { ok: false, reason: 'This coupon has expired.' };
  }
  return { ok: true, reason: '' };
};

const checkUsageLimit = (coupon) => {
  if (coupon.usageLimit === null || coupon.usageLimit === undefined) {
    return { ok: true, reason: '' };
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, reason: 'Usage limit reached for this coupon.' };
  }

  return { ok: true, reason: '' };
};

const computeDiscount = (coupon, subtotal) => {
  if (coupon.discountType === 'fixed') {
    return Math.min(subtotal, Math.max(0, coupon.discountValue));
  }

  const percent = Math.max(0, Math.min(100, coupon.discountValue));
  return Number(((subtotal * percent) / 100).toFixed(2));
};

export const validateCouponCode = async ({ code, subtotal, currency }) => {
  const normalizedCode = toUpperCode(code);
  if (!normalizedCode) {
    return { ok: false, reason: 'Enter a coupon code.' };
  }

  const ipAddress = await getClientAddress();
  const recentFailures = countRecentLocalFailures({ ipAddress });
  if (recentFailures >= ABUSE_ATTEMPT_THRESHOLD) {
    const reason = 'Too many invalid coupon attempts. Please try again later.';
    await flagCouponAbuse({
      couponCode: normalizedCode,
      ipAddress,
      reason,
      meta: {
        recentFailures,
        threshold: ABUSE_ATTEMPT_THRESHOLD,
        windowMinutes: 30,
      },
    });
    return { ok: false, reason };
  }

  const coupons = await getCoupons();
  const coupon = coupons.find((item) => item.code === normalizedCode);

  if (!coupon) {
    logValidationAttempt({
      ipAddress,
      couponCode: normalizedCode,
      outcome: 'failed',
      reason: 'Coupon not found.',
      subtotal,
      currency,
    });
    return { ok: false, reason: 'Coupon not found.' };
  }

  if (!coupon.isActive) {
    logValidationAttempt({
      ipAddress,
      couponId: coupon.id,
      couponCode: coupon.code,
      outcome: 'failed',
      reason: 'This coupon is currently inactive.',
      subtotal,
      currency,
    });
    return { ok: false, reason: 'This coupon is currently inactive.' };
  }

  if (coupon.currency !== 'ALL' && coupon.currency !== currency) {
    logValidationAttempt({
      ipAddress,
      couponId: coupon.id,
      couponCode: coupon.code,
      outcome: 'failed',
      reason: `This coupon is valid only for ${coupon.currency} orders.`,
      subtotal,
      currency,
    });
    return { ok: false, reason: `This coupon is valid only for ${coupon.currency} orders.` };
  }

  const timeWindow = nowWithinWindow(coupon);
  if (!timeWindow.ok) {
    logValidationAttempt({
      ipAddress,
      couponId: coupon.id,
      couponCode: coupon.code,
      outcome: 'failed',
      reason: timeWindow.reason,
      subtotal,
      currency,
    });
    return { ok: false, reason: timeWindow.reason };
  }

  const usage = checkUsageLimit(coupon);
  if (!usage.ok) {
    logValidationAttempt({
      ipAddress,
      couponId: coupon.id,
      couponCode: coupon.code,
      outcome: 'failed',
      reason: usage.reason,
      subtotal,
      currency,
    });
    return { ok: false, reason: usage.reason };
  }

  if (subtotal < coupon.minOrderAmount) {
    logValidationAttempt({
      ipAddress,
      couponId: coupon.id,
      couponCode: coupon.code,
      outcome: 'failed',
      reason: `Minimum order of ${coupon.minOrderAmount.toFixed(0)} required for this coupon.`,
      subtotal,
      currency,
    });
    return {
      ok: false,
      reason: `Minimum order of ${coupon.minOrderAmount.toFixed(0)} required for this coupon.`,
    };
  }

  const perIpLimit = await checkPerIpRedemptionLimit({
    couponId: coupon.id,
    couponCode: coupon.code,
    ipAddress,
  });
  if (!perIpLimit.ok) {
    logValidationAttempt({
      ipAddress,
      couponId: coupon.id,
      couponCode: coupon.code,
      outcome: 'failed',
      reason: perIpLimit.reason,
      subtotal,
      currency,
    });
    await recordRedemptionEvent({
      couponId: coupon.id,
      couponCode: coupon.code,
      ipAddress,
      status: 'blocked',
      reason: perIpLimit.reason,
      subtotal,
      total: subtotal,
      currency,
    });
    return { ok: false, reason: perIpLimit.reason };
  }

  const discountAmount = computeDiscount(coupon, subtotal);

  if (discountAmount <= 0) {
    logValidationAttempt({
      ipAddress,
      couponId: coupon.id,
      couponCode: coupon.code,
      outcome: 'failed',
      reason: 'Coupon discount amount is invalid.',
      subtotal,
      currency,
    });
    return { ok: false, reason: 'Coupon discount amount is invalid.' };
  }

  logValidationAttempt({
    ipAddress,
    couponId: coupon.id,
    couponCode: coupon.code,
    outcome: 'passed',
    reason: '',
    subtotal,
    currency,
  });

  return {
    ok: true,
    coupon,
    discountAmount,
  };
};

const toDbShape = (input) => ({
  code: toUpperCode(input.code),
  description: String(input.description || '').trim(),
  discount_type: input.discountType,
  discount_value: Number(input.discountValue),
  min_order_amount: Number(input.minOrderAmount || 0),
  starts_at: input.startsAt || new Date().toISOString(),
  expires_at: input.expiresAt || null,
  usage_limit:
    input.usageLimit === '' || input.usageLimit === null || input.usageLimit === undefined
      ? null
      : Number(input.usageLimit),
  used_count: Number(input.usedCount || 0),
  is_active: Boolean(input.isActive ?? true),
  currency: input.currency || 'ALL',
});

export const createCoupon = async (input) => {
  const payload = toDbShape(input);

  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase.from('coupons').insert(payload).select('*').single();
    if (!error && data) {
      return normalizeCoupon(data);
    }
  }

  const nextCoupon = normalizeCoupon({
    id: crypto.randomUUID(),
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const coupons = readLocalCoupons().map(normalizeCoupon).filter(Boolean);
  writeLocalCoupons([mapToStorageShape(nextCoupon), ...coupons.map(mapToStorageShape)]);
  return nextCoupon;
};

export const updateCoupon = async (id, updates) => {
  const payload = toDbShape(updates);

  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('coupons')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      return normalizeCoupon(data);
    }
  }

  const coupons = readLocalCoupons().map(normalizeCoupon).filter(Boolean);
  const next = coupons.map((coupon) => {
    if (coupon.id !== id) return coupon;
    return normalizeCoupon({ ...mapToStorageShape(coupon), ...payload, id });
  });
  writeLocalCoupons(next.map(mapToStorageShape));
  return next.find((coupon) => coupon.id === id) || null;
};

export const removeCoupon = async (id) => {
  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (!error) return true;
  }

  const coupons = readLocalCoupons().map(normalizeCoupon).filter(Boolean);
  writeLocalCoupons(coupons.filter((coupon) => coupon.id !== id).map(mapToStorageShape));
  return true;
};

export const incrementCouponUsage = async (couponId, context = {}) => {
  if (!couponId) return { ok: false, reason: 'Missing coupon id.' };

  const ipAddress = await getClientAddress();

  const coupons = await getCoupons();
  const coupon = coupons.find((item) => item.id === couponId);
  const couponCode = coupon?.code || toUpperCode(context.code || '');

  const perIpLimit = await checkPerIpRedemptionLimit({
    couponId,
    couponCode,
    ipAddress,
  });

  if (!perIpLimit.ok) {
    await recordRedemptionEvent({
      couponId,
      couponCode,
      ipAddress,
      status: 'blocked',
      reason: perIpLimit.reason,
      subtotal: Number(context.subtotal || 0),
      total: Number(context.total || 0),
      currency: context.currency || 'ALL',
    });
    return { ok: false, reason: perIpLimit.reason };
  }

  if (hasSupabaseConfig && supabase) {
    const { data } = await supabase.from('coupons').select('used_count').eq('id', couponId).single();
    const nextCount = Number(data?.used_count || 0) + 1;
    await supabase.from('coupons').update({ used_count: nextCount }).eq('id', couponId);
    await recordRedemptionEvent({
      couponId,
      couponCode,
      ipAddress,
      status: 'success',
      reason: '',
      subtotal: Number(context.subtotal || 0),
      total: Number(context.total || 0),
      currency: context.currency || 'ALL',
    });
    return { ok: true, reason: '' };
  }

  const localCoupons = readLocalCoupons().map(normalizeCoupon).filter(Boolean);
  const next = localCoupons.map((couponItem) => {
    if (couponItem.id !== couponId) return couponItem;
    return {
      ...couponItem,
      usedCount: couponItem.usedCount + 1,
      updatedAt: nowIso(),
    };
  });
  writeLocalCoupons(next.map(mapToStorageShape));

  await recordRedemptionEvent({
    couponId,
    couponCode,
    ipAddress,
    status: 'success',
    reason: '',
    subtotal: Number(context.subtotal || 0),
    total: Number(context.total || 0),
    currency: context.currency || 'ALL',
  });

  return { ok: true, reason: '' };
};

export const formatCouponBadge = (coupon) => {
  if (!coupon) return '';
  if (coupon.discountType === 'fixed') {
    return `${coupon.currency === 'NPR' ? 'Rs.' : coupon.currency === 'ALL' ? '' : coupon.currency + ' '}${coupon.discountValue.toFixed(0)} OFF`;
  }
  return `${coupon.discountValue.toFixed(0)}% OFF`;
};
