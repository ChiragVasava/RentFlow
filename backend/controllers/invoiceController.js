const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const SaleOrder = require('../models/SaleOrder');
const Product = require('../models/Product');

// Category-based tax rates (in percentage)
const TAX_RATES = {
  'Electronics': 18,
  'Furniture': 12,
  'Entertainment': 18,
  'Transportation': 12,
  'Tools & Equipment': 18,
  'Party Supplies': 12,
  'default': 18
};

// Helper function to get tax rate by category
const getTaxRateByCategory = (category) => {
  return TAX_RATES[category] || TAX_RATES['default'];
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getAllInvoices = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name email companyName gstin')
      .populate('vendor', 'name companyName gstin')
      .populate('order')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices'
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email companyName gstin phone address')
      .populate('vendor', 'name companyName gstin phone address')
      .populate('order')
      .populate('items.product', 'name');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check access
    if (
      req.user.role === 'customer' && 
      invoice.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (
      req.user.role === 'vendor' && 
      invoice.vendor._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice'
    });
  }
};

// @desc    Create invoice from order
// @route   POST /api/invoices
// @access  Private (Vendor/Admin)
exports.createInvoice = async (req, res) => {
  try {
    const { orderId, dueDate, notes, orderType = 'rental' } = req.body;

    let order;
    
    // Try to find in Order (rental) first, then SaleOrder
    if (orderType === 'sale') {
      order = await SaleOrder.findById(orderId).populate('items.product', 'name');
    } else {
      order = await Order.findById(orderId).populate('items.product', 'name');
      
      // If not found in Order, try SaleOrder
      if (!order) {
        order = await SaleOrder.findById(orderId).populate('items.product', 'name');
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if vendor
    if (req.user.role === 'vendor' && order.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this order'
      });
    }

    // Fetch complete product details to get categories and tax rates
    const productIds = order.items.map(item => item.product._id || item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    // Prepare invoice items with tax rates
    const invoiceItems = order.items.map(item => {
      let rentalPeriod = 'N/A';
      
      if (item.rentalStartDate && item.rentalEndDate) {
        rentalPeriod = `${new Date(item.rentalStartDate).toLocaleDateString()} - ${new Date(item.rentalEndDate).toLocaleDateString()}`;
      } else if (order.startDate && order.endDate) {
        rentalPeriod = `${new Date(order.startDate).toLocaleDateString()} - ${new Date(order.endDate).toLocaleDateString()}`;
      }

      const productId = item.product._id || item.product;
      const product = productMap[productId.toString()];
      const itemTaxRate = product?.taxRate || getTaxRateByCategory(product?.category);

      return {
        product: productId,
        productName: item.product.name || product?.name,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit || item.price,
        totalPrice: item.totalPrice || (item.price * item.quantity),
        rentalPeriod,
        taxRate: itemTaxRate,
        category: product?.category
      };
    });

    // Calculate taxes based on individual item categories (CGST + SGST for same state, IGST for different state)
    const { discount = 0, discountType = 'fixed', paymentType = 'full', initialPayment = 0 } = req.body;
    
    let subtotal = order.subtotal || order.totalAmount;
    let discountAmount = 0;
    
    if (discount > 0) {
      discountAmount = discountType === 'percentage' 
        ? (subtotal * discount) / 100 
        : discount;
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    
    // Calculate weighted average tax rate or calculate tax per item
    let totalTaxAmount = 0;
    invoiceItems.forEach(item => {
      const itemSubtotal = item.totalPrice;
      const itemDiscount = (itemSubtotal / subtotal) * discountAmount;
      const itemSubtotalAfterDiscount = itemSubtotal - itemDiscount;
      const itemTax = (itemSubtotalAfterDiscount * item.taxRate) / 100;
      totalTaxAmount += itemTax;
    });

    // Calculate weighted average tax rate for display
    const effectiveTaxRate = subtotalAfterDiscount > 0 
      ? (totalTaxAmount / subtotalAfterDiscount) * 100 
      : 18;
    
    const cgst = totalTaxAmount / 2;
    const sgst = totalTaxAmount / 2;
    const totalAmount = subtotalAfterDiscount + totalTaxAmount;

    const invoice = await Invoice.create({
      order: orderId,
      customer: order.customer,
      vendor: order.vendor,
      items: invoiceItems,
      subtotal: order.subtotal || order.totalAmount,
      discount: discountAmount,
      discountType,
      taxRate: effectiveTaxRate,
      cgst,
      sgst,
      igst: 0,
      taxAmount: totalTaxAmount,
      totalAmount,
      securityDeposit: order.securityDeposit || 0,
      lateReturnFee: order.lateReturnFee || 0,
      paidAmount: initialPayment || 0,
      balanceAmount: totalAmount - (initialPayment || 0),
      paymentType,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes,
      status: initialPayment >= totalAmount ? 'paid' : initialPayment > 0 ? 'partial' : 'draft'
    });

    await invoice.populate('customer', 'name email companyName gstin');
    await invoice.populate('vendor', 'name companyName gstin');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// @desc    Add payment to invoice
// @route   POST /api/invoices/:id/payment
// @access  Private
exports.addPayment = async (req, res) => {
  try {
    const { amount, method, transactionId, notes } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Add payment record
    invoice.payments.push({
      amount,
      method,
      transactionId,
      notes,
      date: new Date()
    });

    // Update paid amount
    invoice.paidAmount += amount;
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    // Update status
    if (invoice.balanceAmount <= 0) {
      invoice.status = 'paid';
      invoice.balanceAmount = 0;
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'partial';
    }

    invoice.updatedAt = Date.now();
    await invoice.save();

    // Update order payment status - try both models
    try {
      const orderUpdate = await Order.findByIdAndUpdate(invoice.order, {
        paymentStatus: invoice.status === 'paid' ? 'paid' : 'partial'
      });
      
      if (!orderUpdate) {
        await SaleOrder.findByIdAndUpdate(invoice.order, {
          paymentStatus: invoice.status === 'paid' ? 'paid' : 'partial'
        });
      }
    } catch (err) {
      console.error('Error updating order payment status:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording payment'
    });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private (Vendor/Admin)
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (req.user.role === 'vendor' && invoice.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    invoice.status = status;
    invoice.updatedAt = Date.now();
    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice status updated successfully',
      invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating invoice status'
    });
  }
};
