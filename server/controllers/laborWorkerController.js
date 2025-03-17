const { LaborWorker } = require('../models');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/worker-photos/') // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
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

        if (company_id) {
            whereClause.company_id = company_id;
        }
        if (status) {
            whereClause.status = status;
        }

        const order = sort ? [[sort, 'DESC']] : [['created_at', 'DESC']];

        const workers = await LaborWorker.findAll({
            where: whereClause,
            order: order,
        });
        res.json(workers);
    } catch (err) {
        console.error('Error fetching workers:', err);
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
};

exports.createWorker = [
    upload.single('photo'),
    async (req, res) => {
        try {
            const workerData = {
                ...req.body,
                photo_url: req.file ? req.file.path : null,
                company_id: req.user.company_id
            };

            const worker = await LaborWorker.create(workerData);
            res.status(201).json(worker);
        } catch (err) {
            console.error('Error creating worker:', err);
            res.status(500).json({ error: 'Failed to create worker' });
        }
    }
];

exports.updateLaborWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const { company_id, name, bank_id, account_number, worker_id, status } = req.body;
        const worker = await LaborWorker.findByPk(id);
        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }
        await worker.update({
            company_id: company_id || worker.company_id,
            name: name || worker.name,
            bank_id: bank_id || worker.bank_id,
            account_number: account_number || worker.account_number,
            worker_id: worker_id || worker.worker_id,
            status: status || worker.status,
        });
        res.json(worker);
    } catch (err) {
        console.error('Error updating worker:', err);
        res.status(500).json({ error: 'Failed to update worker' });
    }
};

exports.deleteLaborWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const worker = await LaborWorker.findByPk(id);
        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }
        await worker.destroy();
        res.status(204).json({ message: 'Worker deleted' });
    } catch (err) {
        console.error('Error deleting worker:', err);
        res.status(500).json({ error: 'Failed to delete worker' });
    }
};