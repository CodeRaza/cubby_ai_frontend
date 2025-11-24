import axios from 'axios';

// Create axios instance with custom config
const api = axios.create({
  baseURL: 'http://localhost:8000',  // Django backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post(
          'http://localhost:8000/api/auth/token/refresh/',
          {
            refresh: refreshToken
          }
        );

        const { access } = response.data;
        
        // Update stored token
        localStorage.setItem('access_token', access);
        
        // Update Authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Only redirect if we're not already on auth page
        if (!window.location.pathname.startsWith('/auth') && !window.location.pathname.startsWith('/onboarding')) {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;