const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getAllDepartments = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;

    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const departments = await Department.find(query)
      .populate('managerId', 'employeeId position userId')
      .populate({
        path: 'managerId',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Department.countDocuments(query);

    res.status(200).json({
      success: true,
      count: departments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching departments'
    });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, managerId } = req.body;

    // Check if code already exists
    const existing = await Department.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists'
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      managerId
    });

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Create Department',
      module: 'department',
      details: `Created department: ${name} (${code})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating department'
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
exports.updateDepartment = async (req, res) => {
  try {
    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('managerId', 'employeeId position');

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Update Department',
      module: 'department',
      details: `Updated department: ${department.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating department'
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await department.deleteOne();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Delete Department',
      module: 'department',
      details: `Deleted department: ${department.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting department'
    });
  }
};
