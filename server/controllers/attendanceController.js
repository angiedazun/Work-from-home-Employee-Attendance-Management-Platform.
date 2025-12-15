const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');
const { 
  calculateWorkHours, 
  isLate, 
  calculateLateMinutes,
  isEarlyCheckout,
  calculateEarlyMinutes 
} = require('../utils/calculateWorkHours');

// @desc    Check in attendance with face recognition
// @route   POST /api/attendance/check-in
// @access  Private (Employee)
exports.checkIn = async (req, res) => {
  try {
    const { faceData, location } = req.body;

    // Get employee
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Check if face is registered
    if (!employee.faceData.isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Please register your face first'
      });
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Check if today is a working day
    const dayOfWeek = new Date().getDay();
    if (!employee.workSchedule.workingDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: 'Today is not a working day'
      });
    }

    // Check if today is a holiday
    const isHoliday = await Holiday.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      isActive: true
    });

    if (isHoliday) {
      return res.status(400).json({
        success: false,
        message: `Today is a holiday: ${isHoliday.name}`
      });
    }

    const checkInTime = new Date();
    const workStartTime = employee.workSchedule.checkInTime;

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId: employee._id,
      date: today,
      checkInTime: checkInTime,
      checkInFaceData: {
        imageUrl: faceData?.imageUrl,
        confidence: faceData?.confidence,
        location: location
      },
      isLate: isLate(checkInTime, workStartTime),
      lateByMinutes: calculateLateMinutes(checkInTime, workStartTime),
      status: isLate(checkInTime, workStartTime) ? 'late' : 'present'
    });

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Check In',
      module: 'attendance',
      details: `Checked in at ${checkInTime.toLocaleTimeString()}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      attendance: {
        id: attendance._id,
        checkInTime: attendance.checkInTime,
        isLate: attendance.isLate,
        lateByMinutes: attendance.lateByMinutes,
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check in'
    });
  }
};

// @desc    Check out attendance with face recognition
// @route   PUT /api/attendance/check-out
// @access  Private (Employee)
exports.checkOut = async (req, res) => {
  try {
    const { faceData } = req.body;

    // Get employee
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    const checkOutTime = new Date();
    const workEndTime = employee.workSchedule.checkOutTime;

    // Update attendance
    attendance.checkOutTime = checkOutTime;
    attendance.checkOutFaceData = {
      imageUrl: faceData?.imageUrl,
      confidence: faceData?.confidence
    };
    attendance.totalHours = calculateWorkHours(
      attendance.checkInTime, 
      checkOutTime, 
      attendance.breakTime
    );
    attendance.isEarlyCheckout = isEarlyCheckout(checkOutTime, workEndTime);
    attendance.earlyByMinutes = calculateEarlyMinutes(checkOutTime, workEndTime);

    await attendance.save();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Check Out',
      module: 'attendance',
      details: `Checked out at ${checkOutTime.toLocaleTimeString()}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      attendance: {
        id: attendance._id,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        totalHours: attendance.totalHours,
        isEarlyCheckout: attendance.isEarlyCheckout,
        earlyByMinutes: attendance.earlyByMinutes
      }
    });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check out'
    });
  }
};

// @desc    Get my attendance records
// @route   GET /api/attendance/my-attendance
// @access  Private (Employee)
exports.getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    let query = { employeeId: employee._id };

    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      attendance
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance'
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private (Employee)
exports.getTodayAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    res.status(200).json({
      success: true,
      attendance: attendance || null
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching today\'s attendance'
    });
  }
};

// @desc    Get all attendance (Admin)
// @route   GET /api/attendance
// @access  Private (Admin)
exports.getAllAttendance = async (req, res) => {
  try {
    const { 
      employeeId, 
      department, 
      startDate, 
      endDate, 
      status,
      page = 1, 
      limit = 10 
    } = req.query;

    let query = {};

    // Employee filter - search by employee.employeeId (string) not _id
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId: employeeId });
      if (employee) {
        query.employeeId = employee._id;
      } else {
        // No matching employee, return empty result
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          pages: 0,
          attendance: []
        });
      }
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .populate({
        path: 'employeeId',
        select: 'employeeId userId position',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .sort({ date: -1, checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      attendance
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance'
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/statistics
// @access  Private (Admin)
exports.getAttendanceStatistics = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    let matchQuery = {};

    if (employeeId) {
      matchQuery.employeeId = mongoose.Types.ObjectId(employeeId);
    }

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const statistics = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPresent: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          totalLate: {
            $sum: { $cond: ['$isLate', 1, 0] }
          },
          totalAbsent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          totalOnLeave: {
            $sum: { $cond: [{ $eq: ['$status', 'on-leave'] }, 1, 0] }
          },
          averageWorkHours: { $avg: '$totalHours' },
          totalWorkHours: { $sum: '$totalHours' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      statistics: statistics[0] || {}
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
};
