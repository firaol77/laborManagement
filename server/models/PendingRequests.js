const { DataTypes, Model } = require("sequelize")

module.exports = (sequelize) => {
  class PendingRequest extends Model {}

  PendingRequest.init(
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
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_by_username: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      request_type: {
        type: DataTypes.ENUM("new_worker", "overtime_individual", "overtime_group"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      request_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      worker_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      modelName: "PendingRequest",
      tableName: "pending_requests",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return PendingRequest
}

