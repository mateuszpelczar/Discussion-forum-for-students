/**
 * Axios instance z konfiguracją dla API.
 * Zgodnie z zasadą DRY - centralna konfiguracja HTTP.
 */
import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - dodaje token do każdego żądania.
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - odświeża token przy wygaśnięciu.
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Jeśli token wygasł (401) i to nie jest ponowna próba
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // Brak refresh token - wyloguj użytkownika
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/logowanie';
          return Promise.reject(error);
        }

        // Odświeżenie tokena
        const response = await axios.post(`${API_URL}/auth/token/odswiez/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Ponowienie oryginalnego żądania z nowym tokenem
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Błąd przy odświeżaniu - wyloguj użytkownika
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/logowanie';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
