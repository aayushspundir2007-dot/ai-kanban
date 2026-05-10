const router = require('express').Router();
const { createToken, viewByToken, approveTask, listTokens, revokeToken } = require('../controllers/stakeholderController');
const { protect } = require('../middleware/auth');

// Public — no auth needed
router.get('/view/:token', viewByToken);
router.put('/view/:token/approve/:taskId', approveTask);

// Protected
router.post('/token', protect, createToken);
router.get('/project/:projectId', protect, listTokens);
router.delete('/token/:id', protect, revokeToken);

module.exports = router;
