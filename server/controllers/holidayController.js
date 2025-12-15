const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Private
exports.getAllHolidays = async (req, res) => {
  try {
    const { year, type, page = 1, limit = 50 } = req.query;

    let query = { isActive: true };

    // Filter by year
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const holidays = await Holiday.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Holiday.countDocuments(query);

    res.status(200).json({
      success: true,
      count: holidays.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      holidays
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching holidays'
    });
  }
};

// @desc    Create holiday
// @route   POST /api/holidays
// @access  Private (Admin)
exports.createHoliday = async (req, res) => {
  try {
    const { name, date, type, description } = req.body;

    const holiday = await Holiday.create({
      name,
      date,
      type,
      description
    });

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Create Holiday',
      module: 'holiday',
      details: `Created holiday: ${name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      holiday
    });
  } catch (error) {
    console.error('Create holiday error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating holiday'
    });
  }
};

// @desc    Update holiday
// @route   PUT /api/holidays/:id
// @access  Private (Admin)
exports.updateHoliday = async (req, res) => {
  try {
    let holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Update Holiday',
      module: 'holiday',
      details: `Updated holiday: ${holiday.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Holiday updated successfully',
      holiday
    });
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating holiday'
    });
  }
};

// @desc    Delete holiday
// @route   DELETE /api/holidays/:id
// @access  Private (Admin)
exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    await holiday.deleteOne();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Delete Holiday',
      module: 'holiday',
      details: `Deleted holiday: ${holiday.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting holiday'
    });
  }
};
