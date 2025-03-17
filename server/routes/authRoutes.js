const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const companyAdminController = require('../controllers/companyAdminController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

router.patch('/company-admins/:id/status', authenticateToken, requireSuperAdmin, companyAdminController.updateAdminStatus);


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/create-super-admin', authController.createSuperAdmin);

module.exports = router;