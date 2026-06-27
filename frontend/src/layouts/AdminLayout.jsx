import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { 
    LayoutDashboard, 
    Home, 
    Users, 
    Wallet, 
    FileSpreadsheet, 
    LogOut, 
    WalletCards
} from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();

    // Daftar menu navigasi untuk Pak RT
    const menuItems = [
        { name: 'Dashboard Finansial', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Peta Hunian Rumah', path: '/rumah', icon: <Home size={20} /> },
        { name: 'Manajemen Warga', path: '/penghuni', icon: <Users size={20} /> },
        { name: 'Kas Masuk (Iuran)', path: '/pembayaran', icon: <Wallet size={20} /> },
        { name: 'Kas Keluar RT', path: '/pengeluaran', icon: <WalletCards size={20} /> },
        { name: 'Laporan Bulanan', path: '/laporan', icon: <FileSpreadsheet size={20} /> },
    ];

    const handleLogout = async () => {
        try {
            // Tembak API Logout Laravel untuk menghapus token di database
            await api.post('/logout');
        } catch (err) {
            console.error('Gagal mencabut token di server:', err);
        } finally {
            // Apapun hasilnya, hapus token dari browser dan tendang ke login
            localStorage.removeItem('rt_token');
            window.location.href = '/login';
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            {/* --- SIDEBAR (Sisi Kiri - Fixed) --- */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between fixed h-screen z-10">
                <div>
                    {/* Header Sidebar */}
                    <div className="p-6 border-b border-slate-800">
                        <h1 className="text-xl font-bold text-emerald-400 tracking-tight">Kas RT Admin</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Sistem Akuntansi Warga</p>
                    </div>

                    {/* Menu Navigasi */}
                    <nav className="p-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                    }`}
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Tombol Logout (Sisi Bawah Sidebar) */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-colors text-left"
                    >
                        <LogOut size={20} />
                        Keluar Aplikasi
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA (Sisi Kanan) --- */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Top Navbar */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
                            Mode Produksi
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-200">Pak RT (Admin)</p>
                            <p className="text-xs text-slate-500">admin@rt.local</p>
                        </div>
                    </div>
                </header>

                {/* Halaman Anak Dinamis (Rendered Pages) */}
                <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}