import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sportpass_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sportpass_token');
      localStorage.removeItem('sportpass_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

// Dashboard
export const getDashboard = () =>
  api.get('/analytics/dashboard').then((r) => r.data);

// Athletes
export const getAthletes = (params?: { groupId?: string; status?: string }) =>
  api.get('/athletes', { params }).then((r) => r.data);

export const getAthlete = (id: string) =>
  api.get(`/athletes/${id}`).then((r) => r.data);

export const getAthleteSportPassport = (id: string) =>
  api.get(`/athletes/${id}/sport-passport`).then((r) => r.data);

export const createAthlete = (data: Record<string, unknown>) =>
  api.post('/athletes', data).then((r) => r.data);

export const getAthleteProgress = (id: string) =>
  api.get(`/athletes/${id}/progress`).then((r) => r.data);

export const addAthleteProgress = (id: string, data: Record<string, unknown>) =>
  api.post(`/athletes/${id}/progress`, data).then((r) => r.data);

export const getAthleteMedicalDocuments = (id: string) =>
  api.get(`/athletes/${id}/medical-documents`).then((r) => r.data);

export const updateAthlete = (id: string, data: Record<string, unknown>) =>
  api.patch(`/athletes/${id}`, data).then((r) => r.data);

export const deleteAthlete = (id: string) =>
  api.delete(`/athletes/${id}`).then((r) => r.data);

export const getAthleteCompetitions = (id: string) =>
  api.get(`/athletes/${id}/competitions`).then((r) => r.data);

// Groups
export const getGroups = () =>
  api.get('/groups').then((r) => r.data);

export const getGroup = (id: string) =>
  api.get(`/groups/${id}`).then((r) => r.data);

// Sessions & Attendance
export const getSessions = (params?: { groupId?: string; date?: string }) =>
  api.get('/sessions', { params }).then((r) => r.data);

export const createSession = (data: Record<string, unknown>) =>
  api.post('/sessions', data).then((r) => r.data);

export const getSessionAttendance = (sessionId: string) =>
  api.get(`/sessions/${sessionId}/attendance`).then((r) => r.data);

export const bulkMarkAttendance = (sessionId: string, data: Record<string, unknown>) =>
  api.post(`/sessions/${sessionId}/attendance/bulk`, data).then((r) => r.data);

// Payments
export const getPayments = (params?: { status?: string; athleteId?: string }) =>
  api.get('/payments', { params }).then((r) => r.data);

export const getDebtors = () =>
  api.get('/payments/debtors').then((r) => r.data);

export const confirmPayment = (id: string, data: Record<string, unknown>) =>
  api.patch(`/payments/${id}/confirm`, data).then((r) => r.data);

export const createPayment = (data: Record<string, unknown>) =>
  api.post('/payments', data).then((r) => r.data);

export const updatePayment = (id: string, data: Record<string, unknown>) =>
  api.patch(`/payments/${id}`, data).then((r) => r.data);

export const deletePayment = (id: string) =>
  api.delete(`/payments/${id}`).then((r) => r.data);

// Medical Documents
export const getExpiringDocuments = () =>
  api.get('/medical-documents/expiring').then((r) => r.data);

export const getMedicalDocuments = (params?: { athleteId?: string }) =>
  api.get('/medical-documents', { params }).then((r) => r.data);

export const createMedicalDocument = (data: Record<string, unknown>) =>
  api.post('/medical-documents', data).then((r) => r.data);

export const updateMedicalDocument = (id: string, data: Record<string, unknown>) =>
  api.patch(`/medical-documents/${id}`, data).then((r) => r.data);

export const deleteMedicalDocument = (id: string) =>
  api.delete(`/medical-documents/${id}`).then((r) => r.data);

export const requestParentConsent = (athleteId: string) =>
  api.post(`/medical-documents/athletes/${athleteId}/parent-consent/request`).then((r) => r.data);

export const getParentConsentRequests = () =>
  api.get('/parent/consent-requests').then((r) => r.data);

export const respondParentConsent = (id: string, status: 'approved' | 'rejected') =>
  api.patch(`/parent/consent-requests/${id}/respond`, { status }).then((r) => r.data);

// Competitions
export const getCompetitions = () =>
  api.get('/competitions').then((r) => r.data);

export const getCompetition = (id: string) =>
  api.get(`/competitions/${id}`).then((r) => r.data);

export const createCompetition = (data: Record<string, unknown>) =>
  api.post('/competitions', data).then((r) => r.data);

export const updateCompetition = (id: string, data: Record<string, unknown>) =>
  api.patch(`/competitions/${id}`, data).then((r) => r.data);

export const deleteCompetition = (id: string) =>
  api.delete(`/competitions/${id}`).then((r) => r.data);

export const addCompetitionResult = (id: string, data: Record<string, unknown>) =>
  api.post(`/competitions/${id}/results`, data).then((r) => r.data);

// Notifications
export const getNotifications = () =>
  api.get('/notifications').then((r) => r.data);

export const getNotificationRecipients = () =>
  api.get('/notifications/recipients').then((r) => r.data);

export const createNotification = (data: Record<string, unknown>) =>
  api.post('/notifications', data).then((r) => r.data);

export const updateNotification = (id: string, data: Record<string, unknown>) =>
  api.patch(`/notifications/${id}`, data).then((r) => r.data);

export const deleteNotification = (id: string) =>
  api.delete(`/notifications/${id}`).then((r) => r.data);

export const markNotificationRead = (id: string) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data);

// API Keys
export const getApiKeys = () =>
  api.get('/api-keys').then((r) => r.data);

export const createApiKey = (data: Record<string, unknown>) =>
  api.post('/api-keys', data).then((r) => r.data);

export const deleteApiKey = (id: string) =>
  api.delete(`/api-keys/${id}`).then((r) => r.data);

// Coaches
export const getCoaches = () =>
  api.get('/coaches').then((r) => r.data);

// Groups
export const createGroup = (data: Record<string, unknown>) =>
  api.post('/groups', data).then((r) => r.data);

export const updateGroup = (id: string, data: Record<string, unknown>) =>
  api.patch(`/groups/${id}`, data).then((r) => r.data);

export const deleteGroup = (id: string) =>
  api.delete(`/groups/${id}`).then((r) => r.data);

export const addGroupMember = (groupId: string, athleteIds: string | string[]) =>
  api.post(`/groups/${groupId}/members`, Array.isArray(athleteIds) ? { athleteIds } : { athleteId: athleteIds }).then((r) => r.data);

export const removeGroupMember = (groupId: string, athleteId: string) =>
  api.delete(`/groups/${groupId}/members/${athleteId}`).then((r) => r.data);

// Tasks
export const getTasks = () =>
  api.get('/tasks').then((r) => r.data);

export const getTask = (id: string) =>
  api.get(`/tasks/${id}`).then((r) => r.data);

export const createTask = (data: Record<string, unknown>) =>
  api.post('/tasks', data).then((r) => r.data);

export const updateTask = (id: string, data: Record<string, unknown>) =>
  api.patch(`/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id: string) =>
  api.delete(`/tasks/${id}`).then((r) => r.data);

// Users/Participants
export const getUsers = () =>
  api.get('/users').then((r) => r.data);

export const createUser = (data: Record<string, unknown>) =>
  api.post('/users', data).then((r) => r.data);

export const updateUser = (id: string, data: Record<string, unknown>) =>
  api.patch(`/users/${id}`, data).then((r) => r.data);

export const deleteUser = (id: string) =>
  api.delete(`/users/${id}`).then((r) => r.data);

export const generateUserPassword = (id: string) =>
  api.post(`/users/${id}/generate-password`).then((r) => r.data);

export const updateMyProfile = (data: Record<string, unknown>) =>
  api.patch('/users/profile', data).then((r) => r.data);

export const changeMyPassword = (newPassword: string) =>
  api.patch('/users/change-password', { newPassword }).then((r) => r.data);

// Athlete attendance with grades
export const getAthleteAttendanceStats = (id: string) =>
  api.get(`/athletes/${id}/attendance-stats`).then((r) => r.data);

// Parent
export const getMyChildren = () =>
  api.get('/parents/my-children').then((r) => r.data);

// Competition approvals
export const getCompetitionApprovals = (competitionId: string) =>
  api.get(`/competitions/${competitionId}/approvals`).then((r) => r.data);

export const upsertCompetitionApproval = (competitionId: string, athleteId: string, status: string) =>
  api.post(`/competitions/${competitionId}/approvals`, { athleteId, status }).then((r) => r.data);

export const setCompetitionParticipants = (competitionId: string, athleteIds: string[]) =>
  api.post(`/competitions/${competitionId}/participants`, { athleteIds }).then((r) => r.data);

export const respondToApproval = (competitionId: string, athleteId: string, status: 'approved' | 'rejected', comment?: string) =>
  api.patch(`/competitions/${competitionId}/approvals/${athleteId}/respond`, { status, comment }).then((r) => r.data);

export const getParentApprovals = () =>
  api.get('/parent/competition-approvals').then((r) => r.data);

// Athletes readiness
export const getAthletesReadiness = () =>
  api.get('/athletes/readiness').then((r) => r.data);
