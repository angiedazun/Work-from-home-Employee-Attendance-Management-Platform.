const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Admin)
exports.getAllSettings = async (req, res) => {
  try {
    const { category } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    const settings = await Settings.find(query)
      .populate('updatedBy', 'fullName email')
      .sort({ category: 1, key: 1 });

    res.status(200).json({
      success: true,
      count: settings.length,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching settings'
    });
  }
};

// @desc    Update setting
// @route   PUT /api/settings/:id
// @access  Private (Admin)
exports.updateSetting = async (req, res) => {
  try {
    let setting = await Settings.findById(req.params.id);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    if (!setting.isEditable) {
      return res.status(400).json({
        success: false,
        message: 'This setting cannot be edited'
      });
    }

    setting.value = req.body.value;
    setting.updatedBy = req.user.id;
    setting.updatedAt = Date.now();

    await setting.save();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      action: 'Update Setting',
      module: 'settings',
      details: `Updated setting: ${setting.key}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating setting'
    });
  }
};
