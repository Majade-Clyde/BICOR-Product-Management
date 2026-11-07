import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Supabase Admin JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockflow_token') || sessionStorage.getItem('stockflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors and handle session expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      // 401 Unauthorized: Clear stale token and redirect to login if not already there
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('stockflow_token');
        localStorage.removeItem('stockflow_user');
        sessionStorage.removeItem('stockflow_token');
        sessionStorage.removeItem('stockflow_user');
        window.location.href = '/login?expired=true';
      }

      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data && error.response.data.errors) {
        errorMessage = error.response.data.errors.join(', ');
      } else {
        errorMessage = `Server error (${error.response.status}): ${error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to reach backend server. Please verify the Express server is running on port 5000.';
    } else {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
