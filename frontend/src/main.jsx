import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

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
