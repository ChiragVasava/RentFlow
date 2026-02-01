const Pickup = require('../models/Pickup');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get all pickups
// @route   GET /api/pickups
// @access  Private
exports.getAllPickups = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const pickups = await Pickup.find(query)
      .populate('customer', 'name email phone')
      .populate('vendor', 'name companyName')
      .populate('order')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pickups.length,
      pickups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pickups'
    });
  }
};

// @desc    Get single pickup
// @route   GET /api/pickups/:id
// @access  Private
exports.getPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('vendor', 'name companyName phone')
      .populate('order')
      .populate('items.product', 'name images');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    res.status(200).json({
      success: true,
      pickup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pickup'
    });
  }
};

// @desc    Create pickup
// @route   POST /api/pickups
// @access  Private (Vendor/Admin)
exports.createPickup = async (req, res) => {
  try {
    const { orderId, scheduledDate, instructions, notes } = req.body;

    const order = await Order.findById(orderId)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Handle pickup address - could be string or object
    let pickupAddress = order.shippingAddress;
    if (typeof pickupAddress === 'string') {
      // If it's a string, convert to object format
      pickupAddress = { street: pickupAddress };
    }

    const pickup = await Pickup.create({
      order: orderId,
      customer: order.customer,
      vendor: order.vendor,
      items: order.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        condition: 'good'
      })),
      scheduledDate,
      pickupAddress: pickupAddress || {},
      instructions,
      notes,
      status: 'scheduled'
    });

    await pickup.populate('customer', 'name email');
    await pickup.populate('items.product', 'name');

    res.status(201).json({
      success: true,
      message: 'Pickup scheduled successfully',
      pickup
    });
  } catch (error) {
    console.error('Create pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pickup',
      error: error.message
    });
  }
};

// @desc    Complete pickup
// @route   PUT /api/pickups/:id/complete
// @access  Private (Vendor)
exports.completePickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    if (req.user.role === 'vendor' && pickup.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    pickup.status = 'completed';
    pickup.pickupDate = new Date();
    await pickup.save();

    // Update order status to active (items are now with customer)
    await Order.findByIdAndUpdate(pickup.order, {
      status: 'active',
      pickupDate: new Date()
    });

    // Decrement stock for each picked up item
    for (let item of pickup.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantityOnHand -= item.quantity;
        if (product.quantityOnHand < 0) {
          product.quantityOnHand = 0;
        }
        await product.save();
        console.log(`Stock decremented for ${product.name}: -${item.quantity} (New stock: ${product.quantityOnHand})`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Pickup completed successfully',
      pickup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing pickup'
    });
  }
};
