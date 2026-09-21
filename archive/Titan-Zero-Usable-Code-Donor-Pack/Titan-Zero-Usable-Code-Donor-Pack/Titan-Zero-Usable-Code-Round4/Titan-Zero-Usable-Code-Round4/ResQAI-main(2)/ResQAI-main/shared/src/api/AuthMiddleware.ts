import type { ApiClient } from './ApiClient';

export interface AuthMiddlewareConfig {
  getToken: () => string | null;
  onTokenExpired?: () => void;
  refreshToken?: () => Promise<string | null>;
}

export class AuthMiddleware {
  private config: AuthMiddlewareConfig;

  constructor(config: AuthMiddlewareConfig) {
    this.config = config;
  }

  async apply(client: ApiClient): Promise<void> {
    const token = this.config.getToken();
    if (token) {
      client.setConfig({ headers: { Authorization: `Bearer ${token}` } });
    }
  }

  async handleAuthError(client: ApiClient): Promise<boolean> {
    if (this.config.refreshToken) {
      const newToken = await this.config.refreshToken();
      if (newToken) {
        client.setConfig({ headers: { Authorization: `Bearer ${newToken}` } });
        return true;
      }
    }
    this.config.onTokenExpired?.();
    return false;
  }
}
