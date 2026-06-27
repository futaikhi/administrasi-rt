import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboardService';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard() {
    // --- LOGIKA DINAMIS GENERATE 20 TAHUN KE BELAKANG ---
    const tahunSekarang = new Date().getFullYear(); // Otomatis mendeteksi tahun berjalan (2026)
    const daftarTahun = Array.from({ length: 21 }, (_, index) => (tahunSekarang - index).toString());

    const [dataReport, setDataReport] = useState(null);
    const [tahun, setTahun] = useState(tahunSekarang.toString()); // Default langsung ke tahun aktif saat ini
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getSummaryTahunan(tahun);
            setDataReport(data);
        } catch (err) {
            setError('Gagal memuat rangkuman laporan tahunan kas RT.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboardData(); }, [tahun]);

    const maxNominalDiChart = dataReport ? Math.max(
        ...dataReport.chart_data.map(d => Math.max(d.pemasukan, d.pengeluaran)), 
        100000
    ) : 100000;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Utama & Filter Tahun Dinamis */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ringkasan Pembukuan Keuangan RT</h2>
                    <p className="text-sm text-slate-400">Rangkuman grafik performa neraca saldo kas masuk dan kas keluar operasional perumahan.</p>
                </div>
                
                {/* REVISI: Dropdown Tahun Dinamis */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 h-fit w-fit">
                    <Calendar size={14} className="text-slate-500" />
                    <select 
                        value={tahun} 
                        onChange={(e) => setTahun(e.target.value)}
                        className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                    >
                        {daftarTahun.map((th) => (
                            <option key={th} value={th} className="bg-slate-950">
                                Tahun Buku {th}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">{error}</div>}

            {/* Area Ringkasan Saldo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Sisa Kas Buku</p>
                            <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                                Rp {loading ? '...' : (dataReport?.summary?.saldo_sisa || 0).toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl"><Wallet size={20} /></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan (Iuran)</p>
                            <h3 className="text-2xl font-black text-emerald-400 tracking-tight mt-1">
                                + Rp {loading ? '...' : (dataReport?.summary?.total_pemasukan || 0).toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl"><ArrowUpRight size={20} /></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-40" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran Buku</p>
                            <h3 className="text-2xl font-black text-rose-400 tracking-tight mt-1">
                                - Rp {loading ? '...' : (dataReport?.summary?.total_pengeluaran || 0).toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl"><ArrowDownRight size={20} /></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 opacity-40" />
                </div>
            </div>

            {/* Area Grafik Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-4">
                    <TrendingUp size={18} className="text-emerald-400" />
                    <h3>Grafik Tren Pemasukan vs Pengeluaran Bulanan</h3>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500 italic">Mengkalkulasi koordinat grafik transaksi...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="h-64 flex items-end gap-2 sm:gap-4 md:gap-6 border-b border-slate-800 pb-2 pt-4 px-2">
                            {dataReport?.chart_data.map((row, idx) => {
                                const tinggiPemasukan = (row.pemasukan / maxNominalDiChart) * 100;
                                const tinggiPengeluaran = (row.pengeluaran / maxNominalDiChart) * 100;

                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                                        <div className="absolute z-20 bottom-full mb-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-[10px] space-y-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl min-w-[120px]">
                                            <p className="font-bold text-white text-center border-b border-slate-800 pb-1 mb-1">Bulan {row.bulan_nama}</p>
                                            <p className="flex justify-between text-emerald-400"><span>Masuk:</span> <span>{row.pemasukan/1000}k</span></p>
                                            <p className="flex justify-between text-rose-400"><span>Keluar:</span> <span>{row.pengeluaran/1000}k</span></p>
                                            <p className="flex justify-between text-slate-300 font-semibold border-t border-slate-800 pt-1 mt-1"><span>Sisa:</span> <span>{row.saldo_bulan_ini/1000}k</span></p>
                                        </div>

                                        <div className="flex items-end gap-1 w-full h-full justify-center">
                                            <div style={{ height: `${tinggiPemasukan}%` }} className="w-2.5 sm:w-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm min-h-[2px]" />
                                            <div style={{ height: `${tinggiPengeluaran}%` }} className="w-2.5 sm:w-4 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm min-h-[2px]" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex text-center text-[10px] font-bold text-slate-500 px-2">
                            {dataReport?.chart_data.map((row, idx) => (
                                <div key={idx} className="flex-1 text-slate-400 tracking-tight">{row.bulan_nama}</div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800/60 w-fit mx-auto">
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-5 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded" />
                                <span>Pemasukan Kas Warga</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-5 bg-gradient-to-r from-rose-600 to-rose-400 rounded" />
                                <span>Pengeluaran Operasional RT</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}