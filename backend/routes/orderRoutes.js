const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getMyOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/customer/my-orders', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('vendor', 'admin'), updateOrderStatus);
router.put('/:id/payment', updatePaymentStatus);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
