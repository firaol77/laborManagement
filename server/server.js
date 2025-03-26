const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("./utils/logger");
const sequelize = require("./config/database");
const { networkInterfaces } = require("os");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

function getNetworkIP() {
  const nets = networkInterfaces();
  const results = [];

  for (const [name, interfaces] of Object.entries(nets)) {
    for (const net of interfaces) {
      if (net.family === "IPv4" && !net.internal) {
        results.push({
          name,
          address: net.address,
          netmask: net.netmask,
        });
        logger.debug(`Found network interface: ${name} - ${net.address}`);
      }
    }
  }

  const preferredIP = results.find(iface => iface.address === "10.1.15.4");
  if (preferredIP) {
    logger.info(`Using preferred network IP: ${preferredIP.address}`);
    return preferredIP.address;
  }

  const localNetworkIP = results.find(iface => iface.address.startsWith("10."));
  if (localNetworkIP) {
    logger.info(`Using local network IP: ${localNetworkIP.address}`);
    return localNetworkIP.address;
  }

  if (results.length > 0) {
    logger.info(`Using first available network IP: ${results[0].address}`);
    return results[0].address;
  }

  logger.warn('No external network interfaces found, falling back to localhost');
  return "127.0.0.1";
}

const NETWORK_IP = process.env.NETWORK_IP || getNetworkIP();
const PORT = process.env.PORT || 3001;

const app = express();

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later'
}));

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3002",
      `http://${NETWORK_IP}:3000`,
      `http://${NETWORK_IP}:3002`,
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Disposition"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static("uploads", {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  });
  next();
});

app.get("/api/server-info", (req, res) => {
  res.json({
    status: "online",
    apiVersion: "1.0.0",
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: `/api/auth`,
      companies: `/api/companies`,
      workers: `/api/workers`,
      pendingRequests: `/api/pending-requests`,
      workerManagers: `/api/worker-managers`
    }
  });
});

const routes = [
  require("./routes/authRoutes"),
  require("./routes/companyRoutes"),
  require("./routes/adminRoutes"),
  require("./routes/workerManagerRoutes"),
  require("./routes/workerRoutes"),
  require("./routes/pendingRequestRoutes")
];

routes.forEach(route => {
  app.use('/api', route);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    code: err.code || 'SERVER_ERROR'
  });
});

sequelize.authenticate()
  .then(() => {
    logger.info('Database connection established');
    return sequelize.sync({
      alter: true,
      force: false,
      logging: msg => logger.info(msg)
    });
  })
  .then(() => {
    logger.info('Database synchronization complete');
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT}`);
      console.log('\nServer accessible at:');
      console.log(`- Local:    http://localhost:${PORT}`);
      console.log(`- Network:  http://${NETWORK_IP}:${PORT}\n`);
      console.log('Available API Endpoints:');
      app._router.stack.forEach(middleware => {
        if (middleware.route) {
          console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        }
      });
    });
  })
  .catch(err => {
    logger.error('Database connection failed', { error: err.message });
    process.exit(1);
  });

module.exports = app;