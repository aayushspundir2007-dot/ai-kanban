const router = require('express').Router();
const { calculateContribution, getContribution } = require('../controllers/contributionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:projectId', protect, getContribution);
router.post('/:projectId/calculate', protect, authorize('faculty', 'admin'), calculateContribution);

module.exports = router;
