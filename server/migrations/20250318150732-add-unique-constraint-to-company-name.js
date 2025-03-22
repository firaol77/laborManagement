module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('companies', {
      fields: ['name'],
      type: 'unique',
      name: 'unique_company_name',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('companies', 'unique_company_name');
  },
};