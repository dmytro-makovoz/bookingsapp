const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all customers for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.user.id }).sort({ name: 1 });
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
    });
    
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
  body('businessCategory').trim().notEmpty().withMessage('Business category is required'),
  body('bookingNote').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, businessCategory, bookingNote } = req.body;

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
      businessCategory,
      bookingNote,
      createdBy: req.user.id
    });

    await customer.save();
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
  body('businessCategory').trim().notEmpty().withMessage('Business category is required'),
  body('bookingNote').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, businessCategory, bookingNote } = req.body;

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
    customer.businessCategory = businessCategory;
    customer.bookingNote = bookingNote;

    await customer.save();
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
    const customers = await Customer.find({
      createdBy: req.user.id,
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { businessCategory: { $regex: searchQuery, $options: 'i' } }
      ]
    }).sort({ name: 1 });
    
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 