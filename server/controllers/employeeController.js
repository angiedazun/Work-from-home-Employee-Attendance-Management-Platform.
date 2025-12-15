const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      employeeId,
      department,
      position,
      joiningDate,
      salary,
      address,
      emergencyContact,
      faceData
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if employee ID exists
    const existingEmpId = await Employee.findOne({ employeeId });
    if (existingEmpId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Verify department exists
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Create user account
    const user = await User.create({
      email,
      password,
      fullName,
      phone,
      role: 'employee'
    });

    // Create employee profile
    const employeeData = {
      userId: user._id,
      employeeId,
      department,
      position,
      joiningDate,
      salary,
      address,
      emergencyContact
    };

    // Add face data if provided
    if (faceData) {
      employeeData.faceData = {
        descriptors: faceData.descriptors || [],
        images: faceData.images || [],
        isRegistered: faceData.isRegistered || false,
        lastUpdated: new Date()
      };
    }

    const employee = await Employee.create(employeeData);

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Create Employee',
      module: 'employee',
      details: `Created employee: ${fullName} (${employeeId})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('userId', 'email fullName phone status')
      .populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: populatedEmployee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating employee'
    });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin)
exports.getAllEmployees = async (req, res) => {
  try {
    const {
      department,
      status,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Department filter
    if (department) {
      query.department = department;
    }

    // Status filter
    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let employees = await Employee.find(query)
      .populate('userId', 'email fullName phone status')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-faceData.descriptors');

    // Search filter (post-query due to populated fields)
    if (search) {
      employees = employees.filter(emp =>
        emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        emp.userId.fullName.toLowerCase().includes(search.toLowerCase()) ||
        emp.position.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching employees'
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'email fullName phone status')
      .populate('department', 'name code description')
      .select('-faceData.descriptors');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching employee'
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin)
exports.updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update employee
    employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'email fullName phone status')
      .populate('department', 'name code')
      .select('-faceData.descriptors');

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Update Employee',
      module: 'employee',
      details: `Updated employee: ${employee.employeeId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating employee'
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Delete associated user account
    await User.findByIdAndDelete(employee.userId);

    // Delete employee
    await employee.deleteOne();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Delete Employee',
      module: 'employee',
      details: `Deleted employee: ${employee.employeeId}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'high'
    });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting employee'
    });
  }
};

// @desc    Register employee face data
// @route   POST /api/employees/register-face
// @access  Private (Employee)
exports.registerFace = async (req, res) => {
  try {
    const { descriptors, images } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Update face data
    employee.faceData = {
      descriptors,
      images,
      isRegistered: true,
      lastUpdated: new Date()
    };

    await employee.save();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Register Face',
      module: 'employee',
      details: 'Face recognition data registered',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Face registered successfully'
    });
  } catch (error) {
    console.error('Register face error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error registering face'
    });
  }
};

// @desc    Get employee profile
// @route   GET /api/employees/profile
// @access  Private (Employee)
exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
      .populate('userId', 'email fullName phone status')
      .populate('department', 'name code description')
      .select('-faceData.descriptors');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Get employee face data for verification
// @route   GET /api/employees/face-data
// @access  Private (Employee)
exports.getMyFaceData = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
      .select('faceData');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    if (!employee.faceData || !employee.faceData.isRegistered) {
      return res.status(404).json({
        success: false,
        message: 'Face not registered. Please contact admin.'
      });
    }

    res.status(200).json({
      success: true,
      faceData: {
        descriptors: employee.faceData.descriptors,
        isRegistered: employee.faceData.isRegistered
      }
    });
  } catch (error) {
    console.error('Get face data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching face data'
    });
  }
};

// @desc    Update employee profile
// @route   PUT /api/employees/profile
// @access  Private (Employee)
exports.updateMyProfile = async (req, res) => {
  try {
    const allowedFields = ['address', 'emergencyContact'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const employee = await Employee.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'email fullName phone')
      .populate('department', 'name code')
      .select('-faceData.descriptors');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      employee
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};
