const { Company, CompanyAdmin } = require('../models');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

exports.createCompany = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, adminUsername, adminPassword } = req.body;
        console.log('Received request to create company:', { name, adminUsername, adminPassword });

        if (!name || !adminUsername || !adminPassword) {
            throw new Error('Missing required fields: name, adminUsername, or adminPassword');
        }

        const company = await Company.create({ name }, { transaction: t });
        console.log('Company created:', company.toJSON());

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = await CompanyAdmin.create({
            company_id: company.id,
            username: adminUsername,
            password: hashedPassword,
            role: 'company_admin',
            status: 'active',
        }, { transaction: t });
        console.log('Admin created:', admin.toJSON());

        await t.commit();
        res.status(201).json({
            message: 'Company and admin created',
            company: company.toJSON(),
            admin: admin.toJSON()
        });
    } catch (err) {
        await t.rollback();
        console.error('Error creating company:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to create company', details: err.message });
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === '1') {
            return res.status(403).json({ error: 'Super Admin Company cannot be deleted' });
        }
        const company = await Company.findByPk(id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        await company.destroy();
        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        console.error('Error deleting company:', err);
        res.status(500).json({ error: 'Failed to delete company' });
    }
};