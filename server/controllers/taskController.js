const Task = require('../models/Task');
const Employee = require('../models/Employee');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin)
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      category,
      estimatedHours,
      tags
    } = req.body;

    // Validate assigned employee
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      dueDate,
      priority: priority || 'medium',
      category,
      estimatedHours,
      tags
    });

    // Create notification for employee
    await Notification.create({
      userId: employee.userId,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      type: 'info',
      category: 'task',
      link: `/tasks/${task._id}`
    });

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Create Task',
      module: 'task',
      details: `Created task: ${title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const populatedTask = await Task.findById(task._id)
      .populate({
        path: 'assignedTo',
        select: 'employeeId position userId',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('assignedBy', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getAllTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      category,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (employee) {
        query.assignedTo = employee._id;
      }
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'employeeId position userId')
      .populate({
        path: 'assignedTo',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'employeeId position userId')
      .populate({
        path: 'assignedTo',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('assignedBy', 'fullName email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check authorization for employees
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (task.assignedTo._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this task'
        });
      }
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization check
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (task.assignedTo.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this task'
        });
      }

      // Employees can only update certain fields
      const allowedFields = ['status', 'actualHours', 'completionNotes'];
      const updates = Object.keys(req.body);
      const isValidUpdate = updates.every(field => allowedFields.includes(field));

      if (!isValidUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Employees can only update status, actual hours, and completion notes'
        });
      }
    }

    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('assignedTo', 'employeeId position')
      .populate('assignedBy', 'fullName email');

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Update Task',
      module: 'task',
      details: `Updated task: ${task.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Delete Task',
      module: 'task',
      details: `Deleted task: ${task.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/statistics
// @access  Private
exports.getTaskStatistics = async (req, res) => {
  try {
    let matchQuery = {};

    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (employee) {
        matchQuery.assignedTo = employee._id;
      }
    }

    const statistics = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      statistics: statistics[0] || {}
    });
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
};

// @desc    Get my tasks (for employees)
// @route   GET /api/tasks/my-tasks
// @access  Private (Employee)
exports.getMyTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const tasks = await Task.find({ assignedTo: employee._id })
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tasks'
    });
  }
};

// @desc    Update task status (for employees)
// @route   PUT /api/tasks/:id/status
// @access  Private (Employee)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if employee is authorized
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (task.assignedTo.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this task'
        });
      }
    }

    task.status = status;
    if (notes) {
      task.completionNotes = notes;
    }
    
    if (status === 'completed') {
      task.completedAt = Date.now();
    }

    await task.save();

    // Populate task details
    task = await Task.findById(task._id)
      .populate('assignedTo', 'employeeId position')
      .populate('assignedBy', 'fullName email');

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Update Task Status',
      module: 'task',
      details: `Updated task status to ${status}: ${task.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task status'
    });
  }
};
