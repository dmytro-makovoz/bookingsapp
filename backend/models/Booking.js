const mongoose = require('mongoose');

// Schema for individual magazine booking entries
const magazineEntrySchema = new mongoose.Schema({
  magazine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magazine',
    required: true
  },
  contentSize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentSize',
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  // Pricing for this specific magazine entry
  listPrice: {
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
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Issue scheduling for this magazine entry
  startIssue: {
    type: String,
    required: true
  },
  finishIssue: {
    type: String
  },
  isOngoing: {
    type: Boolean,
    default: false
  }
});

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  // Array of magazine entries (each row in the table)
  magazineEntries: [magazineEntrySchema],
  // Overall booking details
  totalValue: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  additionalCharges: {
    type: Number,
    default: 0
  },
  // Overall notes for the entire booking
  notes: {
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
bookingSchema.index({ customer: 1 });
bookingSchema.index({ createdBy: 1 });
bookingSchema.index({ 'magazineEntries.magazine': 1 });
bookingSchema.index({ 'magazineEntries.startIssue': 1 });

// Pre-save middleware to calculate total value
bookingSchema.pre('save', async function(next) {
  try {
    // Calculate total from all magazine entries
    let calculatedTotal = 0;
    
    for (const entry of this.magazineEntries) {
      // Calculate entry total: listPrice - discountValue + any proportional additional charges
      const entryTotal = entry.listPrice - (entry.discountValue || 0);
      entry.totalPrice = entryTotal;
      calculatedTotal += entryTotal;
    }
    
    // Add additional charges to total
    this.totalValue = calculatedTotal + (this.additionalCharges || 0);
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Booking', bookingSchema); 