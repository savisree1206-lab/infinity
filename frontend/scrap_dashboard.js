/* ============================================
   INFINITE SERVICES – Scrap Innovator JS
   ============================================ */

(function () {
  'use strict';

  /* ---- Auth Guard ---- */
  const user = AuthManager.currentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  /* ---- Ambient Particle Canvas (green/gold/ecology theme) ---- */
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const COLORS = ['rgba(0,230,118,', 'rgba(212,175,55,', 'rgba(255,255,255,'];
    function createParticle() {
      return {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: Math.random() * 0.25 + 0.08,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.22 + 0.05,
        pulse: Math.random() * Math.PI * 2
      };
    }
    for (let i = 0; i < 60; i++) particles.push(createParticle());
    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.pulse += 0.015;
        const op = p.opacity + Math.sin(p.pulse) * 0.06;
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.angle += 0.004;
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

  /* ---- Nav User & Eco-Credits Info ---- */
  document.getElementById('user-name-nav').textContent = user.name;
  document.getElementById('user-avatar-nav').textContent = user.name.charAt(0).toUpperCase();

  // Initialize credits in localStorage if missing
  let credits = parseInt(localStorage.getItem('inf_eco_credits_' + user.id) || '120', 10);
  document.getElementById('user-eco-credits').textContent = credits;
  document.getElementById('impact-credits').textContent = credits;

  function updateCredits(amount) {
    credits += amount;
    localStorage.setItem('inf_eco_credits_' + user.id, credits.toString());
    document.getElementById('user-eco-credits').textContent = credits;
    const impactEl = document.getElementById('impact-credits');
    if (impactEl) impactEl.textContent = credits;
  }

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

    if (tabId === 'scrap-shop') renderScrapShop();
    if (tabId === 'my-projects') renderMyProjects();
    if (tabId === 'impact') renderImpact();
  }

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tab));
  });

  /* ========= DEFAULT PRODUCTS ========= */
  const DEFAULT_SCRAP_PRODUCTS = [
    { id: 'sk001', name: 'DIY Solar Tracker Kit', category: 'Kit', price: 750, creditsRequired: 100, icon: '☀️',
      imageUrl: 'images/scrap/solar_tracker.png', desc: 'Build an automatic tracker featuring salvaged mini servos and light sensors.' },
    { id: 'sk002', name: 'Upcycled Wind Turbine', category: 'Kit', price: 590, creditsRequired: 80, icon: '💨',
      imageUrl: 'images/components/voltage_regulator.png', desc: 'Generator model powered by salvaged DC motor and plastic blade mount.' },
    { id: 'sk003', name: 'Obstacle Avoiding Robot', category: 'Kit', price: 990, creditsRequired: 150, icon: '🤖',
      imageUrl: 'images/components/ultrasonic_sensor.png', desc: 'Chassis from recycled acrylic plates, with servo, motor, sensors.' },
    { id: 'sk004', name: 'Geared Motor Pack', category: 'Salvage', price: 180, creditsRequired: 30, icon: '⚙️',
      imageUrl: 'images/components/transistors.png', desc: 'Pack of three salvaged geared DC motors. Tested and verified working.' },
    { id: 'sk005', name: '18650 Battery Pack', category: 'Salvage', price: 250, creditsRequired: 45, icon: '🔋',
      imageUrl: 'images/components/capacitors.png', desc: 'Tested salvaged laptop cell blocks. Refurbished safety protection circuit.' },
    { id: 'sk006', name: 'Smart Irrigation Kit', category: 'Kit', price: 850, creditsRequired: 120, icon: '🌱',
      imageUrl: 'images/components/voltage_regulator.png', desc: 'E-waste soil sensor linked with upcycled motor pump and tubing.' }
  ];

  let scrapProducts = JSON.parse(localStorage.getItem('inf_scrap_products')) || DEFAULT_SCRAP_PRODUCTS;
  localStorage.setItem('inf_scrap_products', JSON.stringify(scrapProducts));

  /* ========= SUBMIT SCRAP FORM ========= */
  const scrapForm = document.getElementById('scrap-submission-form');
  const scrapSuccess = document.getElementById('scrap-success-msg');

  scrapForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemName = document.getElementById('scrap-item-name').value;
    const category = document.getElementById('scrap-category').value;
    const condition = document.getElementById('scrap-condition').value;
    const weight = document.getElementById('scrap-weight').value;
    const desc = document.getElementById('scrap-desc').value;

    // Estimate eco-credits based on condition
    let estimatedCredits = 25;
    if (condition === 'Functional') estimatedCredits = 70;
    else if (condition === 'Semi-Functional') estimatedCredits = 45;

    const submission = {
      id: 'SCRAP-' + Date.now(),
      customerId: user.id,
      itemName,
      category,
      condition,
      weight,
      desc,
      estimatedCredits,
      status: 'Pending Verification',
      date: new Date().toISOString()
    };

    const submissions = JSON.parse(localStorage.getItem('inf_scrap_submissions')) || [];
    submissions.unshift(submission);
    localStorage.setItem('inf_scrap_submissions', JSON.stringify(submissions));

    scrapForm.reset();
    scrapSuccess.style.display = 'block';
    showToast('♻️ Submission Logged', `Credits will be estimated at +${estimatedCredits} after verification.`);
    setTimeout(() => { scrapSuccess.style.display = 'none'; }, 5000);
  });

  /* ========= SHOP RENDERING ========= */
  let activeFilter = 'all';

  function renderScrapShop() {
    const grid = document.getElementById('scrap-shop-grid');
    const filtered = scrapProducts.filter(p => activeFilter === 'all' || p.category === activeFilter);

    grid.innerHTML = filtered.map(p => {
      // Calculate price after eco-credits discount
      const discountedPrice = Math.max(0, p.price - p.creditsRequired);
      const canAffordCredits = credits >= p.creditsRequired;

      return `
        <div class="product-card">
          <div class="product-image-wrap">
            <span class="product-fallback-icon">${p.icon}</span>
            <img src="${p.imageUrl}" alt="${p.name}" class="product-img" onerror="this.style.display='none'" />
            <span class="product-badge" style="background:rgba(0,230,118,0.12);color:#00e676;border-color:rgba(0,230,118,0.3)">
              ${p.category}
            </span>
          </div>
          <div class="product-info-wrap">
            <h3 class="product-title">${p.name}</h3>
            <p class="product-desc" style="font-size:0.78rem;margin-bottom:0.6rem;">${p.desc}</p>
            
            <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.8rem;display:flex;flex-direction:column;gap:0.2rem;">
              <div>Regular Price: <del>₹${p.price}</del></div>
              <div style="color:#00e676;font-weight:700;">
                Leaf Price: ₹${discountedPrice} <span style="font-size:0.7rem;font-weight:normal;color:var(--text-dim);">(-${p.creditsRequired} Credits)</span>
              </div>
            </div>

            <button class="btn-checkout" onclick="buyScrapKit('${p.id}')" style="background:linear-gradient(135deg, #00e676, #b44fff);box-shadow:0 0 20px rgba(0,230,118,0.25);">
              🚀 Buy with Credits
            </button>
          </div>
        </div>`;
    }).join('');
  }

  // Hook filters
  document.querySelectorAll('.scrap-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.scrap-cat-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.dataset.cat;
      renderScrapShop();
    });
  });

  window.buyScrapKit = function (productId) {
    const product = scrapProducts.find(p => p.id === productId);
    if (!product) return;

    if (credits < product.creditsRequired) {
      showToast('❌ Insufficient Eco-Credits', `You need ${product.creditsRequired} credits. Donate more e-waste to earn credits!`);
      return;
    }

    // Deduct credits and place order
    updateCredits(-product.creditsRequired);

    const order = {
      id: 'SK-ORD-' + Date.now(),
      customerId: user.id,
      productName: product.name,
      paidAmount: Math.max(0, product.price - product.creditsRequired),
      creditsUsed: product.creditsRequired,
      status: 'Dispatching',
      date: new Date().toISOString()
    };

    const orders = JSON.parse(localStorage.getItem('inf_scrap_orders')) || [];
    orders.unshift(order);
    localStorage.setItem('inf_scrap_orders', JSON.stringify(orders));

    showToast('🛒 Kit Ordered!', `Dispatching: ${product.name}`);
    renderScrapShop();
  };

  /* ========= MY PROJECTS & SUBMISSIONS ========= */
  function renderMyProjects() {
    const subList = document.getElementById('scrap-submissions-list');
    const ordList = document.getElementById('scrap-orders-list');

    const submissions = (JSON.parse(localStorage.getItem('inf_scrap_submissions')) || [])
      .filter(s => s.customerId === user.id);

    const orders = (JSON.parse(localStorage.getItem('inf_scrap_orders')) || [])
      .filter(o => o.customerId === user.id);

    // Render Submissions
    if (!submissions.length) {
      subList.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-dim);font-size:0.85rem;">No scrap submissions. Donate e-waste to earn credits.</div>`;
    } else {
      subList.innerHTML = submissions.map(s => {
        const date = new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return `
          <div class="order-card" style="margin-bottom:1rem;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);">
            <div class="order-card-header" style="padding-bottom:0.4rem;">
              <div>
                <strong style="color:#fff;font-size:0.9rem;">${s.itemName}</strong>
                <div style="font-size:0.75rem;color:var(--text-dim);">${s.category} · ${s.weight}</div>
              </div>
              <span class="order-status" style="background:rgba(212,175,55,0.12);border-color:rgba(212,175,55,0.4);color:#d4af37;">${s.status}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.6rem;font-size:0.78rem;border-top:1px solid rgba(255,255,255,0.04);padding-top:0.5rem;">
              <span style="color:#00e676;">Est. Value: +${s.estimatedCredits} Credits</span>
              <span style="color:var(--text-dim);">${date}</span>
            </div>
          </div>`;
      }).join('');
    }

    // Render Kit Orders
    if (!orders.length) {
      ordList.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-dim);font-size:0.85rem;">No kits ordered. Browse shop tab to buy kits.</div>`;
    } else {
      ordList.innerHTML = orders.map(o => {
        const date = new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return `
          <div class="order-card" style="margin-bottom:1rem;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);">
            <div class="order-card-header" style="padding-bottom:0.4rem;">
              <div>
                <strong style="color:#fff;font-size:0.9rem;">${o.productName}</strong>
                <div style="font-size:0.75rem;color:var(--text-dim);">Used ${o.creditsUsed} Credits</div>
              </div>
              <span class="order-status" style="background:rgba(0,230,118,0.12);border-color:rgba(0,230,118,0.4);color:#00e676;">${o.status}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.6rem;font-size:0.78rem;border-top:1px solid rgba(255,255,255,0.04);padding-top:0.5rem;">
              <span style="color:#fff;">Paid: ₹${o.paidAmount}</span>
              <span style="color:var(--text-dim);">${date}</span>
            </div>
          </div>`;
      }).join('');
    }
  }

  /* ========= IMPACT TRACKING ========= */
  function renderImpact() {
    const submissions = (JSON.parse(localStorage.getItem('inf_scrap_submissions')) || [])
      .filter(s => s.customerId === user.id);

    const kits = (JSON.parse(localStorage.getItem('inf_scrap_orders')) || [])
      .filter(o => o.customerId === user.id);

    // Calculate weight: base 2.8kg + 1.2kg per verified submission
    let wasteWeight = 2.8;
    let reusedCount = 14;
    
    submissions.forEach(s => {
      if (s.status === 'Verified' || s.status === 'Pending Verification') {
        wasteWeight += 0.8; // estimate 800g per recycling log
        reusedCount += 4;
      }
    });

    const co2Offset = (wasteWeight * 2.3).toFixed(1); // 2.3kg CO2 offset per kg of e-waste

    const wasteEl = document.getElementById('impact-waste');
    const co2El = document.getElementById('impact-co2');
    const partsEl = document.getElementById('impact-parts');

    if (wasteEl) wasteEl.textContent = wasteWeight.toFixed(1) + ' kg';
    if (co2El) co2El.textContent = co2Offset + ' kg';
    if (partsEl) partsEl.textContent = reusedCount;
  }

  /* ========= TOAST ========= */
  function showToast(title, message) {
    const toast = document.getElementById('scrap-toast');
    document.getElementById('scrap-toast-title').textContent = title;
    document.getElementById('scrap-toast-msg').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 4000);
  }

})();
