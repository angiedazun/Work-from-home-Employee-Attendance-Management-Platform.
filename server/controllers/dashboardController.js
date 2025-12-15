const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Leave = require('../models/Leave');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin dashboard statistics
      const totalEmployees = await Employee.countDocuments({ isActive: true });
      const totalDepartments = await require('../models/Department').countDocuments({ isActive: true });

      // Today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAttendance = await Attendance.countDocuments({
        date: today,
        status: { $in: ['present', 'late'] }
      });

      const lateToday = await Attendance.countDocuments({
        date: today,
        isLate: true
      });

      const absentToday = totalEmployees - todayAttendance;

      // Tasks statistics
      const pendingTasks = await Task.countDocuments({ status: 'pending' });
      const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
      const overdueTasks = await Task.countDocuments({ status: 'overdue' });

      // Leave statistics
      const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
      const approvedLeaves = await Leave.countDocuments({ 
        status: 'approved',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      res.status(200).json({
        success: true,
        statistics: {
          employees: {
            total: totalEmployees,
            present: todayAttendance,
            late: lateToday,
            absent: absentToday
          },
          departments: totalDepartments,
          tasks: {
            pending: pendingTasks,
            inProgress: inProgressTasks,
            overdue: overdueTasks
          },
          leaves: {
            pending: pendingLeaves,
            onLeave: approvedLeaves
          }
        }
      });
    } else {
      // Employee dashboard statistics
      const employee = await Employee.findOne({ userId: req.user.id });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      // Today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAttendance = await Attendance.findOne({
        employeeId: employee._id,
        date: today
      });

      // This month's attendance
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthAttendance = await Attendance.countDocuments({
        employeeId: employee._id,
        date: { $gte: startOfMonth },
        status: { $in: ['present', 'late'] }
      });

      // My tasks
      const myPendingTasks = await Task.countDocuments({
        assignedTo: employee._id,
        status: 'pending'
      });

      const myInProgressTasks = await Task.countDocuments({
        assignedTo: employee._id,
        status: 'in-progress'
      });

      const myCompletedTasks = await Task.countDocuments({
        assignedTo: employee._id,
        status: 'completed'
      });

      // My leaves
      const myPendingLeaves = await Leave.countDocuments({
        employeeId: employee._id,
        status: 'pending'
      });

      res.status(200).json({
        success: true,
        statistics: {
          attendance: {
            today: todayAttendance,
            thisMonth: monthAttendance
          },
          tasks: {
            pending: myPendingTasks,
            inProgress: myInProgressTasks,
            completed: myCompletedTasks
          },
          leaves: {
            pending: myPendingLeaves
          }
        }
      });
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics'
    });
  }
};
