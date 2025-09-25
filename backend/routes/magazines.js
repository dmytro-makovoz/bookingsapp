const express = require('express');
const router = express.Router();
const Magazine = require('../models/Magazine');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all magazines for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { createdBy: req.user.id };
    
    if (!includeArchived) {
      filter.archived = { $ne: true };
    }
    
    const magazines = await Magazine.find(filter)
      .populate('schedule', 'name issues')
      .sort({ name: 1 });
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
    }).populate('schedule', 'name issues');
    
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
  body('schedule').isMongoId().withMessage('Valid schedule is required'),
  body('pageConfigurations').isArray().withMessage('Page configurations must be an array'),
  body('pageConfigurations.*.issueName').trim().notEmpty().withMessage('Issue name is required'),
  body('pageConfigurations.*.totalPages').isInt({ min: 1 }).withMessage('Total pages must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, schedule, pageConfigurations } = req.body;

    // Verify schedule belongs to the user
    const scheduleDoc = await Schedule.findOne({ 
      _id: schedule, 
      createdBy: req.user.id 
    });

    if (!scheduleDoc) {
      return res.status(400).json({ message: 'Schedule not found' });
    }

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
      schedule,
      pageConfigurations: pageConfigurations || [],
      createdBy: req.user.id
    });

    await magazine.save();
    
    // Populate schedule data before returning
    await magazine.populate('schedule', 'name issues');
    
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
  body('schedule').isMongoId().withMessage('Valid schedule is required'),
  body('pageConfigurations').isArray().withMessage('Page configurations must be an array'),
  body('pageConfigurations.*.issueName').trim().notEmpty().withMessage('Issue name is required'),
  body('pageConfigurations.*.totalPages').isInt({ min: 1 }).withMessage('Total pages must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, schedule, pageConfigurations } = req.body;

    const magazine = await Magazine.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    // Verify schedule belongs to the user
    const scheduleDoc = await Schedule.findOne({ 
      _id: schedule, 
      createdBy: req.user.id 
    });

    if (!scheduleDoc) {
      return res.status(400).json({ message: 'Schedule not found' });
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
    magazine.schedule = schedule;
    magazine.pageConfigurations = pageConfigurations || [];

    await magazine.save();
    
    // Populate schedule data before returning
    await magazine.populate('schedule', 'name issues');
    
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

// Get current issue (based on schedule close dates)
router.get('/current-issue/:magazineId', auth, async (req, res) => {
  try {
    const magazine = await Magazine.findOne({ 
      _id: req.params.magazineId, 
      createdBy: req.user.id 
    }).populate('schedule', 'name issues');

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    if (!magazine.schedule) {
      return res.status(400).json({ message: 'Magazine has no schedule assigned' });
    }

    const currentDate = new Date();
    
    // Find the first issue that hasn't passed its close date yet
    let currentIssue = null;
    
    for (const issue of magazine.schedule.issues) {
      const issueCloseDate = new Date(issue.closeDate);
      if (issueCloseDate >= currentDate) {
        currentIssue = {
          ...issue._doc,
          // Add page count from magazine page configurations
          totalPages: magazine.pageConfigurations.find(pc => pc.issueName === issue.name)?.totalPages || 40
        };
        break;
      }
    }

    // If all issues have passed their close date, return the last issue
    if (!currentIssue && magazine.schedule.issues.length > 0) {
      const lastIssue = magazine.schedule.issues[magazine.schedule.issues.length - 1];
      currentIssue = {
        ...lastIssue._doc,
        totalPages: magazine.pageConfigurations.find(pc => pc.issueName === lastIssue.name)?.totalPages || 40
      };
    }

    res.json({ magazine: magazine.name, currentIssue });
  } catch (error) {
    console.error('Error getting current issue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get magazine issues with page counts (for backwards compatibility)
router.get('/:id/issues', auth, async (req, res) => {
  try {
    const magazine = await Magazine.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    }).populate('schedule', 'name issues');

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    if (!magazine.schedule) {
      return res.json({ issues: [] });
    }

    // Combine schedule issues with page configurations
    const issues = magazine.schedule.issues.map(issue => ({
      _id: issue._id,
      name: issue.name,
      closeDate: issue.closeDate,
      sortOrder: issue.sortOrder,
      totalPages: magazine.pageConfigurations.find(pc => pc.issueName === issue.name)?.totalPages || 40,
      hidden: false // For backwards compatibility
    }));

    res.json({ issues });
  } catch (error) {
    console.error('Error getting magazine issues:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive/Unarchive a magazine
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const { archived } = req.body;
    
    const magazine = await Magazine.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });
    
    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }
    
    magazine.archived = archived;
    await magazine.save();
    
    res.json(magazine);
  } catch (error) {
    console.error('Error updating magazine archive status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 