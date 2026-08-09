import api, { cleanParams, API_URL } from './client';

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.patch('/auth/me', payload).then((r) => r.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data),
};

export const transporterApi = {
  create: (payload) => api.post('/transporters/create', payload).then((r) => r.data),
  me: () => api.get('/transporters/me').then((r) => r.data),
  update: (payload) => api.patch('/transporters/me', payload).then((r) => r.data),

  // files: [{ uri, name, mimeType, type: 'RC' | 'PATENTE' | ... }]
  uploadDocs: (files) => {
    const form = new FormData();
    files.forEach((file) => {
      form.append('files', { uri: file.uri, name: file.name, type: file.mimeType });
      form.append('types', file.type);
    });
    return api
      .post('/transporters/upload-docs', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};

export const truckApi = {
  create: (payload) => api.post('/trucks/create', payload).then((r) => r.data),
  mine: () => api.get('/trucks/mine').then((r) => r.data.items),
  available: (filters) =>
    api.get('/trucks/available', { params: cleanParams(filters) }).then((r) => r.data.items),
  getById: (id) => api.get(`/trucks/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/trucks/${id}`, payload).then((r) => r.data),
  updatePosition: (id, payload) => api.patch(`/trucks/${id}/position`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/trucks/${id}`).then((r) => r.data),
};

export const tripApi = {
  create: (payload) => api.post('/trips/create', payload).then((r) => r.data),
  list: (filters) => api.get('/trips/list', { params: cleanParams(filters) }).then((r) => r.data),
  getById: (id) => api.get(`/trips/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/trips/${id}`, payload).then((r) => r.data),
  cancel: (id) => api.delete(`/trips/${id}`).then((r) => r.data),
};

export const missionApi = {
  create: (payload) => api.post('/missions/create', payload).then((r) => r.data),
  list: (filters) => api.get('/missions/list', { params: cleanParams(filters) }).then((r) => r.data),
  getById: (id) => api.get(`/missions/${id}`).then((r) => r.data),
  updateStatus: (missionId, status, reason) =>
    api.patch('/missions/update-status', cleanParams({ missionId, status, reason })).then((r) => r.data),
};

export const chatApi = {
  send: (missionId, content) => api.post('/chat/send', { missionId, content }).then((r) => r.data),
  history: (missionId, params) =>
    api.get('/chat/history', { params: cleanParams({ missionId, ...params }) }).then((r) => r.data.items),
  markRead: (missionId) => api.patch(`/chat/${missionId}/read`).then((r) => r.data),
};

export const notificationApi = {
  list: (params) => api.get('/notifications/list', { params: cleanParams(params) }).then((r) => r.data.items),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

export { API_URL };
