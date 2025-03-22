const express = require('express');
const router = express.Router();
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { CompanyAdmin } = require('../models'); // Fixed import
const bcrypt = require('bcrypt');

router.post('/', authenticateToken, restrictTo('company_admin'), async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const workerManager = await CompanyAdmin.create({
            username,
            password: hashedPassword,
            role: 'worker_manager',
            company_id: req.user.company_id,
            created_by: req.user.id,
            status: 'active',
        });
        res.status(201).json({ message: 'Worker Manager created successfully', workerManager });
    } catch (err) {
        console.error('Error creating Worker Manager:', err);
        res.status(500).json({ error: 'Failed to create Worker Manager', details: err.message });
    }
});

router.get('/', authenticateToken, restrictTo('company_admin'), async (req, res) => {
    try {
        const workerManagers = await CompanyAdmin.findAll({
            where: {
                role: 'worker_manager',
                company_id: req.user.company_id,
                created_by: req.user.id,
            },
        });
        res.json(workerManagers);
    } catch (err) {
        console.error('Error fetching Worker Managers:', err);
        res.status(500).json({ error: 'Failed to fetch Worker Managers', details: err.message });
    }
});

router.patch('/:id/status', authenticateToken, restrictTo('company_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        const workerManager = await CompanyAdmin.findOne({
            where: {
                id,
                role: 'worker_manager',
                company_id: req.user.company_id,
                created_by: req.user.id,
            },
        });
        if (!workerManager) {
            return res.status(404).json({ error: 'Worker Manager not found' });
        }
        workerManager.status = status;
        await workerManager.save();
        res.json({ message: `Worker Manager status updated to ${status}` });
    } catch (err) {
        console.error('Error updating Worker Manager status:', err);
        res.status(500).json({ error: 'Failed to update Worker Manager status' });
    }
});

module.exports = router;