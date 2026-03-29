/* ============================================
   names.js — Name selection screen
   ============================================ */

const Names = (() => {
  async function init() {
    const screen = document.getElementById('screen-names');
    screen.innerHTML = `
      <img src="images/pup-baker.png" alt="Baker Pup" class="pup-image pup-baker">
      <div class="card names-card">
        <h1>Who are you? 👋</h1>
        <select id="name-select">
          <option value="">Pick your name...</option>
        </select>
        <button class="btn btn-secondary" id="name-btn">That's Me! 🙋</button>
      </div>
    `;

    // Fetch users
    const { data: users, error } = await sb.from('users').select('*').order('display_name');
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    const select = document.getElementById('name-select');
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.display_name;
      select.appendChild(opt);
    });

    document.getElementById('name-btn').addEventListener('click', async () => {
      const userId = select.value;
      if (!userId) return;

      const user = users.find(u => u.id === userId);
      sessionStorage.setItem('userId', user.id);
      sessionStorage.setItem('displayName', user.display_name);

      if (user.has_active_order) {
        await showAlreadyOrdered(user);
      } else {
        Order.init();
        showScreen('order');
      }
    });
  }

  async function showAlreadyOrdered(user) {
    // Fetch existing active order
    const { data: activeOrders } = await sb
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    const screen = document.getElementById('screen-already');
    const order = activeOrders && activeOrders[0];
    const treat = order ? MENU.find(m => m.name === order.treat) : null;

    const pupImg = order ? getPupImage(order.treat) : 'images/Pup - Cake.png';
    screen.innerHTML = `
      <img src="${pupImg}" alt="Treat Pup" class="pup-image pup-confirm">
      <div class="card already-card">
        <h1>You're already on the list! 🎉</h1>
        <p>You already have a treat on the way!</p>
        ${order ? `
          <div class="order-detail">${treat ? treat.emoji : '🍰'} <strong>${order.treat}</strong></div>
          <div class="order-detail">📅 ${formatDate(new Date(order.pickup_date + 'T00:00:00'))}</div>
          <div class="order-detail">${order.destination === 'office' ? '🏢 Office' : '🏠 Home'}</div>
        ` : ''}
        <p style="margin-top: 20px; opacity: 0.7;">Talk to Cassie if you need to make a change.</p>
        <div style="margin-top: 20px;">
          <button class="btn btn-outline btn-small" id="already-gallery-link">Gallery & Suggestions 📸</button>
        </div>
      </div>
    `;
    showScreen('already');

    document.getElementById('already-gallery-link').addEventListener('click', () => {
      Photos.showGalleryScreen('already');
    });
  }

  return { init };
})();
