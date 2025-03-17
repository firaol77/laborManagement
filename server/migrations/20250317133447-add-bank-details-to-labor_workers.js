'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Remove the foreign key constraint on bank_id
    await queryInterface.removeConstraint('labor_workers', 'labor_workers_bank_id_fkey');

    // Step 2: Rename bank_id to bankName and change its type
    await queryInterface.renameColumn('labor_workers', 'bank_id', 'bankName');
    await queryInterface.changeColumn('labor_workers', 'bankName', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Step 3: Rename account_number to accountNumber
    await queryInterface.renameColumn('labor_workers', 'account_number', 'accountNumber');

    // Step 4: Rename reg_date to regDate
    await queryInterface.renameColumn('labor_workers', 'reg_date', 'regDate');
  },

  down: async (queryInterface, Sequelize) => {
    // Step 1: Rename columns back
    await queryInterface.renameColumn('labor_workers', 'bankName', 'bank_id');
    await queryInterface.renameColumn('labor_workers', 'accountNumber', 'account_number');
    await queryInterface.renameColumn('labor_workers', 'regDate', 'reg_date');

    // Step 2: Change bank_id back to INTEGER and add foreign key constraint
    await queryInterface.changeColumn('labor_workers', 'bank_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addConstraint('labor_workers', {
      fields: ['bank_id'],
      type: 'foreign key',
      name: 'labor_workers_bank_id_fkey',
      references: {
        table: 'payment_methods',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }
};