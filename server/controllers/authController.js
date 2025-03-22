const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { CompanyAdmin } = require('../models');
require('dotenv').config();

/**
 * Register a new company admin.
 */
exports.register = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('company_id').notEmpty().withMessage('Company ID is required'),
  async (req, res) => {
    console.log('Register request received:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { company_id, username, password, role } = req.body;
      console.log('Attempting to create admin with:', { company_id, username, role });
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await CompanyAdmin.create({
        company_id,
        username,
        password: hashedPassword,
        role: role || 'company_admin',
        status: 'active' // Added default status
      });
      console.log('Admin created successfully:', admin.toJSON());
      res.status(201).json({ message: 'Admin registered successfully', admin: admin.toJSON() });
    } catch (err) {
      console.error('Error registering admin:', err);
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Failed to register admin', details: err.message });
    }
  },
];

/**
 * Login a company admin with HttpOnly cookie.
 */
exports.login = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;

    try {
      const admin = await CompanyAdmin.findOne({ where: { username } });
      console.log('Found admin:', admin ? admin.toJSON() : 'Not found');
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials - User not found' });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      console.log('Password valid:', validPassword);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials - Wrong password' });
      }

      if (admin.status !== 'active') {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role, company_id: admin.company_id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ 
        success: true, 
        user: { id: admin.id, username: admin.username, role: admin.role, company_id: admin.company_id } 
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed', details: err.message });
    }
  },
];

/**
 * Logout by clearing the token cookie.
 */
exports.logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to logout', details: err.message });
  }
};

/**
 * Create a super admin account.
 */
exports.createSuperAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await CompanyAdmin.create({
      company_id: 1, // Assuming company ID 1 for Super Admin
      username,
      password: hashedPassword,
      role: 'super_admin',
      status: 'active'
    });

    console.log('Created super admin:', admin.toJSON());
    res.status(201).json({ message: 'Super admin created successfully', admin: admin.toJSON() });
  } catch (err) {
    console.error('Error creating super admin:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create super admin', details: err.message });
  }
};