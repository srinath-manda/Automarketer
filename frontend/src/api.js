import axios from 'axios';

// Determine if we're in production (deployed on Vercel) or development
const isProduction = window.location.hostname !== 'localhost';
const PRODUCTION_API = 'https://automarketer-backend-2mz4.onrender.com/api';
const DEVELOPMENT_API = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: isProduction ? PRODUCTION_API : DEVELOPMENT_API,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
