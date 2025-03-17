const { CompanyAdmin } = require('../models');
const { requireSuperAdmin } = require('../middleware/auth');

exports.updateAdminStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expected values: 'active' or 'inactive'

        const admin = await CompanyAdmin.findByPk(id);
        if (!admin) {
            return res.status(404).json({ error: 'Company Admin not found' });
        }

        // Prevent deactivation of superadmin
        if (admin.role === 'super_admin') {
            return res.status(403).json({ error: 'Super Admin cannot be deactivated' });
        }

        await admin.update({ status: status === 'active' ? 'active' : 'inactive' });
        res.json({ message: `Company Admin ${status === 'active' ? 'activated' : 'deactivated'} successfully` });
    } catch (err) {
        console.error('Error updating admin status:', err);
        res.status(500).json({ error: 'Failed to update admin status' });
    }
};