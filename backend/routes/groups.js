const router = require('express').Router();
const { generateGroups, getFormation, updateSkills, getMySkills } = require('../controllers/groupController');
const { protect, authorize } = require('../middleware/auth');

router.get('/skills/me', protect, getMySkills);
router.put('/skills/me', protect, updateSkills);
router.post('/generate', protect, authorize('faculty', 'admin'), generateGroups);
router.get('/:id', protect, getFormation);

module.exports = router;
