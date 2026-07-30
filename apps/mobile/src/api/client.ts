import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// In production builds, use the hardcoded server IP from app.json extras.
// In development (Expo Go / web dev), dynamically resolve the dev server host.
function resolveApiUrl(): string {
  // Production: use the value baked into app.json at build time
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) {
    return extra.apiUrl as string;
  }

  // Development (web): always localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:80/api';
  }

  // Development (Expo Go on device): derive host from the Metro bundler URI
  const debuggerHost = Constants.expoConfig?.hostUri;
  const hostIp = debuggerHost?.split(':')[0] || '192.168.1.38';
  return `http://${hostIp}:80/api`;
}

function resolveMediaUrl(): string {
  const extra = Constants.expoConfig?.extra;
  if (extra?.mediaUrl) {
    return extra.mediaUrl as string;
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:80';
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  const hostIp = debuggerHost?.split(':')[0] || '192.168.1.38';
  return `http://${hostIp}:80`;
}

export const API_URL = resolveApiUrl();
export const MEDIA_URL = resolveMediaUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach JWT token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Global error handler — log unauthorized errors cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('userToken');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
