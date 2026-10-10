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
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
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

export const usersApi = {
  list: async () => (await api.get('/users/')).data,
  roles: async () => (await api.get('/users/roles')).data,
  assignRoles: async (userId, roleNames) =>
    (await api.put(`/users/${userId}/roles`, { role_names: roleNames })).data,
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
  update: async (proposalId, updateData) => {
    const response = await api.put(`/proposals/${proposalId}`, updateData);
    return response.data;
  },
  submit: async (proposalId) => {
    const response = await api.post(`/proposals/${proposalId}/submit`);
    return response.data;
  },
  clone: async (proposalId) => {
    const response = await api.post(`/proposals/${proposalId}/clone`);
    return response.data;
  },
  withdraw: async (proposalId) => {
    const response = await api.post(`/proposals/${proposalId}/withdraw`);
    return response.data;
  },
  uploadDocument: async (proposalId, file, docType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    const response = await api.post(`/proposals/${proposalId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  export: async (proposalId) => {
    const response = await api.get(`/proposals/${proposalId}/export`);
    return response.data;
  },
  getById: async (proposalId) => {
    const response = await api.get(`/proposals/${proposalId}`);
    return response.data;
  },
};

export const approvalsApi = {
  listInbox: async () => {
    const response = await api.get('/approvals/inbox');
    return response.data;
  },
  approveBudget: async (proposalId) => {
    const response = await api.post(`/approvals/${proposalId}/budget/approve`);
    return response.data;
  },
  initiate: async (proposalId) => {
    const response = await api.post(`/approvals/initiate/${proposalId}`);
    return response.data;
  },
  getWorkflow: async (proposalId) => {
    const response = await api.get(`/approvals/${proposalId}`);
    return response.data;
  },
  reviewNode: async (nodeId, decision, remarks = '') => {
    const response = await api.post(`/approvals/nodes/${nodeId}/review`, {
      decision,
      remarks,
    });
    return response.data;
  },
};

export const financeApi = {
  createBudget: async (budgetData) => {
    const response = await api.post('/finance/budgets', budgetData);
    return response.data;
  },
  getBudget: async (proposalId) => {
    const response = await api.get(`/finance/budgets/${proposalId}`);
    return response.data;
  },
  listBudgets: async () => {
    const response = await api.get('/finance/budgets');
    return response.data;
  },
  listExpenses: async (budgetId = null) => {
    const params = budgetId ? { budget_id: budgetId } : {};
    const response = await api.get('/finance/expenses', { params });
    return response.data;
  },
  submitExpense: async (expenseData) => {
    const response = await api.post('/finance/expenses', expenseData);
    return response.data;
  },
  submitExpenseWithReceipt: async (expenseData) => {
    const formData = new FormData();
    Object.entries(expenseData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value);
    });
    const response = await api.post('/finance/expenses/with-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  requestExpenseReceipt: async (expenseId) =>
    (await api.post(`/finance/expenses/${expenseId}/request-receipt`)).data,
  payExpense: async (expenseId, paymentReq) => {
    const response = await api.post(`/finance/expenses/${expenseId}/pay`, paymentReq);
    return response.data;
  },
  listVendors: async () => {
    const response = await api.get('/finance/vendors');
    return response.data;
  },
  createVendor: async (vendorData) => {
    const response = await api.post('/finance/vendors', vendorData);
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
  listBookings: async () => {
    const response = await api.get('/resources/bookings');
    return response.data;
  },
  cancelBooking: async (bookingId) => {
    const response = await api.post(`/resources/bookings/${bookingId}/cancel`);
    return response.data;
  },
  reportDamage: async (resourceId, damageData) => {
    const response = await api.post(`/resources/${resourceId}/damage`, damageData);
    return response.data;
  },
};

export default api;
