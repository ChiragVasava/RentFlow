const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateProfile,
  updateUser,
  deleteUser,
  toggleUserStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'vendor'), getAllUsers);
router.get('/:id', protect, getUser);
router.put('/profile', protect, updateProfile);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

module.exports = router;
