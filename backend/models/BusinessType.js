const mongoose = require('mongoose');

const businessTypeSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    trim: true,
    unique: true
  }
}, {
  timestamps: true
});

// Create index for efficient searching
businessTypeSchema.index({ section: 'text' });

module.exports = mongoose.model('BusinessType', businessTypeSchema); 