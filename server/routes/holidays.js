const express = require('express');
const router = express.Router();
const {
  getAllHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
} = require('../controllers/holidayController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getAllHolidays)
  .post(protect, authorize('admin'), createHoliday);

router.route('/:id')
  .put(protect, authorize('admin'), updateHoliday)
  .delete(protect, authorize('admin'), deleteHoliday);

module.exports = router;
