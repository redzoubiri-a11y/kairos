import axios from 'axios';
import Constants from 'expo-constants';

function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const fromConfig = Constants.expoConfig?.extra?.apiUrl;
  if (fromConfig) return fromConfig;
  return 'http://localhost:4000';
}

export const API_URL = resolveBaseUrl();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Set by the auth store — avoids a circular import between store and client.
let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && authToken) {
      onUnauthorized?.();
    }
    return Promise.reject(normalizeError(error));
  }
);

export function normalizeError(error) {
  const payload = error.response?.data?.error;
  const message =
    payload?.details?.[0]?.message ||
    payload?.message ||
    (error.code === 'ECONNABORTED'
      ? 'Le serveur ne repond pas. Verifiez votre connexion.'
      : error.message === 'Network Error'
        ? `Impossible de joindre le serveur (${API_URL}).`
        : 'Une erreur est survenue.');

  const normalized = new Error(message);
  normalized.status = error.response?.status;
  normalized.details = payload?.details;
  return normalized;
}

// The server rejects unknown or empty query params, so strip them before sending.
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export default api;
