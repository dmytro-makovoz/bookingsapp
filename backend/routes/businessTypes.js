const express = require('express');
const router = express.Router();
const BusinessType = require('../models/BusinessType');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all business types
router.get('/', auth, async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = includeArchived ? {} : { archived: { $ne: true } };
    const businessTypes = await BusinessType.find(filter).sort({ section: 1 });
    res.json(businessTypes);
  } catch (error) {
    console.error('Error fetching business types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single business type
router.get('/:id', auth, async (req, res) => {
  try {
    const businessType = await BusinessType.findById(req.params.id);
    
    if (!businessType) {
      return res.status(404).json({ message: 'Business type not found' });
    }
    
    res.json(businessType);
  } catch (error) {
    console.error('Error fetching business type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new business type
router.post('/', [
  auth,
  body('section').trim().notEmpty().withMessage('Section is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { section } = req.body;

    // Check if business type with same section already exists
    const existingBusinessType = await BusinessType.findOne({ 
      section: { $regex: new RegExp(`^${section}$`, 'i') }
    });
    
    if (existingBusinessType) {
      return res.status(400).json({ message: 'Business type with this section already exists' });
    }

    const businessType = new BusinessType({
      section
    });

    await businessType.save();
    res.status(201).json(businessType);
  } catch (error) {
    console.error('Error creating business type:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Business type with this section already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a business type
router.put('/:id', [
  auth,
  body('section').trim().notEmpty().withMessage('Section is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { section } = req.body;

    const businessType = await BusinessType.findById(req.params.id);

    if (!businessType) {
      return res.status(404).json({ message: 'Business type not found' });
    }

    // Check if another business type with same section exists
    const existingBusinessType = await BusinessType.findOne({ 
      _id: { $ne: req.params.id },
      section: { $regex: new RegExp(`^${section}$`, 'i') }
    });
    
    if (existingBusinessType) {
      return res.status(400).json({ message: 'Business type with this section already exists' });
    }

    businessType.section = section;

    await businessType.save();
    res.json(businessType);
  } catch (error) {
    console.error('Error updating business type:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Business type with this section already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a business type
router.delete('/:id', auth, async (req, res) => {
  try {
    const businessType = await BusinessType.findById(req.params.id);

    if (!businessType) {
      return res.status(404).json({ message: 'Business type not found' });
    }

    // Check if any customers are using this business type
    const Customer = require('../models/Customer');
    const customersUsingType = await Customer.countDocuments({ businessTypes: req.params.id });
    
    if (customersUsingType > 0) {
      return res.status(400).json({ 
        message: `Cannot delete business type. It is being used by ${customersUsingType} customer(s).` 
      });
    }

    await BusinessType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Business type deleted successfully' });
  } catch (error) {
    console.error('Error deleting business type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive/Unarchive a business type
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const { archived } = req.body;
    
    const businessType = await BusinessType.findById(req.params.id);
    
    if (!businessType) {
      return res.status(404).json({ message: 'Business type not found' });
    }
    
    businessType.archived = archived;
    await businessType.save();
    
    res.json(businessType);
  } catch (error) {
    console.error('Error updating business type archive status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search business types
router.get('/search/:query', auth, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const includeArchived = req.query.includeArchived === 'true';
    const filter = {
      section: { $regex: searchQuery, $options: 'i' }
    };
    
    if (!includeArchived) {
      filter.archived = { $ne: true };
    }
    
    const businessTypes = await BusinessType.find(filter).sort({ section: 1 });
    
    res.json(businessTypes);
  } catch (error) {
    console.error('Error searching business types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 