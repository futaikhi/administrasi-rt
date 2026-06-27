<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Rumah;
use App\Models\Penghuni;
use App\Models\MasterIuran;
use App\Models\PembayaranIuran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KeuanganRtTest extends TestCase
{
    use RefreshDatabase; // Otomatis mengosongkan DB dummy setiap test berjalan

    private $admin;
    private $rumah;
    private $penghuni;
    private $iuranSatpam;
    private $iuranSampah;

    /**
     * Setup data dummy awal untuk keperluan testing
     */
    protected function setUp(): void
    {
        parent::setUp();

        // 1. Buat User Admin (Pak RT)
        $this->admin = User::factory()->create();

        // 2. Buat Data Master Dummy
        $this->rumah = Rumah::create(['nomor_rumah' => 'A-01', 'status_rumah' => 'dihuni']);
        $this->penghuni = Penghuni::create([
            'nama_lengkap' => 'Budi Santoso',
            'foto_ktp' => '/storage/foto_ktp/dummy.jpg',
            'status_penghuni' => 'tetap',
            'nomor_telepon' => '08123456789',
            'status_pernikahan' => 'menikah'
        ]);

        // 3. Buat Jenis Iuran
        $this->iuranSatpam = MasterIuran::create(['nama_iuran' => 'Satpam', 'nominal' => 100000]);
        $this->iuranSampah = MasterIuran::create(['nama_iuran' => 'Sampah', 'nominal' => 50000]);
    }

    /**
     * TEST 1: Memastikan Endpoint Terkunci Jika Tidak Membawa Token
     */
    public function test_akses_tanpa_token_harus_unauthorized(): void
    {
        // Mencoba mengambil data rumah tanpa login/token
        $response = $this->getJson('/api/rumah');

        $response->assertStatus(401); // Harus mengembalikan status 401
    }

    /**
     * TEST 2: Aturan Soal - Iuran Satpam TIDAK BOLEH Bayar Tahunan
     */
    public function test_pembayaran_satpam_tahunan_harus_ditolak(): void
    {
        // Hit API dengan membawa token admin (actingAs)
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/pembayaran', [
                'rumah_id' => $this->rumah->id,
                'penghuni_id' => $this->penghuni->id,
                'master_iuran_id' => $this->iuranSatpam->id, // Iuran Satpam
                'bulan_mulai' => 1,
                'tahun_mulai' => 2026,
                'opsi_bayar' => 'tahunan' // Memilih tahunan (Dilarang untuk Satpam)
            ]);

        $response->assertStatus(422); // Harus gagal dengan error validasi finansial
    }

    /**
     * TEST 3: Opsi Tahunan untuk Iuran Lain Harus Otomatis Generate 12 Bulan (Bulk Insert)
     */
    public function test_pembayaran_sampah_tahunan_berhasil_generate_12_bulan(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/pembayaran', [
                'rumah_id' => $this->rumah->id,
                'penghuni_id' => $this->penghuni->id,
                'master_iuran_id' => $this->iuranSampah->id, // Iuran Sampah (Boleh tahunan)
                'bulan_mulai' => 1,
                'tahun_mulai' => 2026,
                'opsi_bayar' => 'tahunan'
            ]);

        $response->assertStatus(200);

        // Memastikan di database terbuat tepat 12 baris records pembayaran
        $this->assertDatabaseCount('pembayaran_iuran', 12);

        // Memastikan records bulan ke-12 di tahun 2026 benar-benar masuk
        $this->assertDatabaseHas('pembayaran_iuran', [
            'rumah_id' => $this->rumah->id,
            'bulan_iuran' => 12,
            'tahun_iuran' => 2026
        ]);
    }

    /**
     * TEST 4: Anti Double-Payment di Bulan yang Sama
     */
    public function test_tidak_boleh_membayar_iuran_di_bulan_yang_sama_dua_kali(): void
    {
        // Bayar pertama kali (Bulan 1, 2026) -> Sukses
        PembayaranIuran::create([
            'rumah_id' => $this->rumah->id,
            'penghuni_id' => $this->penghuni->id,
            'master_iuran_id' => $this->iuranSampah->id,
            'bulan_iuran' => 1,
            'tahun_iuran' => 2026,
            'jumlah_bayar' => 50000,
            'tanggal_bayar' => '2026-01-01'
        ]);

        // Coba bayar lagi lewat API untuk bulan & tahun yang sama -> Harus Ditolak
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/pembayaran', [
                'rumah_id' => $this->rumah->id,
                'penghuni_id' => $this->penghuni->id,
                'master_iuran_id' => $this->iuranSampah->id,
                'bulan_mulai' => 1,
                'tahun_mulai' => 2026,
                'opsi_bayar' => 'bulanan'
            ]);

        $response->assertStatus(422); // Harus gagal terblokir
    }
}
