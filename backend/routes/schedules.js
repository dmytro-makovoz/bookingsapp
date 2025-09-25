const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all schedules for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ 
      createdBy: req.user.id,
      archived: false 
    }).sort({ createdAt: -1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single schedule
router.get('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new schedule
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Schedule name is required'),
  body('issues').isArray({ min: 1 }).withMessage('At least one issue is required'),
  body('issues.*.name').notEmpty().withMessage('Issue name is required'),
  body('issues.*.closeDate').isISO8601().withMessage('Valid close date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { name, issues } = req.body;

    // Check if schedule name already exists for this user
    const existingSchedule = await Schedule.findOne({ 
      name: name.trim(), 
      createdBy: req.user.id,
      archived: false 
    });

    if (existingSchedule) {
      return res.status(400).json({ 
        message: 'A schedule with this name already exists' 
      });
    }

    // Process issues and add sort order
    const processedIssues = issues.map((issue, index) => ({
      name: issue.name.trim(),
      closeDate: new Date(issue.closeDate),
      sortOrder: index
    }));

    const schedule = new Schedule({
      name: name.trim(),
      issues: processedIssues,
      createdBy: req.user.id
    });

    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a schedule
router.put('/:id', [
  auth,
  body('name').notEmpty().withMessage('Schedule name is required'),
  body('issues').isArray({ min: 1 }).withMessage('At least one issue is required'),
  body('issues.*.name').notEmpty().withMessage('Issue name is required'),
  body('issues.*.closeDate').isISO8601().withMessage('Valid close date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const schedule = await Schedule.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const { name, issues } = req.body;

    // Check if new name conflicts with existing schedules (excluding current one)
    if (name.trim() !== schedule.name) {
      const existingSchedule = await Schedule.findOne({ 
        name: name.trim(), 
        createdBy: req.user.id,
        archived: false,
        _id: { $ne: req.params.id }
      });

      if (existingSchedule) {
        return res.status(400).json({ 
          message: 'A schedule with this name already exists' 
        });
      }
    }

    // Validate close date changes - don't allow past dates to be modified
    const currentDate = new Date();
    for (let i = 0; i < issues.length; i++) {
      const newIssue = issues[i];
      const existingIssue = schedule.issues.find(issue => issue.name === newIssue.name);
      
      if (existingIssue && new Date(existingIssue.closeDate) < currentDate) {
        const newCloseDate = new Date(newIssue.closeDate);
        const existingCloseDate = new Date(existingIssue.closeDate);
        
        // Don't allow changing close date if the existing close date is in the past
        if (newCloseDate.getTime() !== existingCloseDate.getTime()) {
          return res.status(400).json({ 
            message: `Cannot modify close date for ${newIssue.name} as it has already passed` 
          });
        }
      }
    }

    // Process issues and add sort order
    const processedIssues = issues.map((issue, index) => ({
      name: issue.name.trim(),
      closeDate: new Date(issue.closeDate),
      sortOrder: index
    }));

    schedule.name = name.trim();
    schedule.issues = processedIssues;
    
    await schedule.save();
    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a schedule
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive/Unarchive a schedule
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.archived = !schedule.archived;
    await schedule.save();

    res.json(schedule);
  } catch (error) {
    console.error('Error archiving schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available issues (not past close date) for a schedule
router.get('/:id/available-issues', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const currentDate = new Date();
    const availableIssues = schedule.issues.filter(issue => 
      new Date(issue.closeDate) >= currentDate
    );

    res.json({
      schedule: schedule.name,
      availableIssues
    });
  } catch (error) {
    console.error('Error getting available issues:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate if an issue is available for booking (not past close date)
router.get('/validate-issue/:issueName', auth, async (req, res) => {
  try {
    const { issueName } = req.params;
    const currentDate = new Date();
    
    // Find all schedules for the user that contain this issue name
    const schedules = await Schedule.find({ 
      createdBy: req.user.id,
      archived: false,
      'issues.name': issueName
    });

    // If no schedules contain this issue, it's considered available (backward compatibility)
    if (schedules.length === 0) {
      return res.json({ 
        available: true,
        message: 'Issue is available (no schedule restrictions)'
      });
    }

    // Check if any schedule has this issue past its close date
    for (const schedule of schedules) {
      const issue = schedule.issues.find(i => i.name === issueName);
      if (issue && new Date(issue.closeDate) < currentDate) {
        return res.json({
          available: false,
          message: `Issue "${issueName}" is closed. Close date was ${new Date(issue.closeDate).toDateString()}.`,
          closedDate: issue.closeDate,
          schedule: schedule.name
        });
      }
    }

    res.json({ 
      available: true,
      message: 'Issue is available for booking'
    });
  } catch (error) {
    console.error('Error validating issue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 