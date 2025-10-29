import apiClient from '@/api/client';
import { API_BASE_URL } from '@/lib/constants';

class CSRFService {
  private csrfToken: string | null = null;
  private fetchingToken = false;
  private tokenPromise: Promise<string> | null = null;

  getCsrfToken(): string | null {
    const name = 'csrftoken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        this.csrfToken = cookie.substring(name.length);
        return this.csrfToken;
      }
    }
    return null;
  }

  async ensureCsrfToken(): Promise<string> {
    const existingToken = this.getCsrfToken();
    if (existingToken) {
      return existingToken;
    }

    if (this.fetchingToken && this.tokenPromise) {
      return this.tokenPromise;
    }

    this.fetchingToken = true;
    this.tokenPromise = this.fetchNewToken();
    
    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      this.fetchingToken = false;
      this.tokenPromise = null;
    }
  }

  private async fetchNewToken(): Promise<string> {
    try {
      await apiClient.get(`${API_BASE_URL}/api/v1/csrf/`);
      const token = this.getCsrfToken();
      if (!token) {
        throw new Error('Failed to obtain CSRF token');
      }
      return token;
    } catch (error) {
      throw new Error('Failed to fetch CSRF token');
    }
  }

  clearToken(): void {
    this.csrfToken = null;
  }
}

export const csrfService = new CSRFService();