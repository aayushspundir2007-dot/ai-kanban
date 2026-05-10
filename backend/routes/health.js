const router = require('express').Router();
const { getHealthScore, getBurndown } = require('../controllers/healthController');
const { protect } = require('../middleware/auth');

router.get('/:projectId', protect, getHealthScore);
router.get('/:projectId/burndown', protect, getBurndown);

module.exports = router;
