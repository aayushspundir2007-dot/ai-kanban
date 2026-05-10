const router = require('express').Router();
const Badge = require('../models/Badge');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Submission = require('../models/Submission');
const { protect } = require('../middleware/auth');

const BADGE_DEFS = {
  first_project: { title: 'Project Pioneer', description: 'Created your first project', icon: '🚀' },
  task_master: { title: 'Task Master', description: 'Completed 10 tasks', icon: '✅' },
  on_time: { title: 'On Time', description: 'Submitted 5 assignments before deadline', icon: '⏰' },
  collaborator: { title: 'Team Player', description: 'Joined 3 projects as a member', icon: '🤝' },
  top_student: { title: 'Top Student', description: 'Scored 90%+ on 3 assignments', icon: '🏆' },
  streak_7: { title: '7-Day Streak', description: 'Active for 7 consecutive days', icon: '🔥' },
  ai_user: { title: 'AI Explorer', description: 'Used AI features 5 times', icon: '🤖' },
  perfect_score: { title: 'Perfect Score', description: 'Got 100% on an assignment', icon: '💯' }
};

// Get leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('name department avatar');
    const leaderboard = await Promise.all(users.map(async (u) => {
      const completedTasks = await Task.countDocuments({ assignedTo: u._id, status: 'completed' });
      const projects = await Project.countDocuments({ $or: [{ owner: u._id }, { members: u._id }] });
      const badges = await Badge.countDocuments({ user: u._id });
      const submissions = await Submission.find({ student: u._id, status: 'graded' });
      const avgGrade = submissions.length
        ? Math.round(submissions.reduce((s, sub) => s + (sub.grade || 0), 0) / submissions.length)
        : 0;
      const score = (completedTasks * 10) + (projects * 20) + (badges * 15) + avgGrade;
      return { user: u, completedTasks, projects, badges, avgGrade, score };
    }));
    leaderboard.sort((a, b) => b.score - a.score);
    res.json(leaderboard.slice(0, 20));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get my badges
router.get('/badges/me', protect, async (req, res) => {
  try {
    const badges = await Badge.find({ user: req.user._id }).sort('-awardedAt');
    res.json(badges);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Check and award badges
router.post('/badges/check', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const awarded = [];

    const check = async (type, condition) => {
      const exists = await Badge.findOne({ user: userId, type });
      if (!exists && condition) {
        const def = BADGE_DEFS[type];
        const badge = await Badge.create({ user: userId, type, ...def });
        awarded.push(badge);
      }
    };

    const [projects, tasks, submissions] = await Promise.all([
      Project.countDocuments({ owner: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'completed' }),
      Submission.find({ student: userId, status: 'graded' })
    ]);

    const memberProjects = await Project.countDocuments({ members: userId });
    const onTimeSubs = submissions.filter(s => s.status !== 'late').length;
    const perfectSubs = submissions.filter(s => s.grade === 100).length;
    const topSubs = submissions.filter(s => s.grade >= 90).length;

    await check('first_project', projects >= 1);
    await check('task_master', tasks >= 10);
    await check('on_time', onTimeSubs >= 5);
    await check('collaborator', memberProjects >= 3);
    await check('top_student', topSubs >= 3);
    await check('perfect_score', perfectSubs >= 1);

    res.json({ awarded, total: await Badge.countDocuments({ user: userId }) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
