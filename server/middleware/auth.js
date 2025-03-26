const jwt = require("jsonwebtoken");
const { CompanyAdmin, WorkerManager } = require("../models");
const { logger } = require("../utils/logger");

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      logger.warn("No token found in cookies");
      return res.status(401).json({ 
        error: "Authentication required",
        code: "UNAUTHENTICATED"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "1234");
    
    // Find user based on role
    let user;
    if (decoded.role === "company_admin") {
      user = await CompanyAdmin.findByPk(decoded.id);
    } else if (decoded.role === "worker_manager") {
      user = await WorkerManager.findByPk(decoded.id);
    }

    if (!user) {
      logger.warn(`User not found for ID: ${decoded.id}`);
      return res.status(403).json({ 
        error: "User account not found",
        code: "USER_NOT_FOUND"
      });
    }

    if (user.status !== "active") {
      logger.warn(`User account inactive for ID: ${decoded.id}`);
      return res.status(403).json({ 
        error: "Account is deactivated",
        code: "ACCOUNT_DEACTIVATED"
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      company_id: user.company_id,
      username: user.username
    };

    next();
  } catch (err) {
    logger.error(`Authentication error: ${err.message}`);
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        error: "Session expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    return res.status(403).json({ 
      error: "Invalid authentication token",
      code: "INVALID_TOKEN"
    });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ 
      error: "Super admin access required",
      code: "SUPER_ADMIN_REQUIRED"
    });
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS"
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  restrictTo
};