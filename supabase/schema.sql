-- Supabase order tracking schema for Faisan Kaka
-- Safe to apply on a fresh Postgres database.

create extension if not exists pgcrypto;

create type garment_type as enum ('hoodie', 'tshirt', 'pant');
create type print_placement as enum ('front', 'back', 'both');
create type payment_status as enum ('captured', 'pending', 'failed');
create type order_status as enum ('pending', 'printing', 'shipped', 'delivered');
create type coupon_discount_type as enum ('fixed', 'percent');

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),

  -- 1) Customer & Order Identity
  order_id text not null unique,
  order_datetime timestamptz not null default now(),
  customer_name text not null,
  phone_number text not null,
  shipping_address text not null,

  -- 2) Product & Design Specifics
  garment_type garment_type not null,
  size text not null,
  garment_color text not null,
  design_preview_url text not null,
  high_res_design_url text not null,
  print_placement print_placement not null,

  -- 3) Payment & Financials
  total_amount_paid numeric(12, 2) not null check (total_amount_paid >= 0),
  coupon_code text,
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  discounted_total_amount numeric(12, 2) not null default 0 check (discounted_total_amount >= 0),
  razorpay_payment_id text,
  payment_status payment_status not null default 'pending',
  rishav_share numeric(12, 2) not null default 0 check (rishav_share >= 0),
  saurabh_share numeric(12, 2) not null default 0 check (saurabh_share >= 0),

  -- 4) Fulfillment & Logistics
  order_status order_status not null default 'pending',
  shiprocket_tracking_id text,
  actual_shipping_cost numeric(12, 2) not null default 0 check (actual_shipping_cost >= 0),
  estimated_delivery_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_amount numeric(12, 2) not null default 0;
alter table public.orders add column if not exists discounted_total_amount numeric(12, 2) not null default 0;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type coupon_discount_type not null,
  discount_value numeric(12, 2) not null check (discount_value > 0),
  min_order_amount numeric(12, 2) not null default 0 check (min_order_amount >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit >= 1),
  used_count integer not null default 0 check (used_count >= 0),
  currency text not null default 'ALL' check (currency in ('INR', 'NPR', 'ALL')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_coupon_percentage_value
    check (discount_type <> 'percent' or discount_value <= 100),
  constraint chk_coupon_expiry_after_start
    check (expires_at is null or expires_at > starts_at),
  constraint chk_coupon_usage_limit
    check (usage_limit is null or used_count <= usage_limit)
);

create index if not exists idx_coupons_code on public.coupons(code);
create index if not exists idx_coupons_active on public.coupons(is_active);
create index if not exists idx_coupons_expires_at on public.coupons(expires_at);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  ip_address text not null,
  status text not null check (status in ('success', 'blocked', 'failed')),
  reason text,
  subtotal_amount numeric(12, 2) not null default 0 check (subtotal_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  currency text not null default 'ALL' check (currency in ('INR', 'NPR', 'ALL')),
  created_at timestamptz not null default now()
);

create table if not exists public.coupon_abuse_flags (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  ip_address text not null,
  reason text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_coupon_redemptions_coupon_ip_created
  on public.coupon_redemptions(coupon_id, ip_address, created_at desc);
create index if not exists idx_coupon_redemptions_status
  on public.coupon_redemptions(status);
create index if not exists idx_coupon_abuse_flags_ip_created
  on public.coupon_abuse_flags(ip_address, created_at desc);
create index if not exists idx_coupon_abuse_flags_coupon
  on public.coupon_abuse_flags(coupon_id);

create index if not exists idx_orders_order_datetime on public.orders(order_datetime desc);
create index if not exists idx_orders_customer_name on public.orders(customer_name);
create index if not exists idx_orders_phone_number on public.orders(phone_number);
create index if not exists idx_orders_order_status on public.orders(order_status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at
before update on public.coupons
for each row
execute function public.set_updated_at();
