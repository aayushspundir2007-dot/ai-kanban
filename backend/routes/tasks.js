const router = require('express').Router();
const {
  getTasks, createTask, updateTask, deleteTask, reorderTasks,
  setBlocker, resolveBlocker, logTime, uploadDeliverable
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/project/:projectId', protect, getTasks);
router.post('/project/:projectId', protect, createTask);
router.put('/reorder', protect, reorderTasks);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

// Feature 1 — Blockers
router.post('/:id/block', protect, setBlocker);
router.delete('/:id/block', protect, resolveBlocker);

// Feature 3 — Time tracking
router.post('/:id/time-entry', protect, logTime);

// Feature 5 — Deliverable upload + anomaly scan
router.post('/:id/deliverable', protect, upload.single('file'), uploadDeliverable);

module.exports = router;
