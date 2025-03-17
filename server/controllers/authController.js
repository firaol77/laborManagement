const { CompanyAdmin } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { company_id, username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await CompanyAdmin.create({
            company_id,
            username,
            password: hashedPassword,
            role: role || 'company_admin',
        });
        res.status(201).json({ message: 'Admin registered', admin });
    } catch (err) {
        console.error('Error registering admin:', err);
        res.status(500).json({ error: 'Failed to register admin' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Debug log
        console.log('Login attempt:', { username });

        const admin = await CompanyAdmin.findOne({ where: { username } });
        
        // Debug log
        console.log('Found admin:', admin ? {
            id: admin.id,
            username: admin.username,
            role: admin.role,
            company_id: admin.company_id
        } : null);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: admin.id,
            username: admin.username,
            role: admin.role,  // Make sure this is included
            company_id: admin.company_id
        }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });

        // Debug log
        console.log('Generated token payload:', {
            id: admin.id,
            username: admin.username,
            role: admin.role,
            company_id: admin.company_id
        });

        res.json({
            token,
            user: {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                company_id: admin.company_id
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
};

exports.createSuperAdmin = async (req, res) => {
    try {
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const admin = await CompanyAdmin.create({
            company_id: 1,  // Make sure this company exists
            username: 'superadmin',
            password: hashedPassword,
            role: 'super_admin',
        });
        
        console.log('Created admin:', admin);
        res.status(201).json({ message: 'Super admin created', admin });
    } catch (err) {
        console.error('Error creating super admin:', err);
        res.status(500).json({ error: 'Failed to create super admin' });
    }
};