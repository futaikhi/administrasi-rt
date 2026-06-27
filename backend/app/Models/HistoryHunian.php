<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoryHunian extends Model
{
    protected $table = 'history_hunian';
    protected $fillable = ['rumah_id', 'penghuni_id', 'tanggal_masuk', 'tanggal_keluar'];

    public function rumah(): BelongsTo
    {
        return $this->belongsTo(Rumah::class, 'rumah_id');
    }

    public function penghuni(): BelongsTo
    {
        return $this->belongsTo(Penghuni::class, 'penghuni_id');
    }
}