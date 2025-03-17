const { CompanyAdmin, PendingRequest } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.createWorkerManager = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const manager = await CompanyAdmin.create({
            username,
            password: hashedPassword,
            company_id: req.user.company_id,
            role: 'worker_manager',
            created_at: new Date()
        });

        res.status(201).json({
            message: 'Worker manager created successfully',
            manager: {
                id: manager.id,
                username: manager.username,
                role: manager.role
            }
        });
    } catch (err) {
        console.error('Error creating worker manager:', err);
        res.status(500).json({ error: 'Failed to create worker manager' });
    }
};

exports.getWorkerManagerDetails = async (req, res) => {
    try {
        const manager = await CompanyAdmin.findOne({
            where: {
                id: req.user.id,
                role: 'worker_manager'
            },
            attributes: ['id', 'username', 'company_id', 'role']
        });

        if (!manager) {
            return res.status(404).json({ error: 'Worker manager not found' });
        }

        res.json(manager);
    } catch (err) {
        console.error('Error fetching worker manager details:', err);
        res.status(500).json({ error: 'Failed to fetch worker manager details' });
    }
}; 