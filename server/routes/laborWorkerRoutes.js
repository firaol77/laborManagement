const express = require('express');
const router = express.Router();
const laborWorkerController = require('../controllers/laborWorkerController');

router.get('/workers', laborWorkerController.getWorkers);
router.post('/workers', laborWorkerController.createWorker);
router.put('/workers/:id', laborWorkerController.updateLaborWorker); 
router.delete('/workers/:id', laborWorkerController.deleteLaborWorker); 

module.exports = router;