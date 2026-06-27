<?php

namespace Database\Seeders;

use App\Models\HistoryHunian;
use App\Models\PembayaranIuran;
use App\Models\Pengeluaran;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TransaksiKeuanganSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pembayaranBulk = [];

        // LOOPING PEMASUKAN IURAN (Januari - Desember 2026)
        for ($bulan = 1; $bulan <= 12; $bulan++) {
            
            // Ambil semua riwayat hunian yang aktif di bulan tersebut
            $bulanStr = str_pad($bulan, 2, '0', STR_PAD_LEFT);
            $tanggalCheck = "2026-$bulanStr-15"; // Ambil sampling tengah bulan

            $hunianAktif = HistoryHunian::where('tanggal_masuk', '<=', $tanggalCheck)
                ->where(function($query) use ($tanggalCheck) {
                    $query->whereNull('tanggal_keluar')
                          ->orWhere('tanggal_keluar', '>=', $tanggalCheck);
                })->get();

            foreach ($hunianAktif as $hunian) {
                
                // =========================================================================
                // SKENARIO 1: BELUM BAYAR SAMA SEKALI (NUNGGAK SEPANJANG TAHUN)
                // Kita atur Rumah ID 5 dan Rumah ID 12 tidak pernah punya record bayar apa pun.
                // =========================================================================
                if (in_array($hunian->rumah_id, [5, 12])) {
                    continue; 
                }

                // =========================================================================
                // SKENARIO 2: BELUM BAYAR BULAN INI (JUNI 2026)
                // Rumah ID 2 dan Rumah ID 3 kita buat skip iuran total khusus di bulan Juni.
                // Rumah ID 1 kita buat parsial: Kebersihan lunas (karena awal tahun), tapi Satpam lupa bayar di bulan Juni.
                // =========================================================================
                $skipSatpamJuni = ($bulan == 6 && in_array($hunian->rumah_id, [1, 2, 3]));
                $skipKebersihanJuni = ($bulan == 6 && in_array($hunian->rumah_id, [2, 3]));

                // 1. IURAN SATPAM (Selalu Bulanan - 100k)
                if (!$skipSatpamJuni) {
                    $pembayaranBulk[] = [
                        'rumah_id' => $hunian->rumah_id,
                        'penghuni_id' => $hunian->penghuni_id,
                        'master_iuran_id' => 1, // ID Satpam
                        'bulan_iuran' => $bulan,
                        'tahun_iuran' => 2026,
                        'jumlah_bayar' => 100000.00,
                        'tanggal_bayar' => "2026-$bulanStr-05", // Bayar setiap tanggal 5
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now()
                    ];
                }

                // 2. IURAN KEBERSIHAN (15k)
                // Simulasi Rumah ID 1 bayar langsung 1 tahun penuh di bulan Januari
                if ($hunian->rumah_id == 1) {
                    if ($bulan == 1) {
                        // Looping pasang lunas dari bulan 1 - 12 sekaligus
                        for ($b = 1; $b <= 12; $b++) {
                            $pembayaranBulk[] = [
                                'rumah_id' => 1,
                                'penghuni_id' => $hunian->penghuni_id,
                                'master_iuran_id' => 2, // ID Kebersihan
                                'bulan_iuran' => $b,
                                'tahun_iuran' => 2026,
                                'jumlah_bayar' => 15000.00,
                                'tanggal_bayar' => '2026-01-03', // Dibayar lunas di muka
                                'created_at' => Carbon::now(),
                                'updated_at' => Carbon::now()
                            ];
                        }
                    }
                    // Untuk bulan 2-12 skip karena sudah diinsert di bulan ke-1
                    continue; 
                }

                // Untuk rumah selain ID 1, bayar bulanan biasa jika tidak kena skip Juni
                if (!$skipKebersihanJuni) {
                    $pembayaranBulk[] = [
                        'rumah_id' => $hunian->rumah_id,
                        'penghuni_id' => $hunian->penghuni_id,
                        'master_iuran_id' => 2, // ID Kebersihan
                        'bulan_iuran' => $bulan,
                        'tahun_iuran' => 2026,
                        'jumlah_bayar' => 15000.00,
                        'tanggal_bayar' => "2026-$bulanStr-05",
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now()
                    ];
                }
            }

            // LOOPING PENGELUARAN BULANAN TETAP RT
            Pengeluaran::create([
                'nama_pengeluaran' => 'Gaji Bulanan Satpam RT',
                'nominal' => 1200000.00,
                'tanggal_pengeluaran' => "2026-$bulanStr-28",
            ]);

            @Pengeluaran::create([
                'nama_pengeluaran' => 'Token Listrik Pos Satpam',
                'nominal' => 150000.00,
                'tanggal_pengeluaran' => "2026-$bulanStr-02",
            ]);
        }

        // Bulk Insert Data Pembayaran
        collect($pembayaranBulk)->chunk(100)->each(function($chunk) {
            PembayaranIuran::insert($chunk->toArray());
        });

        // 3. PENGELUARAN VARIABEL
        Pengeluaran::create([
            'nama_pengeluaran' => 'Perbaikan Aspal Jalan Blok A',
            'nominal' => 750000.00,
            'tanggal_pengeluaran' => '2026-03-12',
            'keterangan' => 'Tambal sulam lubang jalan utama'
        ]);

        Pengeluaran::create([
            'nama_pengeluaran' => 'Kerja Bakti & Pembersihan Selokan',
            'nominal' => 400000.00,
            'tanggal_pengeluaran' => '2026-08-17',
            'keterangan' => 'Konsumsi konsumsi warga dan beli alat kebersihan'
        ]);
    }
}