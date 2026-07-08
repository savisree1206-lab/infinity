/* ============================================
   INFINITE SERVICES – Electronics Dashboard JS
   ============================================ */

(function () {
  'use strict';

  /* ---- Auth Guard ---- */
  const user = AuthManager.currentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  /* ---- Particle Canvas ---- */
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const COLORS = ['rgba(212,175,55,', 'rgba(255,255,255,', 'rgba(255,215,0,'];
    function createParticle() {
      return { x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.4, color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: Math.random() * 0.3 + 0.1, angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.25 + 0.06, pulse: Math.random() * Math.PI * 2 };
    }
    for (let i = 0; i < 60; i++) particles.push(createParticle());
    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.pulse += 0.02; const op = p.opacity + Math.sin(p.pulse) * 0.05;
        p.x += Math.cos(p.angle) * p.speed; p.y += Math.sin(p.angle) * p.speed; p.angle += 0.005;
        if (p.x < -10) p.x = canvas.width + 10; if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10; if (p.y > canvas.height + 10) p.y = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.max(0, Math.min(1, op)) + ')'; ctx.fill();
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

    if (tabId === 'shop') renderShop();
    if (tabId === 'orders') renderOrders();
    if (tabId === 'my-bookings') renderBookings();
    if (tabId === 'learn') initLearnTab();
  }

  /* ---- YouTube URL → Video ID ---- */
  function extractYouTubeId(url) {
    try {
      const u = new URL(url.trim());
      // youtu.be/XXXXX
      if (u.hostname === 'youtu.be') return u.pathname.slice(1).split(/[?&]/)[0];
      // youtube.com/watch?v=XXXXX  or  /embed/XXXXX  or  /shorts/XXXXX
      return u.searchParams.get('v') ||
             u.pathname.match(/\/(?:embed|shorts|v)\/([^/?&]+)/)?.[1] ||
             null;
    } catch { return null; }
  }

  function initLearnTab() {
    const loadBtn  = document.getElementById('yt-load-btn');
    const urlInput = document.getElementById('yt-url-input');
    const wrap     = document.getElementById('learn-video-wrap');
    if (!loadBtn || loadBtn._bound) return;
    loadBtn._bound = true;

    function loadVideo() {
      const id = extractYouTubeId(urlInput.value);
      if (!id) {
        urlInput.style.borderColor = 'rgba(255,60,60,0.6)';
        urlInput.focus();
        setTimeout(() => { urlInput.style.borderColor = ''; }, 1800);
        return;
      }
      wrap.innerHTML = `
        <iframe
          src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&color=white&autoplay=1"
          title="Electronics Tutorial – Electronic Designer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>`;
      urlInput.value = '';
      urlInput.style.borderColor = '';
    }

    loadBtn.addEventListener('click', loadVideo);
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadVideo(); });
  }

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tab));
  });

  /* ========= SERVICE BOOKINGS ========= */
  function getBookings() {
    try { return JSON.parse(localStorage.getItem('inf_bookings')) || []; }
    catch { return []; }
  }

  function saveBooking(booking) {
    const bookings = getBookings();
    bookings.unshift(booking);
    localStorage.setItem('inf_bookings', JSON.stringify(bookings));
    localStorage.setItem('inf_last_booking', JSON.stringify({ 
      id: booking.id, 
      customerName: booking.customerName,
      type: booking.type,
      title: booking.title,
      ts: Date.now() 
    }));
  }

  const bookingForm = document.getElementById('service-booking-form');
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('project-type').value;
    const title = document.getElementById('project-title').value;
    const desc = document.getElementById('project-desc').value;

    const booking = {
      id: 'PRJ-' + Date.now(),
      customerId: user.id,
      customerName: user.name,
      type, title, desc,
      status: 'Pending Review',
      date: new Date().toISOString()
    };
    saveBooking(booking);
    
    bookingForm.reset();
    const successMsg = document.getElementById('booking-success-msg');
    successMsg.style.display = 'block';
    setTimeout(() => successMsg.style.display = 'none', 4000);
  });

  function renderBookings() {
    const bookings = getBookings().filter(b => b.customerId === user.id);
    const container = document.getElementById('bookings-list');
    
    if (bookings.length === 0) {
      container.innerHTML = '<div class="empty-state"><span>📋</span><p>You have no projects yet.</p></div>';
      return;
    }
    
    container.innerHTML = bookings.map(b => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">${b.id} - ${b.title}</span>
          <span class="order-status-badge status-pending">${b.status}</span>
        </div>
        <div class="order-body" style="margin-top: 10px; color: var(--text-muted);">
          <p><strong>Type:</strong> ${b.type}</p>
          <p><strong>Description:</strong> ${b.desc}</p>
          <p><strong>Date:</strong> ${new Date(b.date).toLocaleDateString()}</p>
        </div>
      </div>
    `).join('');
  }


  /* ========= SHOP & CART (Reusing ShopManager) ========= */
  let currentCategory = 'All';
  let searchQuery = '';

  function renderShop() {
    renderCategories();
    renderProducts();
    updateCartBadge();
  }

  function renderCategories() {
    const cats = ShopManager.getCategories();
    const container = document.getElementById('category-filter');
    container.innerHTML = cats.map(c => 
      `<button class="cat-btn ${c === currentCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentCategory = e.target.dataset.cat;
        renderCategories();
        renderProducts();
      });
    });
  }

  document.getElementById('product-search').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderProducts();
  });

  function renderProducts() {
    const grid = document.getElementById('product-grid');
    let products = ShopManager.getProducts();
    
    if (currentCategory !== 'All') {
      products = products.filter(p => p.category === currentCategory);
    }
    if (searchQuery) {
      products = products.filter(p => p.name.toLowerCase().includes(searchQuery) || p.desc.toLowerCase().includes(searchQuery));
    }

    if (products.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No components found.</div>';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${p.imageUrl}" alt="${p.name}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="product-img-fallback">${p.icon}</div>
          <span class="product-cat-tag">${p.category}</span>
        </div>
        <div class="product-body">
          <h4 class="product-name">${p.name}</h4>
          <p class="product-desc">${p.desc}</p>
          <div class="product-price-row">
            <span class="product-price">₹${p.price}</span>
            <span class="product-unit">${p.unit}</span>
          </div>
          <button class="add-to-cart-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const res = ShopManager.addToCart(id, 1);
        if (res.ok) {
          updateCartBadge();
          renderCart();
          cartOverlay.classList.add('open');
          cartDrawer.classList.add('open');
        }
      });
    });
  }

  /* Cart Drawer */
  const cartOverlay = document.getElementById('cart-overlay');
  const cartDrawer = document.getElementById('cart-drawer');
  
  function closeCart() {
    cartOverlay.classList.remove('open');
    cartDrawer.classList.remove('open');
  }

  document.getElementById('cart-trigger-btn').addEventListener('click', () => {
    renderCart();
    cartOverlay.classList.add('open');
    cartDrawer.classList.add('open');
  });
  document.getElementById('cart-close-btn').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const count = ShopManager.getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  function renderCart() {
    const cart = ShopManager.getCart();
    const itemsContainer = document.getElementById('cart-items');
    
    if (cart.length === 0) {
      itemsContainer.innerHTML = '<div class="empty-state" style="margin-top: 50px;"><span>🛒</span><p>Your cart is empty.</p></div>';
      document.getElementById('cart-total-price').textContent = '₹0';
      document.getElementById('btn-checkout').disabled = true;
      return;
    }

    document.getElementById('btn-checkout').disabled = false;
    document.getElementById('cart-total-price').textContent = '₹' + ShopManager.getCartTotal();

    itemsContainer.innerHTML = cart.map(item => {
      const p = ShopManager.getProductById(item.productId);
      if(!p) return '';
      return `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${p.imageUrl}" />
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-price">₹${p.price}</div>
          </div>
          <div class="cart-qty-controls">
            <button class="qty-btn" onclick="updateCart('${p.id}', ${item.qty - 1})">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="updateCart('${p.id}', ${item.qty + 1})">+</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.updateCart = (productId, qty) => {
    ShopManager.updateCartQty(productId, qty);
    renderCart();
    updateCartBadge();
  };

  document.getElementById('btn-checkout').addEventListener('click', () => {
    const res = ShopManager.placeOrder(user);
    if (res.ok) {
      closeCart();
      updateCartBadge();
      
      const toast = document.getElementById('order-toast');
      toast.classList.remove('hidden');
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 400);
      }, 4000);
      
      if (document.getElementById('tab-orders').classList.contains('active')) {
        renderOrders();
      }
    }
  });

  /* ========= ORDERS TAB ========= */
  function renderOrders() {
    const orders = ShopManager.getOrdersByCustomer(user.id);
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
      container.innerHTML = '<div class="empty-state"><span>📦</span><p>You have no shop orders yet.</p></div>';
      return;
    }
    
    container.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">${o.id}</span>
          <span class="order-status-badge status-${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div class="order-items">
          ${o.items.map(i => `<div class="order-item-row"><span>${i.qty}x ${i.name}</span><span>₹${i.subtotal}</span></div>`).join('')}
        </div>
        <div class="order-footer">
          <span class="order-date">${new Date(o.placedAt).toLocaleDateString()}</span>
          <strong class="order-total">Total: ₹${o.total}</strong>
        </div>
      </div>
    `).join('');
  }

  /* ---- Initial Render ---- */
  updateCartBadge();

  /* ========= STORAGE EVENT SYNC ========= */
  window.addEventListener('storage', (e) => {
    if (e.key === 'inf_products') {
      renderCategories();
      renderProducts();
      updateCartBadge();
      renderCart();
    }
  });

})();
