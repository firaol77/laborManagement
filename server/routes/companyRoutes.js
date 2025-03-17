const express = require('express');
const router = express.Router();
const { Company } = require('../models');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Protect all routes with authentication
router.use(authenticateToken);

// Protect all routes with super admin check
router.use(requireSuperAdmin);

// Get all companies
router.get('/', async (req, res) => {
    try {
        const companies = await Company.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(companies);
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Create new company
router.post('/', async (req, res) => {
    try {
        const company = await Company.create({
            ...req.body,
            created_at: new Date()
        });
        res.status(201).json(company);
    } catch (err) {
        console.error('Error creating company:', err);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

// Update company status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Prevent deactivation of Super Admin company
        if (id === '1') {
            return res.status(403).json({
                error: 'Super Admin Company cannot be deactivated'
            });
        }

        const company = await Company.findByPk(id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Update status
        company.status = status;
        await company.save();

        res.json({ message: 'Company status updated successfully', company });
    } catch (err) {
        console.error('Error updating company status:', err);
        res.status(500).json({ error: 'Failed to update company status' });
    }
});

// Other company routes...

module.exports = router;