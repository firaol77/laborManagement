const express = require('express');
const router = express.Router();
const companyAdminController = require('../controllers/companyAdminController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

router.patch('/company-admins/:id/status', authenticateToken, requireSuperAdmin, companyAdminController.updateAdminStatus);

module.exports = router;