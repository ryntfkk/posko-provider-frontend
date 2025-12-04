// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // [PENTING] Izinkan cookie dikirim bersama request
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('posko_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 dan refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika 401 dan belum retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Cek refresh token di localStorage
        const refreshToken = localStorage.getItem('posko_refresh_token');
        
        if (!refreshToken) {
          // Jika tidak ada di storage, coba logout bersih
          handleLogout();
          return Promise.reject(error);
        }

        // Attempt refresh
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true } // Pastikan cookie dikirim/diterima
        );

        const newAccessToken = response.data.data.tokens.accessToken;
        const newRefreshToken = response.data.data.tokens.refreshToken;

        // [SYNC] Update LocalStorage
        localStorage.setItem('posko_token', newAccessToken);
        localStorage.setItem('posko_refresh_token', newRefreshToken);

        // [SYNC] Update Cookie secara manual jika backend tidak set otomatis (backup)
        // Backend kita sudah set HttpOnly cookie, tapi untuk client-side access di middleware Nextjs (jika perlu)
        document.cookie = `posko_token=${newAccessToken}; path=/; max-age=900; SameSite=Lax`;

        // Retry original request dengan token baru
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh gagal, clear tokens dan redirect
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('posko_token');
    localStorage.removeItem('posko_refresh_token');
    // Clear cookie juga untuk keamanan
    document.cookie = 'posko_token=; path=/; max-age=0; SameSite=Lax';
    window.location.href = '/login';
  }
}

export default api;