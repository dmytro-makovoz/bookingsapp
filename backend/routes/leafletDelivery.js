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
    const { customer, magazine, startIssue, status } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    if (customer) filter.customer = customer;
    if (magazine) filter.magazine = magazine;
    if (startIssue) filter.startIssue = startIssue;
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
  body('startIssue').trim().notEmpty().withMessage('Start issue is required'),
  body('finishIssue').trim().notEmpty().withMessage('Finish issue is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('charge').isFloat({ min: 0 }).withMessage('Charge must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      customer,
      magazine,
      startIssue,
      finishIssue,
      quantity,
      charge,
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
      startIssue,
      finishIssue,
      quantity,
      charge,
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
  body('startIssue').trim().notEmpty().withMessage('Start issue is required'),
  body('finishIssue').trim().notEmpty().withMessage('Finish issue is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('charge').isFloat({ min: 0 }).withMessage('Charge must be a positive number')
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
      startIssue,
      finishIssue,
      quantity,
      charge,
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
    leafletDelivery.startIssue = startIssue;
    leafletDelivery.finishIssue = finishIssue;
    leafletDelivery.quantity = quantity;
    leafletDelivery.charge = charge;
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
    const { magazine, startIssue, customer } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    if (customer) filter.customer = customer;
    if (magazine) filter.magazine = magazine;
    if (startIssue) filter.startIssue = startIssue;

    const leafletDeliveries = await LeafletDelivery.find(filter)
      .populate('customer', 'name businessCategory')
      .populate('magazine', 'name')
      .sort({ 'customer.name': 1, startIssue: 1 });

    const reportData = leafletDeliveries.map(delivery => ({
      magazineName: delivery.magazine.name,
      customerName: delivery.customer.name,
      startIssue: delivery.startIssue,
      finishIssue: delivery.finishIssue,
      quantity: delivery.quantity,
      charge: delivery.charge,
      note: delivery.note || '',
      status: delivery.status
    }));

    res.json({
      data: reportData,
      total: reportData.length,
      totalValue: reportData.reduce((sum, item) => sum + item.charge, 0)
    });
  } catch (error) {
    console.error('Error generating leaflet delivery report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 