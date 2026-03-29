/* ============================================
   config.js — Supabase client, MENU, helpers
   ============================================ */

const SUPABASE_URL = 'https://idsqxlnwyactzckrhlov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkc3F4bG53eWFjdHpja3JobG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODk0NjcsImV4cCI6MjA5MDM2NTQ2N30.5HmqGAaLZ-IcBPmMroYhCafV5Cc3aasBeliWi6AI2c0';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* MENU is loaded from Supabase at boot */
let MENU = [];

async function loadMenu() {
  const { data, error } = await sb
    .from('menu_items')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  if (error) {
    console.error('Failed to load menu:', error);
    return;
  }
  MENU = data.map(item => ({
    id: item.id,
    name: item.name,
    emoji: item.emoji,
    description: item.description,
    leadDays: item.lead_days,
    ingredients: item.ingredients || [],
    badge: item.badge || 'auto',
    _createdAt: item.created_at
  }));
}

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

/* ── Pup image mapping ── */

function getPupImage(treatName) {
  const name = (treatName || '').toLowerCase();
  if (name.includes('muffin')) return 'images/pup-cupcake.png';
  if (name.includes('cake')) return 'images/pup-cake.png';
  if (name.includes('banana') || name.includes('pumpkin') || name.includes('pie')) return 'images/pup-banana.png';
  return 'images/pup-cake.png'; // default
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
