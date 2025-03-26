const express = require("express")
const router = express.Router()
const { authenticateToken, restrictTo } = require("../middleware/auth")
const { WorkerManager } = require("../models")

// Get all worker managers (Company Admin only)
router.get("/", authenticateToken, restrictTo("company_admin"), async (req, res) => {
  try {
    const managers = await WorkerManager.findAll({
      where: { company_id: req.user.company_id },
      attributes: { exclude: ["password"] },
    })
    res.json(managers)
  } catch (err) {
    console.error("Error fetching worker managers:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new worker manager (Company Admin only)
router.post("/", authenticateToken, restrictTo("company_admin"), async (req, res) => {
  try {
    const { username, password } = req.body

    // Check if username already exists
    const existingManager = await WorkerManager.findOne({
      where: { username },
    })

    if (existingManager) {
      return res.status(400).json({ message: "Username already exists" })
    }

    const manager = await WorkerManager.create({
      username,
      password,
      role: "worker_manager",
      company_id: req.user.company_id,
      status: "active",
    })

    // Don't send password back
    const { password: _, ...managerData } = manager.toJSON()

    res.status(201).json(managerData)
  } catch (err) {
    console.error("Error creating worker manager:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Update worker manager status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const manager = await WorkerManager.findByPk(id)
    if (!manager) {
      return res.status(404).json({ message: "Worker manager not found" })
    }

    // Only allow company admin to update their own worker managers
    if (req.user.role === "company_admin" && manager.company_id !== req.user.company_id) {
      return res.status(403).json({ message: "You can only update worker managers from your company" })
    }

    manager.status = status
    await manager.save()

    res.json({ message: `Worker manager status updated to ${status}` })
  } catch (err) {
    console.error("Error updating worker manager status:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

