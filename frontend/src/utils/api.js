import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
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

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
  updatePassword: (data) => api.put('/auth/update-password', data)
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`)
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  checkAvailability: (id, data) => api.post(`/products/${id}/check-availability`, data),
  getCategories: () => api.get('/products/categories/list'),
  getMyProducts: () => api.get('/products/vendor/my-products')
};

// Quotations API
export const quotationsAPI = {
  getAll: () => api.get('/quotations'),
  getOne: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  submit: (id) => api.put(`/quotations/${id}/submit`),
  approve: (id, data) => api.put(`/quotations/${id}/approve`, data),
  reject: (id, data) => api.put(`/quotations/${id}/reject`, data),
  counterOffer: (id, data) => api.post(`/quotations/${id}/counter-offer`, data),
  convertToOrder: (id) => api.post(`/quotations/${id}/convert-to-order`),
  delete: (id) => api.delete(`/quotations/${id}`)
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  updatePayment: (id, data) => api.put(`/orders/${id}/payment`, data),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  getMyOrders: () => api.get('/orders/customer/my-orders')
};

// Sale Orders API
export const saleOrdersAPI = {
  getAll: (params) => api.get('/sale-orders', { params }),
  getOne: (id) => api.get(`/sale-orders/${id}`),
  create: (data) => api.post('/sale-orders', data),
  updateStatus: (id, data) => api.put(`/sale-orders/${id}/status`, data),
  cancel: (id, data) => api.put(`/sale-orders/${id}/cancel`, data),
  updatePayment: (id, data) => api.put(`/sale-orders/${id}/payment`, data),
  delete: (id) => api.delete(`/sale-orders/${id}`)
};

// Invoices API
export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  addPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
  updateStatus: (id, data) => api.put(`/invoices/${id}/status`, data)
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getVendorPerformance: () => api.get('/dashboard/vendor-performance'),
  getOrderTrends: (params) => api.get('/dashboard/order-trends', { params }),
  exportReport: (params) => api.get('/dashboard/export', { params })
};

// Pickups API
export const pickupsAPI = {
  getAll: () => api.get('/pickups'),
  getOne: (id) => api.get(`/pickups/${id}`),
  create: (data) => api.post('/pickups', data),
  complete: (id) => api.put(`/pickups/${id}/complete`)
};

// Returns API
export const returnsAPI = {
  getAll: () => api.get('/returns'),
  getOne: (id) => api.get(`/returns/${id}`),
  create: (data) => api.post('/returns', data),
  complete: (id) => api.put(`/returns/${id}/complete`)
};

// Settings API
export const settingsAPI = {
  getAll: (params) => api.get('/settings', { params }),
  getOne: (key) => api.get(`/settings/${key}`),
  upsert: (key, data) => api.put(`/settings/${key}`, data),
  delete: (key) => api.delete(`/settings/${key}`),
  getAttributes: () => api.get('/settings/attributes/list'),
  updateAttributes: (data) => api.put('/settings/attributes/update', data)
};

export default api;
