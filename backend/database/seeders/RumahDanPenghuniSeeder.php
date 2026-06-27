<?php

namespace Database\Seeders;

use App\Models\HistoryHunian;
use App\Models\Penghuni;
use App\Models\Rumah;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RumahDanPenghuniSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Generate 20 Rumah (A-01 sampai A-20)
        for ($i = 1; $i <= 20; $i++) {
            $nomor = 'A-' . str_pad($i, 2, '0', STR_PAD_LEFT);
            
            // 15 rumah pertama diset dihuni tetap, sisanya tidak dihuni dulu
            $status = ($i <= 15) ? 'dihuni' : 'tidak_dihuni';

            Rumah::create([
                'nomor_rumah' => $nomor,
                'status_rumah' => $status
            ]);
        }
        // 2. Generate 15 Penghuni Tetap
        for ($i = 1; $i <= 15; $i++) {
            $penghuni = Penghuni::create([
                'nama_lengkap' => "Warga Tetap Ke-$i",
                'foto_ktp' => "/storage/uploads/ktp/ktp_tetap_$i.png",
                'status_penghuni' => 'tetap',
                'nomor_telepon' => '0812345678' . str_pad($i, 2, '0', STR_PAD_LEFT),
                'status_pernikahan' => $i % 2 == 0 ? 'menikah' : 'belum_menikah'
            ]);

            // Hubungkan langsung ke rumah 1 s.d 15 sejak awal tahun 2025
            HistoryHunian::create([
                'rumah_id' => $i, // id rumah 1-15
                'penghuni_id' => $penghuni->id,
                'tanggal_masuk' => '2025-01-01',
                'tanggal_keluar' => null
            ]);
        }

        // 3. Simulasikan 2 Rumah Kontrak (Rumah ID 16 & 17 diubah status jadi dihuni)
        // Rumah A-16 diisi kontrak dari Januari - Juni 2025
        $rumah16 = Rumah::find(16);
        $rumah16->update(['status_rumah' => 'dihuni']);
        
        $kontrak1 = Penghuni::create([
            'nama_lengkap' => 'Budi (Kontrak A-16)',
            'foto_ktp' => '/storage/uploads/ktp/ktp_kontrak_16.png',
            'status_penghuni' => 'kontrak',
            'nomor_telepon' => '089999888771',
            'status_pernikahan' => 'menikah'
        ]);

        HistoryHunian::create([
            'rumah_id' => 16,
            'penghuni_id' => $kontrak1->id,
            'tanggal_masuk' => '2025-01-01',
            'tanggal_keluar' => '2025-06-30' // Keluar pertengahan tahun
        ]);

        // Rumah A-17 diisi kontrak baru dari Juli - Desember 2025
        $rumah17 = Rumah::find(17);
        $rumah17->update(['status_rumah' => 'dihuni']);

        $kontrak2 = Penghuni::create([
            'nama_lengkap' => 'Andi (Kontrak A-17)',
            'foto_ktp' => '/storage/uploads/ktp/ktp_kontrak_17.png',
            'status_penghuni' => 'kontrak',
            'nomor_telepon' => '089999888772',
            'status_pernikahan' => 'belum_menikah'
        ]);

        HistoryHunian::create([
            'rumah_id' => 17,
            'penghuni_id' => $kontrak2->id,
            'tanggal_masuk' => '2025-07-01',
            'tanggal_keluar' => null
        ]); 
    }
}
