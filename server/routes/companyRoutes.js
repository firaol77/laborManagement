const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const { authenticateToken, restrictTo, requireSuperAdmin } = require("../middleware/auth")
const {
  Company,
  CompanyAdmin,
  WorkerManager,
  sequelize,
  PendingRequest,
  LaborWorker,
  PayrollRule,
  Worker,
} = require("../models")

// Get all companies (Super Admin only)
router.get("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [["id", "ASC"]],
    })
    res.json(companies)
  } catch (err) {
    console.error("Error fetching companies:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new company with admin (Super Admin only)
router.post("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { name, adminUsername, adminPassword } = req.body

    // Create company
    const company = await Company.create({
      name,
      status: "active",
    })

    // Create company admin
    await CompanyAdmin.create({
      username: adminUsername,
      password: adminPassword,
      role: "company_admin",
      company_id: company.id,
      status: "active",
    })

    res.status(201).json({
      message: "Company and admin created successfully",
      company,
    })
  } catch (err) {
    console.error("Error creating company:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Update the company status update route to also update the status of company admins

// Update company status (Super Admin only)
router.patch("/:id/status", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (id === "1") {
      return res.status(403).json({ message: "Cannot modify super admin company" })
    }

    const company = await Company.findByPk(id)
    if (!company) {
      return res.status(404).json({ message: "Company not found" })
    }

    company.status = status
    await company.save()

    // If company is deactivated, also deactivate all associated admins and worker managers
    if (status === "inactive") {
      await CompanyAdmin.update({ status: "inactive" }, { where: { company_id: id } })
      await WorkerManager.update({ status: "inactive" }, { where: { company_id: id } })
    }
    // If company is activated, also activate all associated admins
    else if (status === "active") {
      await CompanyAdmin.update({ status: "active" }, { where: { company_id: id } })
      // Note: We don't automatically activate worker managers as they should be managed by company admins
    }

    res.json({ message: `Company status updated to ${status}` })
  } catch (err) {
    console.error("Error updating company status:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete company (Super Admin only)
router.delete("/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
  const t = await sequelize.transaction() // Use transaction for atomicity
  try {
    const { id } = req.params

    if (id === "1") {
      await t.rollback()
      return res.status(403).json({ message: "Cannot delete super admin company" })
    }

    const company = await Company.findByPk(id, { transaction: t })
    if (!company) {
      await t.rollback()
      return res.status(404).json({ message: "Company not found" })
    }

    // Step 1: Delete pending requests for this company
    await PendingRequest.destroy({
      where: { company_id: id },
      transaction: t,
    })
    console.log(`Deleted pending_requests for company_id: ${id}`)

    // Step 2: Delete labor workers for this company
    await LaborWorker.destroy({
      where: { company_id: id },
      transaction: t,
    })
    console.log(`Deleted labor_workers for company_id: ${id}`)

    // Step 3: Delete workers for this company
    await Worker.destroy({
      where: { company_id: id },
      transaction: t,
    })
    console.log(`Deleted workers for company_id: ${id}`)

    // Step 4: Use raw query to delete payroll rules
    const payrollRulesCount = await PayrollRule.count({
      where: { company_id: id },
      transaction: t,
    })
    console.log(`Found ${payrollRulesCount} payroll rules for company_id: ${id}`)

    // Try both approaches to ensure deletion
    await PayrollRule.destroy({
      where: { company_id: id },
      transaction: t,
      force: true, // Force hard delete
    })

    // Also try with raw SQL
    await sequelize.query(`DELETE FROM "payroll_rules" WHERE "company_id" = ?`, {
      replacements: [id],
      type: sequelize.QueryTypes.DELETE,
      transaction: t,
    })
    console.log(`Deleted payroll_rules for company_id: ${id}`)

    // Step 5: Delete worker_managers tied to this company
    await WorkerManager.destroy({
      where: { company_id: id },
      transaction: t,
    })
    console.log(`Deleted worker_managers for company_id: ${id}`)

    // Step 6: Delete company_admins tied to this company
    await CompanyAdmin.destroy({
      where: { company_id: id },
      transaction: t,
    })
    console.log(`Deleted company_admins for company_id: ${id}`)

    // Step 7: Delete the company
    await company.destroy({ transaction: t })
    console.log(`Deleted company with id: ${id}`)

    await t.commit()
    res.json({ message: "Company and all related records deleted successfully" })
  } catch (err) {
    await t.rollback()
    console.error("Error deleting company:", err)
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Get worker managers for a specific company
router.get("/:id/worker-managers", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if company exists
    const company = await Company.findByPk(id)
    if (!company) {
      return res.status(404).json({ message: "Company not found" })
    }

    // Get all worker managers for this company
    const managers = await WorkerManager.findAll({
      where: { company_id: id },
      attributes: { exclude: ["password"] },
    })

    res.json(managers)
  } catch (err) {
    console.error("Error fetching worker managers:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

