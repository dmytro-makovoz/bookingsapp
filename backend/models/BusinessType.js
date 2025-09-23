const mongoose = require('mongoose');

const businessTypeSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index for efficient searching
businessTypeSchema.index({ section: 'text' });

module.exports = mongoose.model('BusinessType', businessTypeSchema); 