require('dotenv').config({ override: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Order = require('./models/Order');
const Booking = require('./models/Booking');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/infiniteservices';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend directory locally
if (process.env.VERCEL !== '1') {
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully.');
    // Seed default owner
    const ownerExists = await User.findOne({ email: 'owner@infinite.in' });
    if (!ownerExists) {
      const hashed = await bcrypt.hash('owner123', 10);
      await User.create({
        name: 'Infinite Owner',
        email: 'owner@infinite.in',
        password: hashed,
        role: 'owner'
      });
      console.log('Default owner seeded.');
    }

    // Seed default products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const DEFAULT_PRODUCTS = [
        { id: 'p001', name: 'Resistor 10Ω Pack', category: 'Passive', price: 15, stock: 100, unit: 'pack of 20', icon: '🟤', imageUrl: 'images/components/resistors.png', desc: 'General purpose carbon film resistors, ±5% tolerance' },
        { id: 'p002', name: 'LED Red Pack', category: 'LED', price: 20, stock: 150, unit: 'pack of 10', icon: '🔴', imageUrl: 'images/components/led_pack.png', desc: '5mm red LEDs, 20mA forward current, ultra-bright' },
        { id: 'p003', name: 'LED Blue Pack', category: 'LED', price: 25, stock: 120, unit: 'pack of 10', icon: '🔵', imageUrl: 'images/components/led_pack.png', desc: '5mm blue LEDs, 20mA forward current, ultra-bright' },
        { id: 'p004', name: 'LED Green Pack', category: 'LED', price: 20, stock: 130, unit: 'pack of 10', icon: '🟢', imageUrl: 'images/components/led_pack.png', desc: '5mm green LEDs, 20mA forward current, ultra-bright' },
        { id: 'p005', name: 'Capacitor 100µF', category: 'Passive', price: 12, stock: 200, unit: 'piece', icon: '⚫', imageUrl: 'images/components/capacitors.png', desc: 'Electrolytic capacitor, 25V, aluminium body' },
        { id: 'p006', name: 'Arduino Nano Clone', category: 'MCU', price: 180, stock: 30, unit: 'piece', icon: '🟦', imageUrl: 'images/components/arduino_nano.png', desc: 'ATmega328P, USB-C, pre-loaded bootloader' },
        { id: 'p007', name: '9V Battery Clip', category: 'Power', price: 10, stock: 500, unit: 'piece', icon: '🔋', imageUrl: 'images/components/battery_clip.png', desc: 'Snap connector with red/black wire leads, 15cm' },
        { id: 'p008', name: 'BC547 NPN Transistor', category: 'Active', price: 8, stock: 300, unit: 'piece', icon: '⚡', imageUrl: 'images/components/transistors.png', desc: 'General-purpose NPN BJT, 45V, 100mA, TO-92 package' },
        { id: 'p009', name: 'L293D Motor Driver IC', category: 'IC', price: 35, stock: 50, unit: 'piece', icon: '🎛️', imageUrl: 'images/components/ic_chip.png', desc: 'Dual H-bridge, controls 2 DC motors, 1A per channel' },
        { id: 'p010', name: 'HC-SR04 Ultrasonic Sensor', category: 'Sensor', price: 55, stock: 40, unit: 'piece', icon: '📡', imageUrl: 'images/components/ultrasonic_sensor.png', desc: '2–400cm range, 15° beam angle, 5V operation' },
        { id: 'p011', name: '16×2 LCD Display', category: 'Display', price: 90, stock: 25, unit: 'piece', icon: '🖥️', imageUrl: 'images/components/lcd_display.png', desc: 'Blue backlight, HD44780 controller, I2C-compatible' },
        { id: 'p012', name: 'Jumper Wires Set', category: 'Wire', price: 30, stock: 200, unit: 'set of 40', icon: '🌈', imageUrl: 'images/components/jumper_wires.png', desc: 'Male-to-male, male-to-female, female-to-female included' },
        { id: 'p013', name: 'Mini Breadboard', category: 'Tool', price: 45, stock: 80, unit: 'piece', icon: '🔲', imageUrl: 'images/components/breadboard.png', desc: '400 tie-point, solderless, ABS plastic body' },
        { id: 'p014', name: 'Push Button Switch', category: 'Switch', price: 5, stock: 400, unit: 'pack of 5', icon: '🔘', imageUrl: 'images/components/push_button.png', desc: '6mm tactile momentary push button, PCB mount' },
        { id: 'p015', name: 'LM7805 Voltage Regulator', category: 'IC', price: 18, stock: 100, unit: 'piece', icon: '🔌', imageUrl: 'images/components/voltage_regulator.png', desc: '+5V fixed output, TO-220 package, 1A output current' },
      ];
      await Product.insertMany(DEFAULT_PRODUCTS);
      console.log('Default products seeded.');
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// API Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ ok: false, error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'customer'
    });
    
    await user.save();
    
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ ok: false, error: 'Server error during signup.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }
    
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Server error during login.' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ placedAt: -1 });
    res.json({ ok: true, orders });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error fetching orders.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const order = new Order(orderData);
    await order.save();
    res.json({ ok: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Server error creating order.' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { id: req.params.id }, 
      { status, updatedAt: Date.now(), isNewOrder: false }, 
      { new: true }
    );
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error updating order.' });
  }
});

app.put('/api/orders/:id/seen', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id }, 
      { isNewOrder: false }, 
      { new: true }
    );
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error updating order.' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1 });
    res.json({ ok: true, bookings });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error fetching bookings.' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    const booking = new Booking(bookingData);
    await booking.save();
    res.json({ ok: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Server error creating booking.' });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { id: req.params.id }, 
      { status }, 
      { new: true }
    );
    if (!booking) return res.status(404).json({ ok: false, error: 'Booking not found.' });
    res.json({ ok: true, booking });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error updating booking.' });
  }
});

// Fallback to index.html locally
if (process.env.VERCEL !== '1') {
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
  });
}

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ ok: true, products });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error fetching products.' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ ok: true, product });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error creating product.' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
    res.json({ ok: true, product });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error updating product.' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error deleting product.' });
  }
});

// Start Server
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = app;
