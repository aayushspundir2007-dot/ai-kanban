const Portfolio = require('../models/Portfolio');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ContributionMatrix = require('../models/ContributionMatrix');
const OpenAI = require('openai');
const crypto = require('crypto');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Generate portfolio (Feature 11) ─────────────────────────────────────────
exports.generatePortfolio = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId)
      .populate('owner', 'name')
      .populate('faculty', 'name');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.progress < 100) {
      return res.status(400).json({ message: 'Portfolio can only be generated for completed projects (100%)' });
    }

    // Get student's tasks
    const myTasks = await Task.find({
      project: projectId,
      $or: [{ assignedTo: userId }, { createdBy: userId }],
      status: 'completed'
    });

    // Get contribution data
    const contribution = await ContributionMatrix.findOne({ project: projectId, student: userId });

    const contributions = myTasks.map(t => ({
      taskTitle: t.title,
      description: t.description,
      hoursSpent: t.actualHours || t.estimatedHours || 0,
      deliverables: t.deliverables?.map(d => d.name) || [],
      impact: t.labels?.join(', ') || 'General contribution'
    }));

    // AI-generated professional summary
    const prompt = `Write a professional project portfolio summary for a university student.

Project: "${project.title}" (${project.type})
Description: ${project.description}
Student's completed tasks: ${myTasks.map(t => t.title).join(', ')}
Total hours contributed: ${contribution?.metrics?.totalHoursLogged || 0}h
Contribution score: ${contribution?.contributionScore || 0}/100
Suggested grade: ${contribution?.suggestedGrade || 'N/A'}

Write a compelling 3-paragraph portfolio summary that:
1. Describes the project and its impact
2. Highlights the student's specific contributions and skills demonstrated
3. Summarizes outcomes and what was learned

Keep it professional, suitable for a LinkedIn/resume portfolio.`;

    let aiSummary = 'Portfolio generated from project data.';
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 600
      });
      aiSummary = response.choices[0].message.content;
    } catch { /* use default */ }

    // Extract skills from tasks
    const skills = [...new Set(myTasks.flatMap(t => t.labels || []))];

    const publicSlug = crypto.randomBytes(8).toString('hex');

    const portfolio = await Portfolio.findOneAndUpdate(
      { project: projectId, student: userId },
      {
        title: `${project.title} — Portfolio`,
        summary: project.description,
        contributions,
        skills,
        aiGeneratedSummary: aiSummary,
        publicSlug,
        isPublic: true,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Save portfolio URL to project
    await Project.findByIdAndUpdate(projectId, {
      portfolioUrl: `/portfolio/${publicSlug}`,
      portfolioGeneratedAt: new Date()
    });

    res.json({
      portfolio,
      shareUrl: `${process.env.CLIENT_URL}/portfolio/${publicSlug}`
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── View portfolio by slug (public) ─────────────────────────────────────────
exports.viewPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ publicSlug: req.params.slug, isPublic: true })
      .populate('student', 'name department avatar')
      .populate('project', 'title type description deadline');

    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    portfolio.views += 1;
    await portfolio.save();

    res.json(portfolio);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get my portfolios ────────────────────────────────────────────────────────
exports.getMyPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ student: req.user._id })
      .populate('project', 'title type progress')
      .sort('-generatedAt');
    res.json(portfolios);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
