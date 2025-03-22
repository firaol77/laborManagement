const express = require('express');
const router = express.Router();
const { CompanyAdmin } = require('../models');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Protect all routes with Super Admin access
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/admin/company-admins - List all Company Admins
router.get('/company-admins', async (req, res) => {
  try {
    const admins = await CompanyAdmin.findAll({
      attributes: ['id', 'username', 'company_id', 'status', 'created_at'],
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company admins', details: err.message });
  }
});

// PATCH /api/admin/company-admins/:id/status - Update Company Admin status
router.patch('/company-admins/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use "active" or "inactive"' });
    }
    const admin = await CompanyAdmin.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Company Admin not found' });
    }
    await admin.update({ status });
    res.json({ message: `Company Admin ${status} successfully`, admin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company admin status', details: err.message });
  }
});

// POST /api/admin/company-admins - Create a new Company Admin (optional)
router.post('/company-admins', async (req, res) => {
  try {
    const { username, password, company_id } = req.body;
    if (!username || !password || !company_id) {
      return res.status(400).json({ error: 'Username, password, and company_id are required' });
    }
    const admin = await CompanyAdmin.create({
      username,
      password, 
      company_id,
      role: 'company_admin',
      status: 'active',
    });
    res.status(201).json({ message: 'Company Admin created successfully', admin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create company admin', details: err.message });
  }
});

module.exports = router;