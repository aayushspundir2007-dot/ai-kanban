const router = require('express').Router();
const { submitStandup, getProjectStandups, getMyStandups, getWeeklyPrompt } = require('../controllers/standupController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('student'), submitStandup);
router.get('/project/:projectId', protect, authorize('faculty', 'admin'), getProjectStandups);
router.get('/my/:projectId', protect, getMyStandups);
router.get('/prompt/:projectId', protect, getWeeklyPrompt);

module.exports = router;
