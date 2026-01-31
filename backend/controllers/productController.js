const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      isPublished, 
      category, 
      vendor, 
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Filters
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    if (category) {
      query.category = category;
    }

    if (vendor) {
      query.vendor = vendor;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // For non-authenticated users and customers, only show published products
    if (!req.user || (req.user && req.user.role === 'customer')) {
      query.isPublished = true;
    }

    // If vendor is logged in, show only their products (both published and unpublished)
    // Admin can see all products regardless of publish status
    if (req.user && req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    console.log('Product query:', query);
    console.log('User:', req.user ? { id: req.user.id, role: req.user.role } : 'Not authenticated');

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('vendor', 'name companyName')
      .sort({ [sortBy]: sortOrder })
      .limit(parseInt(limit))
      .skip(skip);

    console.log(`Found ${products.length} products for query`);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name companyName email phone');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Vendor/Admin)
exports.createProduct = async (req, res) => {
  try {
    // Set vendor to logged in user if not admin
    if (req.user.role === 'vendor') {
      req.body.vendor = req.user.id;
    }

    console.log('Creating product with data:', {
      name: req.body.name,
      vendor: req.body.vendor,
      createdBy: req.user.id
    });

    const product = await Product.create(req.body);

    console.log('Product created successfully:', product._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor/Admin)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership (vendor can only update their own products)
    if (req.user.role === 'vendor' && product.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    req.body.updatedAt = Date.now();
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor/Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role === 'vendor' && product.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
};

// @desc    Check product availability
// @route   POST /api/products/:id/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { quantity, startDate, endDate } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const isAvailable = product.checkAvailability(quantity, startDate, endDate);

    res.status(200).json({
      success: true,
      isAvailable,
      product: {
        name: product.name,
        quantityOnHand: product.quantityOnHand
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking availability'
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories/list
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};
