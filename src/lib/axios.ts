import axios from 'axios';

const api = axios. create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors. request.use(
  (config) => {
    try {
      const token = localStorage.getItem('posko_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console. error('Error accessing localStorage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 dan refresh token
api. interceptors.response. use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika 401 dan belum retry
    if (error. response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('posko_refresh_token');
        if (! refreshToken) {
          // Tidak ada refresh token, redirect ke login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Attempt refresh
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        const newAccessToken = response.data.data.tokens.accessToken;
        const newRefreshToken = response.data.data.tokens. refreshToken;

        localStorage.setItem('posko_token', newAccessToken);
        localStorage.setItem('posko_refresh_token', newRefreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh gagal, clear tokens dan redirect
        localStorage. removeItem('posko_token');
        localStorage.removeItem('posko_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;