const Quotation = require('../models/Quotation');
const Product = require('../models/Product');
const Order = require('../models/Order');

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

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
exports.getAllQuotations = async (req, res) => {
  try {
    const query = {};
    const { status } = req.query;

    if (status) {
      query.status = status;
    }

    // Customer can only see their quotations
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    // Vendor can see quotations for their products
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const quotations = await Quotation.find(query)
      .populate('customer', 'name email companyName phone')
      .populate('vendor', 'name companyName')
      .populate('items.product', 'name images category')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      quotations
    });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quotations'
    });
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer', 'name email companyName gstin phone address')
      .populate('vendor', 'name email companyName gstin phone address')
      .populate('items.product', 'name images vendor');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check access
    if (
      req.user.role === 'customer' && 
      quotation.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this quotation'
      });
    }

    res.status(200).json({
      success: true,
      quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quotation'
    });
  }
};

// @desc    Create quotation
// @route   POST /api/quotations
// @access  Private (Customer)
exports.createQuotation = async (req, res) => {
  try {
    const { items, notes } = req.body;

    console.log('Creating quotation for user:', req.user.id);
    console.log('Quotation items received:', JSON.stringify(items, null, 2));

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quotation must have at least one item'
      });
    }

    // Validate all items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product) {
        console.error(`Item ${i} missing product ID`);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing product information`
        });
      }
      if (!item.rentalStartDate || !item.rentalEndDate) {
        console.error(`Item ${i} missing rental dates:`, item);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing rental dates`
        });
      }
      if (!item.quantity || item.quantity < 1) {
        console.error(`Item ${i} has invalid quantity:`, item.quantity);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} has invalid quantity`
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const quotationItems = [];
    let vendorId = null;

    for (let item of items) {
      console.log(`Processing item with product ID: ${item.product}`);
      const product = await Product.findById(item.product).populate('vendor');
      
      if (!product) {
        console.error(`Product not found: ${item.product}`);
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      console.log(`Product found: ${product.name}, Vendor: ${product.vendor?._id}`);

      // Set vendor from first product (assuming all products from same vendor)
      if (!vendorId && product.vendor) {
        vendorId = product.vendor._id;
      }

      // Validate dates
      const startDate = new Date(item.rentalStartDate);
      const endDate = new Date(item.rentalEndDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error(`Invalid dates for product ${product.name}:`, item.rentalStartDate, item.rentalEndDate);
        return res.status(400).json({
          success: false,
          message: `Invalid rental dates for product "${product.name}"`
        });
      }

      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: `End date must be after start date for product "${product.name}"`
        });
      }

      // Check availability
      const isAvailable = product.checkAvailability(
        item.quantity,
        item.rentalStartDate,
        item.rentalEndDate
      );

      if (!isAvailable) {
        console.log(`Product ${product.name} not available for dates:`, item.rentalStartDate, item.rentalEndDate);
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is not available for the selected dates`
        });
      }

      // Calculate rental duration and price
      const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      let pricePerUnit = 0;
      let rentalDuration = {};

      if (durationInDays < 1) {
        // Hourly rental
        const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
        pricePerUnit = product.rentalPricing.hourly || 0;
        rentalDuration = { value: hours, unit: 'hour' };
      } else if (durationInDays < 7) {
        // Daily rental
        pricePerUnit = product.rentalPricing.daily || 0;
        rentalDuration = { value: durationInDays, unit: 'day' };
      } else {
        // Weekly rental
        const weeks = Math.ceil(durationInDays / 7);
        pricePerUnit = product.rentalPricing.weekly || 0;
        rentalDuration = { value: weeks, unit: 'week' };
      }

      const totalPrice = pricePerUnit * item.quantity * rentalDuration.value;

      quotationItems.push({
        product: item.product,
        quantity: item.quantity,
        rentalStartDate: item.rentalStartDate,
        rentalEndDate: item.rentalEndDate,
        rentalDuration,
        pricePerUnit,
        totalPrice,
        taxRate: product.taxRate || getTaxRateByCategory(product.category),
        category: product.category
      });

      subtotal += totalPrice;
    }

    // Calculate tax based on individual item categories
    let totalTaxAmount = 0;
    quotationItems.forEach(item => {
      const itemTax = (item.totalPrice * item.taxRate) / 100;
      totalTaxAmount += itemTax;
    });

    // Calculate weighted average tax rate for display
    const effectiveTaxRate = subtotal > 0 ? (totalTaxAmount / subtotal) * 100 : 18;
    const totalAmount = subtotal + totalTaxAmount;

    // Set validity (7 days from now)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);

    console.log('Creating quotation with data:', {
      customer: req.user.id,
      vendor: vendorId,
      itemsCount: quotationItems.length,
      subtotal,
      taxAmount: totalTaxAmount,
      totalAmount
    });

    const quotation = await Quotation.create({
      customer: req.user.id,
      vendor: vendorId,
      items: quotationItems,
      subtotal,
      taxRate: effectiveTaxRate,
      taxAmount: totalTaxAmount,
      totalAmount,
      notes,
      validUntil,
      status: 'draft'
    });

    await quotation.populate('customer', 'name email companyName');
    await quotation.populate('vendor', 'name companyName');
    await quotation.populate('items.product', 'name images vendor');

    console.log('Quotation created successfully:', quotation.quotationNumber);

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      quotation
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating quotation',
      error: error.message
    });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
exports.updateQuotation = async (req, res) => {
  try {
    let quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Only customer who created it can update
    if (quotation.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quotation'
      });
    }

    // Can only update if status is draft
    if (quotation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft quotations can be updated'
      });
    }

    req.body.updatedAt = Date.now();
    quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('customer', 'name email').populate('items.product', 'name');

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating quotation'
    });
  }
};

// @desc    Confirm quotation (convert to order)
// @route   PUT /api/quotations/:id/confirm
// @access  Private (Customer)
exports.confirmQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

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

    if (quotation.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Quotation already confirmed'
      });
    }

    // Check if quotation is still valid
    if (new Date() > quotation.validUntil) {
      quotation.status = 'expired';
      await quotation.save();
      return res.status(400).json({
        success: false,
        message: 'Quotation has expired'
      });
    }

    quotation.status = 'confirmed';
    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation confirmed successfully. Please proceed to create an order.',
      quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirming quotation'
    });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Can only delete draft quotations
    if (quotation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft quotations can be deleted'
      });
    }

    await quotation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting quotation'
    });
  }
};

// @desc    Submit quotation for vendor review
// @route   PUT /api/quotations/:id/submit
// @access  Private (Customer)
exports.submitQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

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

    if (quotation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft quotations can be submitted'
      });
    }

    // Check if quotation is still valid
    if (new Date() > quotation.validUntil) {
      quotation.status = 'expired';
      await quotation.save();
      return res.status(400).json({
        success: false,
        message: 'Quotation has expired'
      });
    }

    quotation.status = 'pending';
    quotation.updatedAt = Date.now();
    await quotation.save();

    await quotation.populate('customer', 'name email companyName phone');
    await quotation.populate('vendor', 'name companyName');
    await quotation.populate('items.product', 'name images category');

    res.status(200).json({
      success: true,
      message: 'Quotation submitted successfully. Waiting for vendor approval.',
      quotation
    });
  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quotation'
    });
  }
};

// @desc    Approve quotation (vendor)
// @route   PUT /api/quotations/:id/approve
// @access  Private (Vendor)
exports.approveQuotation = async (req, res) => {
  try {
    const { vendorNotes, adjustedPricing } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check if user is authorized (vendor, customer who can accept counter-offer, or admin)
    const isVendor = quotation.vendor && quotation.vendor.toString() === req.user.id;
    const isCustomer = quotation.customer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // Customers can only approve if there are counter offers (accepting a counter offer)
    if (!isVendor && !isAdmin && !(isCustomer && quotation.counterOffers && quotation.counterOffers.length > 0)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this quotation'
      });
    }

    if (quotation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending quotations can be approved'
      });
    }

    // Verify product availability again
    for (let item of quotation.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

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

    quotation.status = 'approved';
    quotation.approvedAt = Date.now();
    quotation.approvedBy = req.user.id;
    
    // Only save vendor notes if approved by vendor
    if (isVendor || isAdmin) {
      quotation.vendorNotes = vendorNotes;
      quotation.vendorAdjustedPricing = adjustedPricing || [];
    }
    
    quotation.updatedAt = Date.now();

    await quotation.save();

    await quotation.populate('customer', 'name email companyName phone');
    await quotation.populate('vendor', 'name companyName');
    await quotation.populate('items.product', 'name images category');
    await quotation.populate('approvedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Quotation approved successfully. Customer can now proceed with payment.',
      quotation
    });
  } catch (error) {
    console.error('Approve quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving quotation'
    });
  }
};

// @desc    Reject quotation (vendor)
// @route   PUT /api/quotations/:id/reject
// @access  Private (Vendor)
exports.rejectQuotation = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check if user is the vendor for this quotation
    if (quotation.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this quotation'
      });
    }

    if (quotation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending quotations can be rejected'
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    quotation.status = 'rejected';
    quotation.rejectedAt = Date.now();
    quotation.rejectionReason = rejectionReason;
    quotation.updatedAt = Date.now();

    await quotation.save();

    await quotation.populate('customer', 'name email companyName phone');
    await quotation.populate('vendor', 'name companyName');
    await quotation.populate('items.product', 'name images category');

    res.status(200).json({
      success: true,
      message: 'Quotation rejected',
      quotation
    });
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting quotation'
    });
  }
};

// @desc    Convert approved quotation to order
// @route   POST /api/quotations/:id/convert-to-order
// @desc    Convert quotation to order
// @route   POST /api/quotations/:id/convert-to-order
// @access  Private (Customer)
exports.convertToOrder = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
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
        message: 'Not authorized to convert this quotation'
      });
    }

    if (quotation.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved quotations can be converted to orders'
      });
    }

    if (quotation.convertedToOrder) {
      return res.status(400).json({
        success: false,
        message: 'Quotation already converted to order'
      });
    }

    // Generate unique order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Create order from quotation
    const order = await Order.create({
      orderNumber,
      quotation: quotation._id,
      customer: quotation.customer,
      vendor: quotation.vendor,
      items: quotation.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        rentalStartDate: item.rentalStartDate,
        rentalEndDate: item.rentalEndDate,
        rentalDuration: item.rentalDuration,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.totalPrice,
        status: 'pending'
      })),
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      shippingAddress: quotation.shippingAddress,
      status: 'confirmed',
      paymentStatus: 'pending',
      notes: `Created from quotation ${quotation.quotationNumber}`
    });

    // Reserve inventory for each product
    for (let item of quotation.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.reservations.push({
          orderId: order._id,
          quantity: item.quantity,
          startDate: item.rentalStartDate,
          endDate: item.rentalEndDate
        });
        await product.save();
      }
    }

    // Update quotation status
    quotation.status = 'converted';
    quotation.convertedToOrder = order._id;
    await quotation.save();

    // Populate order details for response
    await order.populate('customer', 'name email companyName phone address');
    await order.populate('vendor', 'name companyName');
    await order.populate('items.product', 'name images category');

    res.status(201).json({
      success: true,
      message: 'Order created successfully from quotation',
      order
    });
  } catch (error) {
    console.error('Convert to order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error converting quotation to order',
      error: error.message
    });
  }
};

// @desc    Submit counter offer
// @route   POST /api/quotations/:id/counter-offer
// @access  Private (Customer or Vendor)
exports.counterOffer = async (req, res) => {
  try {
    const { items, notes } = req.body;
    
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer', 'name email companyName')
      .populate('vendor', 'name email companyName')
      .populate('items.product');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check authorization
    const isCustomer = quotation.customer._id.toString() === req.user.id;
    const isVendor = quotation.vendor && quotation.vendor._id.toString() === req.user.id;
    
    if (!isCustomer && !isVendor && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to make counter offer'
      });
    }

    // Can only counter-offer if status is pending or if there are existing counter offers
    if (quotation.status !== 'pending' && quotation.counterOffers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Can only counter-offer on pending quotations'
      });
    }

    // Calculate new pricing
    let subtotal = 0;
    const updatedItems = quotation.items.map((originalItem, index) => {
      const counterItem = items.find(i => i.productId === originalItem.product._id.toString());
      const pricePerUnit = counterItem ? counterItem.adjustedPrice : originalItem.pricePerUnit;
      const totalPrice = pricePerUnit * originalItem.quantity;
      subtotal += totalPrice;
      
      return {
        product: originalItem.product._id,
        pricePerUnit,
        totalPrice
      };
    });

    const taxAmount = (subtotal * quotation.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Add counter offer to history
    quotation.counterOffers.push({
      offeredBy: req.user.id,
      offeredByRole: req.user.role,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
      notes: notes || ''
    });

    // Update quotation items with new pricing
    quotation.items = quotation.items.map((item, index) => {
      const updatedItem = updatedItems[index];
      return {
        ...item.toObject(),
        pricePerUnit: updatedItem.pricePerUnit,
        totalPrice: updatedItem.totalPrice
      };
    });

    quotation.subtotal = subtotal;
    quotation.taxAmount = taxAmount;
    quotation.totalAmount = totalAmount;
    quotation.status = 'pending'; // Keep as pending for other party to respond
    quotation.updatedAt = Date.now();

    await quotation.save();
    await quotation.populate('counterOffers.offeredBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Counter offer submitted successfully',
      quotation
    });
  } catch (error) {
    console.error('Counter offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting counter offer',
      error: error.message
    });
  }
};

