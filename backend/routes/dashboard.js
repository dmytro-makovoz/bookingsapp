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
    // Calculate date ranges for current and previous month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper function to calculate percentage change
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const [
      // Current totals
      totalCustomers,
      totalMagazines,
      totalBookings,
      totalLeafletDeliveries,
      totalBookingValue,
      totalLeafletValue,
      // Current month stats
      currentMonthCustomers,
      currentMonthBookings,
      currentMonthLeafletDeliveries,
      currentMonthBookingValue,
      currentMonthLeafletValue,
      // Previous month stats
      previousMonthCustomers,
      previousMonthBookings,
      previousMonthLeafletDeliveries,
      previousMonthBookingValue,
      previousMonthLeafletValue
    ] = await Promise.all([
      // Current totals
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
      ]),
      // Current month stats
      Customer.countDocuments({ 
        createdBy: req.user.id, 
        createdAt: { $gte: startOfCurrentMonth } 
      }),
      Booking.countDocuments({ 
        createdBy: req.user.id, 
        status: 'Active', 
        createdAt: { $gte: startOfCurrentMonth } 
      }),
      LeafletDelivery.countDocuments({ 
        createdBy: req.user.id, 
        status: 'Active', 
        createdAt: { $gte: startOfCurrentMonth } 
      }),
      Booking.aggregate([
        { 
          $match: { 
            createdBy: req.user.id, 
            status: 'Active', 
            createdAt: { $gte: startOfCurrentMonth } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$netValue' } } }
      ]),
      LeafletDelivery.aggregate([
        { 
          $match: { 
            createdBy: req.user.id, 
            status: 'Active', 
            createdAt: { $gte: startOfCurrentMonth } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$charge' } } }
      ]),
      // Previous month stats
      Customer.countDocuments({ 
        createdBy: req.user.id, 
        createdAt: { 
          $gte: startOfPreviousMonth, 
          $lte: endOfPreviousMonth 
        } 
      }),
      Booking.countDocuments({ 
        createdBy: req.user.id, 
        status: 'Active', 
        createdAt: { 
          $gte: startOfPreviousMonth, 
          $lte: endOfPreviousMonth 
        } 
      }),
      LeafletDelivery.countDocuments({ 
        createdBy: req.user.id, 
        status: 'Active', 
        createdAt: { 
          $gte: startOfPreviousMonth, 
          $lte: endOfPreviousMonth 
        } 
      }),
      Booking.aggregate([
        { 
          $match: { 
            createdBy: req.user.id, 
            status: 'Active', 
            createdAt: { 
              $gte: startOfPreviousMonth, 
              $lte: endOfPreviousMonth 
            } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$netValue' } } }
      ]),
      LeafletDelivery.aggregate([
        { 
          $match: { 
            createdBy: req.user.id, 
            status: 'Active', 
            createdAt: { 
              $gte: startOfPreviousMonth, 
              $lte: endOfPreviousMonth 
            } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$charge' } } }
      ])
    ]);

    // Extract values and calculate changes
    const currentBookingValue = currentMonthBookingValue[0]?.total || 0;
    const currentLeafletValue = currentMonthLeafletValue[0]?.total || 0;
    const prevBookingValue = previousMonthBookingValue[0]?.total || 0;
    const prevLeafletValue = previousMonthLeafletValue[0]?.total || 0;
    
    const totalBookingValueAll = totalBookingValue[0]?.total || 0;
    const totalLeafletValueAll = totalLeafletValue[0]?.total || 0;
    const totalRevenueAll = totalBookingValueAll + totalLeafletValueAll;

    res.json({
      totalCustomers,
      totalMagazines,
      totalBookings,
      totalLeafletDeliveries,
      totalBookingValue: totalBookingValueAll,
      totalLeafletValue: totalLeafletValueAll,
      totalRevenue: totalRevenueAll,
      // Percentage changes
      customerChange: calculatePercentageChange(currentMonthCustomers, previousMonthCustomers),
      magazineChange: calculatePercentageChange(0, 0), // Magazines don't change monthly typically
      bookingChange: calculatePercentageChange(currentMonthBookings, previousMonthBookings),
      leafletDeliveryChange: calculatePercentageChange(currentMonthLeafletDeliveries, previousMonthLeafletDeliveries),
      bookingValueChange: calculatePercentageChange(currentBookingValue, prevBookingValue),
      leafletValueChange: calculatePercentageChange(currentLeafletValue, prevLeafletValue),
      totalRevenueChange: calculatePercentageChange(
        currentBookingValue + currentLeafletValue, 
        prevBookingValue + prevLeafletValue
      )
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
    }).populate('schedule', 'name issues');

    if (!magazine) {
      return res.status(404).json({ message: 'Magazine not found' });
    }

    if (!magazine.schedule) {
      return res.status(400).json({ message: 'Magazine has no schedule assigned' });
    }

    // Find current issue (first issue that hasn't passed its close date)
    const currentDate = new Date();
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
        closeDate: currentIssue.closeDate
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