const express = require("express")
const router = express.Router()
const { authenticateToken, restrictTo } = require("../middleware/auth")
const { PayrollRule } = require("../models")

// Get payroll rules for the current company
router.get("/", authenticateToken, async (req, res) => {
  try {
    let payrollRule = await PayrollRule.findOne({
      where: { company_id: req.user.company_id },
    })

    // If no rules exist, create default rules
    if (!payrollRule) {
      payrollRule = await PayrollRule.create({
        company_id: req.user.company_id,
        standard_working_hours: 8,
        daily_rate: 400,
        overtime_rate: 100,
      })
    }

    res.json(payrollRule)
  } catch (err) {
    console.error("Error fetching payroll rules:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Update payroll rules (Company Admin only)
router.post("/", authenticateToken, restrictTo("company_admin"), async (req, res) => {
  try {
    const { standard_working_hours, daily_rate, overtime_rate } = req.body

    // Find existing rules or create new ones
    let payrollRule = await PayrollRule.findOne({
      where: { company_id: req.user.company_id },
    })

    if (payrollRule) {
      // Update existing rules
      payrollRule.standard_working_hours = standard_working_hours
      payrollRule.daily_rate = daily_rate
      payrollRule.overtime_rate = overtime_rate
      await payrollRule.save()
    } else {
      // Create new rules
      payrollRule = await PayrollRule.create({
        company_id: req.user.company_id,
        standard_working_hours,
        daily_rate,
        overtime_rate,
      })
    }

    res.json({
      message: "Payroll rules updated successfully",
      payrollRule,
    })
  } catch (err) {
    console.error("Error updating payroll rules:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

