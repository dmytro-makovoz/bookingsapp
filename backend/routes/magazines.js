const express = require('express');
const router = express.Router();
const Magazine = require('../models/Magazine');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all magazines for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const magazines = await Magazine.find({ createdBy: req.user.id }).sort({ name: 1 });
    res.json(magazines);
  } catch (error) {
    console.error('Error fetching magazines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single magazine
router.get('/:id', auth, async (req, res) => {
  try {
    const magazine = await Magazine.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });
    
    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }
    
    res.json(magazine);
  } catch (error) {
    console.error('Error fetching magazine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new magazine
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('issues').isArray({ min: 1 }).withMessage('At least one issue is required'),
  body('issues.*.name').trim().notEmpty().withMessage('Issue name is required'),
  body('issues.*.totalPages').isInt({ min: 1 }).withMessage('Total pages must be at least 1'),
  body('issues.*.startDate').isISO8601().withMessage('Valid start date is required'),
  body('issues.*.sortOrder').isInt({ min: 0 }).withMessage('Sort order must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, issues } = req.body;

    // Check if magazine with same name already exists for this user
    const existingMagazine = await Magazine.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: req.user.id 
    });
    
    if (existingMagazine) {
      return res.status(400).json({ message: 'Magazine with this name already exists' });
    }

    const magazine = new Magazine({
      name,
      issues,
      createdBy: req.user.id
    });

    await magazine.save();
    res.status(201).json(magazine);
  } catch (error) {
    console.error('Error creating magazine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a magazine
router.put('/:id', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('issues').isArray({ min: 1 }).withMessage('At least one issue is required'),
  body('issues.*.name').trim().notEmpty().withMessage('Issue name is required'),
  body('issues.*.totalPages').isInt({ min: 1 }).withMessage('Total pages must be at least 1'),
  body('issues.*.startDate').isISO8601().withMessage('Valid start date is required'),
  body('issues.*.sortOrder').isInt({ min: 0 }).withMessage('Sort order must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, issues } = req.body;

    const magazine = await Magazine.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    // Check if another magazine with same name exists
    const existingMagazine = await Magazine.findOne({ 
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: req.user.id 
    });
    
    if (existingMagazine) {
      return res.status(400).json({ message: 'Magazine with this name already exists' });
    }

    magazine.name = name;
    magazine.issues = issues;

    await magazine.save();
    res.json(magazine);
  } catch (error) {
    console.error('Error updating magazine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a magazine
router.delete('/:id', auth, async (req, res) => {
  try {
    const magazine = await Magazine.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    await Magazine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Magazine deleted successfully' });
  } catch (error) {
    console.error('Error deleting magazine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current issue (based on start date)
router.get('/current-issue/:magazineId', auth, async (req, res) => {
  try {
    const magazine = await Magazine.findOne({ 
      _id: req.params.magazineId, 
      createdBy: req.user.id 
    });

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    const currentDate = new Date();
    
    // Find the issue whose start date has passed but is closest to current date
    let currentIssue = null;
    let closestDate = null;

    for (const issue of magazine.issues) {
      const issueStartDate = new Date(issue.startDate);
      if (issueStartDate <= currentDate) {
        if (!closestDate || issueStartDate > closestDate) {
          closestDate = issueStartDate;
          currentIssue = issue;
        }
      }
    }

    // If no issue has started yet, get the next upcoming issue
    if (!currentIssue) {
      let nextIssue = null;
      let earliestDate = null;

      for (const issue of magazine.issues) {
        const issueStartDate = new Date(issue.startDate);
        if (issueStartDate > currentDate) {
          if (!earliestDate || issueStartDate < earliestDate) {
            earliestDate = issueStartDate;
            nextIssue = issue;
          }
        }
      }
      currentIssue = nextIssue;
    }

    res.json({ magazine: magazine.name, currentIssue });
  } catch (error) {
    console.error('Error getting current issue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 