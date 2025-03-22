const express = require('express');
const router = express.Router();
const laborWorkerController = require('../controllers/laborWorkerController');

router.get('/', laborWorkerController.getWorkers); 
router.post('/', laborWorkerController.createWorker); 
router.put('/:id', laborWorkerController.updateLaborWorker);
router.delete('/:id', laborWorkerController.deleteLaborWorker);

module.exports = router;