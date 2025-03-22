const express = require('express');
const router = express.Router();
const { Company } = require('../models');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const companyController = require('../controllers/companyController');

router.use(authenticateToken);
router.use(requireSuperAdmin);

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

// Use controller for POST
router.post('/', companyController.createCompany);

router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (id === '1') {
            return res.status(403).json({
                error: 'Super Admin Company cannot be deactivated'
            });
        }
        const company = await Company.findByPk(id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        company.status = status;
        await company.save();
        res.json({ message: 'Company status updated successfully', company });
    } catch (err) {
        console.error('Error updating company status:', err);
        res.status(500).json({ error: 'Failed to update company status' });
    }
});

router.delete('/:id', companyController.deleteCompany);

module.exports = router;