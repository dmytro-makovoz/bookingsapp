const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  contentSize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentSize',
    required: true
  },
  magazines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magazine',
    required: true
  }],
  contentType: {
    type: String,
    required: true,
    enum: ['Advert', 'Article', 'Puzzle', 'Advertorial', 'Front Cover', 'In-house']
  },
  // Pricing and discounts
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
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
  // Issue scheduling
  firstIssue: {
    type: String,
    required: true
  },
  lastIssue: {
    type: String // Empty string or null for "Ongoing"
  },
  isOngoing: {
    type: Boolean,
    default: false
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
  // Status for future workflow management
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
bookingSchema.index({ customer: 1, firstIssue: 1 });
bookingSchema.index({ magazines: 1, firstIssue: 1 });
bookingSchema.index({ contentType: 1 });
bookingSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate net value
bookingSchema.pre('save', function(next) {
  try {
    // Ensure all values are properly converted to numbers
    const basePrice = Number(this.basePrice) || 0;
    const discountPercentage = Number(this.discountPercentage) || 0;
    const discountValue = Number(this.discountValue) || 0;
    const additionalCharges = Number(this.additionalCharges) || 0;
    
    let discountAmount = 0;
    
    // Apply percentage discount
    if (discountPercentage > 0) {
      discountAmount += (basePrice * discountPercentage) / 100;
    }
    
    // Apply value discount
    if (discountValue > 0) {
      discountAmount += discountValue;
    }
    
    // Calculate net value
    this.netValue = Math.max(0, basePrice - discountAmount + additionalCharges);
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Booking', bookingSchema); 