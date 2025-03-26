'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('labor_workers', 'bankname', 'bank_name');
    await queryInterface.renameColumn('labor_workers', 'accountnumber', 'account_number');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('labor_workers', 'bank_name', 'bankname');
    await queryInterface.renameColumn('labor_workers', 'account_number', 'accountnumber');
  }
};