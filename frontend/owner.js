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
  }

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tab));
  });

  document.getElementById('view-all-orders-btn')?.addEventListener('click', () => showTab('orders'));

  /* ========= NOTIFICATION SYSTEM ========= */
  function updateNotifBadge() {
    const count = ShopManager.getNewOrderCount();
    const badge = document.getElementById('notif-badge');
    const sidebarBadge = document.getElementById('sidebar-order-badge');
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
      sidebarBadge.textContent = count;
      sidebarBadge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
      sidebarBadge.classList.add('hidden');
    }
  }

  function showOwnerToast(msg) {
    const toast = document.getElementById('owner-toast');
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
  window.addEventListener('storage', (e) => {
    if (e.key === 'inf_last_order' && e.newValue) {
      updateNotifBadge();
      showOwnerToast('A customer just placed a new order! Check the Orders tab.');
      renderOverview();
      // Auto-dismiss after 6s
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
    const orders = ShopManager.getOrders();
    orders.forEach(o => ShopManager.markOrderSeen(o.id));
    updateNotifBadge();
  });

  /* ========= OVERVIEW ========= */
  function renderOverview() {
    const orders = ShopManager.getOrders();
    const total     = orders.length;
    const newCount  = orders.filter(o => o.isNew).length;
    const fulfilled = orders.filter(o => o.status === 'Fulfilled').length;
    const revenue   = orders.reduce((s, o) => s + o.total, 0);

    document.getElementById('stat-total-orders').textContent = total;
    document.getElementById('stat-new-orders').textContent   = newCount;
    document.getElementById('stat-fulfilled').textContent    = fulfilled;
    document.getElementById('stat-revenue').textContent      = '₹' + revenue;

    // Recent 5 orders
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
            <tr class="order-row ${o.isNew ? 'new-order-row' : ''}" data-id="${o.id}">
              <td><span class="order-id-cell">${o.id}${o.isNew ? ' <span class="new-dot">NEW</span>' : ''}</span></td>
              <td>
                <div class="customer-cell">
                  <div class="cust-avatar">${o.customerName.charAt(0).toUpperCase()}</div>
                  <div>
                    <div class="cust-name">${o.customerName}</div>
                    <div class="cust-email">${o.customerEmail}</div>
                  </div>
                </div>
              </td>
              <td><span class="item-count-badge">${o.items.length} item${o.items.length > 1 ? 's' : ''}</span></td>
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
        sel.addEventListener('change', () => {
          ShopManager.updateOrderStatus(sel.dataset.id, sel.value);
          renderAllOrders();
          renderOverview();
          updateNotifBadge();
          // Flash the row
          const row = sel.closest('tr');
          if (row) { row.classList.add('row-flash'); setTimeout(() => row.classList.remove('row-flash'), 600); }
        });
      });
    }
  }

  /* ========= ALL ORDERS TAB ========= */
  function renderAllOrders() {
    const filter = document.getElementById('order-status-filter').value;
    let orders = ShopManager.getOrders();
    if (filter !== 'All') orders = orders.filter(o => o.status === filter);
    renderOrdersTable('all-orders-table', orders, false);
    updateNotifBadge();
  }

  document.getElementById('order-status-filter').addEventListener('change', renderAllOrders);

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
    productForm.addEventListener('submit', (e) => {
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
        const result = ShopManager.updateProduct(id, productData);
        if (!result.ok) {
          productFormErr.textContent = result.error || 'Failed to update product.';
          return;
        }
      } else {
        ShopManager.addProduct(productData);
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
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const p = ShopManager.getProductById(id);
        if (p && confirm(`Are you sure you want to delete "${p.name}"?`)) {
          const result = ShopManager.deleteProduct(id);
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
  renderOverview();
  updateNotifBadge();

})();
