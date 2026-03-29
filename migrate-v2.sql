-- Request A Treat — v2 Migration
-- Run this in the Supabase SQL Editor

-- 1. Menu items table
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text not null default '🍰',
  description text not null default '',
  lead_days integer not null default 0,
  ingredients text[] not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Menu items RLS
alter table menu_items enable row level security;
create policy "Public read menu_items" on menu_items for select using (true);
create policy "Public insert menu_items" on menu_items for insert with check (true);
create policy "Public update menu_items" on menu_items for update using (true);
create policy "Public delete menu_items" on menu_items for delete using (true);

-- Seed current menu
insert into menu_items (name, emoji, description, lead_days, ingredients, sort_order) values
  ('Banana Cream Pie', '🍌', 'Silky smooth banana cream piled high in a buttery crust. Worth the wait!', 7, ARRAY['2 cups whole milk','3 egg yolks','½ cup sugar','3 tbsp cornstarch','2 tbsp butter','1 tsp vanilla','3 ripe bananas','1 pre-baked pie crust','1 cup whipped cream'], 1),
  ('Pumpkin Pie', '🎃', 'Warm spiced pumpkin in a flaky crust. A fall favorite!', 5, ARRAY['1 can (15 oz) pumpkin puree','¾ cup sugar','1 tsp cinnamon','½ tsp ginger','¼ tsp cloves','2 eggs','1 can evaporated milk','1 unbaked pie crust'], 2),
  ('Banana Bread', '🍞', 'Super moist and packed with banana flavor. Great for breakfast or a snack!', 7, ARRAY['3 very ripe bananas','⅓ cup melted butter','¾ cup sugar','1 egg','1 tsp vanilla','1 tsp baking soda','Pinch of salt','1½ cups flour'], 3),
  ('Pumpkin Muffins', '🧁', 'Fluffy spiced pumpkin muffins with a golden top. A dozen per order!', 5, ARRAY['1¾ cups flour','1 cup sugar','1 tsp baking soda','2 tsp pumpkin spice','½ tsp salt','2 eggs','1 cup pumpkin puree','½ cup vegetable oil','¼ cup water'], 4),
  ('Chocolate Muffins', '🍫', 'Rich, fudgy chocolate muffins. A dozen per order — share if you dare!', 0, ARRAY['1¾ cups flour','¾ cup cocoa powder','1½ cups sugar','2 tsp baking powder','½ tsp salt','2 eggs','1 cup milk','½ cup vegetable oil','1 tsp vanilla','1 cup chocolate chips'], 5),
  ('Chocolate Cake', '🎂', 'A classic layer cake with rich chocolate frosting. Serves 8–10!', 0, ARRAY['2 cups flour','2 cups sugar','¾ cup cocoa powder','2 tsp baking soda','1 tsp salt','2 eggs','1 cup buttermilk','1 cup strong black coffee','½ cup vegetable oil','2 tsp vanilla','Chocolate buttercream frosting'], 6),
  ('Vanilla Cake', '🍰', 'Light and fluffy vanilla layer cake with creamy vanilla frosting. A crowd pleaser!', 0, ARRAY['2½ cups flour','2 cups sugar','1 tbsp baking powder','½ tsp salt','1 cup butter (softened)','4 eggs','1 cup whole milk','2 tsp vanilla extract','Vanilla buttercream frosting'], 7);

-- 2. Suggestions table
create table suggestions (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  suggestion text not null,
  created_at timestamptz default now()
);

alter table suggestions enable row level security;
create policy "Public read suggestions" on suggestions for select using (true);
create policy "Public insert suggestions" on suggestions for insert with check (true);
create policy "Public delete suggestions" on suggestions for delete using (true);
