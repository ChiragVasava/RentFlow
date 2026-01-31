const Order = require('../models/Order');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const moment = require('moment');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    
    // Apply role-based filtering
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    } else if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    // Date filtering
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Total Orders
    const totalOrders = await Order.countDocuments(query);

    // Active Rentals
    const activeRentals = await Order.countDocuments({
      ...query,
      status: { $in: ['active', 'picked_up'] }
    });

    // Total Revenue
    const revenueData = await Invoice.aggregate([
      {
        $match: req.user.role === 'vendor' 
          ? { vendor: req.user._id, status: 'paid' }
          : req.user.role === 'customer'
          ? { customer: req.user._id, status: 'paid' }
          : { status: 'paid' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paidAmount' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Pending Payments
    const pendingPayments = await Invoice.aggregate([
      {
        $match: req.user.role === 'vendor'
          ? { vendor: req.user._id, status: { $in: ['draft', 'sent', 'partial'] } }
          : req.user.role === 'customer'
          ? { customer: req.user._id, status: { $in: ['draft', 'sent', 'partial'] } }
          : { status: { $in: ['draft', 'sent', 'partial'] } }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$balanceAmount' }
        }
      }
    ]);

    const pendingAmount = pendingPayments.length > 0 ? pendingPayments[0].total : 0;

    // Additional stats for vendors and admins
    let additionalStats = {};
    
    if (req.user.role === 'vendor' || req.user.role === 'admin') {
      // Total Products
      const productQuery = req.user.role === 'vendor' 
        ? { vendor: req.user.id }
        : {};
      const totalProducts = await Product.countDocuments(productQuery);

      // Vendor-specific product stats
      if (req.user.role === 'vendor') {
        const publishedProducts = await Product.countDocuments({
          vendor: req.user.id,
          isPublished: true
        });
        const pendingProducts = await Product.countDocuments({
          vendor: req.user.id,
          isPublished: false
        });
        
        additionalStats.publishedProducts = publishedProducts;
        additionalStats.pendingProducts = pendingProducts;
      }

      // Most Rented Products
      const mostRentedProducts = await Order.aggregate([
        {
          $match: req.user.role === 'vendor'
            ? { vendor: req.user._id }
            : {}
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalRented: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalPrice' }
          }
        },
        { $sort: { totalRented: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $project: {
            name: '$productDetails.name',
            totalRented: 1,
            revenue: 1
          }
        }
      ]);

      additionalStats = {
        ...additionalStats,
        totalProducts,
        mostRentedProducts
      };
    }

    // Recent Orders
    const recentOrders = await Order.find(query)
      .populate('customer', 'name companyName')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly Revenue Trend (last 6 months)
    const sixMonthsAgo = moment().subtract(6, 'months').toDate();
    
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          ...(req.user.role === 'vendor' ? { vendor: req.user._id } : {}),
          ...(req.user.role === 'customer' ? { customer: req.user._id } : {}),
          status: 'paid',
          invoiceDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' }
          },
          revenue: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        activeRentals,
        totalRevenue,
        pendingAmount,
        ...additionalStats,
        recentOrders,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get vendor performance report
// @route   GET /api/dashboard/vendor-performance
// @access  Private (Admin)
exports.getVendorPerformance = async (req, res) => {
  try {
    const vendorPerformance = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      {
        $group: {
          _id: '$vendor',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          activeOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['active', 'picked_up']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorDetails'
        }
      },
      { $unwind: '$vendorDetails' },
      {
        $project: {
          vendorName: '$vendorDetails.name',
          companyName: '$vendorDetails.companyName',
          totalOrders: 1,
          totalRevenue: 1,
          activeOrders: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      vendorPerformance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor performance'
    });
  }
};

// @desc    Get order trends
// @route   GET /api/dashboard/order-trends
// @access  Private
exports.getOrderTrends = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = moment().subtract(parseInt(period), 'days').toDate();

    const query = {
      createdAt: { $gte: startDate }
    };

    if (req.user.role === 'vendor') {
      query.vendor = req.user._id;
    } else if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    const orderTrends = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.status(200).json({
      success: true,
      orderTrends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order trends'
    });
  }
};

// @desc    Export report
// @route   GET /api/dashboard/export
// @access  Private
exports.exportReport = async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;

    const query = {};
    
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    } else if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let data;
    
    switch (type) {
      case 'orders':
        data = await Order.find(query)
          .populate('customer', 'name email companyName')
          .populate('vendor', 'name companyName')
          .populate('items.product', 'name');
        break;
        
      case 'invoices':
        data = await Invoice.find(query)
          .populate('customer', 'name email companyName')
          .populate('vendor', 'name companyName');
        break;
        
      case 'products':
        const productQuery = req.user.role === 'vendor' 
          ? { vendor: req.user.id }
          : {};
        data = await Product.find(productQuery)
          .populate('vendor', 'name companyName');
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.status(200).json({
      success: true,
      data,
      exportDate: new Date(),
      type,
      format
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting report'
    });
  }
};
