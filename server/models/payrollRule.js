// File: server/models/PayrollRule.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PayrollRule = sequelize.define('PayrollRule', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        company_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        standard_working_hours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 8 },
        daily_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
        overtime_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'payroll_rules',
        timestamps: true, // Enable timestamps
        underscored: true, // Match database naming (e.g., created_at)
    });

    PayrollRule.associate = (models) => {
        PayrollRule.belongsTo(models.Company, { foreignKey: 'company_id', onDelete: 'CASCADE' });
    };

    return PayrollRule;
};