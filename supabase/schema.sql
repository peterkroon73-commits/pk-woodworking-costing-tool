-- PK Woodworking Quote & Costing Tool — cross-device sync schema
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste
-- this whole file -> Run. Safe to re-run (uses IF NOT EXISTS / OR REPLACE
-- where possible), but it will error harmlessly on objects that already
-- exist rather than duplicating them.
--
-- Data model: one row per user per "table" of app data, holding the whole
-- object as JSONB. This mirrors the app's existing localStorage shape
-- exactly, so the sync layer in js/app.js is a straight read/write of the
-- same objects the app already works with - no separate schema to keep in
-- sync with app logic changes later.
--
-- Security model: Row Level Security restricts every row to the
-- authenticated user that owns it (auth.uid() = user_id). Since this is a
-- single-user tool, in practice only one Supabase Auth account will ever
-- exist for this project, and the app's PIN screen signs into that account
-- (PIN = password) before touching any of these tables.

-- ---------------------------------------------------------------------
-- app_settings: one row per user, holding the whole Settings object
-- (labour rate, overhead %, markup %, quote numbering, material price
-- list, etc.) as a single JSONB blob.
-- ---------------------------------------------------------------------
create table if not exists app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- quotes: one row per saved quote. id matches the quote's own client-side
-- id (uuid), so upserts are idempotent and deletes are straightforward.
-- ---------------------------------------------------------------------
create table if not exists quotes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists quotes_user_id_idx on quotes(user_id);

-- ---------------------------------------------------------------------
-- stock_entries: one row per Stock tab entry.
-- ---------------------------------------------------------------------
create table if not exists stock_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists stock_entries_user_id_idx on stock_entries(user_id);

-- ---------------------------------------------------------------------
-- waste_entries: one row per Waste Log entry.
-- ---------------------------------------------------------------------
create table if not exists waste_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists waste_entries_user_id_idx on waste_entries(user_id);

-- ---------------------------------------------------------------------
-- manual_income: one row per Manual Income tab entry (external/cash
-- payments or other non-quoted income).
-- ---------------------------------------------------------------------
create table if not exists manual_income (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists manual_income_user_id_idx on manual_income(user_id);

-- ---------------------------------------------------------------------
-- expenses: one row per Expenses & Receipts tab entry (material costs,
-- hardware runs, timber purchases, etc.).
-- ---------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists expenses_user_id_idx on expenses(user_id);

-- ---------------------------------------------------------------------
-- Row Level Security: every row is only visible/writable by the user
-- that owns it. Since the app signs into one fixed account (the PIN IS
-- the password for that account), this is what actually makes the PIN
-- screen a real security boundary rather than just a UI gate - the
-- anon/publishable key alone grants no access to this data.
-- ---------------------------------------------------------------------
alter table app_settings enable row level security;
alter table quotes enable row level security;
alter table stock_entries enable row level security;
alter table waste_entries enable row level security;
alter table manual_income enable row level security;
alter table expenses enable row level security;

drop policy if exists "app_settings_select_own" on app_settings;
drop policy if exists "app_settings_insert_own" on app_settings;
drop policy if exists "app_settings_update_own" on app_settings;
drop policy if exists "app_settings_delete_own" on app_settings;
create policy "app_settings_select_own" on app_settings for select using (auth.uid() = user_id);
create policy "app_settings_insert_own" on app_settings for insert with check (auth.uid() = user_id);
create policy "app_settings_update_own" on app_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "app_settings_delete_own" on app_settings for delete using (auth.uid() = user_id);

drop policy if exists "quotes_select_own" on quotes;
drop policy if exists "quotes_insert_own" on quotes;
drop policy if exists "quotes_update_own" on quotes;
drop policy if exists "quotes_delete_own" on quotes;
create policy "quotes_select_own" on quotes for select using (auth.uid() = user_id);
create policy "quotes_insert_own" on quotes for insert with check (auth.uid() = user_id);
create policy "quotes_update_own" on quotes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quotes_delete_own" on quotes for delete using (auth.uid() = user_id);

drop policy if exists "stock_entries_select_own" on stock_entries;
drop policy if exists "stock_entries_insert_own" on stock_entries;
drop policy if exists "stock_entries_update_own" on stock_entries;
drop policy if exists "stock_entries_delete_own" on stock_entries;
create policy "stock_entries_select_own" on stock_entries for select using (auth.uid() = user_id);
create policy "stock_entries_insert_own" on stock_entries for insert with check (auth.uid() = user_id);
create policy "stock_entries_update_own" on stock_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stock_entries_delete_own" on stock_entries for delete using (auth.uid() = user_id);

drop policy if exists "waste_entries_select_own" on waste_entries;
drop policy if exists "waste_entries_insert_own" on waste_entries;
drop policy if exists "waste_entries_update_own" on waste_entries;
drop policy if exists "waste_entries_delete_own" on waste_entries;
create policy "waste_entries_select_own" on waste_entries for select using (auth.uid() = user_id);
create policy "waste_entries_insert_own" on waste_entries for insert with check (auth.uid() = user_id);
create policy "waste_entries_update_own" on waste_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "waste_entries_delete_own" on waste_entries for delete using (auth.uid() = user_id);

drop policy if exists "manual_income_select_own" on manual_income;
drop policy if exists "manual_income_insert_own" on manual_income;
drop policy if exists "manual_income_update_own" on manual_income;
drop policy if exists "manual_income_delete_own" on manual_income;
create policy "manual_income_select_own" on manual_income for select using (auth.uid() = user_id);
create policy "manual_income_insert_own" on manual_income for insert with check (auth.uid() = user_id);
create policy "manual_income_update_own" on manual_income for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manual_income_delete_own" on manual_income for delete using (auth.uid() = user_id);

drop policy if exists "expenses_select_own" on expenses;
drop policy if exists "expenses_insert_own" on expenses;
drop policy if exists "expenses_update_own" on expenses;
drop policy if exists "expenses_delete_own" on expenses;
create policy "expenses_select_own" on expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete_own" on expenses for delete using (auth.uid() = user_id);
