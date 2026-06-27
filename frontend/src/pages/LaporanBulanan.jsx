import React, { useState, useEffect } from 'react';
import pembayaranService from '../services/pembayaranService';
import pengeluaranService from '../services/pengeluaranService';
import { ClipboardList, Calendar, Layers, Receipt, Info, FileSpreadsheet, Download } from 'lucide-react';

export default function LaporanBulanan() {
    const tahunSekarang = new Date().getFullYear();
    const daftarTahun = Array.from({ length: 21 }, (_, index) => (tahunSekarang - index).toString());
    const namaBulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    // State Filter Periode
    const [reportBulan, setReportBulan] = useState((new Date().getMonth() + 1).toString());
    const [reportTahun, setReportTahun] = useState(tahunSekarang.toString());

    // State Data Jurnal
    const [detailPemasukan, setDetailPemasukan] = useState([]);
    const [detailPengeluaran, setDetailPengeluaran] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReportData = async () => {
        try {
            setLoading(true);
            setError('');
            const [resMasuk, resKeluar] = await Promise.all([
                pembayaranService.getReportBulanan(reportBulan, reportTahun),
                pengeluaranService.getReportBulanan(reportBulan, reportTahun)
            ]);
            const dataMasuk = Array.isArray(resMasuk) ? resMasuk : (resMasuk?.data || []);
            const dataKeluar = Array.isArray(resKeluar) ? resKeluar : (resKeluar?.data || []);

            setDetailPemasukan(dataMasuk);
            setDetailPengeluaran(dataKeluar);
        } catch (err) {
            setError('Gagal menarik rincian data laporan keuangan bulanan.');
            setDetailPemasukan([]); // Fallback ke array kosong jika error
            setDetailPengeluaran([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReportData(); }, [reportBulan, reportTahun]);

    const subTotalMasuk = Array.isArray(detailPemasukan)
        ? detailPemasukan.reduce((acc, curr) => acc + parseFloat(curr.jumlah_bayar || 0), 0)
        : 0;

    const subTotalKeluar = Array.isArray(detailPengeluaran)
        ? detailPengeluaran.reduce((acc, curr) => acc + parseFloat(curr.nominal || 0), 0)
        : 0;

    const sisaSaldo = subTotalMasuk - subTotalKeluar;

    // =========================================================================
    // ENGINE EXPORT EXCEL NATIVE (ZERO DEPENDENCY)
    // =========================================================================
    const handleExportToExcel = () => {
        const namaBulanTerpilih = namaBulanArr[parseInt(reportBulan) - 1];

        // 1. Konstruksi Konten HTML & Struktur Tabel Khusus Excel
        let excelTemplate = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="utf-8"></head>
            <body>
                <h2>LAPORAN KEUANGAN KAS RT - PERIODE ${namaBulanTerpilih.toUpperCase()} ${reportTahun}</h2>
                <br/>
                <table border="1" style="border-collapse:collapse;">
                    <tr style="background-color:#f2f2f2; font-weight:bold;">
                        <td colspan="3">RINGKASAN NERACA SALDO BUKU</td>
                    </tr>
                    <tr><td>Total Pemasukan (Iuran)</td><td colspan="2">Rp ${subTotalMasuk}</td></tr>
                    <tr><td>Total Pengeluaran Operasional</td><td colspan="2">Rp ${subTotalKeluar}</td></tr>
                    <tr style="font-weight:bold;"><td>Sisa Saldo Kas Bersih</td><td colspan="2">Rp ${sisaSaldo}</td></tr>
                </table>
                <br/><br/>

                <h3>A. DETAIL RINCIAN MASUK (PEMBAYARAN IURAN WARGA)</h3>
                <table border="1" style="border-collapse:collapse;">
                    <tr style="background-color:#d4edda; font-weight:bold;">
                        <th>No Kavling / Rumah</th>
                        <th>Nama Warga Penyetor</th>
                        <th>Komponen Iuran</th>
                        <th>Nominal Setoran</th>
                    </tr>
                    ${detailPemasukan.length === 0 ? '<tr><td colspan="4">Tidak ada data setoran iuran</td></tr>' :
                detailPemasukan.map(item => `
                            <tr>
                                <td>Blok ${item.rumah?.nomor_rumah || '-'}</td>
                                <td>${item.penghuni?.nama_lengkap || '-'}</td>
                                <td>${item.master_iuran_id === 1 ? 'Satpam' : 'Kebersihan'}</td>
                                <td>${item.jumlah_bayar}</td>
                            </tr>
                        `).join('')
            }
                </table>
                <br/><br/>

                <h3>B. DETAIL RINCIAN KELUAR (PENGELUARAN OPERASIONAL RT)</h3>
                <table border="1" style="border-collapse:collapse;">
                    <tr style="background-color:#f8d7da; font-weight:bold;">
                        <th>Keperluan Anggaran Keluar</th>
                        <th>Tanggal Pengeluaran</th>
                        <th>Keterangan Tambahan</th>
                        <th>Nominal Anggaran</th>
                    </tr>
                    ${detailPengeluaran.length === 0 ? '<tr><td colspan="4">Bebas biaya pengeluaran operasional</td></tr>' :
                detailPengeluaran.map(item => `
                            <tr>
                                <td>${item.nama_pengeluaran}</td>
                                <td>${item.tanggal_pengeluaran}</td>
                                <td>${item.keterangan || '-'}</td>
                                <td>${item.nominal}</td>
                            </tr>
                        `).join('')
            }
                </table>
            </body>
            </html>
        `;

        // 2. Bungkus ke dalam Blob berkas spreadsheet Excel
        const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // 3. Trigger Virtual Link Unduhan Otomatis
        const linkDokumen = document.createElement('a');
        linkDokumen.href = url;
        linkDokumen.download = `Laporan_Kas_RT_${namaBulanTerpilih}_${reportTahun}.xls`;
        document.body.appendChild(linkDokumen);
        linkDokumen.click();
        document.body.removeChild(linkDokumen);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Header Form & Aksi Utama */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Laporan Bulanan</h2>
                    <p className="text-sm text-slate-400 font-medium">Saring rincian berkas kas masuk dan operasional keluar, serta cetak dokumen laporan resmi.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filter Dropdown Ganda */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold shadow-md">
                        <Calendar size={14} className="text-slate-500" />
                        <select value={reportBulan} onChange={(e) => setReportBulan(e.target.value)} className="bg-transparent text-white focus:outline-none cursor-pointer">
                            {namaBulanArr.map((b, i) => <option key={i + 1} value={i + 1} className="bg-slate-950">{b}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold shadow-md">
                        <select value={reportTahun} onChange={(e) => setReportTahun(e.target.value)} className="bg-transparent text-white focus:outline-none cursor-pointer">
                            {daftarTahun.map(th => <option key={th} value={th} className="bg-slate-950">{th}</option>)}
                        </select>
                    </div>

                    {/* TOMBOL PREMIUM EXPORT EXCEL */}
                    <button
                        onClick={handleExportToExcel}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all"
                    >
                        <FileSpreadsheet size={15} /> Export Excel
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">{error}</div>}

            {/* Sub-Summary Neraca Saldo Bulan Terpilih */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Masuk (Iuran)</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">Rp {loading ? '...' : subTotalMasuk.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Keluar (Operasional)</p>
                    <p className="text-lg font-bold text-rose-400 mt-0.5">Rp {loading ? '...' : subTotalKeluar.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sisa Kas Periode Ini</p>
                    <p className={`text-lg font-black mt-0.5 ${sisaSaldo >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                        Rp {loading ? '...' : sisaSaldo.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            {/* Konten Utama Dua Tabel Komparasi */}
            {loading ? (
                <div className="text-center py-20 text-slate-500 italic">Membuka lembaran buku rincian bulanan...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* DETAIL PEMASUKAN */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 font-bold text-xs text-emerald-400 uppercase tracking-wider">
                            <Layers size={14} /> <span>Daftar Rincian Uang Masuk</span>
                        </div>
                        <div className="overflow-x-auto max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                            <table className="w-full text-left text-[11px] text-slate-300">
                                <thead className="bg-slate-950 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3">Kavling / Penyetor</th>
                                        <th className="px-4 py-3">Iuran</th>
                                        <th className="px-4 py-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {detailPemasukan.length === 0 ? (
                                        <tr><td colSpan="3" className="text-center py-12 text-slate-600 italic">Tidak ada setoran iuran di bulan terpilih.</td></tr>
                                    ) : (
                                        detailPemasukan.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-200">Blok {item.rumah?.nomor_rumah || 'N/A'}</p>
                                                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.penghuni?.nama_lengkap || 'Warga'}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${item.master_iuran_id === 1 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                                        }`}>
                                                        {item.master_iuran_id === 1 ? 'Satpam' : 'Kebersihan'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-400">Rp {parseInt(item.jumlah_bayar).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* DETAIL PENGELUARAN */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 font-bold text-xs text-rose-400 uppercase tracking-wider">
                            <Receipt size={14} /> <span>Daftar Rincian Uang Keluar</span>
                        </div>
                        <div className="overflow-x-auto max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                            <table className="w-full text-left text-[11px] text-slate-300">
                                <thead className="bg-slate-950 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3">Keperluan Anggaran</th>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {detailPengeluaran.length === 0 ? (
                                        <tr><td colSpan="3" className="text-center py-12 text-slate-600 italic">Bebas pengeluaran operasional di bulan terpilih.</td></tr>
                                    ) : (
                                        detailPengeluaran.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                                                <td className="px-4 py-3 max-w-[160px]">
                                                    <p className="font-semibold text-slate-200 truncate">{item.nama_pengeluaran}</p>
                                                    {item.keterangan && <p className="text-[10px] text-slate-500 truncate flex items-center gap-0.5"><Info size={9} /> {item.keterangan}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 font-medium">{item.tanggal_pengeluaran}</td>
                                                <td className="px-4 py-3 text-right font-bold text-rose-400">Rp {parseInt(item.nominal).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}