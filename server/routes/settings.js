const express = require('express');
const router = express.Router();
const {
  getAllSettings,
  updateSetting
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getAllSettings);
router.put('/:id', protect, authorize('admin'), updateSetting);

module.exports = router;
