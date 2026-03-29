/* ============================================
   app.js — Boot + routing
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Load menu from Supabase before anything renders
  await loadMenu();

  // Initialize login screen
  Login.init();

  // Baker View link
  document.getElementById('baker-link').addEventListener('click', (e) => {
    e.preventDefault();
    Baker.promptPassword();
  });

  // Close modals on backdrop click
  document.getElementById('recipe-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.hidden = true;
  });
  document.getElementById('menu-edit-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.hidden = true;
  });

  // Close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('recipe-modal').hidden = true;
      document.getElementById('menu-edit-modal').hidden = true;
    }
  });
});
