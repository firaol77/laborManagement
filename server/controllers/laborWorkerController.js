const { LaborWorker } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // For async file operations
const logger = require('../utils/logger'); // Assuming logger is set up

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/worker-photos/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

exports.getWorkers = async (req, res) => {
  try {
    const { company_id, status, sort } = req.query;
    let whereClause = {};

    if (company_id) whereClause.company_id = company_id;
    if (status) whereClause.status = status;

    const order = sort ? [[sort, 'DESC']] : [['created_at', 'DESC']];

    const workers = await LaborWorker.findAll({
      where: whereClause,
      order: order
    });
    res.json(workers);
  } catch (err) {
    logger.error('Error fetching workers', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
};

exports.createWorker = [
  upload.single('photo'),
  async (req, res) => {
    try {
      const workerData = {
        company_id: req.user.company_id,
        name: req.body.name,
        bankName: req.body.bankName,
        accountNumber: req.body.accountNumber,
        photo_url: req.file ? req.file.path : null,
        worker_id: req.body.worker_id,
        status: 'active',
        regdate: new Date().toISOString().split('T')[0]
      };

      const worker = await LaborWorker.create(workerData);
      logger.info('Worker created successfully', { worker_id: worker.id });
      res.status(201).json(worker);
    } catch (err) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path); // Cleanup uploaded file on error
          logger.info('Cleaned up uploaded file', { path: req.file.path });
        } catch (unlinkErr) {
          logger.error('Failed to delete uploaded file', { error: unlinkErr.message });
        }
      }
      logger.error('Error creating worker', { error: err.message, stack: err.stack });
      res.status(500).json({ error: 'Failed to create worker', details: err.message });
    }
  }
];

exports.updateLaborWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, name, bankName, accountNumber, worker_id, status } = req.body;
    const worker = await LaborWorker.findByPk(id);
    if (!worker) {
      logger.warn('Worker not found', { id });
      return res.status(404).json({ error: 'Worker not found' });
    }
    await worker.update({
      company_id: company_id || worker.company_id,
      name: name || worker.name,
      bankName: bankName || worker.bankName,
      accountNumber: accountNumber || worker.accountNumber,
      worker_id: worker_id || worker.worker_id,
      status: status || worker.status
    });
    logger.info('Worker updated successfully', { worker_id: id });
    res.json(worker);
  } catch (err) {
    logger.error('Error updating worker', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to update worker', details: err.message });
  }
};

exports.deleteLaborWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await LaborWorker.findByPk(id);
    if (!worker) {
      logger.warn('Worker not found', { id });
      return res.status(404).json({ error: 'Worker not found' });
    }
    await worker.destroy();
    logger.info('Worker deleted successfully', { worker_id: id });
    res.status(204).json({ message: 'Worker deleted' });
  } catch (err) {
    logger.error('Error deleting worker', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to delete worker', details: err.message });
  }
};