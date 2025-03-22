const { Overtime, PayrollRule } = require('../models');

exports.createOvertimeRequest = async (req, res) => {
  try {
    const { worker_ids, type } = req.body;
    if (!worker_ids || !type) {
      return res.status(400).json({ error: 'worker_ids and type are required' });
    }

    const payrollRule = await PayrollRule.findOne({ where: { company_id: req.user.company_id } });
    if (!payrollRule) {
      return res.status(404).json({ error: 'Payroll rules not found for this company' });
    }

    const overtimeRequest = await Overtime.create({
      company_id: req.user.company_id,
      worker_ids: JSON.stringify(worker_ids),
      overtime_rate: payrollRule.overtime_rate, // Locked to company admin's setting
      type, // 'individual' or 'group'
      status: 'pending',
      requested_by: req.user.id,
    });

    res.status(201).json(overtimeRequest);
  } catch (err) {
    console.error('Error creating overtime request:', err);
    res.status(500).json({ error: 'Failed to create overtime request' });
  }
};

exports.approveOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const overtimeRequest = await Overtime.findByPk(id);
    if (!overtimeRequest) {
      return res.status(404).json({ error: 'Overtime request not found' });
    }

    await overtimeRequest.update({ status: 'approved' });
    res.json({ message: 'Overtime request approved', overtimeRequest });
  } catch (err) {
    console.error('Error approving overtime request:', err);
    res.status(500).json({ error: 'Failed to approve overtime request' });
  }
};

exports.applyApprovedOvertime = async (req, res) => {
  try {
    const { request_id } = req.params;
    const overtimeRequest = await Overtime.findByPk(request_id);
    if (!overtimeRequest) {
      return res.status(404).json({ error: 'Overtime request not found' });
    }
    if (overtimeRequest.status !== 'approved') {
      return res.status(400).json({ error: 'Overtime request must be approved first' });
    }

    // Placeholder logic: Apply overtime to work logs or payroll (to be implemented)
    res.json({ message: 'Overtime applied successfully', overtimeRequest });
  } catch (err) {
    console.error('Error applying overtime:', err);
    res.status(500).json({ error: 'Failed to apply overtime' });
  }
};