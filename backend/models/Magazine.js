const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalPages: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  // For sorting issues chronologically
  sortOrder: {
    type: Number,
    required: true
  }
});

const magazineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  issues: [issueSchema],
  // User who created this magazine (for multi-tenant support)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index for efficient searching
magazineSchema.index({ name: 'text' });

module.exports = mongoose.model('Magazine', magazineSchema); 