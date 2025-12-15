const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (Employee)
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, documents } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range'
      });
    }

    // Create leave application
    const leave = await Leave.create({
      employeeId: employee._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      documents
    });

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Apply Leave',
      module: 'leave',
      details: `Applied for ${leaveType} leave (${totalDays} days)`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error applying for leave'
    });
  }
};

// @desc    Get my leaves
// @route   GET /api/leaves/my-leaves
// @access  Private (Employee)
exports.getMyLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    let query = { employeeId: employee._id };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const leaves = await Leave.find(query)
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      leaves
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaves'
    });
  }
};

// @desc    Get all leaves (Admin)
// @route   GET /api/leaves
// @access  Private (Admin)
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, leaveType, employeeId, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (leaveType) {
      query.leaveType = leaveType;
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const leaves = await Leave.find(query)
      .populate({
        path: 'employeeId',
        select: 'employeeId position userId',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      leaves
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaves'
    });
  }
};

// @desc    Update leave status (Admin)
// @route   PUT /api/leaves/:id
// @access  Private (Admin)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, approvalNotes } = req.body;

    const leave = await Leave.findById(req.params.id)
      .populate('employeeId');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave has already been processed'
      });
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    leave.approvalDate = new Date();
    leave.approvalNotes = approvalNotes;

    await leave.save();

    // Create notification for employee
    await Notification.create({
      userId: leave.employeeId.userId,
      title: `Leave ${status}`,
      message: `Your leave application has been ${status}`,
      type: status === 'approved' ? 'success' : 'warning',
      category: 'leave',
      link: `/leaves/${leave._id}`
    });

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: `${status} Leave`,
      module: 'leave',
      details: `${status} leave application for employee ${leave.employeeId.employeeId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      leave
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating leave status'
    });
  }
};

// @desc    Cancel leave
// @route   DELETE /api/leaves/:id
// @access  Private (Employee)
exports.cancelLeave = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Check ownership
    if (leave.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending leave applications'
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Cancel Leave',
      module: 'leave',
      details: 'Cancelled leave application',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Leave cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling leave'
    });
  }
};
