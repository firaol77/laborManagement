const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import model definitions
const defineLaborWorker = require('./LaborWorker');
const defineCompanyAdmin = require('./CompanyAdmin');
const definePayrollRule = require('./PayrollRule');
const definePendingRequest = require('./PendingRequests');
const definePaymentMethod = require('./paymentMethod');
const defineCompany = require('./company');
const defineWorkLog = require('./workLog'); 

// Initialize all models first
const models = {
    Company: defineCompany(sequelize),
    CompanyAdmin: defineCompanyAdmin(sequelize),
    PaymentMethod: definePaymentMethod(sequelize),
    LaborWorker: defineLaborWorker(sequelize),
    PayrollRule: definePayrollRule(sequelize),
    PendingRequest: definePendingRequest(sequelize),
    WorkLog: defineWorkLog(sequelize), // Add this line
};

// Then set up associations after all models are initialized
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// Export models and sequelize instance
module.exports = {
    sequelize,
    ...models
};