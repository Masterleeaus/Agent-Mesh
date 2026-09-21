export function getEnvVar(key: string, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : fallback;
}

export const environment = {
  podId: getEnvVar('VITE_LEMMA_POD_ID'),
  apiUrl: getEnvVar('VITE_LEMMA_API_URL', 'https://api.lemma.ai'),
  authUrl: getEnvVar('VITE_LEMMA_AUTH_URL', 'https://auth.lemma.ai'),
  appId: getEnvVar('VITE_LEMMA_APP_ID'),
  clientId: getEnvVar('VITE_LEMMA_CLIENT_ID'),
};
