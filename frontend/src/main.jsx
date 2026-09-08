import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Redirection automatique des requêtes Vercel vers Railway
if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
  window.location.replace('https://gebatrh-production.up.railway.app' + window.location.pathname + window.location.search + window.location.hash);
}

// Configuration globale du Backend API (Railway en production)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://gebatrh-production.up.railway.app' : '');
if (API_URL) {
  axios.defaults.baseURL = API_URL;
}

console.log('SIRH: Initialisation de l\'application React...', { API_URL: axios.defaults.baseURL || 'relative' });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
