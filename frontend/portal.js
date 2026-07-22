/* ============================================
   INFINITE SERVICES – Customer Portal JS
   ============================================ */

(function () {
    'use strict';

    /* ---- Auth Guard ---- */
    const user = AuthManager.requireAuth('customer');
    if (!user) return;

    /* ---- Particle Canvas ---- */
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        const COLORS = ['rgba(0,207,255,', 'rgba(180,79,255,', 'rgba(255,140,0,'];
        function createParticle() {
            return {
                x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.4,
                color: COLORS[Math.floor(Math.random() * COLORS.length)], speed: Math.random() * 0.3 + 0.1,
                angle: Math.random() * Math.PI * 2, opacity: Math.random() * 0.3 + 0.08, pulse: Math.random() * Math.PI * 2
            };
        }
        for (let i = 0; i < 60; i++) particles.push(createParticle());
        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.pulse += 0.02;
                const op = p.opacity + Math.sin(p.pulse) * 0.06;
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

    /* ---- Populate Nav User Info ---- */
    document.getElementById('user-name-nav').textContent = user.name;
    document.getElementById('user-avatar-nav').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-avatar-big').textContent = user.name.charAt(0).toUpperCase();

    /* ---- Sign Out ---- */
    document.getElementById('nav-signout-btn').addEventListener('click', () => AuthManager.signOut());
    document.getElementById('profile-signout-btn').addEventListener('click', () => AuthManager.signOut());

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
        if (tabId === 'orders') renderOrders();
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => showTab(item.dataset.tab));
    });

    /* ========= PRODUCT RENDERING ========= */
    let activeCategory = 'All';
    let searchQuery = '';

    function renderCategories() {
        const container = document.getElementById('category-filter');
        const cats = ShopManager.getCategories();
        container.innerHTML = cats.map(c =>
            `<button class="cat-btn ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
        ).join('');
        container.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeCategory = btn.dataset.cat;
                renderCategories();
                renderProducts();
            });
        });
    }

    function renderProducts() {
        const grid = document.getElementById('product-grid');
        let products = ShopManager.getProducts();
        if (activeCategory !== 'All') products = products.filter(p => p.category === activeCategory);
        if (searchQuery) products = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));

        if (products.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No components found.</p></div>';
            return;
        }

        grid.innerHTML = products.map(p => `
      <div class="product-card" id="pc-${p.id}">
        <div class="product-image-wrap">
          <img src="${p.imageUrl || ''}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="product-img-fallback">${p.icon}</div>
          <span class="product-cat-tag">${p.category}</span>
        </div>
        <div class="product-body">
          <h4 class="product-name">${p.name}</h4>
          <p class="product-desc">${p.desc}</p>
          <p class="product-unit">${p.unit}</p>
          <div class="product-footer">
            <span class="product-price">₹${p.price}</span>
            <div class="product-stock ${p.stock < 10 ? 'low-stock' : ''}">
              ${p.stock < 10 ? '⚠️ ' : ''}${p.stock} in stock
            </div>
          </div>
          <button class="add-to-cart-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
          </button>
        </div>
      </div>
    `).join('');

        grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const result = ShopManager.addToCart(btn.dataset.id);
                if (result.ok) {
                    btn.textContent = '✓ Added!';
                    btn.classList.add('added');
                    setTimeout(() => { btn.textContent = '+ Add to Cart'; btn.classList.remove('added'); }, 1200);
                    updateCartBadge();
                    renderCartItems();
                }
            });
        });
    }

    /* ========= SEARCH ========= */
    document.getElementById('product-search').addEventListener('input', e => {
        searchQuery = e.target.value;
        renderProducts();
    });

    /* ========= CART DRAWER ========= */
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');

    function openCart() {
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('open');
        renderCartItems();
    }
    function closeCart() {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('open');
    }

    document.getElementById('cart-trigger-btn').addEventListener('click', openCart);
    document.getElementById('cart-close-btn').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function updateCartBadge() {
        const count = ShopManager.getCartCount();
        const badge = document.getElementById('cart-badge');
        badge.textContent = count;
        badge.classList.toggle('has-items', count > 0);
    }

    function renderCartItems() {
        const container = document.getElementById('cart-items');
        const cart = ShopManager.getCart();

        if (cart.length === 0) {
            container.innerHTML = '<div class="cart-empty"><span>🛒</span><p>Your cart is empty</p></div>';
            document.getElementById('cart-total-price').textContent = '₹0';
            return;
        }

        container.innerHTML = cart.map(item => {
            const p = ShopManager.getProductById(item.productId);
            if (!p) return '';
            return `
        <div class="cart-item">
          <span class="cart-item-icon">${p.icon}</span>
          <div class="cart-item-info">
            <span class="cart-item-name">${p.name}</span>
            <span class="cart-item-price">₹${p.price} × ${item.qty}</span>
          </div>
          <div class="cart-qty-controls">
            <button class="qty-btn" data-id="${p.id}" data-action="dec">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-id="${p.id}" data-action="inc">+</button>
          </div>
          <button class="cart-remove-btn" data-id="${p.id}">✕</button>
        </div>
      `;
        }).join('');

        document.getElementById('cart-total-price').textContent = '₹' + ShopManager.getCartTotal();

        // Qty controls
        container.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cart2 = ShopManager.getCart();
                const item = cart2.find(i => i.productId === btn.dataset.id);
                if (!item) return;
                const newQty = btn.dataset.action === 'inc' ? item.qty + 1 : item.qty - 1;
                ShopManager.updateCartQty(btn.dataset.id, newQty);
                renderCartItems();
                updateCartBadge();
            });
        });

        container.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                ShopManager.removeFromCart(btn.dataset.id);
                renderCartItems();
                updateCartBadge();
            });
        });
    }

    /* ========= CHECKOUT ========= */
    document.getElementById('btn-checkout').addEventListener('click', async () => {
        const result = await ShopManager.placeOrder(user);
        if (!result.ok) {
            alert(result.error);
            return;
        }
        closeCart();
        updateCartBadge();
        renderCartItems();

        const toast = document.getElementById('order-toast');
        document.getElementById('order-toast-msg').textContent = `Order ${result.order.id} placed! Total: ₹${result.order.total}`;
        toast.classList.remove('hidden');
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.classList.add('hidden'), 400); }, 4000);
        
        renderOrders();
    });

    /* ========= ORDERS TAB ========= */
    async function renderOrders() {
        const container = document.getElementById('orders-list');
        await ShopManager.initOrders();
        const orders = ShopManager.getOrdersByCustomer(user.id);

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><span>📦</span><p>No orders yet. Start shopping!</p><button class="btn-primary" onclick="document.getElementById(\'sidebar-shop\').click()">Browse Shop</button></div>';
            return;
        }

        container.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <span class="order-id">${o.id}</span>
            <span class="order-status-badge status-${o.status.toLowerCase()}">${o.status}</span>
          </div>
          <span class="order-date">${new Date(o.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="order-items-preview">
          ${o.items.map(i => `<span class="order-item-chip">${i.name} ×${i.qty}</span>`).join('')}
        </div>
        <div class="order-card-footer">
          <span class="order-total">Total: <strong>₹${o.total}</strong></span>
        </div>
      </div>
    `).join('');
    }

    /* ========= INIT ========= */
    (async function init() {
        await ShopManager.initProducts();
        await ShopManager.initOrders();
        renderCategories();
        renderProducts();
        updateCartBadge();
    })();

    /* ========= STORAGE EVENT SYNC ========= */
    window.addEventListener('storage', (e) => {
        if (e.key === 'inf_products') {
            renderCategories();
            renderProducts();
            updateCartBadge();
            renderCartItems();
        }
    });

})();
