const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  registerFace,
  getMyProfile,
  updateMyProfile,
  getMyFaceData
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

// Employee self-service routes
router.get('/profile', protect, authorize('employee'), getMyProfile);
router.put('/profile', protect, authorize('employee'), updateMyProfile);
router.get('/face-data', protect, authorize('employee'), getMyFaceData);
router.post('/register-face', protect, authorize('employee'), registerFace);

// Admin routes
router.route('/')
  .get(protect, authorize('admin'), getAllEmployees)
  .post(protect, authorize('admin'), createEmployee);

router.route('/:id')
  .get(protect, getEmployee)
  .put(protect, authorize('admin'), updateEmployee)
  .delete(protect, authorize('admin'), deleteEmployee);

module.exports = router;
