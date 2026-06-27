import api from '../api/axios';

const pengeluaranService = {
    getAll: async (page = 1) => {
        const response = await api.get(`/pengeluaran?page=${page}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/pengeluaran', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/pengeluaran/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/pengeluaran/${id}`);
        return response.data;
    },
    getReportBulanan: async (bulan, tahun) => {
        const response = await api.get('/pengeluaran', {
            params: { bulan, tahun, all: true }
        });
        return response.data;
    }
};

export default pengeluaranService;