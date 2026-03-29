/* ============================================
   order.js — Order form: menu + calendar + submit
   ============================================ */

const Order = (() => {
  let selectedTreat = null;
  let selectedDest = null;
  let allOrders = [];
  let allBlocked = [];
  let orderCounts = {}; // treat name → number of orders ever placed

  async function init() {
    selectedTreat = null;
    selectedDest = null;

    // Fetch orders, blocked dates, and historical order counts
    const [ordersRes, blockedRes, allOrdersRes] = await Promise.all([
      sb.from('orders').select('*').eq('status', 'active'),
      sb.from('blocked_dates').select('*'),
      sb.from('orders').select('treat')
    ]);
    allOrders = ordersRes.data || [];
    allBlocked = blockedRes.data || [];

    // Count how many times each treat has been ordered
    orderCounts = {};
    (allOrdersRes.data || []).forEach(o => {
      orderCounts[o.treat] = (orderCounts[o.treat] || 0) + 1;
    });

    const displayName = sessionStorage.getItem('displayName');

    const screen = document.getElementById('screen-order');
    screen.innerHTML = `
      <div class="order-header">
        <h1>Pick Your Treat 🍰</h1>
        <p>Choose something yummy, ${displayName}!</p>
        <button class="btn btn-outline btn-small" id="order-gallery-link" style="margin-top: 12px;">Gallery & Suggestions 📸</button>
      </div>
      <div class="order-layout">
        <div class="menu-section">
          <div class="menu-grid" id="menu-grid"></div>
        </div>
        <div class="order-panel">
          <div class="card" id="treat-display" style="display:none">
            <div class="selected-treat-display" id="selected-treat-info"></div>
            <div class="earliest-msg" id="earliest-msg"></div>
          </div>
          <div class="card" id="calendar-card" style="display:none">
            <div id="order-calendar"></div>
          </div>
          <div class="card" id="dest-card" style="display:none">
            <strong>Where should it go?</strong>
            <div class="dest-toggles">
              <button class="dest-btn" data-dest="office">🏢 Office</button>
              <button class="dest-btn" data-dest="home">🏠 Home</button>
            </div>
          </div>
          <div class="order-user">Ordering as: <strong>${displayName}</strong></div>
          <div class="submit-row">
            <button class="btn btn-primary" id="submit-order-btn" disabled>Place My Order! 🍰</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('order-gallery-link').addEventListener('click', () => {
      Photos.showGalleryScreen('order');
    });

    renderMenu();
    bindDestination();
    bindSubmit();
  }

  function renderMenu() {
    const grid = document.getElementById('menu-grid');

    // Determine badge for each item, then sort: NEW first, BE THE FIRST second, rest after
    const sorted = MENU.map((item, origIndex) => {
      let showBadge = 'none';

      if (item.badge === 'new') {
        showBadge = 'new';
      } else if (item.badge === 'first') {
        showBadge = 'first';
      } else if (item.badge === 'none') {
        showBadge = 'none';
      } else {
        // auto: NEW if created within 14 days, BE THE FIRST if never ordered
        if (isNewItem(item)) showBadge = 'new';
        else if (!orderCounts[item.name]) showBadge = 'first';
      }

      let priority = 2;
      if (showBadge === 'new') priority = 0;
      else if (showBadge === 'first') priority = 1;

      return { item, origIndex, showBadge, priority };
    }).sort((a, b) => a.priority - b.priority);

    grid.innerHTML = sorted.map(({ item, origIndex, showBadge }) => {
      let badge = '';
      if (showBadge === 'new') {
        badge = '<span class="menu-badge badge-new">NEW</span>';
      } else if (showBadge === 'first') {
        badge = '<span class="menu-badge badge-first">BE THE FIRST</span>';
      }

      return `
        <div class="menu-card" data-index="${origIndex}">
          ${badge}
          <span class="menu-emoji">${item.emoji}</span>
          <div class="menu-name">${item.name}</div>
          ${item.leadDays > 0 ? `<div class="menu-lead">⏰ ${item.leadDays}-day lead</div>` : '<div class="menu-lead" style="visibility:hidden">-</div>'}
          <button class="btn btn-outline btn-small recipe-btn" data-index="${origIndex}">See Recipe 📖</button>
        </div>`;
    }).join('');

    // Card selection
    grid.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('recipe-btn')) return;
        selectTreat(+card.dataset.index);
      });
    });

    // Recipe buttons
    grid.querySelectorAll('.recipe-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openRecipe(+btn.dataset.index);
      });
    });
  }

  function isNewItem(item) {
    // "New" = added within the last 14 days (uses id from DB which has created_at)
    if (!item._createdAt) return false;
    const created = new Date(item._createdAt);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return created > twoWeeksAgo;
  }

  function selectTreat(index) {
    selectedTreat = MENU[index];
    Calendar.clearSelection();

    // Highlight card
    document.querySelectorAll('.menu-card').forEach(c => {
      c.classList.toggle('selected', +c.dataset.index === index);
    });

    // Show treat display
    const display = document.getElementById('treat-display');
    display.style.display = 'block';
    document.getElementById('selected-treat-info').innerHTML =
      `<span class="treat-emoji">${selectedTreat.emoji}</span>${selectedTreat.name}`;

    const earliest = getEarliestDate(selectedTreat.leadDays);
    document.getElementById('earliest-msg').textContent =
      `The earliest you can get ${selectedTreat.emoji} ${selectedTreat.name} is ${formatDate(earliest)}!`;

    // Show and init calendar
    document.getElementById('calendar-card').style.display = 'block';
    Calendar.init(document.getElementById('order-calendar'), {
      earliest: earliest,
      orders: allOrders,
      blockedDates: allBlocked,
      onSelect: onDatePicked
    });

    // Show destination
    document.getElementById('dest-card').style.display = 'block';

    updateSubmitBtn();
  }

  function onDatePicked(date) {
    updateSubmitBtn();
  }

  function bindDestination() {
    document.getElementById('dest-card').addEventListener('click', (e) => {
      const btn = e.target.closest('.dest-btn');
      if (!btn) return;
      selectedDest = btn.dataset.dest;
      document.querySelectorAll('.dest-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateSubmitBtn();
    });
  }

  function updateSubmitBtn() {
    const btn = document.getElementById('submit-order-btn');
    btn.disabled = !(selectedTreat && Calendar.getSelectedDate() && selectedDest);
  }

  function bindSubmit() {
    document.getElementById('submit-order-btn').addEventListener('click', submitOrder);
  }

  async function submitOrder() {
    const btn = document.getElementById('submit-order-btn');
    btn.disabled = true;
    btn.textContent = 'Placing order...';

    const userId = sessionStorage.getItem('userId');
    const displayName = sessionStorage.getItem('displayName');
    const pickupDate = dateToISO(Calendar.getSelectedDate());

    // Insert order
    const { error: orderErr } = await sb.from('orders').insert({
      user_id: userId,
      treat: selectedTreat.name,
      pickup_date: pickupDate,
      destination: selectedDest
    });

    if (orderErr) {
      console.error('Order error:', orderErr);
      btn.textContent = 'Something went wrong — try again!';
      btn.disabled = false;
      return;
    }

    // Mark user as having active order
    await sb.from('users').update({ has_active_order: true }).eq('id', userId);

    // Celebrate!
    const firstName = displayName.split(' ')[0];
    const dateStr = formatDate(Calendar.getSelectedDate());
    const pupImg = getPupImage(selectedTreat ? selectedTreat.name : '');
    const screen = document.getElementById('screen-celebrate');
    screen.innerHTML = `
      <img src="${pupImg}" alt="Treat Pup" class="pup-image pup-confirm">
      <h1 class="celebrate-title">Yay!</h1>
      <p class="celebrate-msg">Your treat is coming ${dateStr}, ${firstName}!</p>
      <p class="celebrate-msg">Cassie's on it!</p>
      <div style="margin-top: 24px;">
        <button class="btn btn-outline btn-small" id="celebrate-gallery-link">Gallery & Suggestions 📸</button>
      </div>
    `;
    showScreen('celebrate');
    Confetti.fire();

    document.getElementById('celebrate-gallery-link').addEventListener('click', () => {
      Photos.showGalleryScreen('celebrate');
    });
  }

  function openRecipe(index) {
    const item = MENU[index];
    document.getElementById('recipe-emoji').textContent = item.emoji;
    document.getElementById('recipe-title').textContent = item.name;
    document.getElementById('recipe-desc').textContent = item.description;
    document.getElementById('recipe-lead').textContent =
      item.leadDays > 0 ? `⏰ Order at least ${item.leadDays} days ahead!` : '';
    document.getElementById('recipe-ingredients').innerHTML =
      item.ingredients.map(ing => `<li>${ing}</li>`).join('');

    const linkEl = document.getElementById('recipe-link');
    if (item.recipeUrl) {
      linkEl.href = item.recipeUrl;
      linkEl.hidden = false;
    } else {
      linkEl.hidden = true;
    }

    document.getElementById('recipe-modal').hidden = false;
  }

  return { init };
})();
