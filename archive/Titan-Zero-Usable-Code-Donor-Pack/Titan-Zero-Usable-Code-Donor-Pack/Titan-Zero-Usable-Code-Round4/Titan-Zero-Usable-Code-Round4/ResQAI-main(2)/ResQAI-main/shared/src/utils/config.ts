export interface Config {
  apiUrl: string;
  authUrl: string;
  podId: string;
  appId: string;
  clientId: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  features: Record<string, boolean>;
}

const defaultConfig: Config = {
  apiUrl: '',
  authUrl: '',
  podId: '',
  appId: '',
  clientId: '',
  environment: 'development',
  version: '2.0.0',
  features: {},
};

class AppConfig {
  private config: Config = { ...defaultConfig };

  load(overrides?: Partial<Config>): void {
    this.config = {
      ...defaultConfig,
      apiUrl: import.meta.env?.VITE_API_URL || '',
      authUrl: import.meta.env?.VITE_AUTH_URL || '',
      podId: import.meta.env?.VITE_LEMMA_POD_ID || '',
      appId: import.meta.env?.VITE_APP_ID || '',
      clientId: import.meta.env?.VITE_CLIENT_ID || '',
      environment: (import.meta.env?.MODE as Config['environment']) || 'development',
      version: '2.0.0',
      features: {},
      ...overrides,
    };
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  isFeatureEnabled(feature: string): boolean {
    return !!this.config.features[feature];
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isStaging(): boolean {
    return this.config.environment === 'staging';
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  all(): Config {
    return { ...this.config };
  }
}

export const config = new AppConfig();
