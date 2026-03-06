import axios from 'axios';

const apiLocal = axios.create({
    baseURL: import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001',
});

apiLocal.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiLocal;
