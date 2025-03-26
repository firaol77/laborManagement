const { Sequelize } = require("sequelize")
const sequelize = require("../config/database")

// Import model definitions
const defineLaborWorker = require("./laborWorker")
const defineCompanyAdmin = require("./companyAdmin")
const definePayrollRule = require("./payrollRule")
const definePendingRequest = require("./pendingRequests")
const definePaymentMethod = require("./paymentMethod")
const defineCompany = require("./company")
const defineWorkLog = require("./workLog")
const defineWorker = require("./worker")
const defineWorkerManager = require("./workerManager")

// Initialize models
const Company = defineCompany(sequelize)
const CompanyAdmin = defineCompanyAdmin(sequelize)
const PaymentMethod = definePaymentMethod(sequelize)
const LaborWorker = defineLaborWorker(sequelize)
const PayrollRule = definePayrollRule(sequelize)
const PendingRequest = definePendingRequest(sequelize)
const WorkLog = defineWorkLog(sequelize)
const Worker = defineWorker(sequelize)
const WorkerManager = defineWorkerManager(sequelize)

// Define associations
// Company associations
Company.hasMany(CompanyAdmin, { foreignKey: "company_id", as: "admins", onDelete: "CASCADE" })
Company.hasMany(LaborWorker, { foreignKey: "company_id", as: "workers", onDelete: "CASCADE" })
Company.hasMany(Worker, { foreignKey: "company_id", as: "newWorkers", onDelete: "CASCADE" })
Company.hasMany(WorkerManager, { foreignKey: "company_id", as: "workerManagers", onDelete: "CASCADE" })
Company.hasMany(PayrollRule, { foreignKey: "company_id", as: "payrollRules", onDelete: "CASCADE" })
Company.hasMany(PendingRequest, { foreignKey: "company_id", as: "pendingRequests", onDelete: "CASCADE" })
Company.hasMany(WorkLog, { foreignKey: "company_id", as: "workLogs", onDelete: "CASCADE" })

// CompanyAdmin associations
CompanyAdmin.belongsTo(Company, { foreignKey: "company_id", as: "company" })
CompanyAdmin.hasMany(PendingRequest, { foreignKey: "created_by", as: "requests" })

// LaborWorker associations
LaborWorker.belongsTo(Company, { foreignKey: "company_id", as: "company" })
LaborWorker.hasMany(WorkLog, { foreignKey: "worker_id", as: "workLogs", onDelete: "CASCADE" })
LaborWorker.hasMany(PendingRequest, { foreignKey: "worker_id", as: "pendingRequests" })

// Worker associations
Worker.belongsTo(Company, { foreignKey: "company_id", as: "company" })
Worker.hasMany(WorkLog, { foreignKey: "worker_id", as: "workLogs", onDelete: "CASCADE" })
Worker.hasMany(PendingRequest, { foreignKey: "worker_id", as: "pendingRequests" })

// WorkerManager associations
WorkerManager.belongsTo(Company, { foreignKey: "company_id", as: "company" })

// WorkLog associations
WorkLog.belongsTo(LaborWorker, { foreignKey: "worker_id", as: "worker" })
WorkLog.belongsTo(Company, { foreignKey: "company_id", as: "company" })

// PendingRequest associations
PendingRequest.belongsTo(CompanyAdmin, { foreignKey: "created_by", as: "requester" })
PendingRequest.belongsTo(Company, { foreignKey: "company_id", as: "company" })
PendingRequest.belongsTo(LaborWorker, { foreignKey: "worker_id", as: "worker" })

// PayrollRule associations
PayrollRule.belongsTo(Company, { foreignKey: "company_id", as: "company" })

// Export models and sequelize instance
module.exports = {
  sequelize,
  Company,
  CompanyAdmin,
  PaymentMethod,
  LaborWorker,
  PayrollRule,
  PendingRequest,
  WorkLog,
  Worker,
  WorkerManager,
}

