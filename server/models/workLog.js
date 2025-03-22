const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
 const WorkLog = sequelize.define('WorkLog', {
 id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
 worker_id: { type: DataTypes.INTEGER, allowNull: false },
 date: { type: DataTypes.DATEONLY, allowNull: false }, 
 hours_worked: { type: DataTypes.FLOAT, allowNull: false }, 
 created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
 }, {
 tableName: 'work_logs',
 timestamps: false,
 });

 WorkLog.associate = (models) => {
 WorkLog.belongsTo(models.LaborWorker, { foreignKey: 'worker_id', as: 'worker' });
 };

 return WorkLog;
};