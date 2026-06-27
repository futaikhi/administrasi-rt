<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterIuran extends Model
{
    protected $table = 'master_iuran';
    
    // Kolom yang boleh diisi secara mass-assignment
    protected $fillable = ['nama_iuran', 'nominal'];

    /**
     * Relasi ke tabel pembayaran_iuran
     * Satu master iuran (misal: Satpam) bisa memiliki banyak catatan pembayaran
     */
    public function pembayaranIuran(): HasMany
    {
        return $this->hasMany(PembayaranIuran::class, 'master_iuran_id');
    }
}