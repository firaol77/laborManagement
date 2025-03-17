const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PaymentMethod = sequelize.define('payment_methods', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        created_by: {
            type: DataTypes.STRING(50),
            defaultValue: 'super_admin',
        },
    }, {
        tableName: 'payment_methods',
        timestamps: false,
    });

    return PaymentMethod;
};