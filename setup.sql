-- Request A Treat — Supabase Setup
-- Run this in the Supabase SQL Editor (all at once)

-- 1. Create tables
create table users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  has_active_order boolean default false,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  treat text not null,
  pickup_date date not null,
  destination text not null check (destination in ('office', 'home')),
  status text default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz default now()
);

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  blocked_by_week boolean default false,
  created_at timestamptz default now()
);

-- 2. Seed users
insert into users (display_name) values
  ('Di S'),
  ('Paw Paw'),
  ('Gracie V'),
  ('Grace C'),
  ('Nicole W'),
  ('James F'),
  ('Dad'),
  ('Mom'),
  ('Celeste R'),
  ('Connor W'),
  ('Jen B');

-- 3. Photos table
create table photos (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  status text default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz default now()
);

-- 4. Photos RLS (public read/write for browser-only app)
alter table photos enable row level security;
create policy "Public read photos" on photos for select using (true);
create policy "Public insert photos" on photos for insert with check (true);
create policy "Public update photos" on photos for update using (true);
create policy "Public delete photos" on photos for delete using (true);

-- 5. Create storage bucket (do this in Supabase Dashboard > Storage > New Bucket)
-- Bucket name: treat-photos
-- Public: YES
-- Allowed MIME types: image/jpeg, image/png
-- Max file size: 5MB
