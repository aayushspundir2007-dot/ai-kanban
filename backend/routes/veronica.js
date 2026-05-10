const router = require('express').Router();
const { chat, getHistory, clearHistory, quickAction } = require('../controllers/veronicaController');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, chat);
router.get('/history', protect, getHistory);
router.delete('/history', protect, clearHistory);
router.post('/quick-action', protect, quickAction);

module.exports = router;
