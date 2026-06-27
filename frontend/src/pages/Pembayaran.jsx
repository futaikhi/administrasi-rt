import React, { useState, useEffect } from 'react';
import pembayaranService from '../services/pembayaranService';
import rumahService from '../services/rumahService';
import penghuniService from '../services/penghuniService';

import {
    Wallet, Receipt, Calendar, Home, User,
    ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';

export default function Pembayaran() {
    // --- 1. STATE MANAGEMENT (KONSISTEN DENGAN MENU PENGHUNI) ---
    const [pembayaranList, setPembayaranList] = useState([]);
    const [masterIuranList, setMasterIuranList] = useState([]);
    const [rumahList, setRumahList] = useState([]);
    const [wargaList, setWargaList] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);

    const [formData, setFormData] = useState({
        rumah_id: '',
        penghuni_id: '',
        master_iuran_id: '',
        tahun_iuran: new Date().getFullYear().toString(),
        bulan_iuran: (new Date().getMonth() + 1).toString(),
        mode_bayar: 'bulanan',
        tanggal_bayar: new Date().toISOString().split('T')[0]
    });

    // --- 2. FETCH DATA ENGINE (PARALEL VIA SERVICE CONVENTION) ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resPembayaran, resIuran, resRumah, resWarga] = await Promise.all([
                pembayaranService.getAll(page),
                pembayaranService.getMasterIuran(),
                rumahService.getAll(),
                penghuniService.getAll('', 1, 1000) // Ambil data warga untuk dropdown select
            ]);

            setPembayaranList(resPembayaran.data || []);
            setTotalPages(resPembayaran.last_page || 1);
            setTotalData(resPembayaran.total || 0);
            
            setMasterIuranList(Array.isArray(resIuran) ? resIuran : (resIuran?.data || []));
            setRumahList(resRumah || []);
            setWargaList(resWarga.data || resWarga || []);
        } catch (err) {
            setError('Gagal mengambil data transaksi dari server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page]);

    // --- 3. DYNAMIC INVOICE CALCULATION ENGINE ---
    const selectedIuranObj = masterIuranList.find(i => i.id === parseInt(formData.master_iuran_id));
    const nominalPerBulan = selectedIuranObj ? parseFloat(selectedIuranObj.nominal) : 0;
    const totalBayarPreview = formData.mode_bayar === 'tahunan' ? nominalPerBulan * 12 : nominalPerBulan;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            rumah_id: '',
            penghuni_id: '',
            master_iuran_id: '',
            tahun_iuran: new Date().getFullYear().toString(),
            bulan_iuran: (new Date().getMonth() + 1).toString(),
            mode_bayar: 'bulanan',
            tanggal_bayar: new Date().toISOString().split('T')[0]
        });
    };

    // --- 4. SUBMIT TRANSACTION PROCESSOR ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        try {
            const res = await pembayaranService.savePembayaran(formData);
            setSuccess(res.message || 'Transaksi kas masuk berhasil dibukukan!');
            resetForm();
            setPage(1);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan transaksi.');
        } finally {
            setLoading(false);
        }
    };

    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    return (
        <div className="space-y-8">
            
            {/* TAMPILAN NOTIFIKASI ERROR / SUCCESS BANNER */}
            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
            {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2"><AlertCircle size={14}/> {success}</div>}

            {/* 👑 STRUCTURE MURNI: SPLIT 2 PANEL LAYOUT (KIRI: TABEL, KANAN: FORM) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ========================================================================= */}
                {/* SEKTOR KIRI: TABEL JURNAL LOG KAS MASUK (LEBAR: 2/3)                      */}
                {/* ========================================================================= */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2 font-semibold">
                                <Wallet className="text-emerald-400" size={20} />
                                <h3>Jurnal Riwayat Kas Masuk</h3>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950 text-slate-400 text-xs font-medium uppercase border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Kavling</th>
                                        <th className="px-6 py-4">Nama Warga</th>
                                        <th className="px-6 py-4">Komponen Iuran</th>
                                        <th className="px-6 py-4 text-center">Periode Buku</th>
                                        <th className="px-6 py-4 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {loading && pembayaranList.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-12 text-slate-500">Memuat data transaksi dari server...</td></tr>
                                    ) : pembayaranList.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-12 text-slate-500">Data transaksi tidak ditemukan.</td></tr>
                                    ) : (
                                        pembayaranList.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-white">
                                                    <div className="flex items-center gap-1.5"><Home size={12} className="text-slate-500"/> No. {row.rumah?.nomor_rumah || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-300">
                                                    <div className="flex items-center gap-1.5"><User size={12} className="text-slate-500"/> {row.penghuni?.nama_lengkap || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                                                        {row.master_iuran?.nama_iuran || 'Iuran Umum'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-semibold text-emerald-400">
                                                    {namaBulan[row.bulan_iuran - 1]} {row.tahun_iuran}
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-white">
                                                    Rp {parseFloat(row.jumlah_bayar).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CONTROL COMPONENT: PAGINATION (KONSISTEN PENGHUNI) */}
                    <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-500">Menampilkan <span className="text-slate-300">{pembayaranList?.length || 0}</span> dari <span className="text-slate-300">{totalData}</span> riwayat</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1 || loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"><ChevronLeft size={16} /></button>
                            <span className="text-xs font-medium text-slate-400 px-3">Halaman <span className="text-white">{page}</span> dari <span className="text-white">{totalPages}</span></span>
                            <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages || loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SEKTOR KANAN: FORM LOKET INPUT BUKU KAS (LEBAR: 1/3)                      */}
                {/* ========================================================================= */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit lg:sticky lg:top-24">
                    <div className="flex items-center gap-2 mb-6 font-semibold text-emerald-400">
                        <Receipt size={20} />
                        <h3>Loket Kas Masuk</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* SELECT RUMAH DINAMIS */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Pilih Kavling Rumah</label>
                            <select name="rumah_id" required value={formData.rumah_id} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                                <option value="">-- Pilih Unit Rumah --</option>
                                {rumahList.map(r => (
                                    <option key={r.id} value={r.id}>No. {r.nomor_rumah} ({r.status_rumah === 'dihuni' ? 'Terisi' : 'Kosong'})</option>
                                ))}
                            </select>
                        </div>

                        {/* SELECT WARGA DINAMIS */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Pilih Penanggung Jawab Warga</label>
                            <select name="penghuni_id" required value={formData.penghuni_id} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                                <option value="">-- Pilih Nama Warga --</option>
                                {wargaList.map(w => (
                                    <option key={w.id} value={w.id}>{w.nama_lengkap}</option>
                                ))}
                            </select>
                        </div>

                        {/* SELECT MASTER IURAN DINAMIS DATABASE */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Komponen Iuran</label>
                            <select name="master_iuran_id" required value={formData.master_iuran_id} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                                <option value="">-- Pilih Jenis Iuran --</option>
                                {masterIuranList.map(i => (
                                    <option key={i.id} value={i.id}>{i.nama_iuran} (Rp {parseInt(i.nominal).toLocaleString('id-ID')})</option>
                                ))}
                            </select>
                        </div>

                        {/* SELECTION JANGKA WAKTU METHOD */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Metode Pembayaran</label>
                            <select name="mode_bayar" value={formData.mode_bayar} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                <option value="bulanan">Reguler (1 Bulan)</option>
                                <option value="tahunan">Paket Lunas 1 Tahun (12 Bulan)</option>
                            </select>
                        </div>

                        {/* PERIODE DINAMIS MENGGUNTING TATA LETAK */}
                        {formData.mode_bayar === 'bulanan' ? (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Bulan</label>
                                    <select name="bulan_iuran" value={formData.bulan_iuran} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none">
                                        {namaBulan.map((b, i) => <option key={i+1} value={i+1}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Tahun</label>
                                    <input type="number" name="tahun_iuran" value={formData.tahun_iuran} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Tahun Buku Lunas</label>
                                <input type="number" name="tahun_iuran" value={formData.tahun_iuran} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
                            </div>
                        )}

                        {/* INPUT HARI TRANSAKSI */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Transaksi</label>
                            <div className="relative flex items-center">
                                <Calendar className="absolute left-2.5 text-slate-500 pointer-events-none" size={14} />
                                <input type="date" name="tanggal_bayar" required value={formData.tanggal_bayar} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]" />
                            </div>
                        </div>

                        {/* BILLING LIVE ESTIMATE PREVIEW */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between mt-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Setor</span>
                            <span className="text-sm font-black text-emerald-400">Rp {totalBayarPreview.toLocaleString('id-ID')}</span>
                        </div>

                        {/* SUBMIT BUTTON CONTROL */}
                        <button type="submit" disabled={loading || !formData.master_iuran_id} className="w-full rounded-lg py-2.5 text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-all mt-2">
                            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}