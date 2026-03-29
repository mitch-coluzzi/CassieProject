-- v4 Migration — Add 'completed' as valid order status
-- Run this in the Supabase SQL Editor

alter table orders drop constraint orders_status_check;
alter table orders add constraint orders_status_check check (status in ('active', 'cancelled', 'completed'));
