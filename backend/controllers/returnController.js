const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const moment = require('moment');

// @desc    Get all returns
// @route   GET /api/returns
// @access  Private
exports.getAllReturns = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const returns = await Return.find(query)
      .populate('customer', 'name email phone')
      .populate('vendor', 'name companyName')
      .populate('order')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: returns.length,
      returns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching returns'
    });
  }
};

// @desc    Get single return
// @route   GET /api/returns/:id
// @access  Private
exports.getReturn = async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('vendor', 'name companyName phone')
      .populate('order')
      .populate('items.product', 'name images');

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    res.status(200).json({
      success: true,
      return: returnDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching return'
    });
  }
};

// @desc    Create return
// @route   POST /api/returns
// @access  Private (Customer/Vendor)
exports.createReturn = async (req, res) => {
  try {
    const { orderId, items, notes } = req.body;

    const order = await Order.findById(orderId)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate if return is late
    const expectedReturnDate = new Date(order.items[0].rentalEndDate);
    const returnDate = new Date();
    const isLate = returnDate > expectedReturnDate;
    
    let lateDays = 0;
    let lateReturnFee = 0;

    if (isLate) {
      lateDays = Math.ceil((returnDate - expectedReturnDate) / (1000 * 60 * 60 * 24));
      // Calculate late fee (e.g., 10% of daily rate per day)
      order.items.forEach(item => {
        const product = item.product;
        const dailyRate = product.rentalPricing.daily || 0;
        lateReturnFee += (dailyRate * 0.1 * lateDays * item.quantity);
      });
    }

    // Calculate damage fees
    let totalDamageFee = 0;
    const returnItems = items || order.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      conditionOnReturn: 'good',
      damageFee: 0
    }));

    returnItems.forEach(item => {
      if (item.damageFee) {
        totalDamageFee += item.damageFee;
      }
    });

    // Handle return address - could be string or object
    let returnAddress = order.shippingAddress;
    if (typeof returnAddress === 'string') {
      returnAddress = { street: returnAddress };
    }

    const returnDoc = await Return.create({
      order: orderId,
      customer: order.customer,
      vendor: order.vendor,
      items: returnItems,
      expectedReturnDate,
      isLate,
      lateDays,
      lateReturnFee,
      totalDamageFee,
      returnAddress: returnAddress || {},
      notes,
      status: 'processing'
    });

    // Update order status
    order.status = 'completed';
    order.actualReturnDate = returnDate;
    order.lateReturnFee = lateReturnFee;
    await order.save();

    // Remove reservations and restore stock
    for (let item of order.items) {
      const product = await Product.findById(item.product);
      
      // Remove reservation
      product.reservations = product.reservations.filter(
        res => res.orderId.toString() !== orderId
      );
      
      await product.save();
    }

    await returnDoc.populate('customer', 'name email');
    await returnDoc.populate('items.product', 'name');

    res.status(201).json({
      success: true,
      message: 'Return created successfully',
      return: returnDoc
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating return',
      error: error.message
    });
  }
};

// @desc    Complete return
// @route   PUT /api/returns/:id/complete
// @access  Private (Vendor)
exports.completeReturn = async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    if (req.user.role === 'vendor' && returnDoc.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    returnDoc.status = 'completed';
    await returnDoc.save();

    // Increment stock for each returned item
    const populatedReturn = await Return.findById(returnDoc._id).populate('items.product');
    for (let item of populatedReturn.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.quantityOnHand += item.quantity;
        await product.save();
        console.log(`Stock incremented for ${product.name}: +${item.quantity} (New stock: ${product.quantityOnHand})`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Return completed successfully',
      return: returnDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing return'
    });
  }
};
