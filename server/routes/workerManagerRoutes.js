const express = require('express');
const router = express.Router();
const workerManagerController = require('../controllers/workerManagerController');
const { authenticateToken, restrictTo } = require('../middleware/auth');

router.post('/', authenticateToken, restrictTo('company_admin'), workerManagerController.createWorkerManager);
router.get('/me', authenticateToken, restrictTo('worker_manager'), workerManagerController.getWorkerManagerDetails);

module.exports = router; 