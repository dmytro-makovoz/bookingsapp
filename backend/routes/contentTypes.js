const express = require('express');
const router = express.Router();
const ContentType = require('../models/ContentType');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all content types for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { createdBy: req.user.id };
    
    if (!includeArchived) {
      filter.archived = { $ne: true };
    }
    
    const contentTypes = await ContentType.find(filter)
      .sort({ name: 1 });
    res.json(contentTypes);
  } catch (error) {
    console.error('Error fetching content types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single content type
router.get('/:id', auth, async (req, res) => {
  try {
    const contentType = await ContentType.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contentType) {
      return res.status(404).json({ message: 'Content type not found' });
    }

    res.json(contentType);
  } catch (error) {
    console.error('Error fetching content type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new content type
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, description } = req.body;

    // Check if content type with this name already exists for the user
    const existingContentType = await ContentType.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: req.user.id
    });

    if (existingContentType) {
      return res.status(400).json({ message: 'Content type with this name already exists' });
    }

    const contentType = new ContentType({
      name,
      description,
      createdBy: req.user.id
    });

    await contentType.save();
    res.status(201).json(contentType);
  } catch (error) {
    console.error('Error creating content type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a content type
router.put('/:id', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, description } = req.body;

    // Check if content type exists and belongs to user
    const contentType = await ContentType.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contentType) {
      return res.status(404).json({ message: 'Content type not found' });
    }

    // Check if another content type with this name already exists (excluding current one)
    const existingContentType = await ContentType.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      createdBy: req.user.id,
      _id: { $ne: req.params.id }
    });

    if (existingContentType) {
      return res.status(400).json({ message: 'Content type with this name already exists' });
    }

    contentType.name = name;
    contentType.description = description;
    await contentType.save();

    res.json(contentType);
  } catch (error) {
    console.error('Error updating content type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a content type (soft delete by archiving)
router.delete('/:id', auth, async (req, res) => {
  try {
    const contentType = await ContentType.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contentType) {
      return res.status(404).json({ message: 'Content type not found' });
    }

    // Prevent deletion of default content types
    if (contentType.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default content types' });
    }

    // Soft delete by archiving
    contentType.archived = true;
    await contentType.save();

    res.json({ message: 'Content type archived successfully' });
  } catch (error) {
    console.error('Error deleting content type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore a content type (unarchive)
router.put('/:id/restore', auth, async (req, res) => {
  try {
    const contentType = await ContentType.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contentType) {
      return res.status(404).json({ message: 'Content type not found' });
    }

    contentType.archived = false;
    await contentType.save();

    res.json(contentType);
  } catch (error) {
    console.error('Error restoring content type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 