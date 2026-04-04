import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** AI quota metadata from GET /api/v1/usage/quota */
export interface QuotaResponse {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  reset_period_end: string;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set multipart boundary for file uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth paths where 401 should not trigger refresh (avoids loops during login/refresh)
const isAuthEndpoint = (url: string) =>
  /\/api\/v1\/auth\/(login|refresh)/.test(url);

// Response interceptor to handle token refresh (cookie-based or legacy body)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const path = originalRequest.url ?? '';
      if (isAuthEndpoint(path)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      try {
        const response = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          refreshToken ? { refresh_token: refreshToken } : {},
          { withCredentials: true }
        );

        const { access_token, refresh_token } = response.data;
        setTokens(access_token, refresh_token ?? null);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
