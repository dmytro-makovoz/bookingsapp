const mongoose = require('mongoose');

const pageConfigurationSchema = new mongoose.Schema({
  issueName: {
    type: String,
    required: true,
    trim: true
  },
  totalPages: {
    type: Number,
    required: true,
    min: 1,
    default: 40
  }
});

const magazineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Reference to Schedule model
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  // Page configurations for each issue in the schedule
  pageConfigurations: [pageConfigurationSchema],
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