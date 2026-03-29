/* ============================================
   app.js — Boot + routing
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize login screen
  Login.init();

  // Baker View link
  document.getElementById('baker-link').addEventListener('click', (e) => {
    e.preventDefault();
    Baker.promptPassword();
  });

  // Close recipe modal on backdrop click
  document.getElementById('recipe-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.hidden = true;
    }
  });

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('recipe-modal').hidden = true;
    }
  });
});
