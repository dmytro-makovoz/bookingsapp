const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  businessTypes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessType',
    required: true
  }],
  bookingNote: {
    type: String,
    trim: true
  },
  // For future CRM integration
  crmId: {
    type: String,
    trim: true
  },
  // User who created this customer (for multi-tenant support)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create index for efficient searching
customerSchema.index({ name: 'text' });

module.exports = mongoose.model('Customer', customerSchema); 