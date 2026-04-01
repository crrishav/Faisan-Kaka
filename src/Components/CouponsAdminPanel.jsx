import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createCoupon,
  formatCouponBadge,
  getCoupons,
  removeCoupon,
  updateCoupon,
} from '../lib/couponService.js';

const INITIAL_FORM = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minOrderAmount: '',
  usageLimit: '',
  startsAt: '',
  expiresAt: '',
  currency: 'ALL',
  isActive: true,
};

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const CouponsAdminPanel = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    const list = await getCoupons();
    setCoupons(list);
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = coupons.filter((c) => c.isActive).length;
    const expired = coupons.filter((c) => c.expiresAt && new Date(c.expiresAt).getTime() < now).length;
    const totalUses = coupons.reduce((acc, c) => acc + Number(c.usedCount || 0), 0);
    return { total: coupons.length, active, expired, totalUses };
  }, [coupons]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setError('');
  };

  const hydrateForm = (coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount || ''),
      usageLimit: coupon.usageLimit === null ? '' : String(coupon.usageLimit),
      startsAt: formatDateTimeLocal(coupon.startsAt),
      expiresAt: formatDateTimeLocal(coupon.expiresAt),
      currency: coupon.currency,
      isActive: coupon.isActive,
    });
    setEditingId(coupon.id);
    setError('');
  };

  const validateForm = () => {
    if (!form.code.trim()) return 'Coupon code is required.';
    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return 'Discount value must be greater than zero.';
    }
    if (form.discountType === 'percent' && discountValue > 100) {
      return 'Percentage discount cannot be greater than 100.';
    }
    const minOrder = Number(form.minOrderAmount || 0);
    if (!Number.isFinite(minOrder) || minOrder < 0) {
      return 'Minimum order amount is invalid.';
    }
    const usageLimit = form.usageLimit === '' ? null : Number(form.usageLimit);
    if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
      return 'Usage limit must be a whole number >= 1.';
    }

    const startsAt = toIsoOrNull(form.startsAt);
    const expiresAt = toIsoOrNull(form.expiresAt);
    if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
      return 'Expiry must be after the start date.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const payload = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      startsAt: toIsoOrNull(form.startsAt) || new Date().toISOString(),
      expiresAt: toIsoOrNull(form.expiresAt),
      currency: form.currency,
      isActive: form.isActive,
    };

    if (editingId) {
      await updateCoupon(editingId, payload);
      setToast('Coupon updated');
    } else {
      await createCoupon(payload);
      setToast('Coupon created');
    }

    await loadCoupons();
    resetForm();
    setSubmitting(false);
  };

  const handleDelete = async (couponId) => {
    await removeCoupon(couponId);
    await loadCoupons();
    if (editingId === couponId) {
      resetForm();
    }
    setToast('Coupon deleted');
  };

  const toggleActive = async (coupon) => {
    await updateCoupon(coupon.id, {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      usageLimit: coupon.usageLimit,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      currency: coupon.currency,
      isActive: !coupon.isActive,
      usedCount: coupon.usedCount,
    });
    await loadCoupons();
  };

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-sm font-black px-5 py-3 rounded-2xl shadow-xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Coupons', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Expired', value: stats.expired },
          { label: 'Total Uses', value: stats.totalUses },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-[20px] border-2 border-black/8 px-4 py-3">
            <p className="text-[10px] font-black tracking-[0.14em] uppercase text-black/35">{item.label}</p>
            <p className="text-2xl font-black text-black tracking-tighter mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4 items-start">
        <form onSubmit={handleSubmit} className="bg-white rounded-[28px] border-2 border-black/8 p-5 md:p-6 sticky top-24">
          <p className="text-[11px] font-black tracking-[0.18em] uppercase text-black/35 mb-1">
            {editingId ? 'Edit Coupon' : 'New Coupon'}
          </p>
          <h3 className="text-2xl font-black tracking-tighter text-black mb-5">
            {editingId ? form.code : 'Create Discount'}
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs font-black text-black/55">
              Code
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-sm font-bold uppercase tracking-wide outline-none focus:border-black/45"
              />
            </label>

            <label className="text-xs font-black text-black/55">
              Description
              <input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Launch discount"
                className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-sm font-semibold outline-none focus:border-black/45"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-black text-black/55">
                Type
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-sm font-semibold outline-none focus:border-black/45"
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </label>

              <label className="text-xs font-black text-black/55">
                Value
                <input
                  value={form.discountValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-sm font-semibold outline-none focus:border-black/45"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-black text-black/55">
                Min Order
                <input
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, minOrderAmount: e.target.value }))}
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-sm font-semibold outline-none focus:border-black/45"
                />
              </label>

              <label className="text-xs font-black text-black/55">
                Usage Limit
                <input
                  value={form.usageLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                  type="number"
                  min="1"
                  className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-sm font-semibold outline-none focus:border-black/45"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-black text-black/55">
                Starts At
                <input
                  value={form.startsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                  type="datetime-local"
                  className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-xs font-semibold outline-none focus:border-black/45"
                />
              </label>

              <label className="text-xs font-black text-black/55">
                Expires At
                <input
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  type="datetime-local"
                  className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-xs font-semibold outline-none focus:border-black/45"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-black text-black/55">
                Currency
                <select
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-black/12 bg-[#f7f7f7] px-3 text-sm font-semibold outline-none focus:border-black/45"
                >
                  <option value="ALL">All</option>
                  <option value="INR">INR</option>
                  <option value="NPR">NPR</option>
                </select>
              </label>

              <label className="text-xs font-black text-black/55 flex items-end gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-black/20"
                />
                Active Coupon
              </label>
            </div>
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}

          <div className="flex gap-2 mt-5">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-2xl bg-black text-white text-sm font-black hover:bg-black/85 transition-colors disabled:opacity-40"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="h-11 px-4 rounded-2xl bg-black/6 text-black text-sm font-black hover:bg-black/12 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="bg-white rounded-[28px] border-2 border-black/8 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-black tracking-tighter text-black">All Coupons</h3>
            <button
              type="button"
              onClick={loadCoupons}
              className="px-3 py-2 rounded-xl bg-black/6 text-black text-xs font-black hover:bg-black/12 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm font-semibold text-black/40">Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <p className="text-sm font-semibold text-black/40">No coupons created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
                return (
                  <div key={coupon.id} className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-black tracking-tight">{coupon.code}</p>
                        <p className="text-xs font-semibold text-black/45 mt-0.5">
                          {formatCouponBadge(coupon)}{coupon.description ? ` · ${coupon.description}` : ''}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-full ${
                          coupon.isActive && !isExpired
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {coupon.isActive && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 mt-3 text-[11px] font-semibold text-black/55">
                      <p>Min order: {coupon.minOrderAmount.toFixed(0)}</p>
                      <p>Currency: {coupon.currency}</p>
                      <p>
                        Uses: {coupon.usedCount}
                        {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ' / unlimited'}
                      </p>
                      <p>Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN') : 'Never'}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => hydrateForm(coupon)}
                        className="h-9 rounded-xl bg-black text-white text-xs font-black hover:bg-black/85 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(coupon)}
                        className="h-9 rounded-xl bg-black/6 text-black text-xs font-black hover:bg-black/12 transition-colors"
                      >
                        {coupon.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateCoupon(coupon.id, {
                            code: coupon.code,
                            description: coupon.description,
                            discountType: coupon.discountType,
                            discountValue: coupon.discountValue,
                            minOrderAmount: coupon.minOrderAmount,
                            usageLimit: coupon.usageLimit,
                            startsAt: coupon.startsAt,
                            expiresAt: coupon.expiresAt,
                            currency: coupon.currency,
                            isActive: coupon.isActive,
                            usedCount: 0,
                          }).then(loadCoupons)
                        }
                        className="h-9 rounded-xl bg-black/6 text-black text-xs font-black hover:bg-black/12 transition-colors"
                      >
                        Reset Uses
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon.id)}
                        className="h-9 rounded-xl bg-red-500/10 text-red-600 text-xs font-black hover:bg-red-500/15 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponsAdminPanel;
