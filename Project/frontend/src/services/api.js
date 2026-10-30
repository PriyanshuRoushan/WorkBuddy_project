import axios from 'axios';
import {CONSTANT} from '../../constant';
const api = axios.create({
  baseURL: `${CONSTANT.API_URL.replace(/\/$/, '')}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / invalidation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const isSessionProbe = error.config?.url === '/auth/session';
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      if (typeof window !== 'undefined' && !isSessionProbe && !isLoginPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const login = (email, password, companySlug) =>
  api.post('/auth/login', { email, password, companySlug: companySlug || undefined }).then(res => res.data);
export const restoreSession = () => api.get('/auth/session').then(res => res.data);
export const logout = () => api.post('/auth/logout').then(res => res.data);

export const inspectInvitation = token => api.get(`/auth/invitations/${token}`).then(res => res.data);
export const acceptInvitation = (token, password) => api.post(`/auth/invitations/${token}/accept`, { password }).then(res => res.data);

export const getMe = () => 
  api.get('/auth/me').then(res => res.data);

export const updateProfile = (profileData) => 
  api.put('/auth/profile', profileData).then(res => res.data);

// Projects endpoints
export const getProjects = () => api.get('/projects').then(res => res.data);
export const getProject = (id) => api.get(`/projects/${id}`).then(res => res.data);
export const createProject = (projectData) => api.post('/projects', projectData).then(res => res.data);
export const updateProject = (id, projectData) => api.put(`/projects/${id}`, projectData).then(res => res.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then(res => res.data);

// Tasks endpoints
export const getTasks = (projectId) => api.get(projectId ? `/tasks?projectId=${projectId}` : '/tasks').then(res => res.data);
export const createTask = (taskData) => api.post('/tasks', taskData).then(res => res.data);
export const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData).then(res => res.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(res => res.data);

// Activities endpoints
export const getActivities = () => api.get('/activities').then(res => res.data);
export const createActivity = (activityData) => api.post('/activities', activityData).then(res => res.data);

// Events endpoints (Calendar)
export const getEvents = () => api.get('/events').then(res => res.data);
export const createEvent = (eventData) => api.post('/events', eventData).then(res => res.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`).then(res => res.data);

// Team endpoints
export const getTeamMembers = () => api.get('/team/members').then(res => res.data);
export const inviteTeamMember = (memberData) => api.post('/team/members', memberData).then(res => res.data);
export const getPeople = () => api.get('/people').then(res => res.data);
export const invitePerson = data => api.post('/people/invite', data).then(res => res.data);
export const updatePerson = (id, data) => api.patch(`/people/${id}`, data).then(res => res.data);
export const updateAccountStatus = (id, accountStatus) => api.patch(`/people/${id}/status`, { accountStatus }).then(res => res.data);
export const getAnnouncements = () => api.get('/announcements').then(res => res.data);
export const createAnnouncement = data => api.post('/announcements', data).then(res => res.data);
export const markAnnouncementRead = id => api.patch(`/announcements/${id}/read`).then(res => res.data);
export const getSubscription = () => api.get('/control/subscription').then(res => res.data);
export const getSupportTickets = () => api.get('/control/support/tickets').then(res => res.data);
export const createSupportTicket = data => api.post('/control/support/tickets', data).then(res => res.data);
export const addSupportMessage = (id, message) => api.post(`/control/support/tickets/${id}/messages`, { message }).then(res => res.data);
export const grantSupportAccess = (id, data) => api.post(`/control/support/tickets/${id}/access`, data).then(res => res.data);
export const revokeSupportAccess = grantId => api.post(`/control/support/access/${grantId}/revoke`).then(res => res.data);
export const getSupportAudit = () => api.get('/control/support/audit').then(res => res.data);
export const getStickyNotes = () => api.get('/team/notes').then(res => res.data);
export const createStickyNote = (noteData) => api.post('/team/notes', noteData).then(res => res.data);
export const deleteStickyNote = (id) => api.delete(`/team/notes/${id}`).then(res => res.data);

// Collaboration endpoints
export const getProjectMessages = (projectId) => api.get(`/collab/projects/${projectId}/messages`).then(res => res.data);
export const getProjectNotes = (projectId) => api.get(`/collab/projects/${projectId}/notes`).then(res => res.data);
export const uploadFile = (formData) => api.post('/collab/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
}).then(res => res.data);

export default api;
