import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post('/customers', customerData),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
  search: (query) => api.get(`/customers/search/${query}`),
};

// Business Types API
export const businessTypesAPI = {
  getAll: () => api.get('/business-types'),
  getById: (id) => api.get(`/business-types/${id}`),
  create: (businessTypeData) => api.post('/business-types', businessTypeData),
  update: (id, businessTypeData) => api.put(`/business-types/${id}`, businessTypeData),
  delete: (id) => api.delete(`/business-types/${id}`),
  search: (query) => api.get(`/business-types/search/${query}`),
};

// Magazines API
export const magazinesAPI = {
  getAll: () => api.get('/magazines'),
  getById: (id) => api.get(`/magazines/${id}`),
  create: (magazineData) => api.post('/magazines', magazineData),
  update: (id, magazineData) => api.put(`/magazines/${id}`, magazineData),
  delete: (id) => api.delete(`/magazines/${id}`),
  getCurrentIssue: (magazineId) => api.get(`/magazines/current-issue/${magazineId}`),
};

// Content Sizes API
export const contentSizesAPI = {
  getAll: () => api.get('/content-sizes'),
  getById: (id) => api.get(`/content-sizes/${id}`),
  create: (contentSizeData) => api.post('/content-sizes', contentSizeData),
  update: (id, contentSizeData) => api.put(`/content-sizes/${id}`, contentSizeData),
  delete: (id) => api.delete(`/content-sizes/${id}`),
  getPrice: (contentSizeId, magazineId) => api.get(`/content-sizes/${contentSizeId}/price/${magazineId}`),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params = {}) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (bookingData) => api.post('/bookings', bookingData),
  update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  delete: (id) => api.delete(`/bookings/${id}`),
  getCustomerBookings: (customerId) => api.get(`/bookings/customer/${customerId}`),
  getReportData: (params = {}) => api.get('/bookings/report/data', { params }),
};

// Leaflet Delivery API
export const leafletDeliveryAPI = {
  getAll: (params = {}) => api.get('/leaflet-delivery', { params }),
  getById: (id) => api.get(`/leaflet-delivery/${id}`),
  create: (deliveryData) => api.post('/leaflet-delivery', deliveryData),
  update: (id, deliveryData) => api.put(`/leaflet-delivery/${id}`, deliveryData),
  delete: (id) => api.delete(`/leaflet-delivery/${id}`),
  getReportData: (params = {}) => api.get('/leaflet-delivery/report/data', { params }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCurrentIssue: (magazineId) => api.get(`/dashboard/current-issue/${magazineId}`),
  getPublications: () => api.get('/dashboard/publications'),
  getTopCustomers: () => api.get('/dashboard/top-customers'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

export default api; 