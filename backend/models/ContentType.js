const mongoose = require('mongoose');

const contentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // User who created this content type (for multi-tenant support)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Default content types cannot be deleted
  isDefault: {
    type: Boolean,
    default: false
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index for efficient searching
contentTypeSchema.index({ name: 'text' });
contentTypeSchema.index({ createdBy: 1, name: 1 }, { unique: true }); // Prevent duplicate names per user

module.exports = mongoose.model('ContentType', contentTypeSchema); 