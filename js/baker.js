/* ============================================
   baker.js — Baker View (admin)
   ============================================ */

const Baker = (() => {
  let bakerMonth, bakerYear;
  let orders = [];
  let blockedDates = [];
  let users = [];

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
    const [ordersRes, blockedRes, usersRes] = await Promise.all([
      sb.from('orders').select('*, users(display_name)').eq('status', 'active').order('pickup_date'),
      sb.from('blocked_dates').select('*'),
      sb.from('users').select('*').order('display_name')
    ]);
    orders = ordersRes.data || [];
    blockedDates = blockedRes.data || [];
    users = usersRes.data || [];
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

      <div class="baker-back-btn">
        <button class="btn btn-outline" id="baker-exit">← Back to Site</button>
      </div>
    `;

    renderBakerCalendar();
    renderOrdersTable();
    bindAddUser();
    Photos.renderBakerPhotos(document.getElementById('baker-photos-section'));

    document.getElementById('baker-exit').addEventListener('click', () => {
      Login.init();
      showScreen('login');
    });
  }

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

      // Check if blocked
      const isBlocked = blockedDates.some(bd => bd.date === iso);
      if (isBlocked) classes.push('blocked-day');

      // Orders on this day
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

    // Nav
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

    // Click order chip → cancel
    container.querySelectorAll('.baker-order-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmCancel(chip.dataset.orderId, chip.dataset.name, chip.dataset.treat, chip.dataset.date);
      });
    });

    // Click empty day → block/unblock
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

  async function confirmCancel(orderId, name, treat, date) {
    const ok = confirm(`Cancel ${name}'s ${treat} order for ${date}?`);
    if (!ok) return;

    // Get order to find user_id
    const { data: order } = await sb.from('orders').select('user_id').eq('id', orderId).single();
    await sb.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
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
        <tr><th>Name</th><th>Treat</th><th>Date</th><th>Destination</th></tr>
      </thead>
      <tbody>`;

    orders.forEach(o => {
      const treat = MENU.find(m => m.name === o.treat);
      const emoji = treat ? treat.emoji : '🍰';
      const userName = o.users ? o.users.display_name : '?';
      const destLabel = o.destination === 'office' ? '🏢 Office' : '🏠 Home';
      html += `<tr>
        <td>${userName}</td>
        <td>${emoji} ${o.treat}</td>
        <td>${o.pickup_date}</td>
        <td>${destLabel}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
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
