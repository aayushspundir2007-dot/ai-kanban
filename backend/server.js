const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Allow all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
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
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: MONGO_URI is required in production');
      process.exit(1);
    }
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
    { name: 'Dr. Mehta', email: 'faculty2@demo.com', password: 'password123', role: 'faculty', department: 'Electronics' },
    { name: 'Rahul Verma', email: 'student@demo.com', password: 'password123', role: 'student', department: 'CSE', enrollmentId: 'CSE2024001', skills: [{ name: 'React', category: 'technical', level: 'intermediate' }, { name: 'Node.js', category: 'technical', level: 'beginner' }] },
    { name: 'Priya Patel', email: 'student2@demo.com', password: 'password123', role: 'student', department: 'ECE', enrollmentId: 'ECE2024002', skills: [{ name: 'Python', category: 'technical', level: 'expert' }, { name: 'Research', category: 'research', level: 'intermediate' }] },
    { name: 'Arjun Singh', email: 'student3@demo.com', password: 'password123', role: 'student', department: 'CSE', enrollmentId: 'CSE2024003', skills: [{ name: 'Java', category: 'technical', level: 'intermediate' }, { name: 'Spring Boot', category: 'technical', level: 'beginner' }] },
    { name: 'Sneha Gupta', email: 'student4@demo.com', password: 'password123', role: 'student', department: 'IT', enrollmentId: 'IT2024004', skills: [{ name: 'UI/UX', category: 'design', level: 'expert' }, { name: 'Figma', category: 'design', level: 'intermediate' }] },
    { name: 'Karan Malhotra', email: 'student5@demo.com', password: 'password123', role: 'student', department: 'CSE', enrollmentId: 'CSE2024005', skills: [{ name: 'Machine Learning', category: 'technical', level: 'intermediate' }, { name: 'Python', category: 'technical', level: 'expert' }] },
    { name: 'Ananya Reddy', email: 'student6@demo.com', password: 'password123', role: 'student', department: 'ECE', enrollmentId: 'ECE2024006', skills: [{ name: 'IoT', category: 'technical', level: 'intermediate' }, { name: 'Arduino', category: 'technical', level: 'expert' }] },
    { name: 'Vikram Joshi', email: 'student7@demo.com', password: 'password123', role: 'student', department: 'IT', enrollmentId: 'IT2024007', skills: [{ name: 'DevOps', category: 'technical', level: 'intermediate' }, { name: 'Docker', category: 'technical', level: 'beginner' }] },
  ];

  const createdUsers = {};
  for (const d of demos) {
    const user = await User.create({ ...d, 'subscription.plan': 'premium' });
    await Subscription.create({ user: user._id, plan: 'premium', status: 'active', features: { maxProjects: 999, aiFeatures: true, fileUpload: true, advancedAnalytics: true } });
    createdUsers[d.email] = user;
  }
  console.log('Demo users seeded ✓');

  const s1 = createdUsers['student@demo.com'];
  const s2 = createdUsers['student2@demo.com'];
  const s3 = createdUsers['student3@demo.com'];
  const s4 = createdUsers['student4@demo.com'];
  const s5 = createdUsers['student5@demo.com'];
  const s6 = createdUsers['student6@demo.com'];
  const s7 = createdUsers['student7@demo.com'];
  const f1 = createdUsers['faculty@demo.com'];
  const f2 = createdUsers['faculty2@demo.com'];

  const now = new Date();
  const d = (days) => new Date(now.getTime() + days * 86400000);

  console.log('Seeding demo projects...');

  const projects = [
    {
      data: { title: 'AI-Powered Smart Campus System', description: 'ML-based campus resource optimization with student performance prediction. Built with React, Node.js, and Python.', type: 'software', owner: s1._id, members: [s1._id, s2._id, s3._id], faculty: f1._id, status: 'active', approvalStatus: 'approved', deadline: d(30), tags: ['AI', 'React', 'Node.js', 'ML'], progress: 40, healthScore: 72 },
      tasks: [
        { title: 'Project Setup & CI/CD Pipeline', status: 'completed', priority: 'high', assignedTo: s1._id, storyPoints: 3, estimatedHours: 4, deadline: d(-20), labels: ['devops'] },
        { title: 'JWT Authentication System', status: 'completed', priority: 'critical', assignedTo: s1._id, storyPoints: 8, estimatedHours: 12, deadline: d(-15), labels: ['backend', 'security'] },
        { title: 'MongoDB Schema Design', status: 'completed', priority: 'high', assignedTo: s2._id, storyPoints: 5, estimatedHours: 6, deadline: d(-10), labels: ['database'] },
        { title: 'ML Model Training', status: 'in_progress', priority: 'critical', assignedTo: s2._id, storyPoints: 13, estimatedHours: 20, deadline: d(7), labels: ['ml', 'python'] },
        { title: 'Resource Booking Dashboard', status: 'in_progress', priority: 'high', assignedTo: s3._id, storyPoints: 8, estimatedHours: 14, deadline: d(10), labels: ['frontend'] },
        { title: 'Real-time Notifications', status: 'todo', priority: 'medium', assignedTo: s1._id, storyPoints: 5, estimatedHours: 8, deadline: d(18), labels: ['backend'] },
        { title: 'Admin Analytics Module', status: 'todo', priority: 'high', assignedTo: s3._id, storyPoints: 8, estimatedHours: 12, deadline: d(22), labels: ['analytics'] },
        { title: 'ML Deployment to Production', status: 'blocked', priority: 'critical', assignedTo: s2._id, storyPoints: 8, estimatedHours: 10, deadline: d(12), labels: ['devops'], blockerNote: 'Waiting for dataset approval from faculty.' },
      ]
    },
    {
      data: { title: 'E-Learning Portal for Rural Schools', description: 'Offline-first web app delivering educational content to rural areas with low bandwidth support.', type: 'software', owner: s4._id, members: [s4._id, s5._id], faculty: f1._id, status: 'active', approvalStatus: 'approved', deadline: d(45), tags: ['Education', 'PWA', 'Offline'], progress: 60, healthScore: 85 },
      tasks: [
        { title: 'PWA Setup & Service Workers', status: 'completed', priority: 'high', assignedTo: s4._id, storyPoints: 5, estimatedHours: 8, deadline: d(-25), labels: ['frontend', 'pwa'] },
        { title: 'Content Management System', status: 'completed', priority: 'high', assignedTo: s5._id, storyPoints: 8, estimatedHours: 10, deadline: d(-18), labels: ['backend'] },
        { title: 'Video Compression Module', status: 'completed', priority: 'medium', assignedTo: s4._id, storyPoints: 5, estimatedHours: 6, deadline: d(-10), labels: ['media'] },
        { title: 'Quiz & Assessment Engine', status: 'in_progress', priority: 'high', assignedTo: s5._id, storyPoints: 8, estimatedHours: 12, deadline: d(8), labels: ['backend'] },
        { title: 'Student Progress Tracking', status: 'in_progress', priority: 'medium', assignedTo: s4._id, storyPoints: 5, estimatedHours: 8, deadline: d(15), labels: ['frontend'] },
        { title: 'Multilingual Support (Hindi/English)', status: 'todo', priority: 'medium', assignedTo: s5._id, storyPoints: 5, estimatedHours: 10, deadline: d(30), labels: ['i18n'] },
        { title: 'Deployment & Testing on Low-end Devices', status: 'todo', priority: 'high', assignedTo: s4._id, storyPoints: 3, estimatedHours: 6, deadline: d(40), labels: ['testing'] },
      ]
    },
    {
      data: { title: 'Smart Attendance System using Face Recognition', description: 'Automated attendance marking using OpenCV face recognition integrated with college ERP.', type: 'software', owner: s5._id, members: [s5._id, s6._id], faculty: f2._id, status: 'active', approvalStatus: 'approved', deadline: d(20), tags: ['Computer Vision', 'Python', 'OpenCV'], progress: 75, healthScore: 68 },
      tasks: [
        { title: 'Face Detection Model Training', status: 'completed', priority: 'critical', assignedTo: s5._id, storyPoints: 13, estimatedHours: 20, deadline: d(-30), labels: ['ml', 'python'] },
        { title: 'Camera Integration Module', status: 'completed', priority: 'high', assignedTo: s6._id, storyPoints: 5, estimatedHours: 8, deadline: d(-20), labels: ['hardware'] },
        { title: 'ERP API Integration', status: 'completed', priority: 'high', assignedTo: s5._id, storyPoints: 8, estimatedHours: 10, deadline: d(-12), labels: ['backend'] },
        { title: 'Admin Dashboard for Reports', status: 'in_progress', priority: 'high', assignedTo: s6._id, storyPoints: 5, estimatedHours: 8, deadline: d(5), labels: ['frontend'] },
        { title: 'Accuracy Testing & Optimization', status: 'in_progress', priority: 'critical', assignedTo: s5._id, storyPoints: 8, estimatedHours: 12, deadline: d(10), labels: ['testing', 'ml'] },
        { title: 'Deployment on Raspberry Pi', status: 'todo', priority: 'high', assignedTo: s6._id, storyPoints: 5, estimatedHours: 8, deadline: d(18), labels: ['devops', 'hardware'] },
      ]
    },
    {
      data: { title: 'IoT-Based Smart Greenhouse Monitoring', description: 'Real-time monitoring of temperature, humidity, and soil moisture using IoT sensors with automated alerts.', type: 'hardware', owner: s6._id, members: [s6._id, s7._id], faculty: f2._id, status: 'active', approvalStatus: 'approved', deadline: d(35), tags: ['IoT', 'Arduino', 'MQTT', 'Dashboard'], progress: 50, healthScore: 78 },
      tasks: [
        { title: 'Sensor Hardware Setup', status: 'completed', priority: 'critical', assignedTo: s6._id, storyPoints: 5, estimatedHours: 8, deadline: d(-20), labels: ['hardware', 'iot'] },
        { title: 'MQTT Broker Configuration', status: 'completed', priority: 'high', assignedTo: s7._id, storyPoints: 3, estimatedHours: 4, deadline: d(-15), labels: ['backend'] },
        { title: 'Data Collection & Storage API', status: 'completed', priority: 'high', assignedTo: s7._id, storyPoints: 5, estimatedHours: 6, deadline: d(-8), labels: ['backend'] },
        { title: 'Real-time Dashboard', status: 'in_progress', priority: 'high', assignedTo: s6._id, storyPoints: 8, estimatedHours: 10, deadline: d(10), labels: ['frontend'] },
        { title: 'Alert & Notification System', status: 'in_progress', priority: 'medium', assignedTo: s7._id, storyPoints: 5, estimatedHours: 6, deadline: d(15), labels: ['backend'] },
        { title: 'Mobile App for Monitoring', status: 'todo', priority: 'medium', assignedTo: s6._id, storyPoints: 8, estimatedHours: 14, deadline: d(28), labels: ['mobile'] },
        { title: 'Power Optimization & Battery Testing', status: 'todo', priority: 'low', assignedTo: s7._id, storyPoints: 3, estimatedHours: 5, deadline: d(32), labels: ['hardware'] },
      ]
    },
    {
      data: { title: 'Blockchain-Based Certificate Verification', description: 'Tamper-proof academic certificate issuance and verification using Ethereum smart contracts.', type: 'research', owner: s3._id, members: [s3._id, s7._id], faculty: f1._id, status: 'active', approvalStatus: 'approved', deadline: d(60), tags: ['Blockchain', 'Ethereum', 'Solidity', 'Web3'], progress: 25, healthScore: 60 },
      tasks: [
        { title: 'Smart Contract Development', status: 'completed', priority: 'critical', assignedTo: s3._id, storyPoints: 13, estimatedHours: 18, deadline: d(-15), labels: ['blockchain', 'solidity'] },
        { title: 'IPFS Integration for Document Storage', status: 'in_progress', priority: 'high', assignedTo: s7._id, storyPoints: 8, estimatedHours: 10, deadline: d(10), labels: ['backend'] },
        { title: 'Web3.js Frontend Integration', status: 'in_progress', priority: 'high', assignedTo: s3._id, storyPoints: 8, estimatedHours: 12, deadline: d(15), labels: ['frontend', 'web3'] },
        { title: 'Admin Portal for Certificate Issuance', status: 'todo', priority: 'high', assignedTo: s7._id, storyPoints: 5, estimatedHours: 8, deadline: d(30), labels: ['frontend'] },
        { title: 'QR Code Verification System', status: 'todo', priority: 'medium', assignedTo: s3._id, storyPoints: 5, estimatedHours: 6, deadline: d(40), labels: ['backend'] },
        { title: 'Security Audit & Testing', status: 'todo', priority: 'critical', assignedTo: s7._id, storyPoints: 8, estimatedHours: 12, deadline: d(55), labels: ['security', 'testing'] },
      ]
    },
    {
      data: { title: 'Mental Health Support Chatbot', description: 'NLP-based chatbot providing mental health resources and mood tracking for college students.', type: 'software', owner: s2._id, members: [s2._id, s4._id], faculty: f1._id, status: 'active', approvalStatus: 'approved', deadline: d(25), tags: ['NLP', 'Python', 'Mental Health', 'Chatbot'], progress: 55, healthScore: 80 },
      tasks: [
        { title: 'NLP Model Fine-tuning', status: 'completed', priority: 'critical', assignedTo: s2._id, storyPoints: 13, estimatedHours: 20, deadline: d(-20), labels: ['ml', 'nlp'] },
        { title: 'Mood Tracking Database Design', status: 'completed', priority: 'high', assignedTo: s4._id, storyPoints: 5, estimatedHours: 6, deadline: d(-12), labels: ['database'] },
        { title: 'Chat Interface UI', status: 'completed', priority: 'high', assignedTo: s4._id, storyPoints: 5, estimatedHours: 8, deadline: d(-6), labels: ['frontend', 'design'] },
        { title: 'Crisis Detection Algorithm', status: 'in_progress', priority: 'critical', assignedTo: s2._id, storyPoints: 8, estimatedHours: 12, deadline: d(5), labels: ['ml', 'safety'] },
        { title: 'Resource Recommendation Engine', status: 'in_progress', priority: 'high', assignedTo: s4._id, storyPoints: 5, estimatedHours: 8, deadline: d(12), labels: ['backend'] },
        { title: 'Privacy & Data Anonymization', status: 'todo', priority: 'critical', assignedTo: s2._id, storyPoints: 8, estimatedHours: 10, deadline: d(20), labels: ['security', 'privacy'] },
      ]
    },
    {
      data: { title: 'Automated Code Review Tool', description: 'Static analysis tool that reviews student code submissions for quality, plagiarism, and best practices.', type: 'software', owner: s7._id, members: [s7._id, s3._id], faculty: f1._id, status: 'active', approvalStatus: 'pending', deadline: d(50), tags: ['DevOps', 'Static Analysis', 'Docker', 'CI/CD'], progress: 20, healthScore: 55 },
      tasks: [
        { title: 'AST Parser Implementation', status: 'completed', priority: 'high', assignedTo: s3._id, storyPoints: 8, estimatedHours: 12, deadline: d(-10), labels: ['backend', 'parsing'] },
        { title: 'Plagiarism Detection Module', status: 'in_progress', priority: 'critical', assignedTo: s7._id, storyPoints: 13, estimatedHours: 18, deadline: d(12), labels: ['algorithm'] },
        { title: 'Docker Containerization', status: 'in_progress', priority: 'high', assignedTo: s7._id, storyPoints: 5, estimatedHours: 6, deadline: d(15), labels: ['devops', 'docker'] },
        { title: 'GitHub Actions Integration', status: 'todo', priority: 'high', assignedTo: s3._id, storyPoints: 5, estimatedHours: 8, deadline: d(25), labels: ['ci/cd'] },
        { title: 'Web Dashboard for Reports', status: 'todo', priority: 'medium', assignedTo: s7._id, storyPoints: 8, estimatedHours: 10, deadline: d(35), labels: ['frontend'] },
        { title: 'Performance Benchmarking', status: 'blocked', priority: 'high', assignedTo: s3._id, storyPoints: 5, estimatedHours: 8, deadline: d(20), labels: ['testing'], blockerNote: 'Waiting for test dataset from faculty.' },
      ]
    },
    {
      data: { title: 'Campus Navigation AR App', description: 'Augmented reality mobile app for indoor campus navigation using ARCore and floor plan mapping.', type: 'software', owner: s4._id, members: [s4._id, s6._id, s5._id], faculty: f2._id, status: 'active', approvalStatus: 'approved', deadline: d(40), tags: ['AR', 'Mobile', 'ARCore', 'Maps'], progress: 30, healthScore: 65 },
      tasks: [
        { title: 'Floor Plan Digitization', status: 'completed', priority: 'high', assignedTo: s4._id, storyPoints: 5, estimatedHours: 8, deadline: d(-18), labels: ['design', 'mapping'] },
        { title: 'ARCore SDK Integration', status: 'completed', priority: 'critical', assignedTo: s6._id, storyPoints: 8, estimatedHours: 12, deadline: d(-10), labels: ['ar', 'mobile'] },
        { title: 'Indoor Positioning Algorithm', status: 'in_progress', priority: 'critical', assignedTo: s5._id, storyPoints: 13, estimatedHours: 18, deadline: d(8), labels: ['algorithm'] },
        { title: 'AR Overlay UI Design', status: 'in_progress', priority: 'high', assignedTo: s4._id, storyPoints: 8, estimatedHours: 10, deadline: d(12), labels: ['design', 'ar'] },
        { title: 'POI (Points of Interest) Database', status: 'todo', priority: 'medium', assignedTo: s6._id, storyPoints: 3, estimatedHours: 4, deadline: d(20), labels: ['database'] },
        { title: 'Offline Map Caching', status: 'todo', priority: 'medium', assignedTo: s5._id, storyPoints: 5, estimatedHours: 6, deadline: d(30), labels: ['mobile', 'offline'] },
        { title: 'Beta Testing with Students', status: 'todo', priority: 'high', assignedTo: s4._id, storyPoints: 3, estimatedHours: 8, deadline: d(38), labels: ['testing'] },
      ]
    },
    {
      data: { title: 'Research Paper Recommendation System', description: 'Collaborative filtering system that recommends research papers to students based on their interests and reading history.', type: 'research', owner: s5._id, members: [s5._id, s2._id], faculty: f1._id, status: 'completed', approvalStatus: 'approved', deadline: d(-5), tags: ['Recommendation', 'ML', 'NLP', 'Research'], progress: 100, healthScore: 92 },
      tasks: [
        { title: 'Dataset Collection & Preprocessing', status: 'completed', priority: 'high', assignedTo: s5._id, storyPoints: 5, estimatedHours: 10, deadline: d(-40), labels: ['data', 'ml'] },
        { title: 'Collaborative Filtering Model', status: 'completed', priority: 'critical', assignedTo: s5._id, storyPoints: 13, estimatedHours: 20, deadline: d(-30), labels: ['ml'] },
        { title: 'NLP-based Paper Summarizer', status: 'completed', priority: 'high', assignedTo: s2._id, storyPoints: 8, estimatedHours: 12, deadline: d(-20), labels: ['nlp'] },
        { title: 'REST API for Recommendations', status: 'completed', priority: 'high', assignedTo: s2._id, storyPoints: 5, estimatedHours: 6, deadline: d(-15), labels: ['backend'] },
        { title: 'Frontend Search & Discovery UI', status: 'completed', priority: 'medium', assignedTo: s5._id, storyPoints: 5, estimatedHours: 8, deadline: d(-10), labels: ['frontend'] },
        { title: 'Evaluation & Accuracy Report', status: 'completed', priority: 'high', assignedTo: s2._id, storyPoints: 3, estimatedHours: 5, deadline: d(-6), labels: ['research', 'documentation'] },
      ]
    },
    {
      data: { title: 'Student Expense Tracker App', description: 'Mobile-first budgeting app for students with expense categorization, monthly reports, and savings goals.', type: 'design', owner: s1._id, members: [s1._id, s4._id, s7._id], faculty: f2._id, status: 'on_hold', approvalStatus: 'revision_needed', deadline: d(15), tags: ['React Native', 'Finance', 'Mobile', 'UX'], progress: 45, healthScore: 48 },
      tasks: [
        { title: 'UI/UX Wireframes & Prototypes', status: 'completed', priority: 'high', assignedTo: s4._id, storyPoints: 5, estimatedHours: 8, deadline: d(-15), labels: ['design', 'ux'] },
        { title: 'React Native Project Setup', status: 'completed', priority: 'high', assignedTo: s1._id, storyPoints: 3, estimatedHours: 4, deadline: d(-10), labels: ['mobile'] },
        { title: 'Expense CRUD Operations', status: 'in_progress', priority: 'high', assignedTo: s7._id, storyPoints: 5, estimatedHours: 8, deadline: d(3), labels: ['backend'] },
        { title: 'Charts & Analytics Screen', status: 'todo', priority: 'medium', assignedTo: s4._id, storyPoints: 5, estimatedHours: 8, deadline: d(8), labels: ['frontend', 'charts'] },
        { title: 'Budget Goal Setting Feature', status: 'todo', priority: 'medium', assignedTo: s1._id, storyPoints: 3, estimatedHours: 5, deadline: d(12), labels: ['feature'] },
        { title: 'App Store Submission', status: 'blocked', priority: 'high', assignedTo: s7._id, storyPoints: 3, estimatedHours: 4, deadline: d(14), labels: ['deployment'], blockerNote: 'On hold pending faculty revision feedback.' },
      ]
    },
  ];

  let totalTasks = 0;
  for (const p of projects) {
    const project = await Project.create(p.data);
    for (const t of p.tasks) {
      await Task.create({ ...t, project: project._id, createdBy: p.data.owner, description: t.description || `Task for ${project.title}` });
      totalTasks++;
    }
    const done = p.tasks.filter(t => t.status === 'completed').length;
    await Project.findByIdAndUpdate(project._id, { progress: Math.round((done / p.tasks.length) * 100) });
  }

  console.log(`Demo seeded ✓ — ${demos.length} users, ${projects.length} projects, ${totalTasks} tasks`);
}

startServer().catch(err => { console.error('Startup error:', err); process.exit(1); });
