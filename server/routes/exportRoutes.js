const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

router.get('/payroll', authenticateToken, exportController.exportPayroll);

module.exports = router; 