<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PembayaranIuran;
use App\Models\Pengeluaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaporanController extends Controller
{
    /**
     * Kriteria 3.d: Report Summary Grafik 1 Tahun + Saldo Sisa Akumulatif
     */
    public function summaryChart(Request $request)
    {
        $tahun = $request->query('tahun', date('Y'));

        // 1. Tarik total pemasukan per bulan
        $pemasukanBulanan = PembayaranIuran::select(
                'bulan_iuran as bulan',
                DB::raw('SUM(jumlah_bayar) as total_pemasukan')
            )
            ->where('tahun_iuran', $tahun)
            ->groupBy('bulan_iuran')
            ->get()
            ->pluck('total_pemasukan', 'bulan');

        // 2. Tarik total pengeluaran per bulan
        $pengeluaranBulanan = Pengeluaran::select(
                DB::raw('MONTH(tanggal_pengeluaran) as bulan'),
                DB::raw('SUM(nominal) as total_pengeluaran')
            )
            ->whereYear('tanggal_pengeluaran', $tahun)
            ->groupBy(DB::raw('MONTH(tanggal_pengeluaran)'))
            ->get()
            ->pluck('total_pengeluaran', 'bulan');

        // 3. Gabungkan data ke format yang disukai Chart library (Recharts/Chart.js)
        $chartData = [];
        $runningSaldo = 0; // Akumulasi saldo sisa
        
        $namaBulan = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
            7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des'
        ];

        for ($m = 1; $m <= 12; $m++) {
            $pemasukan = $pemasukanBulanan->get($m, 0);
            $pengeluaran = $pengeluaranBulanan->get($m, 0);
            $runningSaldo += ($pemasukan - $pengeluaran);

            $chartData[] = [
                'bulan_id' => $m,
                'bulan' => $namaBulan[$m],
                'pemasukan' => (float)$pemasukan,
                'pengeluaran' => (float)$pengeluaran,
                'saldo_sisa' => (float)$runningSaldo
            ];
        }

        return response()->json([
            'tahun' => $tahun,
            'data' => $chartData
        ]);
    }

    /**
     * Kriteria 3.e: Report Detail Pemasukan & Pengeluaran untuk bulan tertentu
     */
    public function detailBulanan(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|min:2020'
        ]);

        $bulan = $request->bulan;
        $tahun = $request->tahun;

        // Ambil rincian kas iuran masuk
        $pemasukan = PembayaranIuran::with(['rumah', 'penghuni', 'masterIuran'])
            ->where('bulan_iuran', $bulan)
            ->where('tahun_iuran', $tahun)
            ->get()
            ->map(function ($item) {
                return [
                    'tipe' => 'pemasukan',
                    'keterangan' => "Iuran " . $item->masterIuran->nama_iuran . " - Rumah " . $item->rumah->nomor_rumah,
                    'nama_warga' => $item->penghuni->nama_lengkap,
                    'nominal' => (float)$item->jumlah_bayar,
                    'tanggal' => $item->tanggal_bayar,
                ];
            });

        // Ambil rincian kas keluar
        $pengeluaran = Pengeluaran::whereMonth('tanggal_pengeluaran', $bulan)
            ->whereYear('tanggal_pengeluaran', $tahun)
            ->get()
            ->map(function ($item) {
                return [
                    'tipe' => 'pengeluaran',
                    'keterangan' => $item->nama_pengeluaran,
                    'nama_warga' => 'RT / Pihak Ketiga',
                    'nominal' => (float)$item->nominal,
                    'tanggal' => $item->tanggal_pengeluaran,
                ];
            });

        // Gabungkan ledger kas bulanan
        $allTransactions = $pemasukan->concat($pengeluaran)->sortBy('tanggal')->values();

        return response()->json([
            'bulan' => $bulan,
            'tahun' => $tahun,
            'ringkasan' => [
                'total_pemasukan' => (float)$pemasukan->sum('nominal'),
                'total_pengeluaran' => (float)$pengeluaran->sum('nominal'),
                'selisih' => (float)($pemasukan->sum('nominal') - $pengeluaran->sum('nominal'))
            ],
            'detail_transaksi' => $allTransactions
        ]);
    }
}