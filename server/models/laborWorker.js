const { DataTypes, Model } = require("sequelize")

module.exports = (sequelize) => {
  class LaborWorker extends Model {}

  LaborWorker.init(
    {
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
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      account_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      registration_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      worker_id: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "active", "inactive"),
        defaultValue: "pending",
      },
      overtime_hours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "LaborWorker",
      tableName: "labor_workers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return LaborWorker
}

