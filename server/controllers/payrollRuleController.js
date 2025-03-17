const { PayrollRule } = require('../models');

exports.getPayrollRules = async (req, res) => {
    try {
        const { company_id, sort } = req.query;
        let whereClause = {};

        if (company_id) {
            whereClause.company_id = company_id;
        }

        const order = sort ? [[sort, 'DESC']] : [['created_at', 'DESC']];

        const payrollRules = await PayrollRule.findAll({
            where: whereClause,
            order: order,
        });
        res.json(payrollRules);
    } catch (err) {
        console.error('Error fetching payroll rules:', err);
        res.status(500).json({ error: 'Failed to fetch payroll rules' });
    }
};

exports.createPayrollRule = async (req, res) => {
    try {
        const { company_id, daily_rate, overtime_rate } = req.body;
        if (!company_id || !daily_rate || !overtime_rate) {
            return res.status(400).json({ error: 'company_id, daily_rate, and overtime_rate are required' });
        }
        const payrollRule = await PayrollRule.create({
            company_id,
            daily_rate,
            overtime_rate,
        });
        res.status(201).json(payrollRule);
    } catch (err) {
        console.error('Error creating payroll rule:', err);
        res.status(500).json({ error: 'Failed to create payroll rule', details: err.message });
    }
};

exports.updatePayrollRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { company_id, daily_rate, overtime_rate } = req.body;
        const payrollRule = await PayrollRule.findByPk(id);
        if (!payrollRule) {
            return res.status(404).json({ error: 'Payroll rule not found' });
        }
        await payrollRule.update({ company_id, daily_rate, overtime_rate });
        res.json(payrollRule);
    } catch (err) {
        console.error('Error updating payroll rule:', err);
        res.status(500).json({ error: 'Failed to update payroll rule' });
    }
};

exports.deletePayrollRule = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRule = await PayrollRule.findByPk(id);
        if (!payrollRule) {
            return res.status(404).json({ error: 'Payroll rule not found' });
        }
        await payrollRule.destroy();
        res.status(204).json({ message: 'Payroll rule deleted' });
    } catch (err) {
        console.error('Error deleting payroll rule:', err);
        res.status(500).json({ error: 'Failed to delete payroll rule' });
    }
};