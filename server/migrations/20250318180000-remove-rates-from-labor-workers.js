'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the 'daily_rate' column exists before removing it
    const tableDescription = await queryInterface.describeTable('labor_workers');
    if (tableDescription.daily_rate) {
      await queryInterface.removeColumn('labor_workers', 'daily_rate');
    }

    // Check if the 'overtime_rate' column exists before removing it
    if (tableDescription.overtime_rate) {
      await queryInterface.removeColumn('labor_workers', 'overtime_rate');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add the columns back if they need to be restored
    const tableDescription = await queryInterface.describeTable('labor_workers');
    
    if (!tableDescription.daily_rate) {
      await queryInterface.addColumn('labor_workers', 'daily_rate', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }

    if (!tableDescription.overtime_rate) {
      await queryInterface.addColumn('labor_workers', 'overtime_rate', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }
  }
};

