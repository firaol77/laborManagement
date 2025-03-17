const { PaymentMethod } = require('../models');

exports.getPaymentMethods = async (req, res) => {
    try {
        const { created_by, sort } = req.query;
        let whereClause = {};

        if (created_by) {
            whereClause.created_by = created_by;
        }

        const order = sort ? [[sort, 'DESC']] : [['created_at', 'DESC']];

        const paymentMethods = await PaymentMethod.findAll({
            where: whereClause,
            order: order,
        });
        res.json(paymentMethods);
    } catch (err) {
        console.error('Error fetching payment methods:', err);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
};

exports.createPaymentMethod = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const paymentMethod = await PaymentMethod.create({ name });
        res.status(201).json(paymentMethod);
    } catch (err) {
        console.error('Error creating payment method:', err);
        res.status(500).json({ error: 'Failed to create payment method' });
    }
};

exports.updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const paymentMethod = await PaymentMethod.findByPk(id);
        if (!paymentMethod) {
            return res.status(404).json({ error: 'Payment method not found' });
        }
        await paymentMethod.update({ name: name || paymentMethod.name });
        res.json(paymentMethod);
    } catch (err) {
        console.error('Error updating payment method:', err);
        res.status(500).json({ error: 'Failed to update payment method' });
    }
};

exports.deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentMethod = await PaymentMethod.findByPk(id);
        if (!paymentMethod) {
            return res.status(404).json({ error: 'Payment method not found' });
        }
        await paymentMethod.destroy();
        res.status(204).json({ message: 'Payment method deleted' });
    } catch (err) {
        console.error('Error deleting payment method:', err);
        res.status(500).json({ error: 'Failed to delete payment method' });
    }
};