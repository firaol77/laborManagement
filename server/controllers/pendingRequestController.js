const { Sequelize } = require('sequelize');
const { PendingRequest, LaborWorker, OvertimeRequest, PayrollRule } = require('../models');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

exports.getPendingRequests = async (req, res) => {
  try {
      console.log('Fetching pending requests for user:', req.user);
      let requests;

      if (!req.user || !req.user.role) {
          console.log('User or role missing in request');
          return res.status(401).json({ error: 'User or role missing' });
      }

      if (req.user.role === 'company_admin') {
          console.log('Fetching pending requests for company_admin, company_id:', req.user.company_id);
          requests = await PendingRequest.findAll({
              where: { 
                  company_id: req.user.company_id, 
                  status: 'pending' 
              },
              include: [
                  { model: LaborWorker, as: 'worker', required: false },
              ],
          });
      } else if (req.user.role === 'worker_manager') {
          console.log('Fetching pending requests for worker_manager, user_id:', req.user.id);
          requests = await PendingRequest.findAll({
              where: {
                  company_id: req.user.company_id,
                  requested_by: req.user.id,
                  status: 'pending',
              },
              include: [
                  { model: LaborWorker, as: 'worker', required: false },
              ],
          });
      } else {
          console.log('Unauthorized role:', req.user.role);
          return res.status(403).json({ error: 'Unauthorized role' });
      }

      console.log('Pending requests fetched:', requests);
      res.status(200).json(requests || []);
  } catch (err) {
      console.error('Error fetching pending requests:', err);
      res.status(500).json({ error: 'Failed to fetch pending requests', details: err.message });
  }
};


exports.createRequest = async (req, res) => {
  try {
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);

      const { type, details } = req.body;
      const photo = req.file;

      if (!type || !details) {
          return res.status(400).json({ error: 'Request type and details are required' });
      }

      let photoUrl = null;
      if (photo) {
          photoUrl = `/uploads/${photo.filename}`;
      }

      const request = await PendingRequest.create({
          request_type: type,
          company_id: req.user.company_id,
          requested_by: req.user.id,
          status: 'pending',
          request_data: JSON.parse(details),
          worker_id: type === 'overtime_individual' ? JSON.parse(details).workerId : null,
          photo_url: photoUrl,
      });

      res.status(201).json(request);
  } catch (err) {
      console.error('Error creating pending request:', err);
      res.status(500).json({ error: 'Failed to create pending request', details: err.message });
  }
};

exports.handleRequest = async (req, res, actionType) => {
    const { action } = req.body;
    const companyId = req.user.company_id;

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }

    try {
        if (actionType === 'approve-all') {
            // Handle approving all pending requests
            const pendingRequests = await PendingRequest.findAll({
                where: { company_id: companyId, status: 'pending' },
            });

            if (pendingRequests.length === 0) {
                return res.status(404).json({ error: 'No pending requests found' });
            }

            for (const request of pendingRequests) {
                if (request.request_type === 'new_worker') {
                    const payrollRules = await PayrollRule.findOne({ where: { company_id: companyId } });
                    const worker = await LaborWorker.create({
                        name: request.request_data.name,
                        bankName: request.request_data.bankName,
                        accountNumber: request.request_data.accountNumber,
                        daily_rate: payrollRules.daily_rate,
                        overtime_rate: payrollRules.overtime_rate,
                        company_id: companyId,
                        status: 'active',
                        photo_url: request.request_data.photoUrl || null,
                        regdate: new Date().toISOString().split('T')[0],
                    });
                    request.worker_id = worker.id;
                } else if (request.request_type.includes('overtime')) {
                    await OvertimeRequest.update(
                        { status: 'approved' },
                        { where: { id: request.overtime_request_id } }
                    );
                }
                request.status = 'approved';
                await request.save();
            }

            return res.json({ message: `All pending requests ${action}d successfully` });
        }

        // Handle a single request
        const requestId = req.params.id;
        const request = await PendingRequest.findOne({
            where: { id: requestId, company_id: companyId },
        });

        if (!request) {
            return res.status(404).json({ error: 'Pending request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        if (action === 'approve') {
            if (request.request_type === 'new_worker') {
                const payrollRules = await PayrollRule.findOne({ where: { company_id: companyId } });
                const worker = await LaborWorker.create({
                    name: request.request_data.name,
                    bankName: request.request_data.bankName,
                    accountNumber: request.request_data.accountNumber,
                    daily_rate: payrollRules.daily_rate,
                    overtime_rate: payrollRules.overtime_rate,
                    company_id: companyId,
                    status: 'active',
                    photo_url: request.request_data.photoUrl || null,
                    regdate: new Date().toISOString().split('T')[0], // Add registration date
                });
                request.worker_id = worker.id;
            } else if (request.request_type.includes('overtime')) {
                await OvertimeRequest.update(
                    { status: 'approved' },
                    { where: { id: request.overtime_request_id } }
                );
            }
        }

        await request.update({ status: action === 'approve' ? 'approved' : 'rejected' });
        res.json({ message: `Request ${action}d successfully` });
    } catch (error) {
        console.error('Error handling pending request:', error);
        res.status(500).json({ error: 'Failed to handle request', details: error.message });
    }
};

exports.approveAllRequests = async (req, res) => {
    try {
        const requests = await PendingRequest.findAll({
            where: { company_id: req.user.company_id, status: 'pending' },
        });

        for (const request of requests) {
            if (request.request_type === 'new_worker') {
                const payrollRules = await PayrollRule.findOne({
                    where: { company_id: req.user.company_id },
                });
                const worker = await LaborWorker.create({
                    name: request.request_data.name,
                    bankName: request.request_data.bankName,
                    accountNumber: request.request_data.accountNumber,
                    daily_rate: payrollRules.daily_rate,
                    overtime_rate: payrollRules.overtime_rate,
                    company_id: req.user.company_id,
                    status: 'active',
                    photo_url: request.request_data.photoUrl || null,
                    regdate: new Date().toISOString().split('T')[0], // Add registration date
                });
                request.worker_id = worker.id;
            } else if (request.request_type.includes('overtime')) {
                await OvertimeRequest.update(
                    { status: 'approved' },
                    { where: { id: request.overtime_request_id } }
                );
            }
            request.status = 'approved';
            await request.save();
        }

        res.json({ message: 'All pending requests approved' });
    } catch (err) {
        console.error('Error approving all pending requests:', err);
        res.status(500).json({ error: 'Failed to approve all pending requests', details: err.message });
    }
};

module.exports = exports;