const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getAuditLogs);

module.exports = router;
