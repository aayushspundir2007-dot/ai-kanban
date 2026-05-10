const router = require('express').Router();
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, approveProject, uploadFile
} = require('../controllers/projectController');
const { protect, authorize, premiumOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getProjects);
router.post('/', protect, authorize('student'), createProject);
router.get('/:id', protect, getProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.put('/:id/approve', protect, authorize('faculty', 'admin'), approveProject);
router.post('/:id/upload', protect, premiumOnly, upload.single('file'), uploadFile);

module.exports = router;
