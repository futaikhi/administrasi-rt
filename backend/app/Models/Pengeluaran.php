<?php

namespace App\Models;

use App\Traits\Filterable;
use Illuminate\Database\Eloquent\Model;

class Pengeluaran extends Model
{
    use Filterable;
    protected $table = 'pengeluaran';
    protected $fillable = ['nama_pengeluaran', 'nominal', 'tanggal_pengeluaran', 'keterangan'];
    protected $filterable = [
        'nama_pengeluaran' => 'exact', 
    ];

    public function scopeFilterBulan($query, $value)
    {
        if (empty($value)) return $query;
        
        return $query->whereMonth('tanggal_pengeluaran', $value);
    }

    /**
     * KUSTOM FILTER: Menangani parameter ?tahun=
     * Otomatis dipanggil oleh Trait Filterable saat mendeteksi request 'tahun'
     */
    public function scopeFilterTahun($query, $value)
    {
        if (empty($value)) return $query;

        return $query->whereYear('tanggal_pengeluaran', $value);
    }
}