const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Magazine = require('../models/Magazine');
const ContentSize = require('../models/ContentSize');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Helper function to validate if an issue is available (not past close date)
const validateIssueAvailability = async (issueName, userId) => {
  const currentDate = new Date();
  
  // Find all schedules for the user that contain this issue name
  const schedules = await Schedule.find({ 
    createdBy: userId,
    archived: false,
    'issues.name': issueName
  });

  // If no schedules contain this issue, it's considered available (backward compatibility)
  if (schedules.length === 0) {
    return { available: true };
  }

  // Check if any schedule has this issue past its close date
  for (const schedule of schedules) {
    const issue = schedule.issues.find(i => i.name === issueName);
    if (issue && new Date(issue.closeDate) < currentDate) {
      return {
        available: false,
        message: `Issue "${issueName}" is closed. Close date was ${new Date(issue.closeDate).toDateString()}.`,
        closedDate: issue.closeDate
      };
    }
  }

  return { available: true };
};

// Get all bookings for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { customer, magazine, issue, contentType, status } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    if (customer) filter.customer = customer;
    if (status) filter.status = status;
    
    // For magazine filtering, we need to search within magazineEntries
    if (magazine) {
      filter['magazineEntries.magazine'] = magazine;
    }
    
    // New issue filtering logic: show bookings where the issue falls within the booking's date range
    if (issue) {
      filter.$or = [
        { 'magazineEntries.startIssue': issue },
        { 
          $and: [
            { 'magazineEntries.startIssue': { $lte: issue } },
            { 
              $or: [
                { 'magazineEntries.isOngoing': true },
                { 'magazineEntries.finishIssue': { $gte: issue } }
              ]
            }
          ]
        }
      ];
    }
    
    if (contentType) {
      filter['magazineEntries.contentType'] = contentType;
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
      .populate({
        path: 'magazineEntries.magazine',
        select: 'name schedule',
        populate: {
          path: 'schedule',
          select: 'name issues'
        }
      })
      .populate({
        path: 'magazineEntries.contentSize',
        select: 'description size'
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current issue for filtering (determines which issue to show by default)
router.get('/current-issue', auth, async (req, res) => {
  try {
    const Schedule = require('../models/Schedule');
    
    // Get all schedules for the user
    const schedules = await Schedule.find({ 
      createdBy: req.user.id,
      archived: false 
    });

    if (schedules.length === 0) {
      return res.json({ currentIssue: null });
    }

    const currentDate = new Date();
    let currentIssue = null;
    let earliestCloseDate = null;

    // Find the first issue across all schedules that hasn't passed its close date
    for (const schedule of schedules) {
      for (const issue of schedule.issues) {
        const issueCloseDate = new Date(issue.closeDate);
        if (issueCloseDate >= currentDate) {
          if (!earliestCloseDate || issueCloseDate < earliestCloseDate) {
            earliestCloseDate = issueCloseDate;
            currentIssue = issue.name;
          }
        }
      }
    }

    res.json({ currentIssue });
  } catch (error) {
    console.error('Error getting current issue:', error);
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
      .populate({
        path: 'magazineEntries.magazine',
        select: 'name'
      })
      .populate({
        path: 'magazineEntries.contentSize',
        select: 'description size'
      });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings by customer (for the table interface)
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      customer: req.params.customerId, 
      createdBy: req.user.id 
    })
      .populate('customer', 'name')
      .populate({
        path: 'magazineEntries.magazine',
        select: 'name schedule',
        populate: {
          path: 'schedule',
          select: 'name issues'
        }
      })
      .populate({
        path: 'magazineEntries.contentSize',
        select: 'description size'
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking (table-based with magazine entries)
router.post('/', [
  auth,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('magazineEntries').isArray({ min: 1 }).withMessage('At least one magazine entry is required'),
  body('magazineEntries.*.magazine').notEmpty().withMessage('Magazine is required for each entry'),
  body('magazineEntries.*.contentSize').notEmpty().withMessage('Content size is required for each entry'),
  body('magazineEntries.*.contentType').notEmpty().withMessage('Content type is required for each entry'),
  body('magazineEntries.*.listPrice').isFloat({ min: 0 }).withMessage('List price must be a positive number'),
  body('magazineEntries.*.startIssue').trim().notEmpty().withMessage('Start issue is required for each entry'),
  body('additionalCharges').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      customer,
      magazineEntries,
      additionalCharges = 0,
      notes
    } = req.body;

    // Verify customer belongs to the user
    const customerDoc = await Customer.findOne({ _id: customer, createdBy: req.user.id });
    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Validate each magazine entry
    for (const entry of magazineEntries) {
      // Verify magazine and content size belong to the user
      const [magazineDoc, contentSizeDoc] = await Promise.all([
        Magazine.findOne({ _id: entry.magazine, createdBy: req.user.id }),
        ContentSize.findOne({ _id: entry.contentSize, createdBy: req.user.id })
      ]);

      if (!magazineDoc) {
        return res.status(400).json({ message: 'One or more magazines not found' });
      }

      if (!contentSizeDoc) {
        return res.status(400).json({ message: 'One or more content sizes not found' });
      }

      // Validate issue availability based on schedule close dates
      const startIssueValidation = await validateIssueAvailability(entry.startIssue, req.user.id);
      if (!startIssueValidation.available) {
        return res.status(400).json({ message: startIssueValidation.message });
      }

      // Also validate finishIssue if it's provided and not ongoing
      if (!entry.isOngoing && entry.finishIssue) {
        const finishIssueValidation = await validateIssueAvailability(entry.finishIssue, req.user.id);
        if (!finishIssueValidation.available) {
          return res.status(400).json({ message: finishIssueValidation.message });
        }
      }
    }

    const booking = new Booking({
      customer,
      magazineEntries: magazineEntries.map(entry => ({
        ...entry,
        listPrice: Number(entry.listPrice),
        discountPercentage: Number(entry.discountPercentage) || 0,
        discountValue: Number(entry.discountValue) || 0,
        isOngoing: Boolean(entry.isOngoing),
        finishIssue: entry.isOngoing ? null : entry.finishIssue
      })),
      additionalCharges: Number(additionalCharges),
      notes,
      createdBy: req.user.id
    });

    await booking.save();
    
    // Populate the response
    await booking.populate([
      { path: 'customer', select: 'name' },
      { path: 'magazineEntries.magazine', select: 'name' },
      { path: 'magazineEntries.contentSize', select: 'description size' }
    ]);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a booking (table-based with magazine entries)
router.put('/:id', [
  auth,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('magazineEntries').isArray({ min: 1 }).withMessage('At least one magazine entry is required'),
  body('magazineEntries.*.magazine').notEmpty().withMessage('Magazine is required for each entry'),
  body('magazineEntries.*.contentSize').notEmpty().withMessage('Content size is required for each entry'),
  body('magazineEntries.*.contentType').notEmpty().withMessage('Content type is required for each entry'),
  body('magazineEntries.*.listPrice').isFloat({ min: 0 }).withMessage('List price must be a positive number'),
  body('magazineEntries.*.startIssue').trim().notEmpty().withMessage('Start issue is required for each entry'),
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
      magazineEntries,
      additionalCharges = 0,
      notes,
      status
    } = req.body;

    // Verify customer belongs to the user
    const customerDoc = await Customer.findOne({ _id: customer, createdBy: req.user.id });
    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Validate each magazine entry
    for (const entry of magazineEntries) {
      // Verify magazine and content size belong to the user
      const [magazineDoc, contentSizeDoc] = await Promise.all([
        Magazine.findOne({ _id: entry.magazine, createdBy: req.user.id }),
        ContentSize.findOne({ _id: entry.contentSize, createdBy: req.user.id })
      ]);

      if (!magazineDoc) {
        return res.status(400).json({ message: 'One or more magazines not found' });
      }

      if (!contentSizeDoc) {
        return res.status(400).json({ message: 'One or more content sizes not found' });
      }

      // Validate issue availability based on schedule close dates
      const startIssueValidation = await validateIssueAvailability(entry.startIssue, req.user.id);
      if (!startIssueValidation.available) {
        return res.status(400).json({ message: startIssueValidation.message });
      }

      // Also validate finishIssue if it's provided and not ongoing
      if (!entry.isOngoing && entry.finishIssue) {
        const finishIssueValidation = await validateIssueAvailability(entry.finishIssue, req.user.id);
        if (!finishIssueValidation.available) {
          return res.status(400).json({ message: finishIssueValidation.message });
        }
      }
    }

    // Update booking fields
    booking.customer = customer;
    booking.magazineEntries = magazineEntries.map(entry => ({
      ...entry,
      listPrice: Number(entry.listPrice),
      discountPercentage: Number(entry.discountPercentage) || 0,
      discountValue: Number(entry.discountValue) || 0,
      isOngoing: Boolean(entry.isOngoing),
      finishIssue: entry.isOngoing ? null : entry.finishIssue
    }));
    booking.additionalCharges = Number(additionalCharges);
    booking.notes = notes;
    if (status) booking.status = status;

    await booking.save();
    
    // Populate the response
    await booking.populate([
      { path: 'customer', select: 'name' },
      { path: 'magazineEntries.magazine', select: 'name' },
      { path: 'magazineEntries.contentSize', select: 'description size' }
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