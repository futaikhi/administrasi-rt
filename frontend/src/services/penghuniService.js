import api from '../api/axios';

const penghuniService = {
    // Ambil data warga terpaginasi dengan pencarian
    getAll: async (search = '', page = 1, perPage = 5) => {
        const response = await api.get(`/penghuni`, {
            params: { search, page, per_page: perPage }
        });
        return response.data;
    },

    // Pendaftaran warga baru (Menerima FormData)
    create: async (formData) => {
        const response = await api.post('/penghuni', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Perbarui data warga (Menerima FormData dengan spoofing _method=PUT)
    update: async (id, formData) => {
        const response = await api.post(`/penghuni/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Hapus warga / proses pindah
    delete: async (id) => {
        const response = await api.delete(`/penghuni/${id}`);
        return response.data;
    }
};

export default penghuniService;