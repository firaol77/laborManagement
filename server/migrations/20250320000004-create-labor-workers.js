// File: server/migrations/20250320000004-create-labor-workers.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('labor_workers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      photo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      bankName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      accountNumber: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      regDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      worker_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addConstraint('labor_workers', {
      fields: ['company_id'],
      type: 'foreign key',
      name: 'fk_labor_workers_company_id',
      references: {
        table: 'companies',
        field: 'id',
      },
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('labor_workers');
  },
};