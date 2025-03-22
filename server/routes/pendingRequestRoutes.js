const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getPendingRequests, createRequest, handleRequest, approveAllRequests } = require('../controllers/pendingRequestController');
const { authenticateToken, restrictTo } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Debug middleware
router.use((req, res, next) => {
    console.log('PendingRequestRoutes accessed:', req.method, req.path);
    next();
});

// Company Admin: Fetch all pending requests
router.get('/', authenticateToken, restrictTo('company_admin'), getPendingRequests);

// Worker Manager: Fetch their own pending requests
router.get('/my', authenticateToken, restrictTo('worker_manager'), getPendingRequests);

// Worker Manager: Create a new pending request
router.post('/', authenticateToken, restrictTo('worker_manager'), upload.single('photo'), createRequest);

// Company Admin: Handle a specific request
router.post('/:id', authenticateToken, restrictTo('company_admin'), handleRequest); // Changed to POST to match controller

// Company Admin: Approve all pending requests
router.post('/approve-all', authenticateToken, restrictTo('company_admin'), approveAllRequests);

module.exports = router;