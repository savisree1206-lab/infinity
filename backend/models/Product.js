const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, default: 'piece' },
  icon: { type: String, default: '📦' },
  imageUrl: { type: String, default: '' },
  desc: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
