const express = require('express');
const router = express.Router();
const workLogController = require('../controllers/workLogController');

router.get('/work-logs', workLogController.getWorkLogs);
router.post('/work-logs', workLogController.createWorkLog);
router.put('/work-logs/:id', workLogController.updateWorkLog); 
router.delete('/work-logs/:id', workLogController.deleteWorkLog); 
router.get('/work-logs/export', workLogController.exportWorkLogs);

module.exports = router;