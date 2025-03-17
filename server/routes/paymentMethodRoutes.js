const express = require('express');
const router = express.Router();
const { PaymentMethod } = require('../models');

// Get all payment methods
router.get('/', async (req, res) => {
    try {
        // Debug log
        console.log('GET /payment-methods - User:', req.user);

        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ 
                error: 'You do not have permission to perform this action',
                userRole: req.user.role
            });
        }

        const methods = await PaymentMethod.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(methods);
    } catch (err) {
        console.error('Error fetching payment methods:', err);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});

// Add new payment method
router.post('/', async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }

        const method = await PaymentMethod.create({
            name: req.body.name,
            created_by: req.user.username,
            created_at: new Date()
        });
        res.status(201).json(method);
    } catch (err) {
        console.error('Error creating payment method:', err);
        res.status(500).json({ error: 'Failed to create payment method' });
    }
});

// Delete payment method
router.delete('/:id', async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }

        const method = await PaymentMethod.findByPk(req.params.id);
        if (!method) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        await method.destroy();
        res.json({ message: 'Payment method deleted successfully' });
    } catch (err) {
        console.error('Error deleting payment method:', err);
        res.status(500).json({ error: 'Failed to delete payment method' });
    }
});

module.exports = router;