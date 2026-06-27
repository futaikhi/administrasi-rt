import React, { useState, useEffect } from 'react';
import rumahService from '../services/rumahService';
import penghuniService from '../services/penghuniService';
import {
    Home, User, CheckCircle2, XCircle, PlusCircle, Edit3,
    Trash2, X, History, CalendarDays, Wallet, BadgeDollarSign,
    UserMinus, UserPlus, Search, ChevronDown
} from 'lucide-react';

export default function Rumah() {
    const [rumahList, setRumahList] = useState([]);
    const [wargaDaftar, setWargaDaftar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- State Form Rumah ---
    const [editingId, setEditingId] = useState(null);
    const [selectedRumahObj, setSelectedRumahObj] = useState(null);
    const [formData, setFormData] = useState({ nomor_rumah: '', status_rumah: 'tidak_dihuni' });

    // --- State Form Hubungkan Warga Baru ke Rumah Ini ---
    const [subFormWarga, setSubFormWarga] = useState({ penghuni_id: '', tanggal_masuk: '' });

    // --- State Baru: Kontrol Searchable Dropdown Warga ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [wargaSearchQuery, setWargaSearchQuery] = useState('');

    // --- State Modal Riwayat ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedRumah, setSelectedRumah] = useState(null);
    const [activeTab, setActiveTab] = useState('penghuni');

    const fetchDataAwal = async () => {
        try {
            setLoading(true);
            const [dataRumah, dataWarga] = await Promise.all([
                rumahService.getAll(),
                penghuniService.getAll('', 1, 200) // Ambil kapasitas lebih besar untuk drop-down pencarian
            ]);
            setRumahList(dataRumah || []);
            setWargaDaftar(dataWarga.data || dataWarga || []);
        } catch (err) {
            setError('Gagal memuat interaksi data server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDataAwal(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (rumah) => {
        setError(''); setSuccess('');
        setEditingId(rumah.id);
        setSelectedRumahObj(rumah);
        setFormData({ nomor_rumah: rumah.nomor_rumah, status_rumah: rumah.status_rumah });
        setSubFormWarga({ penghuni_id: '', tanggal_masuk: '' });
        setIsDropdownOpen(false); // Pastikan dropdown tertutup saat ganti rumah
        setWargaSearchQuery('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setSelectedRumahObj(null);
        setFormData({ nomor_rumah: '', status_rumah: 'tidak_dihuni' });
        setIsDropdownOpen(false);
        setWargaSearchQuery('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');
        try {
            if (editingId) {
                await rumahService.update(editingId, formData);
                setSuccess('Data unit rumah berhasil diperbarui!');
            } else {
                await rumahService.create({ nomor_rumah: formData.nomor_rumah });
                setSuccess('Unit rumah baru berhasil ditambahkan!');
            }
            cancelEdit(); fetchDataAwal();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data.');
        }
    };

    const handleAddWargaToHouse = async (e) => {
        e.preventDefault();
        if (!subFormWarga.penghuni_id || !subFormWarga.tanggal_masuk) {
            setError('Pilih warga dan tanggal masuk terlebih dahulu.');
            return;
        }
        setError(''); setSuccess('');
        try {
            await rumahService.tambahPenghuni(editingId, subFormWarga);
            setSuccess('Anggota keluarga baru berhasil dimasukkan ke kavling ini!');

            const updatedRumah = await rumahService.getAll();
            setRumahList(updatedRumah || []);
            const freshHouse = updatedRumah.find(r => r.id === editingId);
            setSelectedRumahObj(freshHouse);

            setSubFormWarga({ penghuni_id: '', tanggal_masuk: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memasukkan warga.');
        }
    };

    const handleRemoveWargaFromHouse = async (wargaId) => {
        if (!confirm('Keluarkan warga ini dari daftar penghuni aktif rumah? Jejak sejarah hunian tetap tersimpan.')) return;
        setError(''); setSuccess('');
        try {
            await rumahService.keluarkanPenghuni(editingId, { penghuni_id: wargaId });
            setSuccess('Warga berhasil diproses pindah keluar.');

            const updatedRumah = await rumahService.getAll();
            setRumahList(updatedRumah || []);
            const freshHouse = updatedRumah.find(r => r.id === editingId);
            setSelectedRumahObj(freshHouse);
        } catch (err) {
            setError('Gagal mengeluarkan warga.');
        }
    };

    const handleDelete = async () => {
        if (!editingId) return;
        if (!confirm('Hapus unit rumah ini?')) return;
        try {
            await rumahService.delete(editingId);
            setSuccess('Unit rumah berhasil dihapus.');
            cancelEdit(); fetchDataAwal();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus.');
        }
    };

    const handleOpenHistory = (e, rumah) => {
        e.stopPropagation(); setSelectedRumah(rumah);
        setActiveTab('penghuni'); setShowHistoryModal(true);
    };

    // --- FILTER LOGIC UNTUK SEARCHABLE DROPDOWN ---
    const filteredWargaOptions = wargaDaftar.filter(w =>
        w.nama_lengkap.toLowerCase().includes(wargaSearchQuery.toLowerCase())
    );

    // Label tombol pemicu dropdown (Menampilkan nama warga terpilih saat ini)
    const labelWargaTerpilih = wargaDaftar.find(w => String(w.id) === String(subFormWarga.penghuni_id))?.nama_lengkap || '-- Cari Nama Warga --';

    const totalRumah = rumahList.length;
    const terisi = rumahList.filter(r => r.status_rumah === 'dihuni').length;
    const kosong = totalRumah - terisi;
    const bulanSekarang = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][new Date().getMonth()];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Manajemen & Peta Denah Rumah</h2>
                <p className="text-sm text-slate-400">Kelola unit kavling, bongkar-pasang anggota keluarga, serta pantau kelunasan iuran warga secara real-time.</p>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}
            {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">{success}</div>}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                    <div><p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Kapasitas</p><p className="text-2xl font-bold text-white mt-1">{loading ? '...' : totalRumah} Unit</p></div>
                    <Home className="text-blue-400" size={28} />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                    <div><p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rumah Dihuni</p><p className="text-2xl font-bold text-emerald-400 mt-1">{loading ? '...' : terisi} Unit</p></div>
                    <CheckCircle2 className="text-emerald-400" size={28} />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                    <div><p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rumah Kosong</p><p className="text-2xl font-bold text-slate-400 mt-1">{loading ? '...' : kosong} Unit</p></div>
                    <XCircle className="text-slate-500" size={28} />
                </div>
            </div>

            {/* Layout Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* SEKTOR KRI: Peta Rumah */}
                <div className="lg:col-span-2 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Klik rumah untuk mengelola kavling, atau klik 📜 untuk detail keuangan:</p>
                    {loading ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">Memetakan denah...</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {rumahList.map((rumah) => {
                                const wargaAktif = rumah.penghuni_aktif || [];
                                const isDihuni = rumah.status_rumah === 'dihuni' && wargaAktif.length > 0;
                                const isSelected = editingId === rumah.id;
                                const statusIuran = rumah.status_iuran_bulan_ini;

                                return (
                                    <div
                                        key={rumah.id}
                                        onClick={() => handleEditClick(rumah)}
                                        className={`group relative rounded-2xl border p-5 flex flex-col justify-between min-h-[165px] cursor-pointer transition-all duration-300 ${isSelected
                                                ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20'
                                                : isDihuni ? 'bg-slate-900 border-slate-800 hover:border-emerald-500' : 'bg-slate-900/40 border-slate-800/60 opacity-80 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className={`p-2 rounded-xl ${isDihuni ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}><Home size={18} /></div>
                                            <button onClick={(e) => handleOpenHistory(e, rumah)} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"><History size={14} /></button>
                                        </div>

                                        <div className="mt-3 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Penghuni ({wargaAktif.length}):</p>
                                                <span className="text-xs font-bold text-slate-300">No. {rumah.nomor_rumah}</span>
                                            </div>
                                            {isDihuni ? (
                                                <div className="space-y-0.5 max-h-[36px] overflow-y-auto pr-1 scrollbar-thin">
                                                    {wargaAktif.map(w => <p key={w.id} className="text-xs text-slate-400 truncate font-medium">• {w.nama_lengkap}</p>)}
                                                </div>
                                            ) : <p className="text-xs text-slate-600 italic">Kosong</p>}

                                            <div className="pt-1 flex flex-wrap gap-1">
                                                {/* Taruh objek accessor backend ke dalam variabel pembantu */}
                                                {(() => {
                                                    const infoIuran = rumah.status_iuran_bulan_ini;

                                                    if (infoIuran?.status === 'bebas_tagihan') {
                                                        return <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-500">Bebas Tagihan</span>;
                                                    }

                                                    if (infoIuran?.status === 'lunas') {
                                                        return (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                {bulanSekarang}: Lunas
                                                            </span>
                                                        );
                                                    }

                                                    // Jika status belum_lunas, render badge spesifik berdasarkan nilai detail key dari backend
                                                    return (
                                                        <>
                                                            {/* Jika properti satpam bernilai false, tampilkan badge merah */}
                                                            {!infoIuran?.detail?.satpam && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                                                                    Belum Bayar: Satpam
                                                                </span>
                                                            )}
                                                            {/* Jika properti kebersihan bernilai false, tampilkan badge oranye */}
                                                            {!infoIuran?.detail?.kebersihan && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                                                    Belum Bayar: Kebersihan
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* SEKTOR KANAN: Form Pengelola Kavling Utama & Anggota Keluarga */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit relative space-y-6">
                    {editingId && <button onClick={cancelEdit} className="absolute top-6 right-6 text-slate-500 hover:text-slate-300"><X size={18} /></button>}

                    {/* Bagian Utama Form Rumah */}
                    <div>
                        <div className={`flex items-center gap-2 mb-4 font-semibold ${editingId ? 'text-amber-400' : 'text-blue-400'}`}>
                            {editingId ? <Edit3 size={18} /> : <PlusCircle size={18} />}
                            <h3 className="text-sm uppercase tracking-wider">{editingId ? 'Ubah Nomor Kavling' : 'Tambah Kavling Rumah'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nomor / Blok Rumah</label>
                                <input type="text" name="nomor_rumah" required value={formData.nomor_rumah} onChange={handleInputChange} className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase" placeholder="Contoh: B-01" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <button type="submit" className={`w-full rounded-lg py-2 text-xs font-bold text-slate-950 uppercase tracking-wider transition-colors ${editingId ? 'bg-amber-500 hover:bg-amber-400' : 'bg-blue-500 hover:bg-blue-400'}`}>{editingId ? 'Simpan Nomor' : 'Daftarkan Unit'}</button>
                                {editingId && <button type="button" onClick={handleDelete} className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 py-2 text-xs font-bold uppercase tracking-wider"><Trash2 size={12} />Hapus Kavling</button>}
                            </div>
                        </form>
                    </div>

                    {/* SEKTOR SUB-KONTROL PENGHUNI (Hanya Aktif Saat Mode Edit Rumah) */}
                    {editingId && selectedRumahObj && (
                        <div className="pt-4 border-t border-slate-800/80 space-y-5">

                            {/* List Anggota Terdaftar Saat Ini */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <UserMinus size={14} className="text-rose-400" />
                                    <h4>Penghuni Rumah Saat Ini ({selectedRumahObj.penghuni_aktif?.length || 0})</h4>
                                </div>
                                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                    {(!selectedRumahObj.penghuni_aktif || selectedRumahObj.penghuni_aktif.length === 0) ? (
                                        <p className="text-xs text-slate-600 italic bg-slate-950/40 p-3 rounded-lg text-center">Rumah kosong kosong melompong.</p>
                                    ) : (
                                        selectedRumahObj.penghuni_aktif.map(p => (
                                            <div key={p.id} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                                                <p className="text-xs font-semibold text-slate-200 truncate">{p.nama_lengkap}</p>
                                                <button type="button" onClick={() => handleRemoveWargaFromHouse(p.id)} className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"><X size={12} /></button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* REVISI FITUR: PREMIUM SEARCHABLE DROPDOWN UNTUK CARI WARGA */}
                            <div className="space-y-3 bg-slate-950/30 border border-slate-800/60 p-4 rounded-xl">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <UserPlus size={14} className="text-emerald-400" />
                                    <h4>Masukkan Warga ke Kavling Ini</h4>
                                </div>
                                <form onSubmit={handleAddWargaToHouse} className="space-y-3">

                                    {/* Wrapper Elemen Custom Search Dropdown */}
                                    <div className="relative">
                                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pilih Warga</label>

                                        {/* Pemicu Tombol Dropdown */}
                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white text-left flex items-center justify-between focus:outline-none focus:border-emerald-500 transition-colors"
                                        >
                                            <span className="truncate">{labelWargaTerpilih}</span>
                                            <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-185' : ''}`} />
                                        </button>

                                        {/* Kotak Floating Menu Dropdown */}
                                        {isDropdownOpen && (
                                            <div className="absolute z-30 mt-1 w-full rounded-xl bg-slate-950 border border-slate-800 shadow-2xl p-2 space-y-2 max-h-[220px] flex flex-col animate-fade-in">
                                                {/* Kolom Pencarian Internal */}
                                                <div className="relative flex items-center shrink-0">
                                                    <Search className="absolute left-2.5 text-slate-500" size={12} />
                                                    <input
                                                        type="text"
                                                        value={wargaSearchQuery}
                                                        onChange={(e) => setWargaSearchQuery(e.target.value)}
                                                        placeholder="Ketik nama warga untuk mencari..."
                                                        className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                                        autoFocus
                                                    />
                                                </div>

                                                {/* List Hasil Filter */}
                                                <div className="overflow-y-auto flex-grow space-y-0.5 pr-1 scrollbar-thin">
                                                    {filteredWargaOptions.length === 0 ? (
                                                        <p className="text-[11px] text-slate-600 italic p-3 text-center">Nama warga tidak ditemukan.</p>
                                                    ) : (
                                                        filteredWargaOptions.map(w => {
                                                            const isCurrent = String(subFormWarga.penghuni_id) === String(w.id);
                                                            return (
                                                                <button
                                                                    key={w.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSubFormWarga(prev => ({ ...prev, penghuni_id: w.id }));
                                                                        setIsDropdownOpen(false); // Otomatis tutup menu
                                                                        setWargaSearchQuery('');  // Reset kata kunci
                                                                    }}
                                                                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg truncate transition-colors ${isCurrent
                                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                                                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                                                        }`}
                                                                >
                                                                    {w.nama_lengkap}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tanggal Mulai Masuk</label>
                                        <input
                                            type="date"
                                            value={subFormWarga.tanggal_masuk}
                                            onChange={(e) => setSubFormWarga(prev => ({ ...prev, tanggal_masuk: e.target.value }))}
                                            className="w-full rounded-md bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                                        />
                                    </div>
                                    <button type="submit" className="w-full rounded-md bg-emerald-500 py-2 text-xs font-bold text-slate-950 uppercase tracking-wider hover:bg-emerald-400 transition-colors">Hubungkan ke Rumah</button>
                                </form>
                            </div>

                        </div>
                    )}
                </div>

            </div>

            {/* Modal Detail Histori Hunian & Pembayaran */}
            {showHistoryModal && selectedRumah && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><History size={18} /></div>
                                <div><h3 className="text-lg font-bold text-white">Log Rekam Jejak Unit {selectedRumah.nomor_rumah}</h3><p className="text-xs text-slate-400">Data audit internal mutasi warga dan keuangan iuran perumahan.</p></div>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"><X size={16} /></button>
                        </div>
                        <div className="flex bg-slate-950/60 p-1 border-b border-slate-800/60">
                            <button onClick={() => setActiveTab('penghuni')} className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'penghuni' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}><CalendarDays size={14} /> Histori Penghuni</button>
                            <button onClick={() => setActiveTab('pembayaran')} className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'pembayaran' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}><Wallet size={14} /> Histori Pembayaran Iuran</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow bg-slate-900/40">
                            {activeTab === 'penghuni' && (
                                <div className="space-y-3">
                                    {(!selectedRumah.riwayat_hunian || selectedRumah.riwayat_hunian.length === 0) ? <p className="text-center py-6 text-slate-500 text-xs italic">Belum ada catatan mutasi warga.</p> : selectedRumah.riwayat_hunian.map((riwayat, idx) => {
                                        const isMantan = riwayat.pivot.tanggal_keluar !== null;
                                        return (
                                            <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isMantan ? 'bg-slate-950/30 border-slate-800/60 opacity-60' : 'bg-emerald-950/10 border-emerald-500/20'}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-lg ${isMantan ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-400'}`}><User size={14} /></div>
                                                    <div className="min-w-0"><p className="text-sm font-semibold text-white truncate">{riwayat.nama_lengkap}</p><p className="text-[11px] text-slate-400 mt-0.5">Masuk: {riwayat.pivot.tanggal_masuk} {isMantan && `• Keluar: ${riwayat.pivot.tanggal_keluar}`}</p></div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMantan ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-400'}`}>{isMantan ? 'Mantan' : 'Aktif'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {activeTab === 'pembayaran' && (
                                <div className="space-y-3">
                                    {(!selectedRumah.pembayaran_iuran || selectedRumah.pembayaran_iuran.length === 0) ? <p className="text-center py-6 text-slate-500 text-xs italic">Belum ada transaksi pembayaran untuk unit rumah ini.</p> : selectedRumah.pembayaran_iuran.map((bayar, idx) => (
                                        <div key={idx} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-lg shrink-0 ${bayar.master_iuran.nama_iuran === 'satpam' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}><BadgeDollarSign size={16} /></div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-white capitalize">Iuran {bayar.master_iuran.nama_iuran} — {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][bayar.bulan_iuran - 1]} {bayar.tahun_iuran}</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">Oleh: <span className="text-slate-300 font-medium">{bayar.penghuni_aktif?.nama_lengkap || 'Warga'}</span> • Tgl: {bayar.tanggal_bayar}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-emerald-400">Rp {(parseInt(bayar.jumlah_bayar)).toLocaleString('id-ID')}</p>
                                                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Lunas</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end"><button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700">Tutup</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}