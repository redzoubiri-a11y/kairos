import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  useUiStore.getState().startLoading();
  return config;
});

const STATUS_FALLBACKS = {
  400: 'Requête invalide.',
  401: 'Session expirée, veuillez vous reconnecter.',
  403: "Vous n'avez pas les droits nécessaires.",
  404: 'Ressource introuvable.',
  409: 'Conflit : cette valeur est déjà utilisée.',
  500: 'Erreur serveur interne.',
};

client.interceptors.response.use(
  (response) => {
    useUiStore.getState().stopLoading();
    return response;
  },
  (error) => {
    useUiStore.getState().stopLoading();

    const status = error.response?.status;
    const payload = error.response?.data?.error;

    let message = payload?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') {
        message = 'Le serveur met trop de temps à répondre.';
      } else if (!error.response) {
        message = "Impossible de joindre l'API. Vérifiez que le serveur est démarré.";
      } else {
        message = STATUS_FALLBACKS[status] || 'Une erreur est survenue.';
      }
    }

    // Clearing the auth store makes ProtectedRoute redirect to /login reactively.
    if (status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
    }

    const normalised = new Error(message);
    normalised.status = status;
    normalised.details = payload?.details ?? [];
    return Promise.reject(normalised);
  }
);

/**
 * The backend validates query strings with strict zod schemas: an empty string
 * fails enum parsing and unknown keys are rejected outright. Only keep keys
 * carrying a real value.
 */
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

export default client;
