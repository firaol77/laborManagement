const jwt = require('jsonwebtoken');
const { Company } = require('../models'); // Import the Company model

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid token' });
            }

            // Check if the company is active
            const company = await Company.findByPk(user.company_id);
            if (!company || company.status !== 'active') {
                return res.status(403).json({
                    error: 'Company is inactive or does not exist'
                });
            }

            req.user = user;
            next();
        });
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Authentication error' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({
            error: 'Access denied. Super admin privileges required.'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    restrictTo,
    requireSuperAdmin
};