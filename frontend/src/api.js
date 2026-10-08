import axios from 'axios';

// Base API instance targeting the FastAPI Gateway at http://127.0.0.1:8000/api/v1
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('unievent_token') ||
      localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Graceful handling of common status codes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional token invalidation hook
      console.warn('[API Auth] 401 Unauthorized encountered.');
    }
    return Promise.reject(error);
  }
);

// API Service Endpoints
export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Silent catch on logout
    }
  },
};

export const proposalsApi = {
  list: async () => {
    const response = await api.get('/proposals/');
    return response.data;
  },
  createDraft: async (draftData) => {
    const response = await api.post('/proposals/draft', draftData);
    return response.data;
  },
  submit: async (proposalId) => {
    const response = await api.post(`/proposals/${proposalId}/submit`);
    return response.data;
  },
  getById: async (proposalId) => {
    const response = await api.get(`/proposals/${proposalId}`);
    return response.data;
  },
};

export const resourcesApi = {
  list: async (type = null) => {
    const params = type ? { type } : {};
    const response = await api.get('/resources/', { params });
    return response.data;
  },
  book: async (bookingData) => {
    const response = await api.post('/resources/book', bookingData);
    return response.data;
  },
};

export default api;
