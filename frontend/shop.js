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

  /* ------ Default Product Catalog ------ */
  const DEFAULT_PRODUCTS = [
    { id: 'p001', name: 'Resistor 10Ω Pack',        category: 'Passive',  price: 15,  stock: 100, unit: 'pack of 20', icon: '🟤',
      imageUrl: 'images/components/resistors.png',
      desc: 'General purpose carbon film resistors, ±5% tolerance' },
    { id: 'p002', name: 'LED Red Pack',              category: 'LED',      price: 20,  stock: 150, unit: 'pack of 10', icon: '🔴',
      imageUrl: 'images/components/led_pack.png',
      desc: '5mm red LEDs, 20mA forward current, ultra-bright' },
    { id: 'p003', name: 'LED Blue Pack',             category: 'LED',      price: 25,  stock: 120, unit: 'pack of 10', icon: '🔵',
      imageUrl: 'images/components/led_pack.png',
      desc: '5mm blue LEDs, 20mA forward current, ultra-bright' },
    { id: 'p004', name: 'LED Green Pack',            category: 'LED',      price: 20,  stock: 130, unit: 'pack of 10', icon: '🟢',
      imageUrl: 'images/components/led_pack.png',
      desc: '5mm green LEDs, 20mA forward current, ultra-bright' },
    { id: 'p005', name: 'Capacitor 100µF',           category: 'Passive',  price: 12,  stock: 200, unit: 'piece',     icon: '⚫',
      imageUrl: 'images/components/capacitors.png',
      desc: 'Electrolytic capacitor, 25V, aluminium body' },
    { id: 'p006', name: 'Arduino Nano Clone',        category: 'MCU',      price: 180, stock: 30,  unit: 'piece',     icon: '🟦',
      imageUrl: 'images/components/arduino_nano.png',
      desc: 'ATmega328P, USB-C, pre-loaded bootloader' },
    { id: 'p007', name: '9V Battery Clip',           category: 'Power',    price: 10,  stock: 500, unit: 'piece',     icon: '🔋',
      imageUrl: 'images/components/battery_clip.png',
      desc: 'Snap connector with red/black wire leads, 15cm' },
    { id: 'p008', name: 'BC547 NPN Transistor',      category: 'Active',   price: 8,   stock: 300, unit: 'piece',     icon: '⚡',
      imageUrl: 'images/components/transistors.png',
      desc: 'General-purpose NPN BJT, 45V, 100mA, TO-92 package' },
    { id: 'p009', name: 'L293D Motor Driver IC',     category: 'IC',       price: 35,  stock: 50,  unit: 'piece',     icon: '🎛️',
      imageUrl: 'images/components/ic_chip.png',
      desc: 'Dual H-bridge, controls 2 DC motors, 1A per channel' },
    { id: 'p010', name: 'HC-SR04 Ultrasonic Sensor', category: 'Sensor',   price: 55,  stock: 40,  unit: 'piece',     icon: '📡',
      imageUrl: 'images/components/ultrasonic_sensor.png',
      desc: '2–400cm range, 15° beam angle, 5V operation' },
    { id: 'p011', name: '16×2 LCD Display',          category: 'Display',  price: 90,  stock: 25,  unit: 'piece',     icon: '🖥️',
      imageUrl: 'images/components/lcd_display.png',
      desc: 'Blue backlight, HD44780 controller, I2C-compatible' },
    { id: 'p012', name: 'Jumper Wires Set',          category: 'Wire',     price: 30,  stock: 200, unit: 'set of 40', icon: '🌈',
      imageUrl: 'images/components/jumper_wires.png',
      desc: 'Male-to-male, male-to-female, female-to-female included' },
    { id: 'p013', name: 'Mini Breadboard',           category: 'Tool',     price: 45,  stock: 80,  unit: 'piece',     icon: '🔲',
      imageUrl: 'images/components/breadboard.png',
      desc: '400 tie-point, solderless, ABS plastic body' },
    { id: 'p014', name: 'Push Button Switch',        category: 'Switch',   price: 5,   stock: 400, unit: 'pack of 5', icon: '🔘',
      imageUrl: 'images/components/push_button.png',
      desc: '6mm tactile momentary push button, PCB mount' },
    { id: 'p015', name: 'LM7805 Voltage Regulator',  category: 'IC',       price: 18,  stock: 100, unit: 'piece',     icon: '🔌',
      imageUrl: 'images/components/voltage_regulator.png',
      desc: '+5V fixed output, TO-220 package, 1A output current' },
  ];

  /* ------ Seed products into localStorage ------ */
  function seedProducts() {
    const storedVersion = parseInt(localStorage.getItem('inf_catalog_version') || '0', 10);
    if (storedVersion < CATALOG_VERSION) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      localStorage.setItem('inf_catalog_version', String(CATALOG_VERSION));
    }
  }

  /* ------ Product helpers ------ */
  function getProducts() {
    try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || []; }
    catch { return DEFAULT_PRODUCTS; }
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

  function placeOrder(user) {
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

    // Trigger storage event for owner page notification
    localStorage.setItem('inf_last_order', JSON.stringify({ orderId: order.id, ts: Date.now() }));

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
  function addProduct(product) {
    const products = getProducts();
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
    products.push(newProduct);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return { ok: true, product: newProduct };
  }

  function updateProduct(id, updatedFields) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        name: updatedFields.name !== undefined ? updatedFields.name : products[idx].name,
        category: updatedFields.category !== undefined ? updatedFields.category : products[idx].category,
        price: updatedFields.price !== undefined ? Number(updatedFields.price) : products[idx].price,
        stock: updatedFields.stock !== undefined ? Number(updatedFields.stock) : products[idx].stock,
        unit: updatedFields.unit !== undefined ? updatedFields.unit : products[idx].unit,
        icon: updatedFields.icon !== undefined ? updatedFields.icon : products[idx].icon,
        imageUrl: updatedFields.imageUrl !== undefined ? updatedFields.imageUrl : products[idx].imageUrl,
        desc: updatedFields.desc !== undefined ? updatedFields.desc : products[idx].desc
      };
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      return { ok: true, product: products[idx] };
    }
    return { ok: false, error: 'Product not found.' };
  }

  function deleteProduct(id) {
    let products = getProducts();
    const exists = products.some(p => p.id === id);
    if (exists) {
      products = products.filter(p => p.id !== id);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      // Remove from cart if it's there
      removeFromCart(id);
      return { ok: true };
    }
    return { ok: false, error: 'Product not found.' };
  }

  /* ------ Init ------ */
  seedProducts();

  return {
    getProducts, getProductById, getCategories,
    getCart, addToCart, removeFromCart, updateCartQty, clearCart, getCartTotal, getCartCount,
    placeOrder, getOrders, getOrdersByCustomer, updateOrderStatus, markOrderSeen, getNewOrderCount,
    addProduct, updateProduct, deleteProduct
  };
})();
