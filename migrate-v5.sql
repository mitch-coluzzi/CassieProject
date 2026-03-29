-- v5 Migration — Add recipe URL to menu items
-- Run this in the Supabase SQL Editor

alter table menu_items add column recipe_url text default '';
