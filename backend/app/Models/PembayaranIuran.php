<?php

namespace App\Models;

use App\Traits\Filterable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PembayaranIuran extends Model
{
    use Filterable;
    protected $table = 'pembayaran_iuran';
    protected $fillable = ['rumah_id', 'penghuni_id', 'master_iuran_id', 'bulan_iuran', 'tahun_iuran', 'jumlah_bayar', 'tanggal_bayar'];    
    protected $filterable = [
        'bulan_iuran' => 'exact',
        'tahun_iuran' => 'exact',
        'master_iuran_id' => 'exact',
        'rumah_id' => 'exact'
    ];

    public function rumah(): BelongsTo
    {
        return $this->belongsTo(Rumah::class, 'rumah_id');
    }

    public function penghuni(): BelongsTo
    {
        return $this->belongsTo(Penghuni::class, 'penghuni_id');
    }

    public function masterIuran(): BelongsTo
    {
        return $this->belongsTo(MasterIuran::class, 'master_iuran_id');
    }
}