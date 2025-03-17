require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const companyRoutes = require('./routes/companyRoutes'); 
const laborWorkerRoutes = require('./routes/laborWorkerRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const payrollRuleRoutes = require('./routes/payrollRuleRoutes'); 
const workLogRoutes = require('./routes/workLogRoutes'); 
const authRoutes = require('./routes/authRoutes');
const { authenticateToken, restrictTo } = require('./middleware/auth'); 
const workerManagerRoutes = require('./routes/workerManagerRoutes');
const overtimeRoutes = require('./routes/overtimeRoutes');
const pendingRequestRoutes = require('./routes/pendingRequestRoutes');
const exportRoutes = require('./routes/exportRoutes');
const workerRoutes = require('./routes/workerRoutes');

console.log('Environment variables:', {
    PORT: process.env.PORT,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT
});

const PORT = process.env.PORT || 3001;

// Middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body
    });
    next();
});

// Public routes
app.get('/', (req, res) => {
    res.send('Labor Management API is running!');
});

// Auth routes (login/register don't need authentication)
app.use('/api/auth', authRoutes);

// Protected routes
// Super Admin routes
app.use('/api/companies', authenticateToken, restrictTo('super_admin'), companyRoutes);
const companyAdminRoutes = require('./routes/companyAdminRoutes');
app.use('/api', companyAdminRoutes); // Mount under /api for consistency

// Company Admin routes
app.use('/api/workers', authenticateToken, restrictTo('company_admin'), laborWorkerRoutes);
app.use('/api/payment-methods', authenticateToken, restrictTo('super_admin'), paymentMethodRoutes);
app.use('/api/payroll-rules', authenticateToken, restrictTo('company_admin'), payrollRuleRoutes);
app.use('/api/work-logs', authenticateToken, restrictTo('company_admin'), workLogRoutes);

// Routes
app.use('/api/worker-managers', workerManagerRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/pending-requests', pendingRequestRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/workers', workerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Database connection and server start
sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = app;