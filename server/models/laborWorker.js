const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LaborWorker = sequelize.define('LaborWorker', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    daily_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    overtime_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    photo_url: { type: DataTypes.STRING(255), allowNull: true },
    bankname: { type: DataTypes.STRING(100), allowNull: true }, // Updated to match database (varchar(100))
    accountnumber: { type: DataTypes.STRING(50), allowNull: true },
    regdate: { type: DataTypes.DATEONLY, allowNull: true }, // DATEONLY for date without time
    worker_id: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    overtime_hours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.00 },
  }, {
    tableName: 'labor_workers',
    timestamps: false, // We manage created_at manually
  });

  LaborWorker.associate = (models) => {
    // Corrected foreignKey to match the database (work_logs.worker_id references labor_workers.id)
    LaborWorker.hasMany(models.WorkLog, { foreignKey: 'worker_id', sourceKey: 'id', as: 'workLogs' });
  };

  return LaborWorker;
};