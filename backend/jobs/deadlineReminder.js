const cron = require('node-cron');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// Run every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tasks due within 24 hours
    const urgentTasks = await Task.find({
      deadline: { $gte: today, $lte: tomorrow },
      status: { $ne: 'completed' }
    }).populate('assignedTo', '_id name').populate('project', 'title');

    for (const task of urgentTasks) {
      if (task.assignedTo) {
        await Notification.create({
          recipient: task.assignedTo._id,
          type: 'deadline_reminder',
          title: 'Task Due Tomorrow',
          message: `Task "${task.title}" in project "${task.project?.title}" is due tomorrow.`,
          link: `/projects/${task.project?._id}`
        });
      }
    }

    // Projects due within 3 days
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);

    const urgentProjects = await Project.find({
      deadline: { $gte: today, $lte: threeDays },
      status: 'active'
    }).populate('owner', '_id');

    for (const project of urgentProjects) {
      await Notification.create({
        recipient: project.owner._id,
        type: 'deadline_reminder',
        title: 'Project Deadline Approaching',
        message: `Project "${project.title}" deadline is in 3 days or less.`,
        link: `/projects/${project._id}`
      });
    }

    console.log(`[CRON] Deadline reminders sent: ${urgentTasks.length} tasks, ${urgentProjects.length} projects`);
  } catch (err) {
    console.error('[CRON] Error:', err.message);
  }
});
