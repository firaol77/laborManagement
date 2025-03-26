const express = require("express")
const router = express.Router()
const { authenticateToken, restrictTo, requireSuperAdmin } = require("../middleware/auth")
const { CompanyAdmin, WorkerManager, Company } = require("../models")

// Get all company admins (Super Admin only)
router.get("/company-admins", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await CompanyAdmin.findAll({
      where: { role: "company_admin" },
      attributes: { exclude: ["password"] },
      order: [["company_id", "ASC"]],
    })
    res.json(admins)
  } catch (err) {
    console.error("Error fetching company admins:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Update the company admin status route to provide more detailed error messages

// Update company admin status (Super Admin only)
router.patch("/company-admins/:id/status", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const admin = await CompanyAdmin.findByPk(id)
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" })
    }

    // Don't allow deactivating super admin
    if (admin.role === "super_admin") {
      return res.status(403).json({ message: "Cannot modify super admin status" })
    }

    // Check if company is active before activating admin
    if (status === "active") {
      const company = await Company.findByPk(admin.company_id)
      if (!company || company.status !== "active") {
        return res.status(403).json({
          message: "Cannot activate admin because the company is inactive. Please activate the company first.",
        })
      }
    }

    admin.status = status
    await admin.save()

    // If admin is deactivated, also deactivate all associated worker managers
    if (status === "inactive") {
      await WorkerManager.update({ status: "inactive" }, { where: { company_id: admin.company_id } })
    }

    res.json({ message: `Admin status updated to ${status}` })
  } catch (err) {
    console.error("Error updating admin status:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new company admin (Super Admin only)
router.post("/company-admins", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, password, company_id } = req.body

    // Check if company exists
    const existingAdmin = await CompanyAdmin.findOne({
      where: { username, role: "company_admin" },
    })

    if (existingAdmin) {
      return res.status(400).json({ message: "Username already exists" })
    }

    const admin = await CompanyAdmin.create({
      username,
      password,
      role: "company_admin",
      company_id,
      status: "active",
    })

    // Don't send password back
    const { password: _, ...adminData } = admin.toJSON()

    res.status(201).json(adminData)
  } catch (err) {
    console.error("Error creating company admin:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

