const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireAdmin } = require('../middleware/auth');

router.use(auth);
router.use(requireAdmin);

// Serial key management
router.post('/serial-keys', adminController.generateSerialKeys);
router.get('/serial-keys', adminController.listSerialKeys);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:userId/progress', adminController.getUserProgress);

// Stats
router.get('/stats', adminController.getStats);

module.exports = router;