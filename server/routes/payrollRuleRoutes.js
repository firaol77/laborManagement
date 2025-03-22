const express = require('express');
const { PayrollRule } = require('../models');
const { authenticateToken, restrictTo } = require('../middleware/auth'); // Use restrictTo instead of checkRole

const router = express.Router();

// Fetch payroll rules
router.get('/', authenticateToken, restrictTo('company_admin','worker_manager'), async (req, res) => {
  try {
    const rule = await PayrollRule.findOne({ where: { company_id: req.user.company_id } });
    if (!rule) {
      return res.json({ standard_working_hours: 8, daily_rate: 0, overtime_rate: 0 });
    }
    // Ensure numeric values
    res.json({
      standard_working_hours: Number(rule.standard_working_hours),
      daily_rate: Number(rule.daily_rate),
      overtime_rate: Number(rule.overtime_rate),
    });
  } catch (error) {
    console.error('Error fetching payroll rule:', error);
    res.status(500).json({ error: 'Failed to fetch payroll rules' });
  }
});

// Update or create payroll rules
router.post('/', authenticateToken, restrictTo('company_admin'), async (req, res) => {
  const { standard_working_hours, daily_rate, overtime_rate } = req.body;
  try {
    const existingRule = await PayrollRule.findOne({ where: { company_id: req.user.company_id } });
    const numericData = {
      standard_working_hours: Number(standard_working_hours),
      daily_rate: Number(daily_rate),
      overtime_rate: Number(overtime_rate),
    };
    if (existingRule) {
      await existingRule.update(numericData);
      res.status(200).json(numericData);
    } else {
      const newRule = await PayrollRule.create({
        company_id: req.user.company_id,
        ...numericData,
      });
      res.status(201).json(numericData);
    }
  } catch (error) {
    console.error('Error updating payroll rule:', error);
    res.status(500).json({ error: 'Failed to update payroll rules' });
  }
});

module.exports = router;