require('dotenv').config({ override: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Order = require('./models/Order');
const Booking = require('./models/Booking');

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

// Start Server
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = app;
