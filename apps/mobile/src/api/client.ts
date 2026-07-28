import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use your PC's local Wi-Fi IP address
export const API_URL = 'http://192.168.1.50:80/api';
export const MEDIA_URL = 'http://192.168.1.50:80';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
