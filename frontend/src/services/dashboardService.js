import api from '../api/axios';

const dashboardService = {
    getSummaryTahunan: async (tahun = 2026) => {
        const response = await api.get(`/dashboard/summary-tahunan?tahun=${tahun}`);
        return response.data;
    }
};

export default dashboardService;