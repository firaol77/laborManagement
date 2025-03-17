const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PayrollRule = sequelize.define('PayrollRule', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        daily_rate: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        overtime_rate: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'payroll_rules',
        timestamps: false
    });

    PayrollRule.associate = (models) => {
        PayrollRule.belongsTo(models.Company, {
            foreignKey: 'company_id'
        });
    };

    return PayrollRule;
};