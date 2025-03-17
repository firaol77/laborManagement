'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('company_admins', 'status', {
      type: Sequelize.STRING(20),
      defaultValue: 'active',
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('company_admins', 'status');
  }
};