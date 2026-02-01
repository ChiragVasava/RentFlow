const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllSaleOrders,
  getSaleOrder,
  createSaleOrder,
  updateSaleOrderStatus,
  cancelSaleOrder,
  updatePaymentStatus,
  deleteSaleOrder
} = require('../controllers/saleOrderController');

// @route   GET /api/sale-orders
// @desc    Get all sale orders
// @access  Private
router.get('/', protect, getAllSaleOrders);

// @route   POST /api/sale-orders
// @desc    Create new sale order
// @access  Private (Customer, Vendor, Admin)
router.post('/', protect, authorize('customer', 'vendor', 'admin'), createSaleOrder);

// @route   GET /api/sale-orders/:id
// @desc    Get single sale order
// @access  Private
router.get('/:id', protect, getSaleOrder);

// @route   PUT /api/sale-orders/:id/status
// @desc    Update sale order status
// @access  Private
router.put('/:id/status', protect, updateSaleOrderStatus);

// @route   PUT /api/sale-orders/:id/cancel
// @desc    Cancel sale order
// @access  Private
router.put('/:id/cancel', protect, cancelSaleOrder);

// @route   PUT /api/sale-orders/:id/payment
// @desc    Update payment status
// @access  Private
router.put('/:id/payment', protect, updatePaymentStatus);

// @route   DELETE /api/sale-orders/:id
// @desc    Delete sale order
// @access  Private
router.delete('/:id', protect, deleteSaleOrder);

module.exports = router;