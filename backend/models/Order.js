const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [{
    productId: String,
    name: String,
    price: Number,
    qty: Number,
    subtotal: Number
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  placedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isNewOrder: { type: Boolean, default: true }
});

module.exports = mongoose.model('Order', OrderSchema);
