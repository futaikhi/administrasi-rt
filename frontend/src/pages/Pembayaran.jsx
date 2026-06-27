import React, { useState, useEffect } from 'react';
import pembayaranService from '../services/pembayaranService';
import rumahService from '../services/rumahService';
import { Wallet, Calendar, Home, User, ArrowUpRight, History, TicketCheck } from 'lucide-react';

export default function Pembayaran() {
    const [transaksiList, setTransaksiList] = useState([]);
    const [rumahList, setRumahList] = useState([]);
    const [wargaAktifOptions, setWargaAktifOptions] = useState([]); // Diisi dinamis tergantung rumah terpilih
    
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State Form Entri Pembayaran
    const [formData, setFormData] = useState({
        rumah_id: '',
        penghuni_id: '',
        master_iuran_id: '1', // Default Satpam
        tahun_iuran: new Date().getFullYear().toString(),
        tanggal_bayar: new Date().toISOString().split('T')[0],
        mode_bayar: 'bulanan', // 'bulanan' atau 'tahunan'
        bulan_iuran: (new Date().getMonth() + 1).toString()
    });

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [resTransaksi, resRumah] = await Promise.all([
                pembayaranService.getAll(page),
                rumahService.getAll()
            ]);
            setTransaksiList(resTransaksi.data || []);
            setTotalPages(resTransaksi.last_page || 1);
            setRumahList(resRumah || []);
        } catch (err) {
            setError('Gagal memuat data transaksi kas masuk.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); }, [page]);

    // EFECT SINKRONISASI: Trigger tiap kali Pak RT memilih rumah berbeda
    useEffect(() => {
        if (!formData.rumah_id) {
            setWargaAktifOptions([]);
            return;
        }
        // Cari objek rumah yang dipilih di dalam list master rumah
        const rumahTerpilih = rumahList.find(r => String(r.id) === String(formData.rumah_id));
        const wargaAktif = rumahTerpilih?.penghuni_aktif || [];
        
        setWargaAktifOptions(wargaAktif);
        
        // Auto-select jika penghuninya cuma ada 1 orang di rumah itu
        if (wargaAktif.length === 1) {
            setFormData(prev => ({ ...prev, penghuni_id: wargaAktif[0].id.toString() }));
        } else {
            setFormData(prev => ({ ...prev, penghuni_id: '' }));
        }
    }, [formData.rumah_id, rumahList]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        if (!formData.penghuni_id) {
            setError('Gagal! Rumah terpilih tidak memiliki penghuni aktif untuk menanggung tagihan.');
            setLoading(false); return;
        }

        try {
            await pembayaranService.create(formData);
            setSuccess('Transaksi iuran kas masuk berhasil dicatat ke buku besar RT!');
            // Reset form parsial
            setFormData(prev => ({
                ...prev,
                rumah_id: '',
                penghuni_id: ''
            }));
            loadInitialData(); // Refresh table log transaksi
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan transaksi pembayaran.');
        } finally {
            setLoading(false);
        }
    };

    const namaBulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Loket Pembayaran Iuran</h2>
                <p className="text-sm text-slate-400">Pencatatan uang kas masuk untuk iuran keamanan satpam (100k) dan kebersihan lingkungan (15k).</p>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">{error}</div>}
            {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* SEKTOR KIRI: Form Pembukuan Transaksi */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
                    <div className="flex items-center gap-2 mb-6 font-semibold text-emerald-400">
                        <TicketCheck size={20} />
                        <h3>Input Setoran Kas Iuran</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 1. Pilih Rumah */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Pilih Unit Rumah</label>
                            <select name="rumah_id" required value={formData.rumah_id} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                <option value="">-- Pilih Nomor Rumah --</option>
                                {rumahList.map(r => (
                                    <option key={r.id} value={r.id}>No. {r.nomor_rumah} ({r.status_rumah === 'dihuni' ? 'Terisi' : 'Kosong'})</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Pilih Warga Pembayar (SINKRON OTOMATIS) */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Warga Penanggung Jawab (Pembayar)</label>
                            <select name="penghuni_id" required value={formData.penghuni_id} onChange={handleInputChange} disabled={wargaAktifOptions.length === 0} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40">
                                <option value="">{formData.rumah_id ? '-- Pilih Anggota Keluarga --' : 'Pilih nomor rumah terlebih dahulu'}</option>
                                {wargaAktifOptions.map(w => (
                                    <option key={w.id} value={w.id}>{w.nama_lengkap}</option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Jenis Iuran */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Jenis Iuran</label>
                                <select name="master_iuran_id" value={formData.master_iuran_id} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                    <option value="1">Satpam (100k)</option>
                                    <option value="2">Kebersihan (15k)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Tahun Periode</label>
                                <select name="tahun_iuran" value={formData.tahun_iuran} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                    <option value="2026">2026</option>
                                    <option value="2027">2027</option>
                                </select>
                            </div>
                        </div>

                        {/* 4. Mode Pembayaran (Sesuai Syarat 3.3) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Mode Pembayaran</label>
                                <select name="mode_bayar" value={formData.mode_bayar} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                    <option value="bulanan">Per Bulan</option>
                                    <option value="tahunan">1 Tahun Lunas</option>
                                </select>
                            </div>
                            
                            {/* Input Bulan disembunyikan/di-lock otomatis jika memilih mode 1 Tahun lunas */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Pilih Bulan</label>
                                <select name="bulan_iuran" disabled={formData.mode_bayar === 'tahunan'} value={formData.bulan_iuran} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-30">
                                    {namaBulanArr.map((b, i) => (
                                        <option key={i+1} value={i+1}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 5. Tanggal Pembukuan */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Transaksi Diterima</label>
                            <input type="date" name="tanggal_bayar" required value={formData.tanggal_bayar} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]" />
                        </div>

                        {/* Info Ringkasan Kalkulasi Nominal Sebelum Submit */}
                        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1">
                            <span className="text-slate-500 uppercase font-bold tracking-wider block text-[10px]">Estimasi Setoran Uang Kas:</span>
                            <p className="text-lg font-bold text-emerald-400">
                                Rp {formData.mode_bayar === 'tahunan' 
                                    ? ((formData.master_iuran_id === '1' ? 100000 : 15000) * 12).toLocaleString('id-ID')
                                    : (formData.master_iuran_id === '1' ? 100000 : 15000).toLocaleString('id-ID')
                                }
                                <span className="text-xs text-slate-400 font-normal"> ({formData.mode_bayar === 'tahunan' ? '12 Bulan' : '1 Bulan'})</span>
                            </p>
                        </div>

                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors">
                            <ArrowUpRight size={14} /> Bukukan Kas Masuk
                        </button>
                    </form>
                </div>

                {/* SEKTOR KANAN: Real-time Jurnal Transaksi Masuk */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden">
                    <div>
                        <div className="p-6 border-b border-slate-800 flex items-center gap-2 font-semibold">
                            <History className="text-blue-400" size={18} />
                            <h3>Buku Jurnal Kas Masuk (Iuran)</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-950 text-slate-400 font-medium uppercase border-b border-slate-800">
                                    <tr>
                                        <th className="px-5 py-3">Kavling / Penyetor</th>
                                        <th className="px-5 py-3">Komponen Iuran</th>
                                        <th className="px-5 py-3">Periode</th>
                                        <th className="px-5 py-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {transaksiList.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-slate-500 italic">Belum ada rekaman transaksi kas iuran masuk.</td></tr>
                                    ) : (
                                        transaksiList.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-3">
                                                    <p className="font-semibold text-white">Blok {t.rumah?.nomor_rumah || 'N/A'}</p>
                                                    <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{t.penghuni?.nama_lengkap || 'Warga'}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        t.master_iuran_id === 1 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                        {t.master_iuran_id === 1 ? 'Satpam' : 'Kebersihan'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-400">
                                                    <div className="font-medium text-slate-200">{namaBulanArr[t.bulan_iuran - 1]} {t.tahun_iuran}</div>
                                                    <div className="text-[10px] text-slate-500">Bayar: {t.tanggal_bayar}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-emerald-400">
                                                    Rp {parseInt(t.jumlah_bayar).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Simple */}
                    <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-end gap-2">
                        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="px-3 py-1 text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-30">Prev</button>
                        <span className="text-[11px] text-slate-500">Halaman {page} dari {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-30">Next</button>
                    </div>
                </div>

            </div>
        </div>
    );
}