import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/constants';
import { AuthError, NetworkError } from '@/lib/errors';

const getCsrfToken = (): string | null => {
  const name = 'csrftoken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const csrfToken = getCsrfToken();
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const authStore = (await import('@/stores/authStore')).useAuthStore.getState();
      
      try {
        await authStore.checkAuth();
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        authStore.logout();
        window.location.href = '/login';
        return Promise.reject(new AuthError('Session expired. Please login again.'));
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      const authStore = (await import('@/stores/authStore')).useAuthStore.getState();
      const csrfToken = getCsrfToken();
      
      if (!csrfToken && ['post', 'put', 'patch', 'delete'].includes(originalRequest.method?.toLowerCase() || '')) {
        try {
          await axios.get(`${API_BASE_URL}/api/v1/csrf/`, { withCredentials: true });
          return apiClient(originalRequest);
        } catch (csrfError) {
          authStore.logout();
          return Promise.reject(new AuthError('CSRF token expired. Please login again.'));
        }
      }
      
      return Promise.reject(new AuthError('You do not have permission to perform this action.'));
    }

    if (!error.response) {
      return Promise.reject(new NetworkError('Network error. Please check your connection.'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;