/* ============================================
   calendar.js — Custom month calendar widget
   ============================================ */

const Calendar = (() => {
  let currentMonth, currentYear;
  let selectedDate = null;
  let onDateSelect = null;
  let earliest = null;
  let orders = [];
  let blockedDates = [];

  function init(container, opts) {
    onDateSelect = opts.onSelect || null;
    earliest = opts.earliest || new Date();
    orders = opts.orders || [];
    blockedDates = opts.blockedDates || [];
    selectedDate = null;

    const today = new Date();
    // Start on the month of the earliest date
    currentMonth = earliest.getMonth();
    currentYear = earliest.getFullYear();

    render(container);
  }

  function update(container, opts) {
    if (opts.earliest !== undefined) earliest = opts.earliest;
    if (opts.orders !== undefined) orders = opts.orders;
    if (opts.blockedDates !== undefined) blockedDates = opts.blockedDates;
    if (opts.onSelect !== undefined) onDateSelect = opts.onSelect;
    render(container);
  }

  function render(container) {
    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];

    const today = new Date();
    today.setHours(0,0,0,0);

    // Build header
    let html = `<div class="calendar-wrapper">
      <div class="calendar-nav">
        <button id="cal-prev">◀</button>
        <h3>${monthNames[currentMonth]} ${currentYear}</h3>
        <button id="cal-next">▶</button>
      </div>
      <div class="calendar-grid">
        <div class="day-header">Mon</div>
        <div class="day-header">Tue</div>
        <div class="day-header">Wed</div>
        <div class="day-header">Thu</div>
        <div class="day-header">Fri</div>
        <div class="day-header">Sat</div>
        <div class="day-header">Sun</div>`;

    // First day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    let startDay = firstDay.getDay(); // 0=Sun
    // Convert to Mon=0 format
    startDay = startDay === 0 ? 6 : startDay - 1;

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      html += `<div class="day-cell empty"></div>`;
    }

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
      const iso = dateToISO(date);
      const classes = ['day-cell'];
      let clickable = false;

      // Weekend (Fri, Sat, Sun)
      if ([0, 5, 6].includes(dayOfWeek)) {
        classes.push('weekend');
      }
      // Past
      else if (date < today) {
        classes.push('disabled');
      }
      // Before earliest date
      else if (date < earliest) {
        classes.push('disabled');
      }
      // Blocked date
      else if (isDateBlocked(date)) {
        classes.push('blocked');
      }
      // Week already has an order
      else if (isWeekBlocked(date, orders)) {
        classes.push('disabled');
      }
      // Selectable
      else {
        classes.push('selectable');
        clickable = true;
      }

      // Selected
      if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        classes.push('selected');
      }

      // Check if a delivery is due on this day
      const hasDelivery = orders.some(o => o.pickup_date === iso && o.status === 'active');
      const deliveryLabel = hasDelivery ? '<div class="cal-delivery-due">📦 Delivery</div>' : '';

      html += `<div class="${classes.join(' ')}" ${clickable ? `data-date="${iso}"` : ''}>${d}${deliveryLabel}</div>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;

    // Events
    container.querySelector('#cal-prev').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      render(container);
    });
    container.querySelector('#cal-next').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      render(container);
    });

    container.querySelectorAll('.day-cell.selectable').forEach(cell => {
      cell.addEventListener('click', () => {
        const parts = cell.dataset.date.split('-');
        selectedDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        render(container);
        if (onDateSelect) onDateSelect(selectedDate);
      });
    });
  }

  function isDateBlocked(date) {
    const iso = dateToISO(date);
    return blockedDates.some(bd => {
      if (bd.blocked_by_week) {
        const bdMonday = getMonday(new Date(bd.date + 'T00:00:00'));
        const dateMonday = getMonday(date);
        return bdMonday.toDateString() === dateMonday.toDateString();
      }
      return bd.date === iso;
    });
  }

  function getSelectedDate() {
    return selectedDate;
  }

  function clearSelection() {
    selectedDate = null;
  }

  return { init, update, render, getSelectedDate, clearSelection };
})();
