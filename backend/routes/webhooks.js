const router = require('express').Router();
const { handleGithub, handleGitlab, handleFigma, getWebhookHistory } = require('../controllers/webhookController');
const { protect } = require('../middleware/auth');

// Public webhook endpoints (no auth — verified by secret header in production)
router.post('/github', handleGithub);
router.post('/gitlab', handleGitlab);
router.post('/figma', handleFigma);

// Authenticated history view
router.get('/project/:projectId', protect, getWebhookHistory);

module.exports = router;
