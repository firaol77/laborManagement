const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PendingRequest = sequelize.define('PendingRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requested_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        request_type: {
            type: DataTypes.ENUM('new_worker', 'overtime_individual', 'overtime_group'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        request_data: {
            type: DataTypes.JSON,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'pending_requests',
        timestamps: false
    });

    // Define associations
    PendingRequest.associate = (models) => {
        PendingRequest.belongsTo(models.CompanyAdmin, {
            foreignKey: 'requested_by',
            as: 'requester',
            targetKey: 'id'
        });
        PendingRequest.belongsTo(models.Company, {
            foreignKey: 'company_id',
            as: 'company'
        });
    };

    return PendingRequest;
};