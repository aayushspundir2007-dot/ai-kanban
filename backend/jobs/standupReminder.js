const cron = require('node-cron');
const Project = require('../models/Project');
const StandupReport = require('../models/StandupReport');
const Notification = require('../models/Notification');

function getWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Every Monday at 9 AM — remind students to submit standup
cron.schedule('0 9 * * 1', async () => {
  try {
    const week = getWeekNumber();
    const year = new Date().getFullYear();

    const projects = await Project.find({ status: 'active' }).populate('members owner');

    for (const project of projects) {
      const allMembers = [project.owner, ...project.members].filter(Boolean);

      for (const member of allMembers) {
        const memberId = member._id || member;
        const submitted = await StandupReport.findOne({ project: project._id, student: memberId, week, year });

        if (!submitted) {
          await Notification.create({
            recipient: memberId,
            type: 'deadline_reminder',
            title: '📋 Weekly Standup Due',
            message: `Please submit your weekly standup for "${project.title}". 3 quick questions — takes 2 minutes!`,
            link: `/projects/${project._id}/standup`
          });
        }
      }
    }
    console.log('[CRON] Standup reminders sent');
  } catch (err) {
    console.error('[CRON] Standup reminder error:', err.message);
  }
});
