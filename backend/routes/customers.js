const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all customers for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.user.id })
      .populate('businessTypes', 'section')
      .sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single customer
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    }).populate('businessTypes', 'section');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new customer
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('businessTypes').isArray({ min: 1 }).withMessage('At least one business type is required'),
  body('businessTypes.*').isMongoId().withMessage('Valid business types are required'),
  body('bookingNote').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, businessTypes, bookingNote } = req.body;

    // Verify all business types exist
    const BusinessType = require('../models/BusinessType');
    const businessTypeCount = await BusinessType.countDocuments({ _id: { $in: businessTypes } });
    if (businessTypeCount !== businessTypes.length) {
      return res.status(400).json({ message: 'One or more business types are invalid' });
    }

    // Check if customer with same name already exists for this user
    const existingCustomer = await Customer.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: req.user.id 
    });
    
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this name already exists' });
    }

    const customer = new Customer({
      name,
      businessTypes,
      bookingNote,
      createdBy: req.user.id
    });

    await customer.save();
    
    // Populate business types before sending response
    await customer.populate('businessTypes', 'section');
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a customer
router.put('/:id', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('businessTypes').isArray({ min: 1 }).withMessage('At least one business type is required'),
  body('businessTypes.*').isMongoId().withMessage('Valid business types are required'),
  body('bookingNote').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, businessTypes, bookingNote } = req.body;

    // Verify all business types exist
    const BusinessType = require('../models/BusinessType');
    const businessTypeCount = await BusinessType.countDocuments({ _id: { $in: businessTypes } });
    if (businessTypeCount !== businessTypes.length) {
      return res.status(400).json({ message: 'One or more business types are invalid' });
    }

    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if another customer with same name exists
    const existingCustomer = await Customer.findOne({ 
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: req.user.id 
    });
    
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this name already exists' });
    }

    customer.name = name;
    customer.businessTypes = businessTypes;
    customer.bookingNote = bookingNote;

    await customer.save();
    
    // Populate business types before sending response
    await customer.populate('businessTypes', 'section');
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search customers
router.get('/search/:query', auth, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    
    // Find business types that match the search query
    const BusinessType = require('../models/BusinessType');
    const matchingBusinessTypes = await BusinessType.find({
      section: { $regex: searchQuery, $options: 'i' }
    });
    const businessTypeIds = matchingBusinessTypes.map(bt => bt._id);
    
    const customers = await Customer.find({
      createdBy: req.user.id,
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { businessTypes: { $in: businessTypeIds } }
      ]
    }).populate('businessTypes', 'section').sort({ name: 1 });
    
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 