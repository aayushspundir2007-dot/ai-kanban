const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL, /\.netlify\.app$/]
    : '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ── Core routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

// ── AI & Veronica ────────────────────────────────────────────────────────────
app.use('/api/ai', require('./routes/ai'));
app.use('/api/veronica', require('./routes/veronica'));

// ── Feature 2: Standups ──────────────────────────────────────────────────────
app.use('/api/standups', require('./routes/standups'));

// ── Feature 3 & 6: Health + Burndown ────────────────────────────────────────
app.use('/api/health', require('./routes/health'));

// ── Feature 4: Contribution Matrix ──────────────────────────────────────────
app.use('/api/contribution', require('./routes/contribution'));

// ── Feature 8: Webhooks ──────────────────────────────────────────────────────
app.use('/api/webhooks', require('./routes/webhooks'));

// ── Feature 9: Stakeholder Portal ───────────────────────────────────────────
app.use('/api/stakeholders', require('./routes/stakeholders'));

// ── Feature 10: Groups & Skills ─────────────────────────────────────────────
app.use('/api/groups', require('./routes/groups'));

// ── Feature 11: Portfolio ────────────────────────────────────────────────────
app.use('/api/portfolio', require('./routes/portfolio'));

// ── Classroom features ───────────────────────────────────────────────────────
app.use('/api/classes', require('./routes/classes'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/whiteboard', require('./routes/whiteboard'));

app.get('/api/health-check', (req, res) =>
  res.json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
);

// ── Startup ──────────────────────────────────────────────────────────────────
async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('placeholder')) {
    console.log('Starting in-memory MongoDB...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    console.log('In-memory MongoDB:', mongoUri);
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server → http://localhost:${PORT}`));

  await seedDemoData();

  try { require('./jobs/deadlineReminder'); } catch (e) { /* skip */ }
  try { require('./jobs/standupReminder'); } catch (e) { /* skip */ }
}

async function seedDemoData() {
  const User = require('./models/User');
  const Subscription = require('./models/Subscription');
  const Project = require('./models/Project');
  const Task = require('./models/Task');

  const exists = await User.findOne({ email: 'admin@demo.com' });
  if (exists) return;

  console.log('Seeding demo users...');
  const demos = [
    { name: 'Admin User', email: 'admin@demo.com', password: 'password123', role: 'admin', department: 'Administration' },
    { name: 'Dr. Sharma', email: 'faculty@demo.com', password: 'password123', role: 'faculty', department: 'Computer Science' },
    { name: 'Rahul Student', email: 'student@demo.com', password: 'password123', role: 'student', department: 'CSE', enrollmentId: 'CSE2024001',
      skills: [{ name: 'React', category: 'technical', level: 'intermediate' }, { name: 'Node.js', category: 'technical', level: 'beginner' }] },
    { name: 'Priya Patel', email: 'student2@demo.com', password: 'password123', role: 'student', department: 'ECE', enrollmentId: 'ECE2024002',
      skills: [{ name: 'Python', category: 'technical', level: 'expert' }, { name: 'Research', category: 'research', level: 'intermediate' }] },
  ];

  const createdUsers = {};
  for (const d of demos) {
    const user = await User.create({ ...d, 'subscription.plan': 'premium' });
    await Subscription.create({
      user: user._id, plan: 'premium', status: 'active',
      features: { maxProjects: 999, aiFeatures: true, fileUpload: true, advancedAnalytics: true }
    });
    createdUsers[d.email] = user;
  }
  console.log('Demo users seeded ✓');

  // ── Demo Project ────────────────────────────────────────────────────────────
  console.log('Seeding demo project...');
  const student = createdUsers['student@demo.com'];
  const student2 = createdUsers['student2@demo.com'];
  const faculty = createdUsers['faculty@demo.com'];

  const now = new Date();
  const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

  const project = await Project.create({
    title: 'AI-Powered Smart Campus System',
    description: 'A full-stack web application that uses machine learning to optimize campus resource allocation, predict student performance, and automate administrative workflows. Built with React, Node.js, and Python ML models.',
    type: 'software',
    owner: student._id,
    members: [student._id, student2._id],
    faculty: faculty._id,
    status: 'active',
    approvalStatus: 'approved',
    deadline: daysFromNow(30),
    tags: ['AI', 'React', 'Node.js', 'Machine Learning', 'Full Stack'],
    progress: 35,
    healthScore: 72,
    totalStoryPoints: 55,
    healthBreakdown: { taskVelocity: 68, blockerResolutionTime: 80, communicationScore: 75, onTimeRate: 65 },
  });

  const tasks = [
    // Completed tasks
    { title: 'Project Setup & Repository Initialization', description: 'Initialize Git repo, set up folder structure, configure ESLint, Prettier, and CI/CD pipeline with GitHub Actions.', status: 'completed', priority: 'high', storyPoints: 3, estimatedHours: 4, actualHours: 3.5, assignedTo: student._id, deadline: daysFromNow(-20), order: 1, labels: ['setup', 'devops'] },
    { title: 'Design System & UI Component Library', description: 'Create reusable Tailwind-based component library including buttons, cards, modals, forms, and data tables.', status: 'completed', priority: 'high', storyPoints: 5, estimatedHours: 8, actualHours: 10, assignedTo: student._id, deadline: daysFromNow(-15), order: 2, labels: ['frontend', 'design'] },
    { title: 'User Authentication & JWT Implementation', description: 'Build secure login/register with bcrypt password hashing, JWT tokens, refresh token rotation, and role-based access control.', status: 'completed', priority: 'critical', storyPoints: 8, estimatedHours: 12, actualHours: 11, assignedTo: student._id, deadline: daysFromNow(-10), order: 3, labels: ['backend', 'security'] },
    { title: 'Database Schema Design & MongoDB Setup', description: 'Design normalized MongoDB schemas for users, courses, resources, and bookings. Set up indexes and validation rules.', status: 'completed', priority: 'high', storyPoints: 5, estimatedHours: 6, actualHours: 7, assignedTo: student2._id, deadline: daysFromNow(-8), order: 4, labels: ['backend', 'database'] },

    // In Progress
    { title: 'Student Performance Prediction ML Model', description: 'Train a Random Forest classifier on historical grade data to predict at-risk students. Integrate with Flask API endpoint for real-time predictions.', status: 'in_progress', priority: 'critical', storyPoints: 13, estimatedHours: 20, actualHours: 8, assignedTo: student2._id, deadline: daysFromNow(7), order: 5, labels: ['ml', 'python', 'ai'] },
    { title: 'Campus Resource Booking Dashboard', description: 'Build interactive dashboard for booking labs, classrooms, and equipment. Includes calendar view, conflict detection, and email confirmations.', status: 'in_progress', priority: 'high', storyPoints: 8, estimatedHours: 14, actualHours: 5, assignedTo: student._id, deadline: daysFromNow(10), order: 6, labels: ['frontend', 'dashboard'] },

    // Todo
    { title: 'Real-time Notifications with WebSockets', description: 'Implement Socket.io for live notifications: booking confirmations, class reminders, grade updates, and admin alerts.', status: 'todo', priority: 'medium', storyPoints: 5, estimatedHours: 8, assignedTo: student._id, deadline: daysFromNow(14), order: 7, labels: ['backend', 'realtime'] },
    { title: 'Admin Analytics & Reporting Module', description: 'Build admin panel with charts for resource utilization, student engagement metrics, and exportable PDF/CSV reports.', status: 'todo', priority: 'high', storyPoints: 8, estimatedHours: 12, assignedTo: student2._id, deadline: daysFromNow(18), order: 8, labels: ['frontend', 'analytics'] },
    { title: 'Mobile Responsive Optimization', description: 'Audit and fix all pages for mobile responsiveness. Test on iOS Safari, Android Chrome. Fix touch interactions and viewport issues.', status: 'todo', priority: 'medium', storyPoints: 3, estimatedHours: 5, assignedTo: student._id, deadline: daysFromNow(22), order: 9, labels: ['frontend', 'mobile'] },
    { title: 'API Documentation with Swagger', description: 'Document all REST API endpoints using Swagger/OpenAPI 3.0. Include request/response examples, auth headers, and error codes.', status: 'todo', priority: 'low', storyPoints: 3, estimatedHours: 4, assignedTo: student._id, deadline: daysFromNow(25), order: 10, labels: ['documentation'] },
    { title: 'Unit & Integration Testing Suite', description: 'Write Jest unit tests for all controllers and React components. Achieve minimum 70% code coverage. Set up test DB with fixtures.', status: 'todo', priority: 'high', storyPoints: 8, estimatedHours: 16, assignedTo: student2._id, deadline: daysFromNow(28), order: 11, labels: ['testing', 'quality'] },

    // Blocked
    { title: 'ML Model Deployment to Production', description: 'Containerize the Python ML model with Docker, deploy to cloud, and connect to the Node.js backend via REST API.', status: 'blocked', priority: 'critical', storyPoints: 8, estimatedHours: 10, assignedTo: student2._id, deadline: daysFromNow(12), order: 12, labels: ['devops', 'ml'], blockerNote: 'Blocked: ML model training not complete yet. Need student performance dataset approval from faculty.' },
  ];

  for (const t of tasks) {
    await Task.create({ ...t, project: project._id, createdBy: student._id });
  }

  // Update project progress based on tasks
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  await Project.findByIdAndUpdate(project._id, {
    progress: Math.round((completedCount / tasks.length) * 100)
  });

  console.log(`Demo project seeded ✓ (${tasks.length} tasks)`);
}

startServer().catch(err => { console.error('Startup error:', err); process.exit(1); });
