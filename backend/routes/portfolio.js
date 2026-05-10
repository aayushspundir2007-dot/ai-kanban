const router = require('express').Router();
const { generatePortfolio, viewPortfolio, getMyPortfolios } = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');

router.get('/view/:slug', viewPortfolio); // public
router.get('/me', protect, getMyPortfolios);
router.post('/generate/:projectId', protect, generatePortfolio);

module.exports = router;
