const router = require('express').Router();
const { getDashboardStats, getProjectAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/project/:projectId', protect, getProjectAnalytics);

module.exports = router;
