const express = require('express');
const router = express.Router();
const overtimeController = require('../controllers/overtimeController');
const { authenticateToken, restrictTo } = require('../middleware/auth');

router.post('/requests', authenticateToken, restrictTo('worker_manager'), overtimeController.createOvertimeRequest);
router.post('/requests/:request_id/apply', authenticateToken, restrictTo('company_admin'), overtimeController.applyApprovedOvertime);

module.exports = router;