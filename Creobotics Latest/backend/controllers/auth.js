const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/profile/setup', auth, authController.completeProfileSetup);
router.put('/change-password', auth, authController.changePassword);
router.post('/logout', auth, authController.logout);

module.exports = router;