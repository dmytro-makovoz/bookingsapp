const express = require('express');
const router = express.Router();
const ContentSize = require('../models/ContentSize');
const Magazine = require('../models/Magazine');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all content sizes for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { createdBy: req.user.id };
    
    if (!includeArchived) {
      filter.archived = { $ne: true };
    }
    
    const contentSizes = await ContentSize.find(filter)
      .populate('pricing.magazine', 'name')
      .sort({ size: 1 });
    
    // Filter out invalid magazine references and clean up data on-the-fly
    const cleanedContentSizes = contentSizes.map(contentSize => {
      const validPricing = contentSize.pricing.filter(pricing => pricing.magazine != null);
      
      // Log if we found invalid references
      if (validPricing.length !== contentSize.pricing.length) {
        console.warn(`Found ${contentSize.pricing.length - validPricing.length} invalid magazine references in content size: ${contentSize.description}`);
      }
      
      return {
        ...contentSize.toObject(),
        pricing: validPricing
      };
    }).filter(contentSize => contentSize.pricing.length > 0); // Only return content sizes with at least one valid pricing
    
    res.json(cleanedContentSizes);
  } catch (error) {
    console.error('Error fetching content sizes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single content size
router.get('/:id', auth, async (req, res) => {
  try {
    const contentSize = await ContentSize.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    }).populate('pricing.magazine', 'name');
    
    if (!contentSize) {
      return res.status(404).json({ message: 'Content size not found' });
    }
    
    res.json(contentSize);
  } catch (error) {
    console.error('Error fetching content size:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new content size
router.post('/', [
  auth,
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('size').isFloat({ min: 0.001, max: 999.999 }).withMessage('Size must be between 0.001 and 999.999'),
  body('pricing').isArray().withMessage('Pricing must be an array'),
  body('pricing.*.magazine').notEmpty().withMessage('Magazine is required for pricing'),
  body('pricing.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { description, size, pricing } = req.body;

    // Verify all magazines belong to the user
    const magazineIds = pricing.map(p => p.magazine);
    const magazines = await Magazine.find({ 
      _id: { $in: magazineIds }, 
      createdBy: req.user.id 
    });

    if (magazines.length !== magazineIds.length) {
      return res.status(400).json({ message: 'One or more magazines not found' });
    }

    const contentSize = new ContentSize({
      description,
      size,
      pricing,
      createdBy: req.user.id
    });

    await contentSize.save();
    await contentSize.populate('pricing.magazine', 'name');
    res.status(201).json(contentSize);
  } catch (error) {
    console.error('Error creating content size:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a content size
router.put('/:id', [
  auth,
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('size').isFloat({ min: 0.001, max: 999.999 }).withMessage('Size must be between 0.001 and 999.999'),
  body('pricing').isArray().withMessage('Pricing must be an array'),
  body('pricing.*.magazine').notEmpty().withMessage('Magazine is required for pricing'),
  body('pricing.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { description, size, pricing } = req.body;

    const contentSize = await ContentSize.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!contentSize) {
      return res.status(404).json({ message: 'Content size not found' });
    }

    // Verify all magazines belong to the user
    const magazineIds = pricing.map(p => p.magazine);
    const magazines = await Magazine.find({ 
      _id: { $in: magazineIds }, 
      createdBy: req.user.id 
    });

    if (magazines.length !== magazineIds.length) {
      return res.status(400).json({ message: 'One or more magazines not found' });
    }

    contentSize.description = description;
    contentSize.size = size;
    contentSize.pricing = pricing;

    await contentSize.save();
    await contentSize.populate('pricing.magazine', 'name');
    res.json(contentSize);
  } catch (error) {
    console.error('Error updating content size:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a content size
router.delete('/:id', auth, async (req, res) => {
  try {
    const contentSize = await ContentSize.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!contentSize) {
      return res.status(404).json({ message: 'Content size not found' });
    }

    await ContentSize.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content size deleted successfully' });
  } catch (error) {
    console.error('Error deleting content size:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get price for a specific content size and magazine
router.get('/:contentSizeId/price/:magazineId', auth, async (req, res) => {
  try {
    const contentSize = await ContentSize.findOne({ 
      _id: req.params.contentSizeId, 
      createdBy: req.user.id 
    });

    if (!contentSize) {
      return res.status(404).json({ message: 'Content size not found' });
    }

    const pricing = contentSize.pricing.find(p => 
      p.magazine.toString() === req.params.magazineId
    );

    if (!pricing) {
      return res.status(404).json({ message: 'Price not found for this magazine' });
    }

    res.json({ price: pricing.price });
  } catch (error) {
    console.error('Error getting price:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive/Unarchive a content size
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const { archived } = req.body;
    
    const contentSize = await ContentSize.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });
    
    if (!contentSize) {
      return res.status(404).json({ message: 'Content size not found' });
    }
    
    contentSize.archived = archived;
    await contentSize.save();
    
    await contentSize.populate('pricing.magazine', 'name');
    res.json(contentSize);
  } catch (error) {
    console.error('Error updating content size archive status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cleanup invalid magazine references in content sizes
router.post('/cleanup', auth, async (req, res) => {
  try {
    console.log('Starting content size cleanup for user:', req.user.id);
    
    // Get all content sizes for this user
    const contentSizes = await ContentSize.find({ createdBy: req.user.id });
    
    let cleanupCount = 0;
    let deletedCount = 0;
    
    for (const contentSize of contentSizes) {
      let needsUpdate = false;
      const validPricing = [];
      
      // Check each pricing entry
      for (const pricing of contentSize.pricing) {
        const magazine = await Magazine.findById(pricing.magazine);
        if (magazine && magazine.createdBy.toString() === req.user.id.toString()) {
          validPricing.push(pricing);
        } else {
          console.log(`Removing invalid magazine reference: ${pricing.magazine} from content size: ${contentSize.description}`);
          needsUpdate = true;
          cleanupCount++;
        }
      }
      
      if (needsUpdate) {
        if (validPricing.length === 0) {
          // Delete content size if it has no valid magazine pricing
          await ContentSize.findByIdAndDelete(contentSize._id);
          deletedCount++;
          console.log(`Deleted content size with no valid magazines: ${contentSize.description}`);
        } else {
          // Update with only valid pricing entries
          contentSize.pricing = validPricing;
          await contentSize.save();
          console.log(`Updated content size: ${contentSize.description}, removed ${contentSize.pricing.length - validPricing.length} invalid magazine references`);
        }
      }
    }
    
    res.json({ 
      message: 'Content size cleanup completed',
      invalidReferencesRemoved: cleanupCount,
      contentSizesDeleted: deletedCount
    });
  } catch (error) {
    console.error('Error during content size cleanup:', error);
    res.status(500).json({ message: 'Server error during cleanup' });
  }
});

module.exports = router; 