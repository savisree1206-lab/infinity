const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String },
  stack: { type: String },
  timeline: { type: String },
  budget: { type: String },
  status: { type: String, default: 'Pending Review' },
  date: { type: Date, default: Date.now },
  source: { type: String } // 'Web Dev' or 'Electronics'
});

module.exports = mongoose.model('Booking', BookingSchema);
