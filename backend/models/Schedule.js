const mongoose = require('mongoose');

const scheduleIssueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  closeDate: {
    type: Date,
    required: true
  },
  // For sorting issues chronologically
  sortOrder: {
    type: Number,
    required: true
  }
});

const scheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  issues: [scheduleIssueSchema],
  // User who created this schedule (for multi-tenant support)
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
scheduleSchema.index({ name: 'text' });
scheduleSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema); 