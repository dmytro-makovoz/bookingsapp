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
  // Issue scheduling (like bookings)
  startIssue: {
    type: String,
    required: true
  },
  finishIssue: {
    type: String,
    required: true
  },
  // Leaflet details
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  charge: {
    type: Number,
    required: true,
    min: 0
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
leafletDeliverySchema.index({ customer: 1, startIssue: 1 });
leafletDeliverySchema.index({ magazine: 1, startIssue: 1 });
leafletDeliverySchema.index({ createdBy: 1 });

module.exports = mongoose.model('LeafletDelivery', leafletDeliverySchema); 