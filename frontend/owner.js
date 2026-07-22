/* ============================================
   INFINITE SERVICES – Owner Dashboard JS
   ============================================ */

(function () {
  'use strict';

  /* ---- Auth Guard ---- */
  const user = AuthManager.requireAuth('owner');
  if (!user) return;

  /* ---- Particle Canvas ---- */
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const COLORS = ['rgba(0,207,255,', 'rgba(255,215,0,', 'rgba(180,79,255,'];
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
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-avatar-big').textContent = user.name.charAt(0).toUpperCase();

  /* ---- Sign Out ---- */
  document.getElementById('nav-signout-btn').addEventListener('click', () => AuthManager.signOut());
  document.getElementById('profile-signout-btn').addEventListener('click', () => AuthManager.signOut());

  /* ========= BACKEND POLLING ========= */
  let serverOrders = [];
  let serverBookings = [];

  async function fetchServerData() {
    try {
      const [oRes, bRes] = await Promise.all([
        fetch('/api/orders').catch(() => null),
        fetch('/api/bookings').catch(() => null)
      ]);
      
      if (oRes && oRes.ok) {
        try {
          const oData = await oRes.json();
          if (oData.ok) serverOrders = oData.orders;
        } catch(e) { console.warn('Orders JSON error (Did you restart the backend?)'); }
      }
      
      if (bRes && bRes.ok) {
        try {
          const bData = await bRes.json();
          if (bData.ok) serverBookings = bData.bookings;
        } catch(e) { console.warn('Bookings JSON error (Did you restart the backend?)'); }
      }
      
      updateNotifBadge();
      const overviewTab = document.getElementById('tab-overview');
      if (overviewTab && overviewTab.classList.contains('active')) renderOverview();
      const ordersTab = document.getElementById('tab-orders');
      if (ordersTab && ordersTab.classList.contains('active')) renderAllOrders();
      const bookingsTab = document.getElementById('tab-bookings');
      if (bookingsTab && bookingsTab.classList.contains('active')) renderBookings();
    } catch (err) {
      console.error('Error in fetchServerData:', err);
    }
  }

  setInterval(fetchServerData, 5000);
  fetchServerData();

  /* ========= TAB SYSTEM ========= */
  const tabs        = document.querySelectorAll('.portal-tab');
  const sidebarItems = document.querySelectorAll('.sidebar-item');

  function showTab(tabId) {
    tabs.forEach(t => t.classList.remove('active'));
    sidebarItems.forEach(s => s.classList.remove('active'));
    const tab         = document.getElementById('tab-' + tabId);
    const sidebarItem = document.getElementById('sidebar-' + tabId);
    if (tab) tab.classList.add('active');
    if (sidebarItem) sidebarItem.classList.add('active');
    if (tabId === 'orders')   renderAllOrders();
    if (tabId === 'overview') renderOverview();
    if (tabId === 'products') renderOwnerProducts();
    if (tabId === 'bookings') renderBookings();
  }

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tab));
  });

  document.getElementById('view-all-orders-btn')?.addEventListener('click', () => showTab('orders'));

  /* ========= NOTIFICATION SYSTEM ========= */
  function getNewBookingCount() {
    return serverBookings.filter(b => b.status === 'Pending Review' || b.status === 'Under Review').length;
  }

  function updateNotifBadge() {
    const orderCount = serverOrders.filter(o => o.isNewOrder).length;
    const bookingCount = getNewBookingCount();
    const totalCount = orderCount + bookingCount;

    const badge = document.getElementById('notif-badge');
    const sidebarOrderBadge = document.getElementById('sidebar-order-badge');
    const sidebarBookingBadge = document.getElementById('sidebar-booking-badge');

    if (totalCount > 0) {
      badge.textContent = totalCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    if (orderCount > 0) {
      sidebarOrderBadge.textContent = orderCount;
      sidebarOrderBadge.classList.remove('hidden');
    } else {
      sidebarOrderBadge.classList.add('hidden');
    }

    if (sidebarBookingBadge) {
      if (bookingCount > 0) {
        sidebarBookingBadge.textContent = bookingCount;
        sidebarBookingBadge.classList.remove('hidden');
      } else {
        sidebarBookingBadge.classList.add('hidden');
      }
    }
  }

  function showOwnerToast(title, msg) {
    const toast = document.getElementById('owner-toast');
    const strongEl = toast.querySelector('strong');
    if (strongEl) strongEl.textContent = title;
    document.getElementById('owner-toast-msg').textContent = msg;
    toast.classList.remove('hidden');
    toast.classList.add('show');
  }

  function dismissToast() {
    const toast = document.getElementById('owner-toast');
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }

  document.getElementById('toast-dismiss-btn').addEventListener('click', dismissToast);

  /* Cross-tab StorageEvent — fires when customer places order or products are changed */
  window.addEventListener('storage', async (e) => {
    if (e.key === 'inf_last_order' && e.newValue) {
      await fetchServerData();
      try {
        const data = JSON.parse(e.newValue);
        showOwnerToast(`New Order from ${data.customerName || 'a customer'}!`, 
          data.summary ? `${data.summary} (₹${data.total})` : 'Check the Orders tab.');
      } catch (err) {}
      // Auto-dismiss after 6s
      setTimeout(dismissToast, 6000);
    } else if (e.key === 'inf_last_booking' && e.newValue) {
      await fetchServerData();
      try {
        const data = JSON.parse(e.newValue);
        showOwnerToast(`New Project from ${data.customerName || 'a customer'}!`, 
          data.title ? `Type: ${data.type} - ${data.title}` : 'Check the Bookings tab.');
      } catch (err) {}
      setTimeout(dismissToast, 6000);
    } else if (e.key === 'inf_products') {
      renderOwnerProducts();
      renderOverview();
    }
  });

  /* Click bell to go to orders and clear badge */
  document.getElementById('notif-bell').addEventListener('click', () => {
    showTab('orders');
    // Mark all as seen
    serverOrders.forEach(async o => {
      if (o.isNewOrder) {
        await fetch(`/api/orders/${o.id}/seen`, { method: 'PUT' });
      }
    });
    fetchServerData();
  });

  /* ========= OVERVIEW ========= */
  function renderOverview() {
    const orders = serverOrders;
    const bookings = serverBookings;
    
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => o.isNewOrder).length;
    const fulfilledOrders = orders.filter(o => o.status === 'Fulfilled').length;
    const revenue = orders.reduce((s, o) => s + o.total, 0);

    const totalBookings = bookings.length;
    const newBookings = bookings.filter(b => b.status === 'Pending Review' || b.status === 'Under Review').length;
    const fulfilledBookings = bookings.filter(b => b.status === 'Completed').length;

    document.getElementById('stat-total-orders').textContent = totalOrders + totalBookings;
    document.getElementById('stat-new-orders').textContent = newOrders + newBookings;
    document.getElementById('stat-fulfilled').textContent = fulfilledOrders + fulfilledBookings;
    document.getElementById('stat-revenue').textContent = `₹${revenue}`;

    // Recent orders snippet (latest 5)
    const recent = orders.slice(0, 5);
    renderOrdersTable('recent-orders-table', recent, true);
  }

  /* ========= ORDER TABLE RENDERER ========= */
  function renderOrdersTable(containerId, orders, compact = false) {
    const container = document.getElementById(containerId);
    if (!orders || orders.length === 0) {
      container.innerHTML = '<div class="empty-state"><span>📦</span><p>No orders yet.</p></div>';
      return;
    }
    container.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            ${!compact ? '<th>Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr class="order-row ${o.isNewOrder ? 'new-order-row' : ''}" data-id="${o.id}">
              <td><span class="order-id-cell">${o.id}${o.isNewOrder ? ' <span class="new-dot">NEW</span>' : ''}</span></td>
              <td>
                <div class="customer-cell">
                  <div class="cust-avatar">${o.customerName.charAt(0).toUpperCase()}</div>
                  <div>
                    <div class="cust-name">${o.customerName}</div>
                    <div class="cust-email">${o.customerEmail}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="item-count-badge">${o.items.length} item${o.items.length > 1 ? 's' : ''}</span>
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">
                  ${o.items.map(i => `${i.qty}x ${i.name}`).join('<br>')}
                </div>
              </td>
              <td><strong>₹${o.total}</strong></td>
              <td class="date-cell">${new Date(o.placedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
              <td><span class="order-status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
              ${!compact ? `
              <td>
                <select class="status-select" data-id="${o.id}">
                  <option value="Pending"    ${o.status==='Pending'?'selected':''}>Pending</option>
                  <option value="Processing" ${o.status==='Processing'?'selected':''}>Processing</option>
                  <option value="Fulfilled"  ${o.status==='Fulfilled'?'selected':''}>Fulfilled</option>
                  <option value="Cancelled"  ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                </select>
              </td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Status select change
    if (!compact) {
      container.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          try {
            await fetch(`/api/orders/${sel.dataset.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: sel.value })
            });
            fetchServerData();
            // Flash the row
            const row = sel.closest('tr');
            if (row) { row.classList.add('row-flash'); setTimeout(() => row.classList.remove('row-flash'), 600); }
          } catch (e) {}
        });
      });
    }
  }

  /* ========= ALL ORDERS TAB ========= */
  function renderAllOrders() {
    const filter = document.getElementById('order-status-filter').value;
    let orders = serverOrders;
    if (filter !== 'All') orders = orders.filter(o => o.status === filter);
    renderOrdersTable('all-orders-table', orders, false);
    updateNotifBadge();
  }

  document.getElementById('order-status-filter').addEventListener('change', renderAllOrders);

  /* ========= BOOKINGS TAB ========= */
  function renderBookings() {
    const container = document.getElementById('all-bookings-table');
    if (!container) return;

    const bookings = serverBookings;

    if (bookings.length === 0) {
      container.innerHTML = '<div class="empty-state"><span>💼</span><p>No service bookings yet.</p></div>';
      return;
    }

    container.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Booking ID / Source</th>
            <th>Customer</th>
            <th>Type / Title</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.map(b => `
            <tr class="order-row">
              <td>
                <span class="order-id-cell">${b.id}</span>
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">${b.source}</div>
              </td>
              <td>
                <div class="customer-cell">
                  <div class="cust-avatar">${b.customerName.charAt(0).toUpperCase()}</div>
                  <div class="cust-name">${b.customerName}</div>
                </div>
              </td>
              <td>
                <strong>${b.title}</strong>
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">${b.type}</div>
              </td>
              <td class="date-cell">${new Date(b.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
              <td><span class="order-status-badge">${b.status}</span></td>
              <td>
                <select class="booking-status-select portal-select" data-id="${b.id}" data-source="${b.source}" style="max-width:120px;">
                  <option value="${b.status}" selected disabled>${b.status}</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.booking-status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        updateBookingStatus(sel.dataset.id, sel.dataset.source, sel.value);
      });
    });
  }

  async function updateBookingStatus(id, source, newStatus) {
    try {
      await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchServerData();
    } catch (e) { console.error(e); }
  }

  /* ========= PRODUCT MODAL SYSTEM ========= */
  const productModal      = document.getElementById('product-modal');
  const productForm       = document.getElementById('product-form');
  const productModalClose  = document.getElementById('product-modal-close');
  const productModalTitle  = document.getElementById('product-modal-title');
  const productFormErr     = document.getElementById('product-form-err');
  const addProductBtn      = document.getElementById('add-product-btn');

  let selectedImageBase64 = '';

  // Handle file selection and read as base64
  const fileInput = document.getElementById('product-image-file');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          selectedImageBase64 = event.target.result;
          
          const previewImg = document.getElementById('product-image-preview');
          const placeholder = document.getElementById('product-image-placeholder');
          const filenameSpan = document.getElementById('product-image-filename');
          const removeBtn = document.getElementById('product-image-remove');
          
          if (previewImg) { previewImg.src = selectedImageBase64; previewImg.style.display = 'block'; }
          if (placeholder) placeholder.style.display = 'none';
          if (filenameSpan) filenameSpan.textContent = file.name;
          if (removeBtn) removeBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle image removal
  const removeImageBtn = document.getElementById('product-image-remove');
  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
      selectedImageBase64 = '';
      
      const fileInput = document.getElementById('product-image-file');
      const previewImg = document.getElementById('product-image-preview');
      const placeholder = document.getElementById('product-image-placeholder');
      const filenameSpan = document.getElementById('product-image-filename');
      
      if (fileInput) fileInput.value = '';
      if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
      if (placeholder) placeholder.style.display = 'block';
      if (filenameSpan) filenameSpan.textContent = 'No image selected';
      removeImageBtn.style.display = 'none';
    });
  }

  function openProductModal(mode, productId = null) {
    if (!productForm || !productModal) return;
    productForm.reset();
    productFormErr.textContent = '';
    selectedImageBase64 = '';

    const previewImg = document.getElementById('product-image-preview');
    const placeholder = document.getElementById('product-image-placeholder');
    const filenameSpan = document.getElementById('product-image-filename');
    const removeBtn = document.getElementById('product-image-remove');
    const fileInput = document.getElementById('product-image-file');

    if (fileInput) fileInput.value = '';
    if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'block';
    if (filenameSpan) filenameSpan.textContent = 'No image selected';
    if (removeBtn) removeBtn.style.display = 'none';
    
    if (mode === 'add') {
      productModalTitle.innerHTML = '⚡ Add New <span class="gradient-text">Product</span>';
      document.getElementById('product-id').value = '';
      document.getElementById('product-modal-subtitle').textContent = 'Enter details to add a product to the catalog.';
    } else {
      productModalTitle.innerHTML = '⚡ Edit <span class="gradient-text">Product</span>';
      document.getElementById('product-id').value = productId;
      document.getElementById('product-modal-subtitle').textContent = 'Modify product details below.';
      
      const p = ShopManager.getProductById(productId);
      if (p) {
        document.getElementById('product-name').value = p.name;
        document.getElementById('product-category').value = p.category;
        document.getElementById('product-price').value = p.price;
        document.getElementById('product-stock').value = p.stock;
        document.getElementById('product-unit').value = p.unit;
        document.getElementById('product-desc').value = p.desc;
        
        if (p.imageUrl) {
          selectedImageBase64 = p.imageUrl;
          if (previewImg) { previewImg.src = p.imageUrl; previewImg.style.display = 'block'; }
          if (placeholder) placeholder.style.display = 'none';
          if (filenameSpan) {
            filenameSpan.textContent = p.imageUrl.startsWith('data:') ? 'Custom uploaded image' : p.imageUrl.split('/').pop();
          }
          if (removeBtn) removeBtn.style.display = 'block';
        }
      }
    }
    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    if (productModal) {
      productModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (addProductBtn) addProductBtn.addEventListener('click', () => openProductModal('add'));
  if (productModalClose) productModalClose.addEventListener('click', closeProductModal);
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) closeProductModal();
    });
  }

  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('product-id').value;
      const name = document.getElementById('product-name').value.trim();
      const category = document.getElementById('product-category').value.trim();
      const price = Number(document.getElementById('product-price').value);
      const stock = Number(document.getElementById('product-stock').value);
      const unit = document.getElementById('product-unit').value.trim();
      const desc = document.getElementById('product-desc').value.trim();
      const imageUrl = selectedImageBase64;

      if (!name || !category || isNaN(price) || isNaN(stock) || !unit || !desc) {
        productFormErr.textContent = 'Please fill out all fields correctly.';
        return;
      }

      if (price < 0 || stock < 0) {
        productFormErr.textContent = 'Price and Stock must be non-negative numbers.';
        return;
      }

      const existingProduct = id ? ShopManager.getProductById(id) : null;
      const icon = existingProduct ? existingProduct.icon : '⚡';

      const productData = { name, category, icon, price, stock, unit, desc, imageUrl };
      
      if (id) {
        const result = await ShopManager.updateProduct(id, productData);
        if (!result.ok) {
          productFormErr.textContent = result.error || 'Failed to update product.';
          return;
        }
      } else {
        const result = await ShopManager.addProduct(productData);
        if (!result.ok) {
          productFormErr.textContent = result.error || 'Failed to add product.';
          return;
        }
      }

      closeProductModal();
      renderOwnerProducts();
      renderOverview();
    });
  }

  /* ========= OWNER PRODUCT VIEW ========= */
  function renderOwnerProducts() {
    const grid = document.getElementById('owner-product-grid');
    if (!grid) return;
    const products = ShopManager.getProducts();
    grid.innerHTML = products.map(p => `
      <div class="product-card owner-product-card">
        <div class="product-image-wrap">
          <img src="${p.imageUrl || ''}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="product-img-fallback">${p.icon}</div>
          <span class="product-cat-tag">${p.category}</span>
        </div>
        <div class="product-body" style="display: flex; flex-direction: column; height: 100%; flex: 1;">
          <h4 class="product-name">${p.name}</h4>
          <p class="product-desc" style="flex: 1;">${p.desc}</p>
          <div class="product-price-row" style="margin-bottom: 0.5rem; display: flex; align-items: baseline; gap: 0.5rem;">
            <span class="product-price" style="font-family: var(--font-head); font-size: 1.15rem; font-weight: 700; color: var(--blue);">₹${p.price}</span>
            <span class="product-unit" style="font-size: 0.74rem; color: rgba(255,255,255,0.28); font-style: italic; white-space: nowrap;">${p.unit}</span>
          </div>
          <div class="product-stock ${p.stock < 10 ? 'low-stock' : ''}" style="font-size: 0.75rem; color: rgba(0,220,100,0.8); margin-bottom: 1rem;">
            ${p.stock < 10 ? '⚠️ ' : '✓ '}${p.stock} in stock
          </div>
          <div class="owner-product-actions" style="margin-top: auto; display: flex; gap: 0.5rem;">
            <button class="nav-goto-dashboard edit-product-btn" data-id="${p.id}" style="flex: 1; text-align: center; justify-content: center; font-size: 0.75rem; padding: 0.5rem 0;">✏️ Edit</button>
            <button class="btn-danger delete-product-btn" data-id="${p.id}" style="flex: 1; border-radius: 8px; font-size: 0.75rem; padding: 0.5rem 0;">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `).join('');

    // Bind Edit and Delete events
    grid.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openProductModal('edit', btn.dataset.id);
      });
    });

    grid.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const p = ShopManager.getProductById(id);
        if (p && confirm(`Are you sure you want to delete "${p.name}"?`)) {
          const result = await ShopManager.deleteProduct(id);
          if (result.ok) {
            renderOwnerProducts();
            renderOverview();
          } else {
            alert(result.error || 'Failed to delete product.');
          }
        }
      });
    });
  }

  /* ========= INIT ========= */
  (async function init() {
    await ShopManager.initProducts();
    renderOverview();
    updateNotifBadge();
  })();

})();
