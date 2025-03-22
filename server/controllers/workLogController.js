const { WorkLog, LaborWorker, PayrollRule } = require('../models');
const ExcelJS = require('exceljs');

exports.getWorkLogs = async (req, res) => {
    try {
        const { worker_id, sort } = req.query;
        let whereClause = {};
        
        if (worker_id) {
            whereClause.worker_id = worker_id;
        }

        const order = sort ? [[sort, 'DESC']] : [['created_at', 'DESC']];

        const workLogs = await WorkLog.findAll({
            where: whereClause,
            order: order,
        });
        res.json(workLogs);
    } catch (err) {
        console.error('Error fetching work logs:', err);
        res.status(500).json({ error: 'Failed to fetch work logs' });
    }
};

exports.createWorkLog = async (req, res) => {
    try {
      const { worker_id, date, hours_worked, overtime_hours } = req.body;
      if (!worker_id || !date || !hours_worked) {
        return res.status(400).json({ error: 'worker_id, date, and hours_worked are required' });
      }
  
      const worker = await LaborWorker.findByPk(worker_id);
      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }
  
      const payrollRule = await PayrollRule.findOne({ where: { company_id: worker.company_id } });
      if (!payrollRule) {
        return res.status(404).json({ error: 'Payroll rules not found for this company' });
      }
  
      const calculated_salary =
        hours_worked * (payrollRule.daily_rate / payrollRule.standard_working_hours) +
        (overtime_hours || 0) * payrollRule.overtime_rate;
  
      const workLog = await WorkLog.create({
        worker_id,
        date,
        hours_worked,
        overtime_hours: overtime_hours || 0,
        calculated_salary,
      });
  
      res.status(201).json(workLog);
    } catch (err) {
      console.error('Error creating work log:', err);
      res.status(500).json({ error: 'Failed to create work log' });
    }
  };

exports.updateWorkLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { worker_id, date, hours_worked, overtime_hours } = req.body;
        const workLog = await WorkLog.findByPk(id);
        if (!workLog) {
            return res.status(404).json({ error: 'Work log not found' });
        }

        const worker = await LaborWorker.findByPk(worker_id || workLog.worker_id);
        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        const payrollRule = await PayrollRule.findOne({ where: { company_id: worker.company_id } });
        if (!payrollRule) {
            return res.status(404).json({ error: 'Payroll rules not found for this company' });
        }

        const calculated_salary = (hours_worked || workLog.hours_worked) * payrollRule.daily_rate + 
                                 ((overtime_hours || workLog.overtime_hours) * payrollRule.overtime_rate);

        await workLog.update({
            worker_id: worker_id || workLog.worker_id,
            date: date || workLog.date,
            hours_worked: hours_worked || workLog.hours_worked,
            overtime_hours: overtime_hours || workLog.overtime_hours,
            calculated_salary,
        });
        res.json(workLog);
    } catch (err) {
        console.error('Error updating work log:', err);
        res.status(500).json({ error: 'Failed to update work log' });
    }
};

exports.deleteWorkLog = async (req, res) => {
    try {
        const { id } = req.params;
        const workLog = await WorkLog.findByPk(id);
        if (!workLog) {
            return res.status(404).json({ error: 'Work log not found' });
        }
        await workLog.destroy();
        res.status(204).json({ message: 'Work log deleted' });
    } catch (err) {
        console.error('Error deleting work log:', err);
        res.status(500).json({ error: 'Failed to delete work log' });
    }
};

exports.exportWorkLogs = async (req, res) => {
    try {
        const { worker_id } = req.query; // Optional: Allow filtering in export
        let whereClause = {};
        if (worker_id) {
            whereClause.worker_id = worker_id;
        }

        const workLogs = await WorkLog.findAll({ where: whereClause });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Work Logs');

        // Define columns for the Excel sheet
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Worker ID', key: 'worker_id', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Hours Worked', key: 'hours_worked', width: 15 },
            { header: 'Overtime Hours', key: 'overtime_hours', width: 15 },
            { header: 'Calculated Salary', key: 'calculated_salary', width: 15 },
            { header: 'Created At', key: 'created_at', width: 20 },
        ];

        // Add rows from the work logs data
        worksheet.addRows(workLogs.map(log => ({
            id: log.id,
            worker_id: log.worker_id,
            date: log.date,
            hours_worked: log.hours_worked,
            overtime_hours: log.overtime_hours,
            calculated_salary: log.calculated_salary,
            created_at: log.created_at,
        })));

        // Set headers to trigger a file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename=work_logs.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error exporting work logs:', err);
        res.status(500).json({ error: 'Failed to export work logs' });
    }
};