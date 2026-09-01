const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', progressController.getProgress);
router.post('/attempt', progressController.recordAttempt);
router.delete('/reset', progressController.resetProgress);
router.get('/modules', progressController.getModules);

module.exports = router;