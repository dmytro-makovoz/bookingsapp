const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  magazine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magazine',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const contentSizeSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0.001,
    max: 999.999
  },
  // Array of pricing for different magazines
  pricing: [pricingSchema],
  // User who created this content size (for multi-tenant support)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create index for efficient searching
contentSizeSchema.index({ description: 'text' });

module.exports = mongoose.model('ContentSize', contentSizeSchema); 