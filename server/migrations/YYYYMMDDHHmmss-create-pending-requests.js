// File: server/migrations/YYYYMMDDHHmmss-create-pending-requests.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUM types for request_type and status
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_pending_requests_request_type AS ENUM ('new_worker', 'overtime_individual', 'overtime_group');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_pending_requests_status AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Create the pending_requests table
    await queryInterface.createTable('pending_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      request_type: {
        type: Sequelize.ENUM('new_worker', 'overtime_individual', 'overtime_group'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      request_data: {
        type: Sequelize.JSON,
        allowNull: false,
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

    // Add foreign key constraints (check if they exist first)
    const constraints = await queryInterface.sequelize.query(
      `SELECT constraint_name FROM information_schema.table_constraints 
       WHERE table_name = 'pending_requests' AND constraint_type = 'FOREIGN KEY';`
    );

    const constraintNames = constraints[0].map(c => c.constraint_name);

    if (!constraintNames.includes('fk_pending_requests_company_id')) {
      await queryInterface.addConstraint('pending_requests', {
        fields: ['company_id'],
        type: 'foreign key',
        name: 'fk_pending_requests_company_id',
        references: {
          table: 'companies',
          field: 'id',
        },
        onDelete: 'CASCADE',
      });
    }

    if (!constraintNames.includes('fk_pending_requests_requested_by')) {
      await queryInterface.addConstraint('pending_requests', {
        fields: ['requested_by'],
        type: 'foreign key',
        name: 'fk_pending_requests_requested_by',
        references: {
          table: 'users',
          field: 'id',
        },
        onDelete: 'CASCADE',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pending_requests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_pending_requests_request_type;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_pending_requests_status;');
  },
};