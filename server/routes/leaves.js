const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

// Employee routes
router.post('/', protect, authorize('employee'), applyLeave);
router.get('/my-leaves', protect, authorize('employee'), getMyLeaves);
router.delete('/:id', protect, authorize('employee'), cancelLeave);

// Admin routes
router.get('/', protect, authorize('admin'), getAllLeaves);
router.put('/:id', protect, authorize('admin'), updateLeaveStatus);

module.exports = router;
