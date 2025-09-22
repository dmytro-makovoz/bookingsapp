const mongoose = require('mongoose');

const leafletDeliverySchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  magazine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magazine',
    required: true
  },
  issue: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Pricing adjustments
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountValue: {
    type: Number,
    default: 0,
    min: 0
  },
  additionalCharges: {
    type: Number,
    default: 0
  },
  // Calculated net value
  netValue: {
    type: Number,
    required: true,
    min: 0
  },
  // Leaflet details
  leafletDescription: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  // Optional note
  note: {
    type: String,
    trim: true
  },
  // User who created this booking (for multi-tenant support)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
leafletDeliverySchema.index({ customer: 1, issue: 1 });
leafletDeliverySchema.index({ magazine: 1, issue: 1 });
leafletDeliverySchema.index({ createdBy: 1 });

// Pre-save middleware to calculate net value
leafletDeliverySchema.pre('save', function(next) {
  let discountAmount = 0;
  
  // Apply percentage discount
  if (this.discountPercentage > 0) {
    discountAmount += (this.price * this.discountPercentage) / 100;
  }
  
  // Apply value discount
  if (this.discountValue > 0) {
    discountAmount += this.discountValue;
  }
  
  // Calculate net value
  this.netValue = Math.max(0, this.price - discountAmount + (this.additionalCharges || 0));
  
  next();
});

module.exports = mongoose.model('LeafletDelivery', leafletDeliverySchema); 