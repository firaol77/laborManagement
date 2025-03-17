const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CompanyAdmin = sequelize.define('CompanyAdmin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'company_admin',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'company_admins',
    timestamps: false,
  });

  CompanyAdmin.associate = (models) => {
    CompanyAdmin.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company',
    });
    CompanyAdmin.hasMany(models.PendingRequest, {
      foreignKey: 'requested_by',
      as: 'requests',
    });
  };

  return CompanyAdmin;
};