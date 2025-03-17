const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LaborWorker = sequelize.define('LaborWorker', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    regDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    worker_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'labor_workers',
    timestamps: false,
  });

  LaborWorker.associate = function (models) {
    LaborWorker.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company',
    });
    LaborWorker.hasMany(models.WorkLog, {
      foreignKey: 'worker_id',
      as: 'work_logs',
    });
  };

  return LaborWorker;
};