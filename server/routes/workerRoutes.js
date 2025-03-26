const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { authenticateToken, restrictTo } = require("../middleware/auth")
const { Worker, Company, CompanyAdmin } = require("../models")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "worker-" + uniqueSuffix + ext)
  },
})

const upload = multer({ storage })

// Get all workers
router.get("/", authenticateToken, async (req, res) => {
  try {
    let workers

    if (req.user.role === "super_admin") {
      // Super admin can see all workers
      workers = await Worker.findAll()
    } else {
      // Company admin and worker manager can only see workers from their company
      workers = await Worker.findAll({
        where: { company_id: req.user.company_id },
      })
    }

    res.json(workers)
  } catch (err) {
    console.error("Error fetching workers:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new worker
router.post("/", authenticateToken, restrictTo("company_admin"), upload.single("photo"), async (req, res) => {
  try {
    const { name, bankName, accountNumber, regdate } = req.body

    const worker = await Worker.create({
      name,
      bank_name: bankName,
      account_number: accountNumber,
      registration_date: regdate || new Date().toISOString().split("T")[0],
      photo_url: req.file ? `/uploads/${req.file.filename}` : null,
      company_id: req.user.company_id,
      status: "active",
      overtime_hours: 0,
    })

    res.status(201).json(worker)
  } catch (err) {
    console.error("Error creating worker:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Update worker status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const worker = await Worker.findByPk(id)
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" })
    }

    // Check if user has permission to update this worker
    if (req.user.role !== "super_admin" && worker.company_id !== req.user.company_id) {
      return res.status(403).json({ message: "You can only update workers from your company" })
    }

    worker.status = status
    await worker.save()

    res.json({ message: `Worker status updated to ${status}` })
  } catch (err) {
    console.error("Error updating worker status:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete worker
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const worker = await Worker.findByPk(id)
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" })
    }

    // Check if user has permission to delete this worker
    if (req.user.role !== "super_admin" && worker.company_id !== req.user.company_id) {
      return res.status(403).json({ message: "You can only delete workers from your company" })
    }

    // Delete worker photo if exists
    if (worker.photo_url) {
      const photoPath = path.join(__dirname, "..", worker.photo_url)
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath)
      }
    }

    await worker.destroy()

    res.json({ message: "Worker deleted successfully" })
  } catch (err) {
    console.error("Error deleting worker:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Apply overtime to workers
router.post("/overtime", authenticateToken, restrictTo("company_admin"), async (req, res) => {
  try {
    const { workerId, hours, allWorkers, deduct } = req.body

    if (allWorkers) {
      // Apply overtime to all workers in the company
      const workers = await Worker.findAll({
        where: {
          company_id: req.user.company_id,
          status: "active",
        },
      })

      for (const worker of workers) {
        const currentHours = Number.parseFloat(worker.overtime_hours || 0)
        const newHours = deduct
          ? Math.max(0, currentHours - Number.parseFloat(hours))
          : currentHours + Number.parseFloat(hours)

        worker.overtime_hours = newHours
        await worker.save()
      }

      res.json({
        message: deduct
          ? `Deducted ${hours} overtime hours from all workers`
          : `Added ${hours} overtime hours to all workers`,
      })
    } else {
      // Apply overtime to a specific worker
      const worker = await Worker.findByPk(workerId)

      if (!worker) {
        return res.status(404).json({ message: "Worker not found" })
      }

      if (worker.company_id !== req.user.company_id) {
        return res.status(403).json({ message: "You can only update workers from your company" })
      }

      const currentHours = Number.parseFloat(worker.overtime_hours || 0)
      const newHours = deduct
        ? Math.max(0, currentHours - Number.parseFloat(hours))
        : currentHours + Number.parseFloat(hours)

      worker.overtime_hours = newHours
      await worker.save()

      res.json({
        message: deduct
          ? `Deducted ${hours} overtime hours from worker ${worker.name}`
          : `Added ${hours} overtime hours to worker ${worker.name}`,
      })
    }
  } catch (err) {
    console.error("Error applying overtime:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Calculate payroll for a date range
router.get("/payroll", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" })
    }

    // Get workers for the company
    let workers
    if (req.user.role === "super_admin") {
      workers = await Worker.findAll()
    } else {
      workers = await Worker.findAll({
        where: { company_id: req.user.company_id },
      })
    }

    // Get payroll rules
    const company = await Company.findByPk(req.user.company_id)
    const payrollRules = {
      standard_working_hours: 8,
      daily_rate: company?.daily_rate || 400,
      overtime_rate: company?.overtime_rate || 100,
    }

    // Calculate days between start and end dates (inclusive)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1

    // Calculate payroll for each worker
    const payrollData = workers.map((worker) => {
      // Only count active workers
      const isActive = worker.status === "active"
      const daysWorked = isActive ? daysDiff : 0
      const regularHours = daysWorked * payrollRules.standard_working_hours
      const overtimeHours = Number.parseFloat(worker.overtime_hours || 0)

      const dailyPay = daysWorked * payrollRules.daily_rate
      const overtimePay = overtimeHours * payrollRules.overtime_rate
      const totalSalary = dailyPay + overtimePay

      return {
        workerId: worker.id,
        name: worker.name,
        daysWorked,
        regularHours,
        overtimeHours,
        dailyPay,
        overtimePay,
        totalSalary,
        bankName: worker.bank_name,
        accountNumber: worker.account_number,
      }
    })

    res.json(payrollData)
  } catch (err) {
    console.error("Error calculating payroll:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

