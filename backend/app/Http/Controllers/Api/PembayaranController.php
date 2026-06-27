<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PembayaranIuran;
use App\Models\Rumah;
use App\Models\Iuran; // Atau MasterIuran sesuai penamaan Anda
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PembayaranController extends Controller
{
    // 1. Tampilkan Semua Riwayat Transaksi Masuk (Terpaginasi)
    public function index(Request $request)
    {
        $query = PembayaranIuran::with(['rumah', 'penghuni'])
            ->autoFilter($request->all())
            ->orderBy('id', 'desc');

        // 2. KONDISI OVERRIDE UNTUK LAPORAN BULANAN & EXCEL (all = true)
        if ($request->boolean('all')) {
            return response()->json($query->get(), 200); // Tarik SEMUA data terfilter tanpa kelimit
        }

        // 3. Default untuk Tampilan Tabel Loket Pembayaran Biasa
        return response()->json($query->paginate(10), 200);
    }

    // 2. Entri Pembayaran Iuran Baru (Mendukung Bulanan & 1 Tahun Sekaligus)
    public function store(Request $request)
    {
        $request->validate([
            'rumah_id' => 'required|exists:rumah,id',
            'penghuni_id' => 'required|exists:penghuni,id',
            'master_iuran_id' => 'required|in:1,2', // 1: Satpam, 2: Kebersihan
            'tahun_iuran' => 'required|integer|min:2020|max:2030',
            'tanggal_bayar' => 'required|date',
            'mode_bayar' => 'required|in:bulanan,tahunan',
            'bulan_iuran' => 'required_if:mode_bayar,bulanan|nullable|integer|min:1|max:12'
        ]);

        // Tentukan nominal default sesuai dokumen test
        $nominalPerBulan = ($request->master_iuran_id == 1) ? 100000.00 : 15000.00;

        DB::beginTransaction();
        try {
            $recordsInserted = 0;

            // KASUS A: Warga membayar langsung 1 Tahun Penuh (12 Bulan)
            if ($request->mode_bayar === 'tahunan') {
                for ($m = 1; $m <= 12; $m++) {
                    // Proteksi data ganda: Cek apakah bulan tersebut sudah pernah dibayar
                    $sudahBayar = PembayaranIuran::where('rumah_id', $request->rumah_id)
                        ->where('master_iuran_id', $request->master_iuran_id)
                        ->where('bulan_iuran', $m)
                        ->where('tahun_iuran', $request->tahun_iuran)
                        ->exists();

                    if ($sudahBayar) {
                        continue; // Skip jika bulan ini sudah lunas, lanjut ke bulan berikutnya
                    }

                    PembayaranIuran::create([
                        'rumah_id' => $request->rumah_id,
                        'penghuni_id' => $request->penghuni_id,
                        'master_iuran_id' => $request->master_iuran_id,
                        'bulan_iuran' => $m,
                        'tahun_iuran' => $request->tahun_iuran,
                        'jumlah_bayar' => $nominalPerBulan,
                        'tanggal_bayar' => $request->tanggal_bayar
                    ]);
                    $recordsInserted++;
                }

                if ($recordsInserted === 0) {
                    return response()->json(['message' => 'Gagal! Semua bulan di tahun tersebut sudah berstatus lunas.'], 400);
                }

            } 
            // KASUS B: Pembayaran Bulanan Biasa (1 Bulan)
            else {
                $sudahBayar = PembayaranIuran::where('rumah_id', $request->rumah_id)
                    ->where('master_iuran_id', $request->master_iuran_id)
                    ->where('bulan_iuran', $request->bulan_iuran)
                    ->where('tahun_iuran', $request->tahun_iuran)
                    ->exists();

                if ($sudahBayar) {
                    return response()->json(['message' => 'Gagal! Rumah ini sudah melunasi iuran tersebut pada periode bulan terpilih.'], 400);
                }

                PembayaranIuran::create([
                    'rumah_id' => $request->rumah_id,
                    'penghuni_id' => $request->penghuni_id,
                    'master_iuran_id' => $request->master_iuran_id,
                    'bulan_iuran' => $request->bulan_iuran,
                    'tahun_iuran' => $request->tahun_iuran,
                    'jumlah_bayar' => $nominalPerBulan,
                    'tanggal_bayar' => $request->tanggal_bayar
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Transaksi pembayaran iuran warga berhasil dibukukan.'], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }
}