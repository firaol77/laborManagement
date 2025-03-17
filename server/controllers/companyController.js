const { Company, CompanyAdmin } = require('../models');
const bcrypt = require('bcrypt');

exports.createCompany = async (req, res) => {
    try {
        const { name, adminUsername, adminPassword } = req.body;

        // Create company
        const company = await Company.create({
            name,
            status: 'active',
            created_at: new Date()
        });

        // Hash password and create company admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await CompanyAdmin.create({
            company_id: company.id,
            username: adminUsername,
            password: hashedPassword,
            role: 'company_admin',
            created_at: new Date()
        });

        res.status(201).json({
            message: 'Company and admin created successfully',
            company
        });
    } catch (err) {
        console.error('Error creating company:', err);
        res.status(500).json({ error: 'Failed to create company' });
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        console.log('Fetching companies...');
        const companies = await Company.findAll();
        res.json(companies);
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
};

exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    } catch (err) {
        console.error('Error fetching company:', err);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
};

exports.updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Prevent deactivation of Super Admin Company
        if (id === '1') {
            return res.status(403).json({ 
                error: 'Super Admin Company cannot be deactivated' 
            });
        }

        const company = await Company.findByPk(id);
        
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Update company status
        company.status = status;
        await company.save();

        // Cascade deactivation to company admins
        if (status === 'inactive') {
            await CompanyAdmin.update(
                { status: 'inactive' }, 
                { where: { company_id: id } }
            );
        }

        res.json({ message: 'Company status updated successfully', company });
    } catch (err) {
        console.error('Error updating company status:', err);
        res.status(500).json({ error: 'Failed to update company status' });
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deletion of Super Admin Company
        if (id === '1') {
            return res.status(403).json({ 
                error: 'Super Admin Company cannot be deleted' 
            });
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