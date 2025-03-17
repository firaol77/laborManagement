const express = require('express');
const router = express.Router();
const pendingRequestController = require('../controllers/pendingRequestController');
const { authenticateToken, restrictTo } = require('../middleware/auth');

router.post('/', authenticateToken, restrictTo('worker_manager'), pendingRequestController.createRequest);
router.get('/', authenticateToken, restrictTo('company_admin'), pendingRequestController.getPendingRequests);
router.post('/:id', authenticateToken, restrictTo('company_admin'), pendingRequestController.handleRequest);
router.post('/approve-all', authenticateToken, restrictTo('company_admin'), pendingRequestController.approveAllRequests);

module.exports = router; 