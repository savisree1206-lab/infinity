/* ============================================
   INFINITE SERVICES – Web Dev Dashboard JS
   ============================================ */

(function () {
  'use strict';

  /* ---- Auth Guard ---- */
  const user = AuthManager.currentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  /* ---- Particle Canvas (cyan/purple theme) ---- */
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const COLORS = ['rgba(0,207,255,', 'rgba(180,79,255,', 'rgba(255,255,255,'];
    function createParticle() {
      return {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.22 + 0.05,
        pulse: Math.random() * Math.PI * 2
      };
    }
    for (let i = 0; i < 60; i++) particles.push(createParticle());
    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.pulse += 0.02;
        const op = p.opacity + Math.sin(p.pulse) * 0.05;
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.angle += 0.005;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.max(0, Math.min(1, op)) + ')';
        ctx.fill();
      });
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ---- Nav User Info ---- */
  document.getElementById('user-name-nav').textContent = user.name;
  document.getElementById('user-avatar-nav').textContent = user.name.charAt(0).toUpperCase();

  /* ---- Sign Out ---- */
  document.getElementById('nav-signout-btn').addEventListener('click', () => AuthManager.signOut());

  /* ========= TAB SYSTEM ========= */
  const tabs = document.querySelectorAll('.portal-tab');
  const sidebarItems = document.querySelectorAll('.sidebar-item');

  function showTab(tabId) {
    tabs.forEach(t => t.classList.remove('active'));
    sidebarItems.forEach(s => s.classList.remove('active'));
    const tab = document.getElementById('tab-' + tabId);
    const sidebarItem = document.getElementById('sidebar-' + tabId);
    if (tab) tab.classList.add('active');
    if (sidebarItem) sidebarItem.classList.add('active');
    if (tabId === 'my-bookings') renderBookings();
  }

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tab));
  });

  /* ========= BOOKING FORM ========= */
  const BOOKINGS_KEY = 'inf_webdev_bookings';

  function getBookings() {
    try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || []; }
    catch { return []; }
  }

  function saveBooking(booking) {
    const list = getBookings();
    list.unshift(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));

    booking.source = 'Web Dev';
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    }).catch(e => console.error(e));

    localStorage.setItem('inf_last_booking', JSON.stringify({ 
      id: booking.id, 
      customerName: booking.customerName,
      type: booking.type,
      title: booking.title,
      ts: Date.now() 
    }));
  }

  const form = document.getElementById('webdev-booking-form');
  const successMsg = document.getElementById('wd-booking-success');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Collect selected tech stack
    const stackChecked = [...document.querySelectorAll('#wd-stack-grid input:checked')]
      .map(cb => cb.value);

    const booking = {
      id: 'WD-' + Date.now(),
      customerId: user.id,
      customerName: user.name,
      type: document.getElementById('wd-project-type').value,
      stack: stackChecked.length ? stackChecked.join(', ') : 'Not specified',
      timeline: document.getElementById('wd-timeline').value,
      budget: document.getElementById('wd-budget').value,
      title: document.getElementById('wd-title').value,
      desc: document.getElementById('wd-desc').value,
      status: 'Under Review',
      date: new Date().toISOString()
    };

    saveBooking(booking);
    form.reset();
    successMsg.style.display = 'block';
    showToast();
    setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
  });

  function showToast() {
    const toast = document.getElementById('wd-toast');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
  }

  /* ========= RENDER BOOKINGS ========= */
  function renderBookings() {
    const list = document.getElementById('wd-bookings-list');
    const bookings = getBookings().filter(b => b.customerId === user.id);

    if (!bookings.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💻</div>
          <h3>No Bookings Yet</h3>
          <p>Submit a project request to get started.</p>
          <button class="btn-checkout" style="margin-top:1rem;padding:0.7rem 2rem;"
            onclick="document.querySelector('[data-tab=booking]').click()">
            Book a Project
          </button>
        </div>`;
      return;
    }

    const statusColors = {
      'Under Review':  { bg: 'rgba(255,193,7,0.15)',  border: 'rgba(255,193,7,0.4)',  text: '#ffc107' },
      'In Progress':   { bg: 'rgba(0,207,255,0.12)',  border: 'rgba(0,207,255,0.4)',  text: '#00cfff' },
      'Completed':     { bg: 'rgba(0,230,118,0.12)',  border: 'rgba(0,230,118,0.4)',  text: '#00e676' },
      'On Hold':       { bg: 'rgba(255,80,80,0.12)',  border: 'rgba(255,80,80,0.4)',  text: '#ff5050' }
    };

    list.innerHTML = bookings.map(b => {
      const s = statusColors[b.status] || statusColors['Under Review'];
      const date = new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return `
        <div class="order-card" style="margin-bottom:1.2rem;">
          <div class="order-card-header">
            <div>
              <div class="order-id">${b.id}</div>
              <div class="order-title" style="font-size:1rem;font-weight:700;color:#fff;margin:0.25rem 0;">${b.title}</div>
              <div style="font-size:0.78rem;color:var(--text-dim);">${b.type} · ${b.timeline} · ${b.budget}</div>
            </div>
            <span class="order-status" style="background:${s.bg};border-color:${s.border};color:${s.text};">${b.status}</span>
          </div>
          <div style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-dim);line-height:1.5;">
            <strong style="color:rgba(255,255,255,0.6)">Stack:</strong> ${b.stack}
          </div>
          <div style="margin-top:0.4rem;font-size:0.82rem;color:var(--text-dim);line-height:1.5;border-top:1px solid var(--border);padding-top:0.5rem;">
            ${b.desc.length > 140 ? b.desc.slice(0, 140) + '…' : b.desc}
          </div>
          <div class="order-footer">
            <span class="order-date">Submitted: ${date}</span>
          </div>
        </div>`;
    }).join('');
  }

})();
