import api from '../api/axios';

const rumahService = {
    getAll: async (status = '') => {
        const response = await api.get('/rumah', {
            params: status ? { status } : {}
        });
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/rumah', data);
        return response.data;
    },

    update: async (id, data) => {
        // Karena data teks biasa tanpa file, PUT murni bisa bekerja langsung di Laravel
        const response = await api.put(`/rumah/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/rumah/${id}`);
        return response.data;
    },

    tambahPenghuni: async (id, data) => {
        const response = await api.post(`/rumah/${id}/tambah-penghuni`, data);
        return response.data;
    },

    keluarkanPenghuni: async (id, data) => {
        const response = await api.post(`/rumah/${id}/kembangkan-penghuni`, data); // Sesuai endpoint backend
        return response.data;
    }
};

export default rumahService;