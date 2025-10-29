import apiClient from '@/api/client';
import { API_ENDPOINTS } from '@/lib/constants';
import { User } from '@/stores/authStore';

interface SessionResponse {
  authenticated: boolean;
  user: User | null;
  csrf_token: string;
}

class AuthService {
  private csrfToken: string | null = null;

  async checkSession(): Promise<SessionResponse> {
    try {
      const response = await apiClient.get<SessionResponse>(API_ENDPOINTS.AUTH.SESSION);
      const data = response.data;
      
      if (data.csrf_token) {
        this.csrfToken = data.csrf_token;
        this.setCsrfCookie(data.csrf_token);
      }
      
      return data;
    } catch (error) {
      console.error('Session check failed:', error);
      return { authenticated: false, user: null, csrf_token: '' };
    }
  }

  async logout(): Promise<void> {
    try {
      // The apiClient already handles CSRF token in its interceptor
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});

      this.csrfToken = null;
      this.clearCsrfCookie();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      this.csrfToken = null;
      this.clearCsrfCookie();
      throw error;
    }
  }

  getCsrfToken(): string | null {
    return this.csrfToken || this.getCsrfFromCookie();
  }

  private setCsrfCookie(token: string): void {
    // Set a cookie that the apiClient interceptor can read
    // Note: This is not the httpOnly session cookie, just for CSRF
    document.cookie = `csrftoken=${token}; path=/; SameSite=Lax`;
  }

  private getCsrfFromCookie(): string | null {
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
  }

  private clearCsrfCookie(): void {
    document.cookie = 'csrftoken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export default new AuthService();
export type { SessionResponse };