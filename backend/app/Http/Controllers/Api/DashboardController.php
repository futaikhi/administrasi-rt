<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PembayaranIuran;
use App\Models\Pengeluaran;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getSummaryTahunan(Request $request)
    {
        // Ambil parameter tahun, default ke tahun berjalan (atau 2026 sesuai seeder kamu)
        $tahun = $request->input('tahun', Carbon::now()->year);

        $namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        $chartData = [];

        $grandTotalPemasukan = 0;
        $grandTotalPengeluaran = 0;

        // Loop dari bulan 1 sampai 12 untuk mengagregasi data kas masuk & keluar
        for ($m = 1; $m <= 12; $m++) {
            
            // 1. Hitung total pemasukan iuran pada bulan dan tahun ini
            $pemasukanBulanIni = PembayaranIuran::where('bulan_iuran', $m)
                ->where('tahun_iuran', $tahun)
                ->sum('jumlah_bayar');

            // 2. Hitung total pengeluaran RT pada bulan dan tahun ini
            $pengeluaranBulanIni = Pengeluaran::whereMonth('tanggal_pengeluaran', $m)
                ->whereYear('tanggal_pengeluaran', $tahun)
                ->sum('nominal');

            // Akumulasikan ke total keseluruhan
            $grandTotalPemasukan += $pemasukanBulanIni;
            $grandTotalPengeluaran += $pengeluaranBulanIni;

            // Susun struktur data untuk dilempar ke grafik React
            $chartData[] = [
                'bulan_angka' => $m,
                'bulan_nama' => $namaBulan[$m - 1],
                'pemasukan' => (float) $pemasukanBulanIni,
                'pengeluaran' => (float) $pengeluaranBulanIni,
                'saldo_bulan_ini' => (float) ($pemasukanBulanIni - $pengeluaranBulanIni)
            ];
        }

        // Hitung Saldo Sisa Akhir Buku Besar RT
        $saldoSisaKas = $grandTotalPemasukan - $grandTotalPengeluaran;

        return response()->json([
            'tahun' => $tahun,
            'summary' => [
                'total_pemasukan' => (float) $grandTotalPemasukan,
                'total_pengeluaran' => (float) $grandTotalPengeluaran,
                'saldo_sisa' => (float) $saldoSisaKas
            ],
            'chart_data' => $chartData
        ], 200);
    }
}