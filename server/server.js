require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { sequelize } = require('./models');
const companyRoutes = require('./routes/companyRoutes');
const payrollRuleRoutes = require('./routes/payrollRuleRoutes');
const workLogRoutes = require('./routes/workLogRoutes');
const authRoutes = require('./routes/authRoutes');
const workerManagerRoutes = require('./routes/workerManagerRoutes');
const overtimeRoutes = require('./routes/overtimeRoutes');
const pendingRequestRoutes = require('./routes/pendingRequestRoutes');
const exportRoutes = require('./routes/exportRoutes');
const workerRoutes = require('./routes/workerRoutes');
const companyAdminRoutes = require('./routes/companyAdminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { authenticateToken, restrictTo } = require('./middleware/auth');

console.log('Environment variables:', {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
});

const PORT = process.env.PORT || 3001;

const app = express();

// Configure CORS
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3002'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware (sanitize in production)
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    cookies: req.cookies,
  });
  next();
});

// Public routes
app.get('/', (req, res) => {
  res.send('Labor Management API is running!');
});

// Mount routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/companies', authenticateToken, restrictTo('super_admin'), companyRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/payroll-rules', payrollRuleRoutes);
app.use('/api/work-logs', authenticateToken, restrictTo('company_admin'), workLogRoutes);
app.use('/api/worker-managers', workerManagerRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/pending-requests', pendingRequestRoutes);
app.use('/api/export', exportRoutes);
app.use('/api', companyAdminRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res, next) => {
  console.log('Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ error: 'The provided value must be unique' });
  }
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = app;