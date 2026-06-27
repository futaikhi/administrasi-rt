<?php

namespace App\Models;

use App\Traits\Filterable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Penghuni extends Model
{
    use SoftDeletes, Filterable;

    protected $table = 'penghuni';
    protected $fillable = ['nama_lengkap', 'foto_ktp', 'status_penghuni', 'nomor_telepon', 'status_pernikahan'];
    protected $filterable = [
        // Kolom Lokal
        'status_penghuni' => 'exact', // Dropdown exact
        'status_pernikahan' => 'like',  // Ubah ke LIKE agar bisa ditangkap Global Search Datatable
        'nama_lengkap' => 'like',  // Masuk Global Search

        // Kolom Relasi (Gunakan Notasi Titik)
        'rumah.nomor_rumah' => 'like',  // Pak RT bisa search nomor rumah di global box
        'rumah.status_rumah' => 'exact', // Dropdown filter warga berdasarkan status rumahnya
    ];

    public function historyHunian(): HasMany
    {
        return $this->hasMany(HistoryHunian::class, 'penghuni_id');
    }

    public function rumahAktif()
    {
        $today = Carbon::now()->toDateString();

        return $this->belongsToMany(Rumah::class, 'history_hunian')
                    ->where(function($query) use ($today) {
                        $query->whereNull('history_hunian.tanggal_keluar') // Belum keluar[cite: 1]
                              ->orWhere('history_hunian.tanggal_keluar', '>', $today); // Belum melewati hari ini
                    })
                    ->withPivot('tanggal_masuk', 'tanggal_keluar');
    }
}