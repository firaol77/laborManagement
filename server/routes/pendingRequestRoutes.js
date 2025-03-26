const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { authenticateToken, restrictTo } = require("../middleware/auth")
const { PendingRequest, Worker } = require("../models")

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

// Get all pending requests (Company Admin only)
router.get("/", authenticateToken, restrictTo("company_admin"), async (req, res) => {
  try {
    const requests = await PendingRequest.findAll({
      where: { company_id: req.user.company_id },
      order: [["created_at", "DESC"]],
    })

    res.json(requests)
  } catch (err) {
    console.error("Error fetching pending requests:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Get my pending requests (Worker Manager only)
router.get("/my", authenticateToken, restrictTo("worker_manager"), async (req, res) => {
  try {
    const requests = await PendingRequest.findAll({
      where: {
        created_by: req.user.id,
        company_id: req.user.company_id,
      },
      order: [["created_at", "DESC"]],
    })

    res.json(requests)
  } catch (err) {
    console.error("Error fetching my pending requests:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new pending request
router.post("/", authenticateToken, restrictTo("worker_manager"), upload.single("photo"), async (req, res) => {
  try {
    const { type, details } = req.body
    let requestData = {}

    if (type === "new_worker") {
      // Parse the details JSON
      const parsedDetails = JSON.parse(details)

      // Add photo_url if a photo was uploaded
      if (req.file) {
        parsedDetails.photo_url = `/uploads/${req.file.filename}`
      }

      requestData = parsedDetails
    } else {
      // For other request types
      requestData = JSON.parse(details)
    }

    const request = await PendingRequest.create({
      request_type: type,
      request_data: requestData,
      status: "pending",
      company_id: req.user.company_id,
      created_by: req.user.id,
      created_by_username: req.user.username,
    })

    res.status(201).json(request)
  } catch (err) {
    console.error("Error creating pending request:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Approve or reject a pending request
router.post("/:id", authenticateToken, restrictTo("company_admin"), async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body

    const request = await PendingRequest.findByPk(id)
    if (!request) {
      return res.status(404).json({ message: "Request not found" })
    }

    if (request.company_id !== req.user.company_id) {
      return res.status(403).json({ message: "You can only manage requests from your company" })
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed" })
    }

    if (action === "approve") {
      // Process the request based on its type
      if (request.request_type === "new_worker") {
        // Create a new worker
        await Worker.create({
          name: request.request_data.name,
          photo_url: request.request_data.photo_url,
          bank_name: request.request_data.bankName,
          account_number: request.request_data.accountNumber,
          registration_date: request.request_data.regdate || new Date().toISOString().split("T")[0],
          company_id: req.user.company_id,
          status: "active",
          overtime_hours: 0,
        })
      } else if (request.request_type === "overtime_individual") {
        // Apply overtime to a specific worker
        const worker = await Worker.findByPk(request.request_data.workerId)
        if (worker) {
          const currentHours = Number.parseFloat(worker.overtime_hours || 0)
          const newHours = request.request_data.deduct
            ? Math.max(0, currentHours - Number.parseFloat(request.request_data.hours))
            : currentHours + Number.parseFloat(request.request_data.hours)

          worker.overtime_hours = newHours
          await worker.save()
        }
      } else if (request.request_type === "overtime_group") {
        // Apply overtime to all workers in the company
        const workers = await Worker.findAll({
          where: {
            company_id: req.user.company_id,
            status: "active",
          },
        })

        for (const worker of workers) {
          const currentHours = Number.parseFloat(worker.overtime_hours || 0)
          const newHours = request.request_data.deduct
            ? Math.max(0, currentHours - Number.parseFloat(request.request_data.hours))
            : currentHours + Number.parseFloat(request.request_data.hours)

          worker.overtime_hours = newHours
          await worker.save()
        }
      }

      request.status = "approved"
    } else {
      request.status = "rejected"
    }

    await request.save()

    res.json({
      message: `Request ${action === "approve" ? "approved" : "rejected"} successfully`,
    })
  } catch (err) {
    console.error("Error processing pending request:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Approve all pending requests
router.post("/approve-all", authenticateToken, restrictTo("company_admin"), async (req, res) => {
  try {
    const pendingRequests = await PendingRequest.findAll({
      where: {
        company_id: req.user.company_id,
        status: "pending",
      },
    })

    for (const request of pendingRequests) {
      // Process the request based on its type
      if (request.request_type === "new_worker") {
        // Create a new worker
        await Worker.create({
          name: request.request_data.name,
          photo_url: request.request_data.photo_url,
          bank_name: request.request_data.bankName,
          account_number: request.request_data.accountNumber,
          registration_date: request.request_data.regdate || new Date().toISOString().split("T")[0],
          company_id: req.user.company_id,
          status: "active",
          overtime_hours: 0,
        })
      } else if (request.request_type === "overtime_individual") {
        // Apply overtime to a specific worker
        const worker = await Worker.findByPk(request.request_data.workerId)
        if (worker) {
          const currentHours = Number.parseFloat(worker.overtime_hours || 0)
          const newHours = request.request_data.deduct
            ? Math.max(0, currentHours - Number.parseFloat(request.request_data.hours))
            : currentHours + Number.parseFloat(request.request_data.hours)

          worker.overtime_hours = newHours
          await worker.save()
        }
      } else if (request.request_type === "overtime_group") {
        // Apply overtime to all workers in the company
        const workers = await Worker.findAll({
          where: {
            company_id: req.user.company_id,
            status: "active",
          },
        })

        for (const worker of workers) {
          const currentHours = Number.parseFloat(worker.overtime_hours || 0)
          const newHours = request.request_data.deduct
            ? Math.max(0, currentHours - Number.parseFloat(request.request_data.hours))
            : currentHours + Number.parseFloat(request.request_data.hours)

          worker.overtime_hours = newHours
          await worker.save()
        }
      }

      request.status = "approved"
      await request.save()
    }

    res.json({
      message: `All pending requests approved successfully`,
      count: pendingRequests.length,
    })
  } catch (err) {
    console.error("Error approving all pending requests:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

