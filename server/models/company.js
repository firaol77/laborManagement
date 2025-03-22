const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Company = sequelize.define('Company', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active'
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'companies',
        timestamps: false,
        // Define model methods
        scopes: {
            active: {
                where: {
                    status: 'active'
                }
            }
        }
    });

    // Define class methods
    Company.associate = (models) => {
        // Company Admins
        Company.hasMany(models.CompanyAdmin, {
            foreignKey: 'company_id',
            as: 'admins',
            onDelete: 'CASCADE' // Add cascade deletion
        });
    
        // Labor Workers
        Company.hasMany(models.LaborWorker, {
            foreignKey: 'company_id',
            as: 'workers',
            onDelete: 'CASCADE' // Add cascade deletion
        });
    
        // Payroll Rules
        Company.hasMany(models.PayrollRule, {
            foreignKey: 'company_id',
            as: 'payrollRules',
            onDelete: 'CASCADE' // Add cascade deletion
        });
    };

    // Define instance methods
    Company.prototype.getActiveWorkers = async function() {
        return await this.getWorkers({
            where: { status: 'active' }
        });
    };

    Company.prototype.getActiveAdmins = async function() {
        return await this.getAdmins({
            where: { status: 'active' }
        });
    };

    Company.prototype.getCurrentPayrollRules = async function() {
        return await this.getPayrollRules({
            order: [['created_at', 'DESC']],
            limit: 1
        });
    };

    return Company;
};