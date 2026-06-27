import React, { useState, useEffect } from 'react';
import pengeluaranService from '../services/pengeluaranService';
import { WalletCards, PlusCircle, Edit3, Trash2, X, CalendarDays, DollarSign, Info, ArrowDownRight } from 'lucide-react';

export default function Pengeluaran() {
    const [pengeluaranList, setPengeluaranList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalNominal, setTotalNominal] = useState(0); // State akumulasi pengeluaran dihalaman ini
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State Kontrol CRUD Form
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nama_pengeluaran: '', // Sesuai kolom seeder[cite: 1]
        nominal: '', // Sesuai kolom seeder[cite: 1]
        tanggal_pengeluaran: new Date().toISOString().split('T')[0], // Sesuai kolom seeder[cite: 1]
        keterangan: '' // Sesuai kolom seeder[cite: 1]
    });

    const fetchPengeluaran = async () => {
        try {
            setLoading(true);
            const data = await pengeluaranService.getAll(page);
            setPengeluaranList(data.data || []);
            setTotalPages(data.last_page || 1);
            
            // Hitung ringkasan total pengeluaran di list saat ini
            const total = (data.data || []).reduce((acc, curr) => acc + parseFloat(curr.nominal), 0); // Sesuai kolom seeder[cite: 1]
            setTotalNominal(total);
        } catch (err) {
            setError('Gagal memuat catatan jurnal pengeluaran kas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPengeluaran(); }, [page]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (item) => {
        setError(''); setSuccess('');
        setEditingId(item.id);
        setFormData({
            nama_pengeluaran: item.nama_pengeluaran, // Sesuai kolom seeder[cite: 1]
            nominal: parseInt(item.nominal).toString(), // Sesuai kolom seeder[cite: 1]
            tanggal_pengeluaran: item.tanggal_pengeluaran, // Sesuai kolom seeder[cite: 1]
            keterangan: item.keterangan || '' // Sesuai kolom seeder[cite: 1]
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({
            nama_pengeluaran: '', // Sesuai kolom seeder[cite: 1]
            nominal: '', // Sesuai kolom seeder[cite: 1]
            tanggal_pengeluaran: new Date().toISOString().split('T')[0], // Sesuai kolom seeder[cite: 1]
            keterangan: '' // Sesuai kolom seeder[cite: 1]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        try {
            if (editingId) {
                await pengeluaranService.update(editingId, formData);
                setSuccess('Catatan pengeluaran kas berhasil diperbarui!');
            } else {
                await pengeluaranService.create(formData);
                setSuccess('Pengeluaran kas RT baru berhasil dibukukan!');
            }
            cancelEdit();
            fetchPengeluaran();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data pengeluaran.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus catatan transaksi pengeluaran ini dari buku besar?')) return;
        setError(''); setSuccess('');
        try {
            await pengeluaranService.delete(id);
            setSuccess('Catatan transaksi pengeluaran berhasil dihapus.');
            cancelEdit();
            fetchPengeluaran();
        } catch (err) {
            setError('Gagal menghapus log pengeluaran.');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Master Pengeluaran Kas</h2>
                <p className="text-sm text-slate-400">Pencatatan pos pengeluaran dana RT baik biaya operasional rutin maupun insidental perumahan[cite: 1].</p>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">{error}</div>}
            {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">{success}</div>}

            {/* Total Expense Summary Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between max-w-sm">
                <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Dana Keluar (Hal Ini)</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">Rp {totalNominal.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                    <ArrowDownRight size={24} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* SEKTOR KIRI: Tabel List Jurnal Pengeluaran Kas */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden">
                    <div>
                        <div className="p-6 border-b border-slate-800 font-semibold text-slate-200">
                            <h3>Buku Jurnal Kas Keluar</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-950 text-slate-400 font-medium uppercase border-b border-slate-800">
                                    <tr>
                                        <th className="px-5 py-3">Rincian Alokasi Dana</th>
                                        <th className="px-5 py-3">Tanggal Operasional</th>
                                        <th className="px-5 py-3 text-right">Nominal Anggaran</th>
                                        <th className="px-5 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-slate-500 italic">Sedang memuat lembaran buku jurnal...</td></tr>
                                    ) : pengeluaranList.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-slate-500 italic">Belum ada catatan pengeluaran dana RT yang terekam[cite: 1].</td></tr>
                                    ) : (
                                        pengeluaranList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="px-5 py-3 space-y-0.5 max-w-[220px]">
                                                    <p className="font-semibold text-white truncate">{item.nama_pengeluaran}</p> {/* Sesuai kolom seeder[cite: 1] */}
                                                    {item.keterangan && <p className="text-[11px] text-slate-500 truncate flex items-center gap-1"><Info size={10}/> {item.keterangan}</p>} {/* Sesuai kolom seeder[cite: 1] */}
                                                </td>
                                                <td className="px-5 py-3 text-slate-400 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarDays size={12} className="text-slate-500" />
                                                        {item.tanggal_pengeluaran} {/* Sesuai kolom seeder[cite: 1] */}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-rose-400">
                                                    Rp {parseInt(item.nominal).toLocaleString('id-ID')} {/* Sesuai kolom seeder[cite: 1] */}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleEditClick(item)} className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors" title="Ubah Log"><Edit3 size={12}/></button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors" title="Hapus Log"><Trash2 size={12}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-end gap-2">
                        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="px-3 py-1 text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-30">Prev</button>
                        <span className="text-[11px] text-slate-500">Halaman {page} dari {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300 rounded-lg disabled:opacity-30">Next</button>
                    </div>
                </div>

                {/* SEKTOR KANAN: Form Input Pencatatan Kas Keluar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit relative">
                    {editingId && <button onClick={cancelEdit} className="absolute top-6 right-6 text-slate-500 hover:text-slate-300"><X size={18} /></button>}
                    
                    <div className={`flex items-center gap-2 mb-6 font-semibold ${editingId ? 'text-amber-400' : 'text-rose-400'}`}>
                        {editingId ? <Edit3 size={18} /> : <PlusCircle size={18} />}
                        <h3 className="text-sm uppercase tracking-wider">{editingId ? 'Ubah Log Anggaran' : 'Catat Dana Keluar'}</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nama / Keperluan Pengeluaran</label>
                            <input type="text" name="nama_pengeluaran" required value={formData.nama_pengeluaran} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" placeholder="Contoh: Perbaikan Pintu Gerbang RT" /> {/* Sesuai kolom seeder[cite: 1] */}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nominal Anggaran (Rp)</label>
                            <input type="number" name="nominal" required value={formData.nominal} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" placeholder="Contoh: 350000" /> {/* Sesuai kolom seeder[cite: 1] */}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Anggaran Keluar</label>
                            <input type="date" name="tanggal_pengeluaran" required value={formData.tanggal_pengeluaran} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 [color-scheme:dark]" /> {/* Sesuai kolom seeder[cite: 1] */}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Keterangan Tambahan (Opsional)</label>
                            <textarea name="keterangan" rows="3" value={formData.keterangan} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 resize-none" placeholder="Tulis catatan detil bila diperlukan..."></textarea> {/* Sesuai kolom seeder[cite: 1] */}
                        </div>

                        <button type="submit" className={`w-full text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg text-slate-950 transition-colors ${editingId ? 'bg-amber-500 hover:bg-amber-400' : 'bg-rose-400 hover:bg-rose-300'}`}>
                            {editingId ? 'Perbarui Catatan' : 'Bukukan Kas Keluar'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}