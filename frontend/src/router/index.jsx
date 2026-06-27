import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout'; // <-- Import Layout baru
import Penghuni from '../pages/Penghuni';
import Rumah from '../pages/Rumah';
import Pembayaran from '../pages/Pembayaran';
import Pengeluaran from '../pages/Pengeluaran';
import Dashboard from '../pages/Dashboard';
import LaporanBulanan from '../pages/LaporanBulanan';

// Placeholder halaman sementara biar navigasi tidak error saat diklik
const DashboardDummy = () => <h1 className="text-2xl font-bold">📊 Halaman Dashboard Keuangan</h1>;
const RumahDummy = () => <h1 className="text-2xl font-bold">🏠 Halaman Peta Keterisian Rumah</h1>;
const PenghuniDummy = () => <h1 className="text-2xl font-bold">👥 Halaman Manajemen Data Warga</h1>;
const TransaksiDummy = () => <h1 className="text-2xl font-bold">💰 Halaman Input Iuran & Kas Keluar</h1>;
const LaporanDummy = () => <h1 className="text-2xl font-bold">📄 Halaman Rincian Jurnal Bulanan</h1>;

const router = createBrowserRouter([
    // --- Rute Publik ---
    {
        path: '/login',
        element: <Login />
    },
    
    // --- Rute Terproteksi ---
    {
        element: <ProtectedRoute />, // Pastikan user punya token dahulu
        children: [
            {
                element: <AdminLayout />, // Bungkus dengan kerangka Sidebar + Navbar
                children: [
                    { path: '/dashboard', element: <Dashboard /> },
                    { path: '/rumah', element: <Rumah /> },
                    { path: '/penghuni', element: <Penghuni /> },
                    { path: '/pembayaran', element: <Pembayaran /> },
                    { path: '/pengeluaran', element: <Pengeluaran /> },
                    { path: '/laporan', element: <LaporanBulanan /> },
                ]
            }
        ]
    },
    
    // --- Fallback Rute ---
    {
        path: '*',
        element: <Navigate to="/login" replace />
    }
]);

export default router;