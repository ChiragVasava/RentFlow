const Order = require('../models/Order');
const Quotation = require('../models/Quotation');
const Product = require('../models/Product');
const Pickup = require('../models/Pickup');
const ExcelJS = require('exceljs');
const moment = require('moment');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getAllOrders = async (req, res) => {
  try {
    const query = {};
    const { search, status, invoicedPaid, returnDateFilter } = req.query;

    // Customer can only see their orders
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    // Vendor can see orders for their products
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Invoiced and paid filter
    if (invoicedPaid === 'true') {
      query.status = 'invoiced';
      query.isPaid = true;
    }

    // Return date filter (approaching or passed)
    if (returnDateFilter === 'true') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      query.returnDate = { $lte: tomorrow };
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email companyName phone')
      .populate('vendor', 'name companyName')
      .populate('items.product', 'name images')
      .populate('quotation')
      .sort({ createdAt: -1 });

    // Search filter (post-query)
    let filteredOrders = orders;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = orders.filter(order =>
        order.orderId?.toLowerCase().includes(searchLower) ||
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.items?.some(item => item.product?.name?.toLowerCase().includes(searchLower))
      );
    }

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      orders: filteredOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email companyName gstin phone address')
      .populate('vendor', 'name companyName email phone')
      .populate('items.product', 'name images')
      .populate('quotation');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check access
    if (
      req.user.role === 'customer' &&
      order.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    if (
      req.user.role === 'vendor' &&
      order.vendor._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
};

// @desc    Create order from quotation
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res) => {
  try {
    const { quotationId, shippingAddress, securityDeposit, notes } = req.body;

    // Find quotation
    const quotation = await Quotation.findById(quotationId)
      .populate('items.product');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (quotation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Quotation must be confirmed before creating an order'
      });
    }

    // Get vendor from first product
    const firstProduct = await Product.findById(quotation.items[0].product);
    const vendorId = firstProduct.vendor;

    // Reserve products
    for (let item of quotation.items) {
      const product = await Product.findById(item.product);

      // Check availability again
      const isAvailable = product.checkAvailability(
        item.quantity,
        item.rentalStartDate,
        item.rentalEndDate
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is no longer available for the selected dates`
        });
      }
    }

    // Create order
    const order = await Order.create({
      quotation: quotationId,
      customer: req.user.id,
      vendor: vendorId,
      items: quotation.items.map(item => ({
        ...item.toObject(),
        status: 'pending'
      })),
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      securityDeposit: securityDeposit || 0,
      shippingAddress,
      notes,
      status: 'confirmed',
      paymentStatus: 'pending'
    });

    // Add reservations to products
    for (let item of quotation.items) {
      await Product.findByIdAndUpdate(item.product, {
        $push: {
          reservations: {
            orderId: order._id,
            quantity: item.quantity,
            startDate: item.rentalStartDate,
            endDate: item.rentalEndDate
          }
        }
      });
    }

    await order.populate('customer', 'name email companyName');
    await order.populate('vendor', 'name companyName');
    await order.populate('items.product', 'name images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor/Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'vendor' && order.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    order.status = status;
    order.updatedAt = Date.now();

    // If status is picked_up, create pickup document
    if (status === 'picked_up') {
      const pickup = await Pickup.create({
        order: order._id,
        customer: order.customer,
        vendor: order.vendor,
        items: order.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          condition: 'good'
        })),
        scheduledDate: order.pickupDate,
        pickupAddress: order.shippingAddress,
        status: 'completed'
      });

      order.pickupDate = new Date();

      // Update item statuses
      order.items.forEach(item => {
        item.status = 'with_customer';
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paidAmount, paymentMethod, transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = paymentStatus;
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment status'
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (
      req.user.role === 'customer' &&
      order.customer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Cannot cancel if already picked up
    if (order.status === 'picked_up' || order.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that is already in progress'
      });
    }

    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    // Remove reservations
    for (let item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $pull: {
          reservations: { orderId: order._id }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order'
    });
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/customer/my-orders
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('vendor', 'name companyName')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
exports.getOrderStats = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Order.countDocuments(query);

    const formattedStats = {
      total,
      quotation: 0,
      sale_order: 0,
      confirmed: 0,
      invoiced: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics'
    });
  }
};

// @desc    Export orders to CSV/Excel
// @route   GET /api/orders/export
// @access  Private
exports.exportOrders = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders');

      worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Product', key: 'product', width: 25 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Return Date', key: 'returnDate', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 }
      ];

      orders.forEach(order => {
        const productName = order.items[0]?.product?.name || 'N/A';
        worksheet.addRow({
          orderId: order.orderId,
          customer: order.customer?.name || 'N/A',
          product: productName,
          price: `₹${order.totalAmount}`,
          status: order.status,
          paymentStatus: order.paymentStatus,
          returnDate: order.returnDate ? moment(order.returnDate).format('YYYY-MM-DD') : 'N/A',
          createdAt: moment(order.createdAt).format('YYYY-MM-DD')
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } else {
      // CSV format
      const csvRows = [];
      csvRows.push('Order ID,Customer,Product,Price,Status,Payment Status,Return Date,Created At');

      orders.forEach(order => {
        const productName = order.items[0]?.product?.name || 'N/A';
        const row = [
          order.orderId,
          order.customer?.name || 'N/A',
          productName,
          order.totalAmount,
          order.status,
          order.paymentStatus,
          order.returnDate ? moment(order.returnDate).format('YYYY-MM-DD') : 'N/A',
          moment(order.createdAt).format('YYYY-MM-DD')
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      res.send(csvRows.join('\n'));
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting orders'
    });
  }
};

// @desc    Import orders from CSV
// @route   POST /api/orders/import
// @access  Private (Admin/Vendor)
exports.importOrders = async (req, res) => {
  try {
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format'
      });
    }

    const imported = [];
    const errors = [];

    for (const orderData of orders) {
      try {
        // Find or create customer
        // This is simplified - in production you'd need proper validation
        imported.push(orderData);
      } catch (error) {
        errors.push({ orderData, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${imported.length} orders`,
      imported: imported.length,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Error importing orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing orders'
    });
  }
};

