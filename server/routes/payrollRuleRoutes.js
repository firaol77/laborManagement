const express = require('express');
const router = express.Router();
const { PayrollRule } = require('../models');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const rules = await PayrollRule.findOne({
            where: { company_id: req.user.company_id }
        });
        res.json(rules || {
            standard_working_hours: 8,
            daily_rate: 0,
            overtime_rate: 0
        });
    } catch (err) {
        console.error('Error fetching payroll rules:', err);
        res.status(500).json({ error: 'Failed to fetch payroll rules' });
    }
});

router.post('/', async (req, res) => {
    try {
        const [rules, created] = await PayrollRule.findOrCreate({
            where: { company_id: req.user.company_id },
            defaults: {
                ...req.body,
                company_id: req.user.company_id
            }
        });

        if (!created) {
            await rules.update(req.body);
        }

        res.json(rules);
    } catch (err) {
        console.error('Error updating payroll rules:', err);
        res.status(500).json({ error: 'Failed to update payroll rules' });
    }
});

module.exports = router;