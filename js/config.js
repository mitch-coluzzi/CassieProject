/* ============================================
   config.js — Supabase client, MENU, helpers
   ============================================ */

const SUPABASE_URL = 'https://idsqxlnwyactzckrhlov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkc3F4bG53eWFjdHpja3JobG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODk0NjcsImV4cCI6MjA5MDM2NTQ2N30.5HmqGAaLZ-IcBPmMroYhCafV5Cc3aasBeliWi6AI2c0';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MENU = [
  {
    name: "Banana Cream Pie",
    emoji: "🍌",
    leadDays: 7,
    description: "Silky smooth banana cream piled high in a buttery crust. Worth the wait!",
    ingredients: ["2 cups whole milk","3 egg yolks","½ cup sugar","3 tbsp cornstarch","2 tbsp butter","1 tsp vanilla","3 ripe bananas","1 pre-baked pie crust","1 cup whipped cream"]
  },
  {
    name: "Pumpkin Pie",
    emoji: "🎃",
    leadDays: 5,
    description: "Warm spiced pumpkin in a flaky crust. A fall favorite!",
    ingredients: ["1 can (15 oz) pumpkin puree","¾ cup sugar","1 tsp cinnamon","½ tsp ginger","¼ tsp cloves","2 eggs","1 can evaporated milk","1 unbaked pie crust"]
  },
  {
    name: "Banana Bread",
    emoji: "🍞",
    leadDays: 7,
    description: "Super moist and packed with banana flavor. Great for breakfast or a snack!",
    ingredients: ["3 very ripe bananas","⅓ cup melted butter","¾ cup sugar","1 egg","1 tsp vanilla","1 tsp baking soda","Pinch of salt","1½ cups flour"]
  },
  {
    name: "Pumpkin Muffins",
    emoji: "🧁",
    leadDays: 5,
    description: "Fluffy spiced pumpkin muffins with a golden top. A dozen per order!",
    ingredients: ["1¾ cups flour","1 cup sugar","1 tsp baking soda","2 tsp pumpkin spice","½ tsp salt","2 eggs","1 cup pumpkin puree","½ cup vegetable oil","¼ cup water"]
  },
  {
    name: "Chocolate Muffins",
    emoji: "🍫",
    leadDays: 0,
    description: "Rich, fudgy chocolate muffins. A dozen per order — share if you dare!",
    ingredients: ["1¾ cups flour","¾ cup cocoa powder","1½ cups sugar","2 tsp baking powder","½ tsp salt","2 eggs","1 cup milk","½ cup vegetable oil","1 tsp vanilla","1 cup chocolate chips"]
  },
  {
    name: "Chocolate Cake",
    emoji: "🎂",
    leadDays: 0,
    description: "A classic layer cake with rich chocolate frosting. Serves 8–10!",
    ingredients: ["2 cups flour","2 cups sugar","¾ cup cocoa powder","2 tsp baking soda","1 tsp salt","2 eggs","1 cup buttermilk","1 cup strong black coffee","½ cup vegetable oil","2 tsp vanilla","Chocolate buttercream frosting"]
  },
  {
    name: "Vanilla Cake",
    emoji: "🍰",
    leadDays: 0,
    description: "Light and fluffy vanilla layer cake with creamy vanilla frosting. A crowd pleaser!",
    ingredients: ["2½ cups flour","2 cups sugar","1 tbsp baking powder","½ tsp salt","1 cup butter (softened)","4 eggs","1 cup whole milk","2 tsp vanilla extract","Vanilla buttercream frosting"]
  }
];

/* ── Date helpers ── */

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getEarliestDate(leadDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + leadDays);
  // Advance past Fri/Sat/Sun to next Mon
  while ([0, 5, 6].includes(date.getDay())) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function isWeekBlocked(date, existingOrders) {
  const monday = getMonday(date);
  return existingOrders.some(order => {
    const orderMonday = getMonday(new Date(order.pickup_date + 'T00:00:00'));
    return orderMonday.toDateString() === monday.toDateString()
      && order.status === 'active';
  });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function dateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ── View switching ── */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) {
    el.classList.add('active');
    el.offsetHeight; // trigger reflow for animation
  }
}
