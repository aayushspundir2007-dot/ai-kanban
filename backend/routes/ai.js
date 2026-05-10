const router = require('express').Router();
const {
  suggestTasks, predictDeadlineRisk, generateDocument,
  smartReminder, adaptiveLearning, engagementHeatmap, provisionResources
} = require('../controllers/aiController');
const { protect, premiumOnly } = require('../middleware/auth');

router.get('/suggest/:projectId', protect, premiumOnly, suggestTasks);
router.get('/risk/:projectId', protect, premiumOnly, predictDeadlineRisk);
router.post('/generate-doc', protect, premiumOnly, generateDocument);
router.get('/reminder/:taskId', protect, premiumOnly, smartReminder);
router.get('/adaptive', protect, premiumOnly, adaptiveLearning);
router.get('/heatmap/:userId?', protect, engagementHeatmap);
router.post('/resources/:taskId', protect, premiumOnly, provisionResources); // Feature 7

module.exports = router;
