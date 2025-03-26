const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { CompanyAdmin, WorkerManager, Company } = require("../models");
const { logger } = require("../utils/logger");
require("dotenv").config();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
        code: "MISSING_CREDENTIALS"
      });
    }

    // Find user (admin or worker manager)
    let user = await CompanyAdmin.findOne({ where: { username } }) || 
               await WorkerManager.findOne({ where: { username } });

    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${username}`);
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Password verification
    const passwordValid = user.password.startsWith("$2b$") ? 
      await bcrypt.compare(password, user.password) : 
      user.password === password;

    if (!passwordValid) {
      logger.warn(`Invalid password for user: ${username}`);
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Account status check
    if (user.status !== "active") {
      logger.warn(`Login attempt for inactive account: ${username}`);
      return res.status(403).json({
        error: "Account is deactivated",
        code: "ACCOUNT_DEACTIVATED"
      });
    }

    // Additional checks for worker managers
    if (user.role === "worker_manager") {
      const company = await Company.findByPk(user.company_id);
      if (!company || company.status !== "active") {
        return res.status(403).json({
          error: "Company is deactivated",
          code: "COMPANY_DEACTIVATED"
        });
      }
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
      },
      process.env.JWT_SECRET || "1234",
      { expiresIn: "24h" }
    );

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    // Return user data without sensitive info
    const { password: _, ...userData } = user.toJSON();
    logger.info(`Successful login for ${user.role}: ${user.username}`);

    res.json({
      success: true,
      user: userData
    });

  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR"
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;