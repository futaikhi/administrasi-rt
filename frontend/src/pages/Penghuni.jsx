import React, { useState, useEffect } from 'react';
// 1. IMPORT SERVICE BARU DI SINI
import penghuniService from '../services/penghuniService';
import rumahService from '../services/rumahService';

import {
    UserPlus, Edit2, Trash2, IdCard, Phone, Users as UsersIcon,
    Search, ChevronLeft, ChevronRight, Calendar, X
} from 'lucide-react';

export default function Penghuni() {
    const [wargaList, setWargaList] = useState([]);
    const [rumahList, setRumahList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nama_lengkap: '', status_penghuni: 'tetap', nomor_telepon: '',
        status_pernikahan: 'belum_menikah', rumah_id: '', tanggal_masuk: '', foto_ktp: null
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    // 2. REFACTOR FUNGSI FETCH DATA MENGGUNAKAN SERVICE
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resWarga, resRumah] = await Promise.all([
                penghuniService.getAll(debouncedSearch, page, perPage),
                rumahService.getAll()
            ]);

            setWargaList(resWarga.data || resWarga || []);
            setTotalPages(resWarga.last_page || 1);
            setTotalData(resWarga.total || 0);
            setRumahList(resRumah || []);
        } catch (err) {
            setError('Gagal mengambil data dari server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, debouncedSearch, perPage]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const fileTerpilih = e.target.files[0];

        if (!fileTerpilih) return;

        // 1. Validasi Tipe File (Harus Diawali Dengan Kata 'image/')
        if (!fileTerpilih.type.startsWith('image/')) {
            alert('Gagal! Berkas yang Anda pilih bukan gambar. Silakan pilih foto dengan format JPG atau PNG.');
            e.target.value = ''; // Reset input file di browser
            return;
        }

        // 2. Validasi Ukuran File (2MB = 2 * 1024 * 1024 Bytes = 2.097.152 Bytes)
        const batasMaksimal = 2 * 1024 * 1024;
        if (fileTerpilih.size > batasMaksimal) {
            alert('Gagal! Ukuran foto KTP terlalu besar (Maksimal 2MB). Silakan kompres atau kecilkan resolusi gambar terlebih dahulu.');
            e.target.value = ''; // Reset input file di browser
            return;
        }

        // Jika lolos semua validasi, masukkan ke state form
        setFormData(prev => ({
            ...prev,
            foto_ktp: fileTerpilih
        }));
    };

    const handleEditClick = (warga) => {
        setError(''); setSuccess('');
        setEditingId(warga.id);
        const rumahAktifId = warga.rumah_aktif?.[0]?.id || '';
        const tanggalMasukAktif = warga.rumah_aktif?.[0]?.pivot?.tanggal_masuk || '';

        setFormData({
            nama_lengkap: warga.nama_lengkap, status_penghuni: warga.status_penghuni,
            nomor_telepon: warga.nomor_telepon, status_pernikahan: warga.status_pernikahan,
            rumah_id: rumahAktifId, tanggal_masuk: tanggalMasukAktif, foto_ktp: null
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({
            nama_lengkap: '', status_penghuni: 'tetap', nomor_telepon: '',
            status_pernikahan: 'belum_menikah', rumah_id: '', tanggal_masuk: '', foto_ktp: null
        });
    };

    // 3. REFACTOR PROSES SUBMIT MENGGUNAKAN SERVICE
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        const data = new FormData();
        data.append('nama_lengkap', formData.nama_lengkap);
        data.append('status_penghuni', formData.status_penghuni);
        data.append('nomor_telepon', formData.nomor_telepon);
        data.append('status_pernikahan', formData.status_pernikahan);
        data.append('rumah_id', formData.rumah_id);
        data.append('tanggal_masuk', formData.tanggal_masuk);

        if (formData.foto_ktp) data.append('foto_ktp', formData.foto_ktp);

        try {
            if (editingId) {
                data.append('_method', 'PUT');
                await penghuniService.update(editingId, data);
                setSuccess('Data warga berhasil diperbarui!');
            } else {
                if (!formData.foto_ktp) {
                    setError('Foto KTP wajib diunggah untuk pendaftaran baru.');
                    setLoading(false); return;
                }
                await penghuniService.create(data);
                setSuccess('Warga baru berhasil didaftarkan!');
            }
            cancelEdit();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    // 4. REFACTOR PROSES DELETE MENGGUNAKAN SERVICE
    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin warga ini sudah pindah?')) return;
        try {
            await penghuniService.delete(id);
            setSuccess('Data warga berhasil diproses pindah.');
            fetchData();
        } catch (err) {
            setError('Gagal menghapus data warga.');
        }
    };

    return (
        <div className="space-y-8">
            {/* Tampilan UI HTML tetap sama persis seperti kode revisi sebelumnya */}
            {/* ... Sektor Kiri Tabel & Sektor Kanan Form ... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* [Tabel & Form Input HTML tetap dilanjutkan ke bawah seperti biasa] */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2 font-semibold">
                                <UsersIcon className="text-emerald-400" size={20} />
                                <h3>Daftar Seluruh Warga</h3>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, status, rumah..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950 text-slate-400 text-xs font-medium uppercase border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Nama / Detail</th>
                                        <th className="px-6 py-4">Kontak</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-12 text-slate-500">Memuat data dari server...</td></tr>
                                    ) : wargaList?.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-12 text-slate-500">Data tidak ditemukan.</td></tr>
                                    ) : (
                                        wargaList.map((warga) => (
                                            <tr key={warga.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <a href={`http://localhost:8000${warga.foto_ktp}`} target="_blank" rel="noreferrer" className="group relative flex h-10 w-14 shrink-0 bg-slate-950 border border-slate-800 rounded overflow-hidden">
                                                            <img src={`http://localhost:8000${warga.foto_ktp}`} alt="KTP" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><IdCard size={14} className="text-white" /></div>
                                                        </a>
                                                        <div>
                                                            <p className="font-semibold text-white">{warga.nama_lengkap}</p>
                                                            <p className="text-xs text-slate-500">Rumah: No. {warga.rumah_aktif?.[0]?.nomor_rumah || 'Sudah Pindah'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-400"><div className="flex items-center gap-1"><Phone size={12} />{warga.nomor_telepon}</div></td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${warga.status_penghuni === 'tetap' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{warga.status_penghuni}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleEditClick(warga)} className="p-2 rounded-lg bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"><Edit2 size={14} /></button>
                                                        <button onClick={() => handleDelete(warga.id)} className="p-2 rounded-lg bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-500">Menampilkan <span className="text-slate-300">{wargaList?.length || 0}</span> dari <span className="text-slate-300">{totalData}</span> warga</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1 || loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
                            <span className="text-xs font-medium text-slate-400 px-3">Halaman <span className="text-white">{page}</span> dari <span className="text-white">{totalPages}</span></span>
                            <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages || loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit relative">
                    {editingId && <button onClick={cancelEdit} className="absolute top-6 right-6 text-slate-500 hover:text-slate-300"><X size={18} /></button>}
                    <div className={`flex items-center gap-2 mb-6 font-semibold ${editingId ? 'text-amber-400' : 'text-emerald-400'}`}><UserPlus size={20} /><h3>{editingId ? 'Edit Data Warga' : 'Daftarkan Warga Baru'}</h3></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Nama Lengkap</label><input type="text" name="nama_lengkap" required value={formData.nama_lengkap} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">Status Hunian</label><select name="status_penghuni" value={formData.status_penghuni} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"><option value="tetap">Warga Tetap</option><option value="kontrak">Kontrak</option></select></div>
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">Pernikahan</label><select name="status_pernikahan" value={formData.status_pernikahan} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"><option value="belum_menikah">Belum Menikah</option><option value="menikah">Menikah</option></select></div>
                        </div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Nomor Telepon</label><input type="text" name="nomor_telepon" required value={formData.formData?.nomor_telepon || formData.nomor_telepon} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">Pilih Rumah</label><select name="rumah_id" required value={formData.rumah_id} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"><option value="">-- Pilih --</option>{rumahList.map(r => <option key={r.id} value={r.id}>No. {r.nomor_rumah} ({r.status_rumah === 'dihuni' ? 'Terisi' : 'Kosong'})</option>)}</select></div>
                            <div><label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Masuk</label><div className="relative flex items-center"><Calendar className="absolute left-2.5 text-slate-500 pointer-events-none" size={14} /><input type="date" name="tanggal_masuk" required value={formData.tanggal_masuk} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]" /></div></div>
                        </div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Foto KTP {editingId && <span className="text-slate-500 italic">(Kosongkan jika tidak diganti)</span>}</label><input type="file" accept="image/jpeg, image/png, image/jpg" onChange={handleFileChange} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer" /></div>
                        <div className="flex gap-3 mt-2">
                            {editingId && <button type="button" onClick={cancelEdit} className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700">Batal</button>}
                            <button type="submit" disabled={loading} className={`flex-grow rounded-lg py-2.5 text-sm font-semibold text-slate-950 ${editingId ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'} disabled:opacity-50`}>{loading ? 'Menyimpan...' : editingId ? 'Perbarui Data' : 'Simpan Data Warga'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}