import api from '../api/axios';

const pembayaranService = {
    getAll: async (page = 1) => {
        const response = await api.get(`/pembayaran?page=${page}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/pembayaran', data);
        return response.data;
    },
    getReportBulanan: async (bulan, tahun) => {
        const response = await api.get('/pembayaran', {
            params: { bulan_iuran: bulan, tahun_iuran: tahun, all: true }
        });
        return response.data;
    },
    getMasterIuran: async () => {
        const response = await api.get('/master-iuran'); // Mengarah ke endpoint master data iuran
        return response.data;
    },
};

export default pembayaranService;