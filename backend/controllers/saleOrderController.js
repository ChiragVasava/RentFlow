const SaleOrder = require('../models/SaleOrder');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get all sale orders
// @route   GET /api/sale-orders
// @access  Private
exports.getAllSaleOrders = async (req, res) => {
  try {
    const query = {};
    const { status, paymentStatus } = req.query;

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Customer can only see their sale orders
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    // Vendor can see sale orders for their products
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const saleOrders = await SaleOrder.find(query)
      .populate('customer', 'name email companyName phone')
      .populate('vendor', 'name companyName email phone')
      .populate('items.product', 'name images category salesPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: saleOrders.length,
      saleOrders
    });
  } catch (error) {
    console.error('Get sale orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sale orders'
    });
  }
};

// @desc    Get single sale order
// @route   GET /api/sale-orders/:id
// @access  Private
exports.getSaleOrder = async (req, res) => {
  try {
    const saleOrder = await SaleOrder.findById(req.params.id)
      .populate('customer', 'name email companyName gstin phone address')
      .populate('vendor', 'name email companyName gstin phone address')
      .populate('items.product', 'name images category salesPrice specifications');

    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    // Check access
    if (
      (req.user.role === 'customer' && saleOrder.customer._id.toString() !== req.user.id) ||
      (req.user.role === 'vendor' && saleOrder.vendor._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this sale order'
      });
    }

    res.status(200).json({
      success: true,
      saleOrder
    });
  } catch (error) {
    console.error('Get sale order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sale order'
    });
  }
};

// @desc    Create sale order
// @route   POST /api/sale-orders
// @access  Private (Customer)
exports.createSaleOrder = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, notes } = req.body;

    console.log('Creating sale order for user:', req.user.id);
    console.log('Sale order items received:', JSON.stringify(items, null, 2));

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sale order must have at least one item'
      });
    }

    // Validate and process items
    const processedItems = [];
    let vendor = null;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      // Check if product is available for sale
      if (!product.isSellable && product.availabilityType !== 'sale' && product.availabilityType !== 'both') {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available for sale`
        });
      }

      // Check inventory
      if (product.quantityOnHand < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for product ${product.name}. Available: ${product.quantityOnHand}, Requested: ${item.quantity}`
        });
      }

      // Set vendor (all products should be from same vendor in one order)
      if (!vendor) {
        vendor = product.vendor;
      } else if (vendor.toString() !== product.vendor.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All products in a sale order must be from the same vendor'
        });
      }

      const pricePerUnit = product.salesPrice;
      const totalPrice = pricePerUnit * item.quantity;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        pricePerUnit,
        totalPrice,
        status: 'pending'
      });
    }

    // Generate order number
    const orderNumber = await SaleOrder.generateOrderNumber();

    // Create sale order
    const saleOrder = new SaleOrder({
      orderNumber,
      customer: req.user.id,
      vendor,
      items: processedItems,
      shippingAddress: shippingAddress || req.user.address,
      billingAddress: billingAddress || shippingAddress || req.user.address,
      paymentMethod: paymentMethod || 'cash',
      notes,
      status: 'draft'
    });

    // Calculate totals
    saleOrder.calculateTotals();

    await saleOrder.save();

    // Update product inventory
    for (let i = 0; i < items.length; i++) {
      const product = await Product.findById(items[i].productId);
      product.quantityOnHand -= items[i].quantity;
      await product.save();
    }

    // Populate the response
    await saleOrder.populate([
      { path: 'customer', select: 'name email companyName phone' },
      { path: 'vendor', select: 'name companyName email phone' },
      { path: 'items.product', select: 'name images category salesPrice' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Sale order created successfully',
      saleOrder
    });

  } catch (error) {
    console.error('Create sale order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating sale order'
    });
  }
};

// @desc    Update sale order status
// @route   PUT /api/sale-orders/:id/status
// @access  Private
exports.updateSaleOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const saleOrder = await SaleOrder.findById(req.params.id);
    
    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'vendor' && saleOrder.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this sale order'
      });
    }

    if (req.user.role === 'customer' && saleOrder.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this sale order'
      });
    }

    // Update status
    saleOrder.status = status;

    // Set timestamps
    const now = new Date();
    switch (status) {
      case 'confirmed':
        saleOrder.confirmedAt = now;
        break;
      case 'shipped':
        saleOrder.shippedAt = now;
        break;
      case 'delivered':
        saleOrder.deliveredAt = now;
        break;
      case 'cancelled':
        saleOrder.cancelledAt = now;
        break;
    }

    if (notes) {
      if (req.user.role === 'vendor') {
        saleOrder.vendorNotes = notes;
      } else {
        saleOrder.customerNotes = notes;
      }
    }

    await saleOrder.save();

    res.status(200).json({
      success: true,
      message: 'Sale order status updated successfully',
      saleOrder
    });

  } catch (error) {
    console.error('Update sale order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sale order status'
    });
  }
};

// @desc    Cancel sale order
// @route   PUT /api/sale-orders/:id/cancel
// @access  Private
exports.cancelSaleOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const saleOrder = await SaleOrder.findById(req.params.id)
      .populate('items.product');
    
    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && saleOrder.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this sale order'
      });
    }

    if (req.user.role === 'vendor' && saleOrder.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this sale order'
      });
    }

    // Check if order can be cancelled
    if (!saleOrder.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'This sale order cannot be cancelled'
      });
    }

    // Restore inventory
    for (const item of saleOrder.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.quantityOnHand += item.quantity;
        await product.save();
      }
    }

    // Update order
    saleOrder.status = 'cancelled';
    saleOrder.rejectionReason = reason;
    saleOrder.cancelledAt = new Date();

    await saleOrder.save();

    res.status(200).json({
      success: true,
      message: 'Sale order cancelled successfully',
      saleOrder
    });

  } catch (error) {
    console.error('Cancel sale order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling sale order'
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/sale-orders/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, notes } = req.body;
    
    const saleOrder = await SaleOrder.findById(req.params.id);
    
    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    // Check authorization (usually vendor or admin)
    if (req.user.role === 'vendor' && saleOrder.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update payment status'
      });
    }

    saleOrder.paymentStatus = paymentStatus;
    if (paymentMethod) saleOrder.paymentMethod = paymentMethod;
    if (notes) saleOrder.vendorNotes = notes;

    await saleOrder.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      saleOrder
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status'
    });
  }
};

// @desc    Delete sale order
// @route   DELETE /api/sale-orders/:id
// @access  Private
exports.deleteSaleOrder = async (req, res) => {
  try {
    const saleOrder = await SaleOrder.findById(req.params.id);

    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && saleOrder.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this sale order'
      });
    }

    // Only allow deletion of draft orders
    if (saleOrder.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft sale orders can be deleted'
      });
    }

    await saleOrder.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Sale order deleted successfully'
    });

  } catch (error) {
    console.error('Delete sale order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sale order'
    });
  }
};