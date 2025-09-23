const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Magazine = require('../models/Magazine');
const ContentSize = require('../models/ContentSize');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all bookings for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { customer, magazine, issue, contentType, status } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    if (customer) filter.customer = customer;
    if (magazine) filter.magazines = magazine;
    if (issue) {
      filter.$or = [
        { firstIssue: issue },
        { 
          $and: [
            { firstIssue: { $lte: issue } },
            { 
              $or: [
                { isOngoing: true },
                { lastIssue: { $gte: issue } }
              ]
            }
          ]
        }
      ];
    }
    if (contentType) filter.contentType = contentType;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('customer', 'name')
      .populate({
        path: 'customer',
        populate: {
          path: 'businessTypes',
          select: 'section'
        }
      })
      .populate('magazines', 'name')
      .populate('contentSize', 'description size')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    })
      .populate('customer', 'name')
      .populate({
        path: 'customer',
        populate: {
          path: 'businessTypes',
          select: 'section'
        }
      })
      .populate('magazines', 'name')
      .populate('contentSize', 'description size');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking
router.post('/', [
  auth,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('contentSize').notEmpty().withMessage('Content size is required'),
  body('magazines').isArray({ min: 1 }).withMessage('At least one magazine is required'),
  body('contentType').isIn(['Advert', 'Article', 'Puzzle', 'Advertorial', 'Front Cover', 'In-house']).withMessage('Valid content type is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('firstIssue').trim().notEmpty().withMessage('First issue is required'),
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
      contentSize,
      magazines,
      contentType,
      basePrice,
      discountPercentage = 0,
      discountValue = 0,
      additionalCharges = 0,
      firstIssue,
      lastIssue,
      isOngoing = false,
      note,
      netValue
    } = req.body;

    // Verify customer, content size, and magazines belong to the user
    const [customerDoc, contentSizeDoc, magazineDocs] = await Promise.all([
      Customer.findOne({ _id: customer, createdBy: req.user.id }),
      ContentSize.findOne({ _id: contentSize, createdBy: req.user.id }),
      Magazine.find({ _id: { $in: magazines }, createdBy: req.user.id })
    ]);

    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    if (!contentSizeDoc) {
      return res.status(400).json({ message: 'Content size not found' });
    }

    if (magazineDocs.length !== magazines.length) {
      return res.status(400).json({ message: 'One or more magazines not found' });
    }

    const booking = new Booking({
      customer,
      contentSize,
      magazines,
      contentType,
      basePrice: Number(basePrice),
      discountPercentage: Number(discountPercentage),
      discountValue: Number(discountValue),
      additionalCharges: Number(additionalCharges),
      firstIssue,
      lastIssue: isOngoing ? null : lastIssue,
      isOngoing,
      note,
      createdBy: req.user.id,
      netValue
    });

    await booking.save();
    
    // Populate the response
    await booking.populate([
      { 
        path: 'customer', 
        select: 'name',
        populate: {
          path: 'businessTypes',
          select: 'section'
        }
      },
      { path: 'magazines', select: 'name' },
      { path: 'contentSize', select: 'description size' }
    ]);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a booking
router.put('/:id', [
  auth,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('contentSize').notEmpty().withMessage('Content size is required'),
  body('magazines').isArray({ min: 1 }).withMessage('At least one magazine is required'),
  body('contentType').isIn(['Advert', 'Article', 'Puzzle', 'Advertorial', 'Front Cover', 'In-house']).withMessage('Valid content type is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('firstIssue').trim().notEmpty().withMessage('First issue is required'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('additionalCharges').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const {
      customer,
      contentSize,
      magazines,
      contentType,
      basePrice,
      discountPercentage = 0,
      discountValue = 0,
      additionalCharges = 0,
      firstIssue,
      lastIssue,
      isOngoing = false,
      note,
      status
    } = req.body;

    // Verify customer, content size, and magazines belong to the user
    const [customerDoc, contentSizeDoc, magazineDocs] = await Promise.all([
      Customer.findOne({ _id: customer, createdBy: req.user.id }),
      ContentSize.findOne({ _id: contentSize, createdBy: req.user.id }),
      Magazine.find({ _id: { $in: magazines }, createdBy: req.user.id })
    ]);

    if (!customerDoc || !contentSizeDoc || magazineDocs.length !== magazines.length) {
      return res.status(400).json({ message: 'Invalid customer, content size, or magazines' });
    }

    // Update booking fields
    booking.customer = customer;
    booking.contentSize = contentSize;
    booking.magazines = magazines;
    booking.contentType = contentType;
    booking.basePrice = Number(basePrice);
    booking.discountPercentage = Number(discountPercentage);
    booking.discountValue = Number(discountValue);
    booking.additionalCharges = Number(additionalCharges);
    booking.firstIssue = firstIssue;
    booking.lastIssue = isOngoing ? null : lastIssue;
    booking.isOngoing = isOngoing;
    booking.note = note;
    if (status) booking.status = status;

    await booking.save();
    
    // Populate the response
    await booking.populate([
      { 
        path: 'customer', 
        select: 'name',
        populate: {
          path: 'businessTypes',
          select: 'section'
        }
      },
      { path: 'magazines', select: 'name' },
      { path: 'contentSize', select: 'description size' }
    ]);

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer bookings summary
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.customerId, 
      createdBy: req.user.id 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const bookings = await Booking.find({ 
      customer: req.params.customerId,
      createdBy: req.user.id 
    })
      .populate('customer', 'name')
      .populate({
        path: 'customer',
        populate: {
          path: 'businessTypes',
          select: 'section'
        }
      })
      .populate('magazines', 'name')
      .populate('contentSize', 'description size')
      .sort({ firstIssue: 1 });

    const totalValue = bookings.reduce((sum, booking) => sum + booking.netValue, 0);

    res.json({
      customer,
      bookings,
      totalValue
    });
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings report data
router.get('/report/data', auth, async (req, res) => {
  try {
    const { magazine, issue, customer, contentType, format } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    if (customer) filter.customer = customer;
    if (magazine) filter.magazines = magazine;
    if (contentType) filter.contentType = contentType;
    if (issue) {
      filter.$or = [
        { firstIssue: issue },
        { 
          $and: [
            { firstIssue: { $lte: issue } },
            { 
              $or: [
                { isOngoing: true },
                { lastIssue: { $gte: issue } }
              ]
            }
          ]
        }
      ];
    }

    const bookings = await Booking.find(filter)
      .populate('customer', 'name')
      .populate({
        path: 'customer',
        populate: {
          path: 'businessTypes',
          select: 'section'
        }
      })
      .populate('magazines', 'name')
      .populate('contentSize', 'description size')
      .sort({ 'customer.name': 1, firstIssue: 1 });

    const reportData = bookings.map(booking => ({
      magazineNames: booking.magazines.map(m => m.name).join(', '),
      customerName: booking.customer.name,
      contentType: booking.contentType,
      contentSize: booking.contentSize.description,
      contentSizeValue: booking.contentSize.size,
      netValue: booking.netValue,
      basePrice: booking.basePrice,
      note: booking.note || '',
      firstIssue: booking.firstIssue,
      lastIssue: booking.isOngoing ? 'Ongoing' : booking.lastIssue || '',
      status: booking.status
    }));

    res.json({
      data: reportData,
      total: reportData.length,
      totalValue: reportData.reduce((sum, item) => sum + item.netValue, 0)
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 