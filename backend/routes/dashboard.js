const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Magazine = require('../models/Magazine');
const ContentSize = require('../models/ContentSize');
const LeafletDelivery = require('../models/LeafletDelivery');
const auth = require('../middleware/auth');

// Get dashboard summary statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const [
      totalCustomers,
      totalMagazines,
      totalBookings,
      totalLeafletDeliveries,
      totalBookingValue,
      totalLeafletValue
    ] = await Promise.all([
      Customer.countDocuments({ createdBy: req.user.id }),
      Magazine.countDocuments({ createdBy: req.user.id }),
      Booking.countDocuments({ createdBy: req.user.id, status: 'Active' }),
      LeafletDelivery.countDocuments({ createdBy: req.user.id, status: 'Active' }),
      Booking.aggregate([
        { $match: { createdBy: req.user.id, status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$netValue' } } }
      ]),
      LeafletDelivery.aggregate([
        { $match: { createdBy: req.user.id, status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$charge' } } }
      ])
    ]);

    res.json({
      totalCustomers,
      totalMagazines,
      totalBookings,
      totalLeafletDeliveries,
      totalBookingValue: totalBookingValue[0]?.total || 0,
      totalLeafletValue: totalLeafletValue[0]?.total || 0,
      totalRevenue: (totalBookingValue[0]?.total || 0) + (totalLeafletValue[0]?.total || 0)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current issue dashboard data for a magazine
router.get('/current-issue/:magazineId', auth, async (req, res) => {
  try {
    const magazine = await Magazine.findOne({ 
      _id: req.params.magazineId, 
      createdBy: req.user.id 
    });

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    // Find current issue
    const currentDate = new Date();
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

    if (!currentIssue) {
      // Get next upcoming issue
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

    if (!currentIssue) {
      return res.status(404).json({ message: 'No current or upcoming issue found' });
    }

    // Get bookings for this issue and magazine
    const bookings = await Booking.find({
      createdBy: req.user.id,
      magazines: req.params.magazineId,
      $or: [
        { firstIssue: currentIssue.name },
        { 
          $and: [
            { firstIssue: { $lte: currentIssue.name } },
            { 
              $or: [
                { isOngoing: true },
                { lastIssue: { $gte: currentIssue.name } }
              ]
            }
          ]
        }
      ],
      status: 'Active'
    }).populate('contentSize', 'size');

    // Calculate content type breakdown
    const contentTypeBreakdown = {};
    let totalBookedPages = 0;

    bookings.forEach(booking => {
      const contentType = booking.contentType;
      const pages = booking.contentSize.size;
      
      if (!contentTypeBreakdown[contentType]) {
        contentTypeBreakdown[contentType] = { pages: 0, count: 0, value: 0 };
      }
      
      contentTypeBreakdown[contentType].pages += pages;
      contentTypeBreakdown[contentType].count += 1;
      contentTypeBreakdown[contentType].value += booking.netValue;
      totalBookedPages += pages;
    });

    // Calculate percentages
    const totalPages = currentIssue.totalPages;
    const unallocatedPages = Math.max(0, totalPages - totalBookedPages);

    const breakdown = Object.entries(contentTypeBreakdown).map(([type, data]) => ({
      contentType: type,
      pages: data.pages,
      count: data.count,
      value: data.value,
      percentage: ((data.pages / totalPages) * 100).toFixed(1)
    }));

    // Add unallocated space
    if (unallocatedPages > 0) {
      breakdown.push({
        contentType: 'Unallocated',
        pages: unallocatedPages,
        count: 0,
        value: 0,
        percentage: ((unallocatedPages / totalPages) * 100).toFixed(1)
      });
    }

    res.json({
      magazine: magazine.name,
      currentIssue: {
        name: currentIssue.name,
        totalPages: currentIssue.totalPages,
        startDate: currentIssue.startDate
      },
      totalBookedPages,
      totalPages,
      unallocatedPages,
      breakdown,
      totalValue: Object.values(contentTypeBreakdown).reduce((sum, data) => sum + data.value, 0)
    });
  } catch (error) {
    console.error('Error fetching current issue dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get publication totals for all magazines
router.get('/publications', auth, async (req, res) => {
  try {
    const magazines = await Magazine.find({ createdBy: req.user.id });
    
    const publicationTotals = await Promise.all(
      magazines.map(async (magazine) => {
        const bookings = await Booking.find({
          createdBy: req.user.id,
          magazines: magazine._id,
          status: 'Active'
        });

        const contentTypeBreakdown = {};
        let totalValue = 0;

        bookings.forEach(booking => {
          const contentType = booking.contentType;
          
          if (!contentTypeBreakdown[contentType]) {
            contentTypeBreakdown[contentType] = { count: 0, value: 0 };
          }
          
          contentTypeBreakdown[contentType].count += 1;
          contentTypeBreakdown[contentType].value += booking.netValue;
          totalValue += booking.netValue;
        });

        return {
          magazine: {
            id: magazine._id,
            name: magazine.name
          },
          totalBookings: bookings.length,
          totalValue,
          contentTypeBreakdown: Object.entries(contentTypeBreakdown).map(([type, data]) => ({
            contentType: type,
            count: data.count,
            value: data.value
          }))
        };
      })
    );

    res.json(publicationTotals);
  } catch (error) {
    console.error('Error fetching publication totals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top customers by booking value
router.get('/top-customers', auth, async (req, res) => {
  try {
    const topCustomers = await Booking.aggregate([
      { $match: { createdBy: req.user.id, status: 'Active' } },
      {
        $group: {
          _id: '$customer',
          totalValue: { $sum: '$netValue' },
          totalBookings: { $sum: 1 }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          customerName: '$customer.name',
          businessCategory: '$customer.businessCategory',
          totalValue: 1,
          totalBookings: 1
        }
      }
    ]);

    res.json(topCustomers);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent activity (recent bookings and leaflet deliveries)
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const [recentBookings, recentLeafletDeliveries] = await Promise.all([
      Booking.find({ createdBy: req.user.id })
        .populate('customer', 'name')
        .populate('magazines', 'name')
        .populate('contentSize', 'description')
        .sort({ createdAt: -1 })
        .limit(5),
      LeafletDelivery.find({ createdBy: req.user.id })
        .populate('customer', 'name')
        .populate('magazine', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Combine and sort by creation date
    const activities = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        id: booking._id,
        customerName: booking.customer.name,
        description: `${booking.contentSize.description} in ${booking.magazines.map(m => m.name).join(', ')}`,
        value: booking.netValue,
        createdAt: booking.createdAt
      })),
      ...recentLeafletDeliveries.map(delivery => ({
        type: 'leaflet',
        id: delivery._id,
        customerName: delivery.customer.name,
        description: `Leaflet delivery (${delivery.quantity}x) in ${delivery.magazine.name}`,
        value: delivery.charge,
        createdAt: delivery.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 