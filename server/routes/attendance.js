const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayAttendance,
  getAllAttendance,
  getAttendanceStatistics
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Employee routes
router.post('/check-in', protect, authorize('employee'), checkIn);
router.put('/check-out', protect, authorize('employee'), checkOut);
router.get('/my-attendance', protect, authorize('employee'), getMyAttendance);
router.get('/today', protect, authorize('employee'), getTodayAttendance);

// Admin routes
router.get('/', protect, authorize('admin'), getAllAttendance);
router.get('/statistics', protect, authorize('admin'), getAttendanceStatistics);

module.exports = router;
