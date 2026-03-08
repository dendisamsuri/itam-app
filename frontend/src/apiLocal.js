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

apiLocal.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 400 || error.response.status === 401) {
            const errorMsg = error.response.data?.error;
            if (errorMsg === 'Token expired' || errorMsg === 'Token tidak valid' || error.response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiLocal;
