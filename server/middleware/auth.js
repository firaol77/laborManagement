  const jwt = require('jsonwebtoken');
  const { CompanyAdmin } = require('../models');
  require('dotenv').config();

  const authenticateToken = async (req, res, next) => {
    try {
      const token = req.cookies.token; // Read token from cookie
      console.log('Received Token from Cookie:', token);
      if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      console.log('Authenticating token:', token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '1234');
      console.log('Decoded user:', decoded);

      const user = await CompanyAdmin.findByPk(decoded.id);
      if (!user) {
        console.log('User not found in database');
        return res.status(403).json({ error: 'User not found' });
      }
      if (user.status !== 'active') {
        console.log('User account is deactivated');
        return res.status(403).json({ error: 'Account deactivated' });
      }

      req.user = { ...decoded, status: user.status };
      next();
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  };

  const restrictTo = (...roles) => {
    return (req, res, next) => {
      console.log('Checking role access:', {
        userRole: req.user?.role,
        allowedRoles: roles,
        user: req.user,
      });
      if (!req.user || !roles.includes(req.user.role)) {
        console.log('Access denied: Role not allowed');
        return res.status(403).json({
          error: 'You do not have permission to perform this action',
        });
      }
      console.log('Access granted: Role allowed');
      next();
    };
  };

  const requireSuperAdmin = (req, res, next) => {
    console.log('Checking for super admin:', {
      userRole: req.user?.role,
      user: req.user,
    });
    if (!req.user || req.user.role !== 'super_admin') {
      console.log('Access denied: Super admin required');
      return res.status(403).json({
        error: 'Access denied. Super admin privileges required.',
      });
    }
    console.log('Access granted: Super admin confirmed');
    next();
  };

  module.exports = {
    authenticateToken,
    restrictTo,
    requireSuperAdmin,
  };