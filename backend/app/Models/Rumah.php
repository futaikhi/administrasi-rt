<?php

namespace App\Models;

use App\Traits\Filterable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Rumah extends Model
{
    use SoftDeletes, Filterable;

    protected $table = 'rumah';
    protected $fillable = ['nomor_rumah', 'status_rumah'];
    protected $filterable = [
        'status_rumah' => 'exact', // Harus pas (dihuni / tidak_dihuni)
        'nomor_rumah' => 'like',  // Bisa ketik parsial (misal ketik "A" keluar A-1, A-2)
    ];

    public function getStatusRumahAttribute()
    {
        // Panggil relasi penghuniAktif yang sudah menggunakan filter tanggal cerdas kita kemarin
        $adaPenghuniAktif = $this->penghuniAktif()->exists();

        // Jika ada minimal 1 orang yang masa huniannya masih aktif, maka 'dihuni'
        // Jika tidak ada satu orang pun (atau kontrak sudah habis/melewati tanggal keluar), otomatis 'tidak_dihuni'
        return $adaPenghuniAktif ? 'dihuni' : 'tidak_dihuni';
    }

    public function riwayatHunian()
    {
        return $this->belongsToMany(Penghuni::class, 'history_hunian')
            ->withPivot('tanggal_masuk', 'tanggal_keluar')
            ->orderByPivot('id', 'desc'); // Menampilkan riwayat terbaru di atas
    }

    public function pembayaranIuran(): HasMany
    {
        return $this->hasMany(PembayaranIuran::class, 'rumah_id');
    }

    public function penghuniAktif()
    {
        $today = Carbon::now()->toDateString();

        return $this->belongsToMany(Penghuni::class, 'history_hunian')
                    ->where(function($query) use ($today) {
                        $query->whereNull('history_hunian.tanggal_keluar') // Skenario A: Belum tahu kapan pindah[cite: 1]
                              ->orWhere('history_hunian.tanggal_keluar', '>', $today); // Skenario B: Tanggal pindah belum lewat hari ini
                    })
                    ->withPivot('tanggal_masuk', 'tanggal_keluar');
    }

    public function getStatusIuranBulanIniAttribute()
    {
        // Kondisi A: Jika rumah kosong, otomatis bebas semua tagihan
        if (!$this->penghuniAktif()->exists()) {
            return [
                'status' => 'bebas_tagihan',
                'detail' => ['satpam' => true, 'kebersihan' => true]
            ];
        }

        // Ambal parameter waktu bulan berjalan saat ini (Juni 2026)
        $bulanIni = Carbon::now()->month;
        $tahunIni = Carbon::now()->year;

        // 1. Cek Kelunasan Satpam (master_iuran_id = 1)
        $satpamLunas = $this->pembayaranIuran()
                            ->where('master_iuran_id', 1)
                            ->where('bulan_iuran', $bulanIni)
                            ->where('tahun_iuran', $tahunIni)
                            ->exists();

        // 2. Cek Kelunasan Kebersihan (master_iuran_id = 2)
        $kebersihanLunas = $this->pembayaranIuran()
                                ->where('master_iuran_id', 2)
                                ->where('bulan_iuran', $bulanIni)
                                ->where('tahun_iuran', $tahunIni)
                                ->exists();

        // Status global dinyatakan lunas jika keduanya bernilai TRUE
        $statusGlobal = ($satpamLunas && $kebersihanLunas) ? 'lunas' : 'belum_lunas';

        return [
            'status' => $statusGlobal,
            'detail' => [
                'satpam' => $satpamLunas,       // true = lunas, false = nunggak
                'kebersihan' => $kebersihanLunas // true = lunas, false = nunggak
            ]
        ];
    }
}