const express = require('express');
const router = express.Router();
const LeafletDelivery = require('../models/LeafletDelivery');
const Customer = require('../models/Customer');
const Magazine = require('../models/Magazine');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all leaflet deliveries for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { customer, magazine, issue, status } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    if (customer) filter.customer = customer;
    if (magazine) filter.magazine = magazine;
    if (issue) filter.issue = issue;
    if (status) filter.status = status;

    const leafletDeliveries = await LeafletDelivery.find(filter)
      .populate('customer', 'name businessCategory')
      .populate('magazine', 'name')
      .sort({ createdAt: -1 });

    res.json(leafletDeliveries);
  } catch (error) {
    console.error('Error fetching leaflet deliveries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single leaflet delivery
router.get('/:id', auth, async (req, res) => {
  try {
    const leafletDelivery = await LeafletDelivery.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    })
      .populate('customer', 'name businessCategory')
      .populate('magazine', 'name');
    
    if (!leafletDelivery) {
      return res.status(404).json({ message: 'Leaflet delivery not found' });
    }
    
    res.json(leafletDelivery);
  } catch (error) {
    console.error('Error fetching leaflet delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new leaflet delivery
router.post('/', [
  auth,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('magazine').notEmpty().withMessage('Magazine is required'),
  body('issue').trim().notEmpty().withMessage('Issue is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('leafletDescription').trim().notEmpty().withMessage('Leaflet description is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('additionalCharges').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      customer,
      magazine,
      issue,
      price,
      leafletDescription,
      quantity,
      discountPercentage = 0,
      discountValue = 0,
      additionalCharges = 0,
      note
    } = req.body;

    // Verify customer and magazine belong to the user
    const [customerDoc, magazineDoc] = await Promise.all([
      Customer.findOne({ _id: customer, createdBy: req.user.id }),
      Magazine.findOne({ _id: magazine, createdBy: req.user.id })
    ]);

    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    if (!magazineDoc) {
      return res.status(400).json({ message: 'Magazine not found' });
    }

    const leafletDelivery = new LeafletDelivery({
      customer,
      magazine,
      issue,
      price,
      leafletDescription,
      quantity,
      discountPercentage,
      discountValue,
      additionalCharges,
      note,
      createdBy: req.user.id
    });

    await leafletDelivery.save();
    
    // Populate the response
    await leafletDelivery.populate([
      { path: 'customer', select: 'name businessCategory' },
      { path: 'magazine', select: 'name' }
    ]);

    res.status(201).json(leafletDelivery);
  } catch (error) {
    console.error('Error creating leaflet delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a leaflet delivery
router.put('/:id', [
  auth,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('magazine').notEmpty().withMessage('Magazine is required'),
  body('issue').trim().notEmpty().withMessage('Issue is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('leafletDescription').trim().notEmpty().withMessage('Leaflet description is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('additionalCharges').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const leafletDelivery = await LeafletDelivery.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!leafletDelivery) {
      return res.status(404).json({ message: 'Leaflet delivery not found' });
    }

    const {
      customer,
      magazine,
      issue,
      price,
      leafletDescription,
      quantity,
      discountPercentage = 0,
      discountValue = 0,
      additionalCharges = 0,
      note,
      status
    } = req.body;

    // Verify customer and magazine belong to the user
    const [customerDoc, magazineDoc] = await Promise.all([
      Customer.findOne({ _id: customer, createdBy: req.user.id }),
      Magazine.findOne({ _id: magazine, createdBy: req.user.id })
    ]);

    if (!customerDoc || !magazineDoc) {
      return res.status(400).json({ message: 'Invalid customer or magazine' });
    }

    // Update leaflet delivery fields
    leafletDelivery.customer = customer;
    leafletDelivery.magazine = magazine;
    leafletDelivery.issue = issue;
    leafletDelivery.price = price;
    leafletDelivery.leafletDescription = leafletDescription;
    leafletDelivery.quantity = quantity;
    leafletDelivery.discountPercentage = discountPercentage;
    leafletDelivery.discountValue = discountValue;
    leafletDelivery.additionalCharges = additionalCharges;
    leafletDelivery.note = note;
    if (status) leafletDelivery.status = status;

    await leafletDelivery.save();
    
    // Populate the response
    await leafletDelivery.populate([
      { path: 'customer', select: 'name businessCategory' },
      { path: 'magazine', select: 'name' }
    ]);

    res.json(leafletDelivery);
  } catch (error) {
    console.error('Error updating leaflet delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a leaflet delivery
router.delete('/:id', auth, async (req, res) => {
  try {
    const leafletDelivery = await LeafletDelivery.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!leafletDelivery) {
      return res.status(404).json({ message: 'Leaflet delivery not found' });
    }

    await LeafletDelivery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leaflet delivery deleted successfully' });
  } catch (error) {
    console.error('Error deleting leaflet delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaflet delivery report data
router.get('/report/data', auth, async (req, res) => {
  try {
    const { magazine, issue, customer } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    if (customer) filter.customer = customer;
    if (magazine) filter.magazine = magazine;
    if (issue) filter.issue = issue;

    const leafletDeliveries = await LeafletDelivery.find(filter)
      .populate('customer', 'name businessCategory')
      .populate('magazine', 'name')
      .sort({ 'customer.name': 1, issue: 1 });

    const reportData = leafletDeliveries.map(delivery => ({
      magazineName: delivery.magazine.name,
      customerName: delivery.customer.name,
      issue: delivery.issue,
      leafletDescription: delivery.leafletDescription,
      quantity: delivery.quantity,
      netValue: delivery.netValue,
      price: delivery.price,
      note: delivery.note || '',
      status: delivery.status
    }));

    res.json({
      data: reportData,
      total: reportData.length,
      totalValue: reportData.reduce((sum, item) => sum + item.netValue, 0)
    });
  } catch (error) {
    console.error('Error generating leaflet delivery report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 