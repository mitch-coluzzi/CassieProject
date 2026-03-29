/* ============================================
   baker.js — Baker View (admin)
   ============================================ */

const Baker = (() => {
  let bakerMonth, bakerYear;
  let orders = [];
  let blockedDates = [];
  let users = [];
  let allMenuItems = []; // includes inactive

  function promptPassword() {
    const screen = document.getElementById('screen-baker');
    screen.innerHTML = `
      <div class="baker-password card">
        <h1>👩‍🍳 Baker View</h1>
        <p style="margin-bottom: 20px;">Enter the baker password:</p>
        <input type="password" id="baker-pw" placeholder="Password..." autocomplete="off">
        <div style="margin-top: 16px;">
          <button class="btn btn-primary" id="baker-pw-btn">Open Bakery 🧁</button>
        </div>
        <div id="baker-pw-error" class="login-error"></div>
        <div style="margin-top: 20px;">
          <button class="btn btn-outline btn-small" id="baker-back">← Back</button>
        </div>
      </div>
    `;
    showScreen('baker');

    const input = document.getElementById('baker-pw');
    const btn = document.getElementById('baker-pw-btn');
    const err = document.getElementById('baker-pw-error');

    btn.addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    document.getElementById('baker-back').addEventListener('click', () => showScreen('login'));

    function check() {
      if (input.value.trim().toLowerCase() === 'swimfast12') {
        loadBakerView();
      } else {
        err.textContent = "That's not it! 🍪";
        input.value = '';
        input.focus();
      }
    }
  }

  async function loadBakerView() {
    const now = new Date();
    bakerMonth = now.getMonth();
    bakerYear = now.getFullYear();

    await refreshData();
    renderBakerView();
  }

  async function refreshData() {
    const [ordersRes, blockedRes, usersRes, menuRes] = await Promise.all([
      sb.from('orders').select('*, users(display_name)').eq('status', 'active').order('pickup_date'),
      sb.from('blocked_dates').select('*'),
      sb.from('users').select('*').order('display_name'),
      sb.from('menu_items').select('*').order('sort_order')
    ]);
    orders = ordersRes.data || [];
    blockedDates = blockedRes.data || [];
    users = usersRes.data || [];
    allMenuItems = menuRes.data || [];
  }

  function renderBakerView() {
    const screen = document.getElementById('screen-baker');
    screen.innerHTML = `
      <div class="baker-header">
        <h1>👩‍🍳 Baker View</h1>
        <p>Manage orders, dates, and guests</p>
      </div>

      <div class="baker-section">
        <h2>Order Calendar</h2>
        <div class="card baker-calendar" id="baker-cal"></div>
      </div>

      <div class="baker-section">
        <h2>Active Orders</h2>
        <div class="card" id="baker-orders-table"></div>
      </div>

      <div class="baker-section">
        <h2>Menu Items 🍰</h2>
        <div class="card" id="baker-menu-list"></div>
        <div style="margin-top: 12px; text-align: center;">
          <button class="btn btn-secondary btn-small" id="add-menu-item-btn">+ Add New Item</button>
        </div>
      </div>

      <div class="baker-section">
        <h2>Add a Guest</h2>
        <div class="card">
          <div class="baker-add-user">
            <input type="text" id="new-user-name" placeholder="Display name...">
            <button class="btn btn-primary btn-small" id="add-user-btn">Add to List</button>
          </div>
          <div id="add-user-msg" style="margin-top: 10px; font-weight: 700; color: var(--purple);"></div>
        </div>
      </div>

      <div id="baker-photos-section"></div>
      <div id="baker-suggestions-section"></div>

      <div class="baker-back-btn">
        <button class="btn btn-outline" id="baker-exit">← Back to Site</button>
      </div>
    `;

    renderBakerCalendar();
    renderOrdersTable();
    renderMenuManager();
    bindAddUser();
    Photos.renderBakerPhotos(document.getElementById('baker-photos-section'));
    Photos.renderBakerSuggestions(document.getElementById('baker-suggestions-section'));

    document.getElementById('add-menu-item-btn').addEventListener('click', () => openMenuEditor(null));

    document.getElementById('baker-exit').addEventListener('click', () => {
      Login.init();
      showScreen('login');
    });
  }

  /* ── Menu Management ── */

  function renderMenuManager() {
    const container = document.getElementById('baker-menu-list');

    if (allMenuItems.length === 0) {
      container.innerHTML = '<p style="padding: 12px; opacity: 0.6;">No menu items.</p>';
      return;
    }

    container.innerHTML = `<table class="order-table">
      <thead><tr><th></th><th>Name</th><th>Lead</th><th>Status</th><th></th></tr></thead>
      <tbody>${allMenuItems.map(item => `
        <tr style="${!item.active ? 'opacity: 0.5;' : ''}">
          <td style="font-size: 1.5rem;">${item.emoji}</td>
          <td><strong>${item.name}</strong></td>
          <td>${item.lead_days > 0 ? item.lead_days + 'd' : '—'}</td>
          <td>${item.active ? '<span style="color: var(--orange); font-weight:700;">Active</span>' : '<span style="opacity:0.5;">Hidden</span>'}</td>
          <td style="white-space: nowrap;">
            <button class="btn btn-outline btn-small menu-edit-btn" data-id="${item.id}">Edit</button>
            <button class="btn btn-small ${item.active ? 'btn-outline' : 'btn-primary'} menu-toggle-btn" data-id="${item.id}" data-active="${item.active}">${item.active ? 'Hide' : 'Show'}</button>
          </td>
        </tr>
      `).join('')}</tbody>
    </table>`;

    container.querySelectorAll('.menu-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = allMenuItems.find(m => m.id === btn.dataset.id);
        if (item) openMenuEditor(item);
      });
    });

    container.querySelectorAll('.menu-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const isActive = btn.dataset.active === 'true';
        await sb.from('menu_items').update({ active: !isActive }).eq('id', btn.dataset.id);
        await refreshData();
        await loadMenu(); // refresh global MENU
        renderMenuManager();
      });
    });
  }

  const EMOJI_OPTIONS = [
    '🍰','🎂','🧁','🍌','🍞','🎃','🍫','🍪','🍩','🥧',
    '🍮','🍦','🧇','🥞','🍬','🍭','🍡','🥐','🥖','🥨',
    '🫐','🍓','🍒','🍑','🥭','🍍','🥥','🍋','🍊','🍎',
    '🥕','🍯','☕','🫖','🧈','🥚','🥛','🌰','🍇','🫘'
  ];

  function initEmojiPicker() {
    const grid = document.getElementById('emoji-picker-grid');
    const input = document.getElementById('menu-edit-emoji');
    const toggle = document.getElementById('emoji-picker-toggle');

    grid.innerHTML = EMOJI_OPTIONS.map(e =>
      `<span class="emoji-option" data-emoji="${e}">${e}</span>`
    ).join('');

    toggle.addEventListener('click', () => {
      grid.hidden = !grid.hidden;
    });

    grid.querySelectorAll('.emoji-option').forEach(opt => {
      opt.addEventListener('click', () => {
        input.value = opt.dataset.emoji;
        grid.hidden = true;
      });
    });
  }

  function openMenuEditor(item) {
    const modal = document.getElementById('menu-edit-modal');
    document.getElementById('menu-edit-title').textContent = item ? 'Edit Item' : 'Add New Item';
    document.getElementById('menu-edit-id').value = item ? item.id : '';
    document.getElementById('menu-edit-name').value = item ? item.name : '';
    document.getElementById('menu-edit-emoji').value = item ? item.emoji : '🍰';
    document.getElementById('menu-edit-desc').value = item ? item.description : '';
    document.getElementById('menu-edit-lead').value = item ? item.lead_days : 0;
    document.getElementById('menu-edit-ingredients').value = item ? (item.ingredients || []).join('\n') : '';
    document.getElementById('menu-edit-sort').value = item ? item.sort_order : allMenuItems.length + 1;
    document.getElementById('menu-edit-url').value = item ? (item.recipe_url || '') : '';
    document.getElementById('emoji-picker-grid').hidden = true;

    // Badge toggles
    const badgeValue = item ? (item.badge || 'auto') : 'auto';
    document.getElementById('menu-edit-badge').value = badgeValue;
    document.querySelectorAll('.badge-toggle').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.badge === badgeValue);
      btn.onclick = () => {
        document.getElementById('menu-edit-badge').value = btn.dataset.badge;
        document.querySelectorAll('.badge-toggle').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      };
    });

    modal.hidden = false;

    initEmojiPicker();

    // Remove old listener, add new one
    const saveBtn = document.getElementById('menu-edit-save');
    const newBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newBtn, saveBtn);
    newBtn.addEventListener('click', () => saveMenuItem(item ? item.id : null));
  }

  async function saveMenuItem(existingId) {
    const name = document.getElementById('menu-edit-name').value.trim();
    const emoji = document.getElementById('menu-edit-emoji').value.trim();
    const description = document.getElementById('menu-edit-desc').value.trim();
    const lead_days = parseInt(document.getElementById('menu-edit-lead').value) || 0;
    const ingredients = document.getElementById('menu-edit-ingredients').value
      .split('\n').map(s => s.trim()).filter(Boolean);
    const sort_order = parseInt(document.getElementById('menu-edit-sort').value) || 0;

    if (!name || !emoji) {
      alert('Name and emoji are required!');
      return;
    }

    const badge = document.getElementById('menu-edit-badge').value || 'auto';
    const recipe_url = document.getElementById('menu-edit-url').value.trim();
    const row = { name, emoji, description, lead_days, ingredients, sort_order, badge, recipe_url };

    if (existingId) {
      await sb.from('menu_items').update(row).eq('id', existingId);
    } else {
      row.active = true;
      await sb.from('menu_items').insert(row);
    }

    document.getElementById('menu-edit-modal').hidden = true;
    await refreshData();
    await loadMenu(); // refresh global MENU
    renderMenuManager();
  }

  /* ── Calendar ── */

  function renderBakerCalendar() {
    const container = document.getElementById('baker-cal');
    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];

    let html = `
      <div class="calendar-nav">
        <button id="baker-cal-prev">◀</button>
        <h3>${monthNames[bakerMonth]} ${bakerYear}</h3>
        <button id="baker-cal-next">▶</button>
      </div>
      <div class="calendar-grid">
        <div class="day-header">Mon</div>
        <div class="day-header">Tue</div>
        <div class="day-header">Wed</div>
        <div class="day-header">Thu</div>
        <div class="day-header">Fri</div>
        <div class="day-header">Sat</div>
        <div class="day-header">Sun</div>`;

    const firstDay = new Date(bakerYear, bakerMonth, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < startDay; i++) {
      html += `<div class="day-cell empty"></div>`;
    }

    const daysInMonth = new Date(bakerYear, bakerMonth + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(bakerYear, bakerMonth, d);
      const dayOfWeek = date.getDay();
      const iso = dateToISO(date);
      const classes = ['day-cell'];

      if ([0, 5, 6].includes(dayOfWeek)) {
        classes.push('weekend');
        html += `<div class="${classes.join(' ')}">${d}</div>`;
        continue;
      }

      const isBlocked = blockedDates.some(bd => bd.date === iso);
      if (isBlocked) classes.push('blocked-day');

      const dayOrders = orders.filter(o => o.pickup_date === iso);

      let content = `<div>${d}</div>`;
      dayOrders.forEach(o => {
        const treat = MENU.find(m => m.name === o.treat);
        const emoji = treat ? treat.emoji : '🍰';
        const destIcon = o.destination === 'office' ? '🏢' : '🏠';
        const userName = o.users ? o.users.display_name : '?';
        content += `<div class="baker-order-chip" data-order-id="${o.id}" data-name="${userName}" data-treat="${o.treat}" data-date="${iso}">${emoji} ${userName} ${destIcon}</div>`;
      });

      if (isBlocked && dayOrders.length === 0) {
        content += `<div style="font-size:0.7rem;">🚫</div>`;
      }

      html += `<div class="${classes.join(' ')}" data-iso="${iso}">${content}</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    container.querySelector('#baker-cal-prev').addEventListener('click', () => {
      bakerMonth--;
      if (bakerMonth < 0) { bakerMonth = 11; bakerYear--; }
      renderBakerCalendar();
    });
    container.querySelector('#baker-cal-next').addEventListener('click', () => {
      bakerMonth++;
      if (bakerMonth > 11) { bakerMonth = 0; bakerYear++; }
      renderBakerCalendar();
    });

    container.querySelectorAll('.baker-order-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        showOrderActions(chip.dataset.orderId, chip.dataset.name, chip.dataset.treat, chip.dataset.date);
      });
    });

    container.querySelectorAll('.day-cell[data-iso]').forEach(cell => {
      cell.addEventListener('click', (e) => {
        if (e.target.closest('.baker-order-chip')) return;
        const iso = cell.dataset.iso;
        const isBlocked = blockedDates.some(bd => bd.date === iso);
        if (isBlocked) {
          confirmUnblock(iso);
        } else {
          promptBlock(iso);
        }
      });
    });
  }

  function showOrderActions(orderId, name, treat, date) {
    const action = prompt(
      `${name}'s ${treat} for ${date}\n\nType "complete" to mark as completed\nType "cancel" to cancel the order\n\n(or press Cancel to go back)`
    );
    if (!action) return;
    const choice = action.trim().toLowerCase();
    if (choice === 'complete' || choice === 'completed') {
      updateOrderStatus(orderId, 'completed');
    } else if (choice === 'cancel' || choice === 'cancelled') {
      updateOrderStatus(orderId, 'cancelled');
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { data: order } = await sb.from('orders').select('user_id').eq('id', orderId).single();
    await sb.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (order) {
      await sb.from('users').update({ has_active_order: false }).eq('id', order.user_id);
    }
    await refreshData();
    renderBakerCalendar();
    renderOrdersTable();
  }

  function promptBlock(iso) {
    const choice = confirm(`Block this day (${iso})?\n\nOK = Block just this day\n(To block the whole week, click each day individually)`);
    if (choice) {
      blockDate(iso, false);
    }
  }

  async function blockDate(iso, byWeek) {
    await sb.from('blocked_dates').insert({ date: iso, blocked_by_week: byWeek });
    await refreshData();
    renderBakerCalendar();
  }

  async function confirmUnblock(iso) {
    const ok = confirm(`Unblock ${iso}?`);
    if (!ok) return;
    await sb.from('blocked_dates').delete().eq('date', iso);
    await refreshData();
    renderBakerCalendar();
  }

  function renderOrdersTable() {
    const container = document.getElementById('baker-orders-table');
    if (orders.length === 0) {
      container.innerHTML = '<p style="padding: 12px; opacity: 0.6;">No active orders.</p>';
      return;
    }

    let html = `<table class="order-table">
      <thead>
        <tr><th>Name</th><th>Treat</th><th>Date</th><th>Dest</th><th></th></tr>
      </thead>
      <tbody>`;

    orders.forEach(o => {
      const treat = MENU.find(m => m.name === o.treat);
      const emoji = treat ? treat.emoji : '🍰';
      const userName = o.users ? o.users.display_name : '?';
      const destLabel = o.destination === 'office' ? '🏢' : '🏠';
      html += `<tr>
        <td>${userName}</td>
        <td>${emoji} ${o.treat}</td>
        <td>${o.pickup_date}</td>
        <td>${destLabel}</td>
        <td style="white-space: nowrap;">
          <button class="btn btn-primary btn-small order-complete-btn" data-id="${o.id}">Done</button>
          <button class="btn btn-outline btn-small order-cancel-btn" data-id="${o.id}">Cancel</button>
        </td>
      </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    container.querySelectorAll('.order-complete-btn').forEach(btn => {
      btn.addEventListener('click', () => updateOrderStatus(btn.dataset.id, 'completed'));
    });
    container.querySelectorAll('.order-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Cancel this order?')) updateOrderStatus(btn.dataset.id, 'cancelled');
      });
    });
  }

  function bindAddUser() {
    document.getElementById('add-user-btn').addEventListener('click', async () => {
      const input = document.getElementById('new-user-name');
      const name = input.value.trim();
      if (!name) return;

      const { error } = await sb.from('users').insert({ display_name: name });
      const msg = document.getElementById('add-user-msg');
      if (error) {
        msg.textContent = 'Something went wrong!';
        msg.style.color = 'var(--pink)';
      } else {
        msg.textContent = `${name} has been added! They can now place an order. 🎉`;
        msg.style.color = 'var(--purple)';
        input.value = '';
        await refreshData();
      }
    });
  }

  return { promptPassword };
})();
