const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  getTaskStatistics,
  getMyTasks,
  updateTaskStatus
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.get('/statistics', protect, getTaskStatistics);
router.get('/my-tasks', protect, getMyTasks);

router.route('/')
  .get(protect, getAllTasks)
  .post(protect, authorize('admin'), createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, authorize('admin'), deleteTask);

router.put('/:id/status', protect, updateTaskStatus);

module.exports = router;
