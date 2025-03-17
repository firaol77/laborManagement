const express = require('express');
const router = express.Router();
const { LaborWorker } = require('../models');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const workers = await LaborWorker.findAll({
            where: { company_id: req.user.company_id }
        });
        res.json(workers);
    } catch (err) {
        console.error('Error fetching workers:', err);
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
});

router.post('/', async (req, res) => {
    try {
        const worker = await LaborWorker.create({
            ...req.body,
            company_id: req.user.company_id,
            status: 'active'
        });
        res.status(201).json(worker);
    } catch (err) {
        console.error('Error creating worker:', err);
        res.status(500).json({ error: 'Failed to create worker' });
    }
});

module.exports = router; 