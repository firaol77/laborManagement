const express = require('express');
const path = require('path');
const multer = require('multer');
const { Sequelize } = require('sequelize');
const { LaborWorker, PendingRequest, WorkLog, PayrollRule } = require('../models');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const db = require('../config/database');
const fs = require('fs').promises;

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `photo-${timestamp}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Create a new worker
router.post('/', authenticateToken, restrictTo('company_admin'), upload.single('photo'), async (req, res) => {
  const { name, bankName, accountNumber } = req.body;
  try {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const worker = await LaborWorker.create({
      name,
      bankname: bankName,
      accountnumber: accountNumber,
      photo_url: photoUrl,
      company_id: req.user.company_id,
      status: 'active',
    });
    res.status(201).json(worker);
  } catch (error) {
    console.error('Error creating worker:', error);
    if (req.file) {
      try {
        await fs.unlink(path.join(uploadDir, req.file.filename));
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Failed to create worker' });
  }
});

// Fetch all workers for the authenticated user's company
router.get('/', authenticateToken, restrictTo('company_admin', 'worker_manager'), async (req, res) => {
  try {
    const workers = await LaborWorker.findAll({
      where: { company_id: req.user.company_id },
      attributes: ['id', 'name', 'status', 'overtime_hours', 'photo_url', 'bankname', 'accountnumber'],
    });

    const payrollRules = await PayrollRule.findOne({ where: { company_id: req.user.company_id } });
    const workersWithRates = workers.map(worker => ({
      ...worker.toJSON(),
      bank_name: worker.bankname, // Add for frontend
      account_number: worker.accountnumber, // Add for frontend
      daily_rate: payrollRules ? Number(payrollRules.daily_rate) || 0 : 0, // Ensure number
      overtime_rate: payrollRules ? Number(payrollRules.overtime_rate) || 0 : 0, // Ensure number
    }));

    res.json(workersWithRates);
  } catch (err) {
    console.error('Error fetching workers:', err);
    res.status(500).json({ error: 'Failed to fetch workers', details: err.message });
  }
});

// Toggle worker status
router.patch('/:id/status', authenticateToken, restrictTo('company_admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const worker = await LaborWorker.findOne({
      where: { id: req.params.id, company_id: req.user.company_id },
    });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    await worker.update({ status });
    res.json({ message: `Worker ${status} successfully` });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

// Delete a worker
router.delete('/:id', authenticateToken, restrictTo('company_admin'), async (req, res) => {
  const transaction = await db.transaction();
  try {
    const worker = await LaborWorker.findOne({
      where: { id: req.params.id, company_id: req.user.company_id },
    });
    if (!worker) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Worker not found' });
    }

    await WorkLog.destroy({ where: { worker_id: req.params.id }, transaction });
    await PendingRequest.destroy({ where: { worker_id: req.params.id }, transaction });
    await worker.destroy({ transaction });

    await transaction.commit();
    res.json({ message: 'Worker and related data deleted successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Delete worker error:', err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Cannot delete worker due to existing references' });
    } else {
      res.status(500).json({ error: 'Failed to delete worker', details: err.message });
    }
  }
});

// Calculate payroll for active workers
router.get('/payroll', authenticateToken, restrictTo('company_admin', 'worker_manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const workers = await LaborWorker.findAll({
      where: { company_id: req.user.company_id, status: 'active' },
      include: [{
        model: WorkLog,
        as: 'workLogs',
        where: { date: { [Sequelize.Op.between]: [startDate, endDate] } },
        required: false,
      }],
    });

    const payrollRules = await PayrollRule.findOne({ where: { company_id: req.user.company_id } });
    if (!payrollRules) {
      return res.status(400).json({ error: 'Payroll rules not set for this company' });
    }

    const payroll = workers.map(worker => {
      const workLogs = worker.workLogs || [];
      const daysWorked = [...new Set(workLogs.map(log => log.date.toISOString().split('T')[0]))].length;
      const totalHoursWorked = workLogs.reduce((sum, log) => sum + (log.hours_worked || 0), 0);
      const regularHours = Math.min(totalHoursWorked, daysWorked * payrollRules.standard_working_hours);
      const overtimeHours = Math.max(totalHoursWorked - regularHours, 0) + (Number(worker.overtime_hours) || 0);
      const dailyPay = payrollRules.daily_rate * daysWorked;
      const overtimePay = payrollRules.overtime_rate * overtimeHours;
      const totalSalary = dailyPay + overtimePay;

      return {
        workerId: worker.id,
        name: worker.name,
        bank_name: worker.bankname,
        account_number: worker.accountnumber,
        daysWorked,
        regularHours,
        overtimeHours,
        dailyPay: Number(dailyPay),
        overtimePay: Number(overtimePay),
        totalSalary: Number(totalSalary),
      };
    });

    res.json(payroll);
  } catch (err) {
    console.error('Error calculating payroll:', err);
    res.status(500).json({ error: 'Failed to calculate payroll', details: err.message });
  }
});

// Apply or deduct overtime
router.post('/overtime', authenticateToken, restrictTo('company_admin'), async (req, res) => {
  const { workerId, hours, allWorkers, deduct } = req.body;
  const companyId = req.user.company_id;

  try {
    if (!hours || hours <= 0) {
      return res.status(400).json({ error: 'Invalid hours' });
    }

    const hoursAdjustment = deduct ? -parseFloat(hours) : parseFloat(hours);

    if (allWorkers) {
      const [updatedRows] = await LaborWorker.update(
        {
          overtime_hours: Sequelize.literal(`COALESCE("overtime_hours", 0) + ${hoursAdjustment}`),
        },
        { 
          where: { 
            company_id: companyId,
            status: 'active'
          }
        }
      );

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'No active workers found' });
      }

      const workersWithNegativeOvertime = await LaborWorker.findAll({
        where: {
          company_id: companyId,
          status: 'active',
          overtime_hours: { [Sequelize.Op.lt]: 0 },
        },
      });

      if (workersWithNegativeOvertime.length > 0) {
        await LaborWorker.update(
          {
            overtime_hours: Sequelize.literal(`COALESCE("overtime_hours", 0) - ${hoursAdjustment}`),
          },
          { 
            where: { 
              company_id: companyId,
              status: 'active'
            }
          }
        );
        return res.status(400).json({ error: 'Overtime hours cannot be negative for some workers' });
      }

      return res.json({ 
        success: true, 
        message: `${deduct ? 'Deducted' : 'Added'} ${hours} overtime hours for ${updatedRows} workers` 
      });
    } else {
      if (!workerId) {
        return res.status(400).json({ error: 'Worker ID is required' });
      }

      const worker = await LaborWorker.findOne({ 
        where: { id: workerId, company_id: companyId }
      });

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      const currentOvertime = Number(worker.overtime_hours) || 0;
      const newOvertime = currentOvertime + hoursAdjustment;
      if (newOvertime < 0) {
        return res.status(400).json({ error: 'Overtime hours cannot be negative' });
      }

      worker.overtime_hours = newOvertime;
      await worker.save();

      return res.json({ 
        success: true, 
        message: `${deduct ? 'Deducted' : 'Added'} ${hours} overtime hours for worker ${workerId}` 
      });
    }
  } catch (error) {
    console.error('Error applying overtime:', error);
    res.status(500).json({ error: 'Failed to apply overtime', details: error.message });
  }
});

module.exports = router;