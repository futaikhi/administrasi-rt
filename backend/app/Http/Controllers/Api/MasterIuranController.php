<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterIuran;
use Illuminate\Http\Request;

class MasterIuranController extends Controller
{
    /**
     * Tampilkan semua komponen iuran beserta nominalnya
     * Digunakan oleh dropdown loket pembayaran di frontend
     */
    public function index()
    {
        try {
            // Ambil semua data iuran (Satpam, Kebersihan, dll) beserta kolom nominalnya
            $masterIuran = MasterIuran::orderBy('id', 'asc')->get();
            
            return response()->json($masterIuran, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memuat master data iuran: ' . $e->getMessage()
            ], 500);
        }
    }
}