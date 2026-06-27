import axios from 'axios';

const api = axios.create({
    // Sesuaikan URL ini dengan port running Laravel API kamu
    baseURL: 'http://localhost:8000/api', 
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Interceptor untuk otomatis menyisipkan Token ke setiap Request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('rt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk menangani error global (misal: Token Expired / 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Cek jika error statusnya 401
        if (error.response && error.response.status === 401) {
            // Cek apakah rute yang sedang di-hit saat ini adalah rute login
            const isLoginRequest = error.config.url.includes('/login');

            // JIKA BUKAN dari rute login, baru hapus token dan tendang ke halaman login
            if (!isLoginRequest) {
                localStorage.removeItem('rt_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;