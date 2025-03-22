const { PayrollRule, WorkLog } = require('../models');
const { Op } = require('sequelize');

exports.getPayrollRules = async (req, res) => {
  try {
    const rules = await PayrollRule.findOne({
      where: { company_id: req.user.company_id },
    });

    if (rules) {
      res.json({
        id: rules.id,
        company_id: rules.company_id,
        standard_working_hours: rules.standard_working_hours,
        daily_rate: Number(rules.daily_rate),
        overtime_rate: Number(rules.overtime_rate),
        created_at: rules.created_at,
        updated_at: rules.updated_at,
      });
    } else {
      res.json({
        standard_working_hours: 8,
        daily_rate: 0,
        overtime_rate: 0,
      });
    }
  } catch (err) {
    console.error('Error fetching payroll rules:', err);
    res.status(500).json({ error: 'Failed to fetch payroll rules', details: err.message });
  }
};

exports.updatePayrollRules = async (req, res) => {
  try {
    const { standard_working_hours, daily_rate, overtime_rate } = req.body;

    const parsedStandardHours = Number(standard_working_hours);
    const parsedDailyRate = Number(daily_rate);
    const parsedOvertimeRate = Number(overtime_rate);

    if (isNaN(parsedStandardHours) || parsedStandardHours < 1 || parsedStandardHours > 24) {
      return res.status(400).json({ error: 'Standard working hours must be a number between 1 and 24' });
    }
    if (isNaN(parsedDailyRate) || parsedDailyRate < 0) {
      return res.status(400).json({ error: 'Daily rate must be a non-negative number' });
    }
    if (isNaN(parsedOvertimeRate) || parsedOvertimeRate < 0) {
      return res.status(400).json({ error: 'Overtime rate must be a non-negative number' });
    }

    // Explicitly find and update or create
    let rules = await PayrollRule.findOne({ where: { company_id: req.user.company_id } });

    if (rules) {
      await rules.update({
        standard_working_hours: parsedStandardHours,
        daily_rate: parsedDailyRate,
        overtime_rate: parsedOvertimeRate,
        updated_at: new Date(),
      });
    } else {
      rules = await PayrollRule.create({
        company_id: req.user.company_id,
        standard_working_hours: parsedStandardHours,
        daily_rate: parsedDailyRate,
        overtime_rate: parsedOvertimeRate,
        created_at: new Date(),
      });
    }

    res.json({
      id: rules.id,
      company_id: rules.company_id,
      standard_working_hours: rules.standard_working_hours,
      daily_rate: Number(rules.daily_rate),
      overtime_rate: Number(rules.overtime_rate),
      created_at: rules.created_at,
      updated_at: rules.updated_at,
    });
  } catch (err) {
    console.error('Error updating payroll rules:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Payroll rules already exist for this company; update failed' });
    } else {
      res.status(500).json({ error: 'Failed to update payroll rules', details: err.message });
    }
  }
};

exports.calculateSalary = async (req, res) => {
  try {
    const { worker_id, start_date, end_date } = req.query;

    if (!worker_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required query parameters: worker_id, start_date, end_date' });
    }

    const rules = await PayrollRule.findOne({
      where: { company_id: req.user.company_id },
    });

    if (!rules) {
      return res.status(400).json({ error: 'Payroll rules not set' });
    }

    const workLogs = await WorkLog.findAll({
      where: {
        worker_id,
        date: {
          [Op.between]: [start_date, end_date],
        },
      },
    });

    let totalSalary = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;

    workLogs.forEach((log) => {
      const regularHours = Math.min(log.hours_worked, rules.standard_working_hours);
      const regularPay = (rules.daily_rate / rules.standard_working_hours) * regularHours;

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
      total_salary: Number(totalSalary.toFixed(2)),
      details: {
        daily_rate: Number(rules.daily_rate),
        overtime_rate: Number(rules.overtime_rate),
        standard_working_hours: rules.standard_working_hours,
      },
    });
  } catch (err) {
    console.error('Error calculating salary:', err);
    res.status(500).json({ error: 'Failed to calculate salary', details: err.message });
  }
};