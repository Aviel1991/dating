import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth APIs
export const authApi = {
  adminLogin: (username: string, password: string) =>
    api.post('/auth/admin/login', { username, password }).then((r) => r.data),
  userLogin: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  userRegister: (fullName: string, email: string, password: string) =>
    api.post('/auth/register', { fullName, email, password }).then((r) => r.data),
};

// Events (Public)
export const eventsApi = {
  getEvent: (eventId: string) =>
    api.get(`/events/${eventId}`).then((r) => r.data),
  getStatus: (eventId: string) =>
    api.get(`/events/${eventId}/status`).then((r) => r.data),
};

// Registrations
export const registrationsApi = {
  create: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/registrations`, data).then((r) => r.data),
  getMyRegistration: (eventId: string) =>
    api.get(`/me/events/${eventId}/registration`).then((r) => r.data),
};

// Profile Photo
export const photoApi = {
  getUploadUrl: () =>
    api.post('/me/profile-photo/upload-url').then((r) => r.data),
  confirmUpload: (fileKey: string) =>
    api.post('/me/profile-photo/confirm', { fileKey }).then((r) => r.data),
};

// Selections
export const selectionsApi = {
  getAvailable: (eventId: string) =>
    api.get(`/me/events/${eventId}/selection/available`).then((r) => r.data),
  getParticipants: (eventId: string) =>
    api.get(`/me/events/${eventId}/selection/participants`).then((r) => r.data),
  upsertChoice: (eventId: string, toUserId: string, data: any) =>
    api.put(`/me/events/${eventId}/choices/${toUserId}`, data).then((r) => r.data),
  submitChoices: (eventId: string) =>
    api.post(`/me/events/${eventId}/choices/submit`).then((r) => r.data),
};

// Matches (Participant)
export const matchesApi = {
  getMyMatches: (eventId: string) =>
    api.get(`/me/events/${eventId}/matches`).then((r) => r.data),
};

// Admin APIs
export const adminApi = {
  // Events
  getEvents: () =>
    api.get('/admin/events').then((r) => r.data),
  createEvent: (data: any) =>
    api.post('/admin/events', data).then((r) => r.data),
  updateEvent: (eventId: string, data: any) =>
    api.put(`/admin/events/${eventId}`, data).then((r) => r.data),
  publishEvent: (eventId: string) =>
    api.post(`/admin/events/${eventId}/publish`).then((r) => r.data),

  // Registrations
  getRegistrations: (eventId: string, params?: any) =>
    api.get(`/admin/events/${eventId}/registrations`, { params }).then((r) => r.data),
  approveRegistration: (regId: string, data?: any) =>
    api.post(`/admin/registrations/${regId}/approve`, data || {}).then((r) => r.data),
  rejectRegistration: (regId: string, data?: any) =>
    api.post(`/admin/registrations/${regId}/reject`, data || {}).then((r) => r.data),
  waitlistRegistration: (regId: string, data?: any) =>
    api.post(`/admin/registrations/${regId}/waitlist`, data || {}).then((r) => r.data),

  // Participants
  getParticipants: (eventId: string, params?: any) =>
    api.get(`/admin/events/${eventId}/participants`, { params }).then((r) => r.data),
  remindPhoto: (eventId: string) =>
    api.post(`/admin/events/${eventId}/participants/remind-photo`).then((r) => r.data),

  // Check-in
  getCheckinList: (eventId: string, search?: string) =>
    api.get(`/admin/events/${eventId}/checkin-list`, { params: { search } }).then((r) => r.data),
  markArrived: (eventId: string, userId: string) =>
    api.post(`/admin/events/${eventId}/attendances/${userId}/arrive`).then((r) => r.data),

  // Selection window
  openSelection: (eventId: string, closeAt?: string) =>
    api.post(`/admin/events/${eventId}/selection/open`, { closeAt }).then((r) => r.data),
  closeSelection: (eventId: string) =>
    api.post(`/admin/events/${eventId}/selection/close`).then((r) => r.data),

  // Matches
  generateMatches: (eventId: string) =>
    api.post(`/admin/events/${eventId}/matches/generate`).then((r) => r.data),
  getMatches: (eventId: string, status?: string) =>
    api.get(`/admin/events/${eventId}/matches`, { params: { status } }).then((r) => r.data),
  approveMatch: (matchId: string, note?: string) =>
    api.post(`/admin/matches/${matchId}/approve`, { note }).then((r) => r.data),
  rejectMatch: (matchId: string, note?: string) =>
    api.post(`/admin/matches/${matchId}/reject`, { note }).then((r) => r.data),
};
