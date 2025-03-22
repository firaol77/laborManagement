'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('payroll_rules', 'standard_working_hours', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 8
    });
    await queryInterface.addColumn('payroll_rules', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('payroll_rules', 'standard_working_hours');
    await queryInterface.removeColumn('payroll_rules', 'updated_at');
  }
};