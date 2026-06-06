-- Run in Supabase SQL Editor for persistent storage

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  farmer_id text,
  crop text,
  status text,
  steps jsonb,
  deal_value_inr integer,
  income_uplift_pct numeric,
  result jsonb,
  created_at timestamptz default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  quantity_tons numeric,
  buyer text,
  final_price integer,
  deal_value_inr integer,
  created_at timestamptz default now()
);

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  message text not null,
  intent text,
  crop text,
  language text default 'te',
  created_at timestamptz default now()
);

create index if not exists idx_whatsapp_phone on whatsapp_messages(phone);
create index if not exists idx_workflows_created on workflows(created_at desc);
