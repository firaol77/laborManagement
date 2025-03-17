const { PayrollRule, WorkLog, LaborWorker } = require('../models');
const { Op } = require('sequelize');

exports.getPayrollRules = async (req, res) => {
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
};

exports.updatePayrollRules = async (req, res) => {
    try {
        const { standard_working_hours, daily_rate, overtime_rate } = req.body;
        
        const [rules, created] = await PayrollRule.findOrCreate({
            where: { company_id: req.user.company_id },
            defaults: {
                standard_working_hours,
                daily_rate,
                overtime_rate,
                created_at: new Date()
            }
        });

        if (!created) {
            await rules.update({
                standard_working_hours,
                daily_rate,
                overtime_rate,
                updated_at: new Date()
            });
        }

        res.json(rules);
    } catch (err) {
        console.error('Error updating payroll rules:', err);
        res.status(500).json({ error: 'Failed to update payroll rules' });
    }
};

exports.calculateSalary = async (req, res) => {
    try {
        const { worker_id, start_date, end_date } = req.query;
        
        // Get payroll rules
        const rules = await PayrollRule.findOne({
            where: { company_id: req.user.company_id }
        });

        if (!rules) {
            return res.status(400).json({ error: 'Payroll rules not set' });
        }

        // Get work logs for the period
        const workLogs = await WorkLog.findAll({
            where: {
                worker_id,
                date: {
                    [Op.between]: [start_date, end_date]
                }
            }
        });

        // Calculate salary
        let totalSalary = 0;
        let totalRegularHours = 0;
        let totalOvertimeHours = 0;

        workLogs.forEach(log => {
            // Regular hours calculation
            const regularHours = Math.min(log.hours_worked, rules.standard_working_hours);
            const regularPay = (rules.daily_rate / rules.standard_working_hours) * regularHours;
            
            // Overtime calculation
            const overtimeHours = Math.max(0, log.hours_worked - rules.standard_working_hours);
            const overtimePay = overtimeHours * rules.overtime_rate;

            totalRegularHours += regularHours;
            totalOvertimeHours += overtimeHours;
            totalSalary += regularPay + overtimePay;
        });

        res.json({
            worker_id,
            period: { start_date, end_date },
            total_regular_hours: totalRegularHours,
            total_overtime_hours: totalOvertimeHours,
            total_salary: totalSalary,
            details: {
                daily_rate: rules.daily_rate,
                overtime_rate: rules.overtime_rate,
                standard_working_hours: rules.standard_working_hours
            }
        });
    } catch (err) {
        console.error('Error calculating salary:', err);
        res.status(500).json({ error: 'Failed to calculate salary' });
    }
};