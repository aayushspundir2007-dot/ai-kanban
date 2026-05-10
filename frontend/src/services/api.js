import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/profile', d),
  changePassword: (d) => api.put('/auth/password', d)
};

export const projectAPI = {
  getAll: (p) => api.get('/projects', { params: p }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (d) => api.post('/projects', d),
  update: (id, d) => api.put(`/projects/${id}`, d),
  delete: (id) => api.delete(`/projects/${id}`),
  approve: (id, d) => api.put(`/projects/${id}/approve`, d),
  uploadFile: (id, fd) => api.post(`/projects/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
};

export const taskAPI = {
  getByProject: (pid) => api.get(`/tasks/project/${pid}`),
  create: (pid, d) => api.post(`/tasks/project/${pid}`, d),
  update: (id, d) => api.put(`/tasks/${id}`, d),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (d) => api.put('/tasks/reorder', d),
  setBlocker: (id, d) => api.post(`/tasks/${id}/block`, d),
  resolveBlocker: (id) => api.delete(`/tasks/${id}/block`),
  logTime: (id, d) => api.post(`/tasks/${id}/time-entry`, d),
  uploadDeliverable: (id, fd) => api.post(`/tasks/${id}/deliverable`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
};

export const commentAPI = {
  get: (type, id) => api.get(`/comments/${type}/${id}`),
  create: (d) => api.post('/comments', d),
  delete: (id) => api.delete(`/comments/${id}`)
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export const aiAPI = {
  suggestTasks: (pid) => api.get(`/ai/suggest/${pid}`),
  predictRisk: (pid) => api.get(`/ai/risk/${pid}`),
  generateDoc: (d) => api.post('/ai/generate-doc', d),
  smartReminder: (tid) => api.get(`/ai/reminder/${tid}`),
  adaptive: () => api.get('/ai/adaptive'),
  heatmap: (uid) => api.get(`/ai/heatmap${uid ? '/' + uid : ''}`),
  provisionResources: (tid) => api.post(`/ai/resources/${tid}`)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getProject: (id) => api.get(`/analytics/project/${id}`)
};

export const userAPI = {
  getAll: (p) => api.get('/users', { params: p }),
  getFaculty: () => api.get('/users/faculty'),
  toggle: (id) => api.put(`/users/${id}/toggle`),
  delete: (id) => api.delete(`/users/${id}`)
};

export const subscriptionAPI = {
  get: () => api.get('/subscriptions'),
  checkout: () => api.post('/subscriptions/checkout'),
  cancel: () => api.post('/subscriptions/cancel')
};

export const activityAPI = { getAll: () => api.get('/activity') };

// ── Feature 2: Standups ──────────────────────────────────────────────────────
export const standupAPI = {
  submit: (d) => api.post('/standups', d),
  getProject: (pid, p) => api.get(`/standups/project/${pid}`, { params: p }),
  getMy: (pid) => api.get(`/standups/my/${pid}`),
  getPrompt: (pid) => api.get(`/standups/prompt/${pid}`)
};

// ── Feature 3 & 6: Health + Burndown ────────────────────────────────────────
export const healthAPI = {
  getScore: (pid) => api.get(`/health/${pid}`),
  getBurndown: (pid) => api.get(`/health/${pid}/burndown`)
};

// ── Feature 4: Contribution ──────────────────────────────────────────────────
export const contributionAPI = {
  get: (pid) => api.get(`/contribution/${pid}`),
  calculate: (pid) => api.post(`/contribution/${pid}/calculate`)
};

// ── Feature 8: Webhooks ──────────────────────────────────────────────────────
export const webhookAPI = {
  getHistory: (pid) => api.get(`/webhooks/project/${pid}`)
};

// ── Feature 9: Stakeholders ──────────────────────────────────────────────────
export const stakeholderAPI = {
  createToken: (d) => api.post('/stakeholders/token', d),
  listTokens: (pid) => api.get(`/stakeholders/project/${pid}`),
  revokeToken: (id) => api.delete(`/stakeholders/token/${id}`),
  viewByToken: (token) => api.get(`/stakeholders/view/${token}`),
  approveTask: (token, tid) => api.put(`/stakeholders/view/${token}/approve/${tid}`)
};

// ── Feature 10: Groups ───────────────────────────────────────────────────────
export const groupAPI = {
  getMySkills: () => api.get('/groups/skills/me'),
  updateSkills: (d) => api.put('/groups/skills/me', d),
  generate: (d) => api.post('/groups/generate', d),
  getFormation: (id) => api.get(`/groups/${id}`)
};

// ── Feature 11: Portfolio ────────────────────────────────────────────────────
export const portfolioAPI = {
  generate: (pid) => api.post(`/portfolio/generate/${pid}`),
  getMy: () => api.get('/portfolio/me'),
  view: (slug) => api.get(`/portfolio/view/${slug}`)
};

// ── Meetings ─────────────────────────────────────────────────────────────────
export const meetingAPI = {
  getAll: () => api.get('/meetings'),
  create: (d) => api.post('/meetings', d),
  update: (id, d) => api.put(`/meetings/${id}`, d),
  delete: (id) => api.delete(`/meetings/${id}`)
};

// ── Veronica ─────────────────────────────────────────────────────────────────
export const veronicaAPI = {
  chat: (message) => api.post('/veronica/chat', { message }),
  getHistory: () => api.get('/veronica/history'),
  clearHistory: () => api.delete('/veronica/history'),
  quickAction: (action, params) => api.post('/veronica/quick-action', { action, params })
};

export default api;
