-- v3 Migration — Add badge column to menu_items
-- Run this in the Supabase SQL Editor

alter table menu_items add column badge text default 'auto' check (badge in ('auto', 'new', 'first', 'none'));
