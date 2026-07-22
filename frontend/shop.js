/* ============================================
   INFINITE SERVICES – Shop Manager
   Product catalog, cart, and order system
   ============================================ */

const ShopManager = (() => {
  'use strict';

  const PRODUCTS_KEY = 'inf_products';
  const CART_KEY     = 'inf_cart';
  const ORDERS_KEY   = 'inf_orders';
  const CATALOG_VERSION = 4; // bump → force re-seed with local images

  /* ------ Fetch products from API ------ */
  async function initProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.ok && data.products) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data.products));
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  }

  /* ------ Product helpers ------ */
  function getProducts() {
    try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || []; }
    catch { return []; }
  }

  function getProductById(id) {
    return getProducts().find(p => p.id === id) || null;
  }

  /* ------ Cart helpers ------ */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCart(productId, qty = 1) {
    const cart = getCart();
    const existing = cart.find(i => i.productId === productId);
    const product = getProductById(productId);
    if (!product) return { ok: false, error: 'Product not found.' };
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.stock);
    } else {
      cart.push({ productId, qty: Math.min(qty, product.stock) });
    }
    saveCart(cart);
    return { ok: true };
  }

  function removeFromCart(productId) {
    const cart = getCart().filter(i => i.productId !== productId);
    saveCart(cart);
  }

  function updateCartQty(productId, qty) {
    const cart = getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) {
      if (qty <= 0) return removeFromCart(productId);
      item.qty = qty;
      saveCart(cart);
    }
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
  }

  function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
      const p = getProductById(item.productId);
      return total + (p ? p.price * item.qty : 0);
    }, 0);
  }

  function getCartCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }

  /* ------ Order helpers ------ */
  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
    catch { return []; }
  }
  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  async function placeOrder(user) {
    const cart = getCart();
    if (cart.length === 0) return { ok: false, error: 'Cart is empty.' };

    const products = getProducts();
    const items = cart.map(ci => {
      const p = products.find(pr => pr.id === ci.productId);
      return { productId: ci.productId, name: p.name, price: p.price, qty: ci.qty, subtotal: p.price * ci.qty };
    });
    const total = items.reduce((s, i) => s + i.subtotal, 0);

    const order = {
      id: 'ORD-' + Date.now(),
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      items,
      total,
      status: 'Pending',
      placedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNew: true
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    clearCart();

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    } catch (e) {
      console.error('Failed to post order to backend', e);
    }

    // Trigger storage event for owner page notification
    const summary = items.map(i => `${i.qty}x ${i.name}`).join(', ');
    localStorage.setItem('inf_last_order', JSON.stringify({ 
      orderId: order.id, 
      customerName: order.customerName,
      summary: summary,
      total: order.total,
      ts: Date.now() 
    }));

    return { ok: true, order };
  }

  function getOrdersByCustomer(customerId) {
    return getOrders().filter(o => o.customerId === customerId);
  }

  function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      if (status !== 'Pending') order.isNew = false;
      saveOrders(orders);
      return { ok: true };
    }
    return { ok: false, error: 'Order not found.' };
  }

  function markOrderSeen(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.isNew = false;
      saveOrders(orders);
    }
  }

  function getNewOrderCount() {
    return getOrders().filter(o => o.isNew).length;
  }

  /* ------ Categories ------ */
  function getCategories() {
    const products = getProducts();
    const cats = [...new Set(products.map(p => p.category))];
    return ['All', ...cats];
  }

  /* ------ Product mutation helpers ------ */
  async function addProduct(product) {
    const newProduct = {
      id: 'p-' + Date.now(),
      name: product.name || '',
      category: product.category || '',
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      unit: product.unit || '',
      icon: product.icon || '📦',
      imageUrl: product.imageUrl || '',
      desc: product.desc || ''
    };
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (data.ok) {
        const products = getProducts();
        products.push(data.product);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        // notify storage listeners
        window.dispatchEvent(new Event('storage'));
        return { ok: true, product: data.product };
      }
      return { ok: false, error: data.error };
    } catch (err) {
      return { ok: false, error: 'Network error' };
    }
  }

  async function updateProduct(id, updatedFields) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.ok) {
        const products = getProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
          products[idx] = data.product;
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
          window.dispatchEvent(new Event('storage'));
        }
        return { ok: true, product: data.product };
      }
      return { ok: false, error: data.error };
    } catch (err) {
      return { ok: false, error: 'Network error' };
    }
  }

  async function deleteProduct(id) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        let products = getProducts();
        products = products.filter(p => p.id !== id);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        removeFromCart(id);
        window.dispatchEvent(new Event('storage'));
        return { ok: true };
      }
      return { ok: false, error: data.error };
    } catch (err) {
      return { ok: false, error: 'Network error' };
    }
  }

  return {
    initProducts, getProducts, getProductById, getCategories,
    getCart, addToCart, removeFromCart, updateCartQty, clearCart, getCartTotal, getCartCount,
    placeOrder, getOrders, getOrdersByCustomer, updateOrderStatus, markOrderSeen, getNewOrderCount,
    addProduct, updateProduct, deleteProduct
  };
})();
