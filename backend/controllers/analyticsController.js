const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role === 'admin') {
      const [totalUsers, totalProjects, totalTasks, recentActivity] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Task.countDocuments(),
        ActivityLog.find().sort('-createdAt').limit(10).populate('user', 'name avatar')
      ]);

      const projectsByStatus = await Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const usersByRole = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      const monthlyProjects = await Project.aggregate([
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]);

      return res.json({ totalUsers, totalProjects, totalTasks, projectsByStatus, usersByRole, monthlyProjects, recentActivity });
    }

    if (role === 'faculty') {
      const projects = await Project.find({ faculty: _id });
      const projectIds = projects.map(p => p._id);
      const tasks = await Task.find({ project: { $in: projectIds } });

      const stats = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        pendingApprovals: projects.filter(p => p.approvalStatus === 'pending').length
      };

      return res.json(stats);
    }

    // Student
    const projects = await Project.find({ $or: [{ owner: _id }, { members: _id }] });
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } });

    const stats = {
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      overdueTasks: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
      avgProgress: projects.length
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectAnalytics = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId });
    const byStatus = { todo: 0, in_progress: 0, completed: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };

    tasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });

    res.json({ byStatus, byPriority, total: tasks.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
