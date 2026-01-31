const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  checkAvailability,
  getCategories
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/categories/list', getCategories);
router.get('/:id', getProduct);
router.post('/:id/check-availability', checkAvailability);

// Protected routes - vendor specific
router.get('/vendor/my-products', protect, authorize('vendor'), async (req, res) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find({ vendor: req.user.id })
      .populate('vendor', 'name companyName')
      .sort({ createdAt: -1 });
    
    console.log(`Vendor ${req.user.id} has ${products.length} products`);
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// General products route (must be after specific routes)
router.get('/', getAllProducts);

router.post('/', protect, authorize('vendor', 'admin'), createProduct);
router.put('/:id', protect, authorize('vendor', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('vendor', 'admin'), deleteProduct);

module.exports = router;
