// File: server/migrations/20250320000001-create-users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Migrate data from company_admins to users
    await queryInterface.sequelize.query(`
      INSERT INTO users (id, username, password, role, company_id, status, created_at, updated_at)
      SELECT id, username, password, 'company_admin', company_id, status, created_at, updated_at
      FROM company_admins;
    `);

    // Drop the company_admins table
    await queryInterface.dropTable('company_admins');

    // Add foreign key constraints
    await queryInterface.addConstraint('users', {
      fields: ['company_id'],
      type: 'foreign key',
      name: 'fk_users_company_id',
      references: {
        table: 'companies',
        field: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('users', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fk_users_created_by',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate company_admins table
    await queryInterface.createTable('company_admins', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Migrate data back to company_admins
    await queryInterface.sequelize.query(`
      INSERT INTO company_admins (id, company_id, username, password, status, created_at, updated_at)
      SELECT id, company_id, username, password, status, created_at, updated_at
      FROM users
      WHERE role = 'company_admin';
    `);

    // Drop the users table
    await queryInterface.dropTable('users');
  },
};