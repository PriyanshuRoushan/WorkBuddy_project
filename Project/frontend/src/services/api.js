import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
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

// Authentication endpoints
export const login = (email, password) => 
  api.post('/auth/login', { email, password }).then(res => res.data);

export const register = (name, email, password, role) => 
  api.post('/auth/register', { name, email, password, role }).then(res => res.data);

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
export const getTasks = () => api.get('/tasks').then(res => res.data);
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
export const getStickyNotes = () => api.get('/team/notes').then(res => res.data);
export const createStickyNote = (noteData) => api.post('/team/notes', noteData).then(res => res.data);
export const deleteStickyNote = (id) => api.delete(`/team/notes/${id}`).then(res => res.data);

export default api;
