const express = require('express');
const router = express.Router();
const {
  getAllQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  confirmQuotation,
  deleteQuotation,
  submitQuotation,
  approveQuotation,
  rejectQuotation,
  convertToOrder,
  counterOffer
} = require('../controllers/quotationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllQuotations);
router.post('/', createQuotation);
router.get('/:id', getQuotation);
router.put('/:id', updateQuotation);
router.put('/:id/confirm', confirmQuotation);
router.put('/:id/submit', submitQuotation);
router.put('/:id/approve', authorize('vendor', 'admin'), approveQuotation);
router.put('/:id/reject', authorize('vendor', 'admin'), rejectQuotation);
router.post('/:id/counter-offer', counterOffer);
router.post('/:id/convert-to-order', authorize('customer', 'admin'), convertToOrder);
router.delete('/:id', deleteQuotation);

module.exports = router;
