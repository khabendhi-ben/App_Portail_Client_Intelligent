// Centralise la configuration d'Axios. 
// Gère l'URL de base du backend et 
// l'injection automatique du Token JWT 
// dans chaque requête via des "intercepteurs", 
// évitant ainsi la redondance de code.

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // L'URL de base de ton backend
});

// Intercepteur pour envoyer automatiquement le Token JWT avec chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;


api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si l'erreur 401 provient de la tentative de login, on ne redirige pas pour laisser le message s'afficher
    const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);