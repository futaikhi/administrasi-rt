<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengeluaran; // Sesuai nama model[cite: 1]
use Illuminate\Http\Request;

class PengeluaranController extends Controller
{
    // Tampilkan Semua Riwayat Pengeluaran (Terpaginasi)
    public function index(Request $request)
    {
        // 1. Oper parameter filter ke scope autoFilter di Model Pengeluaran
        $query = Pengeluaran::query()
            ->filterBulan($request->input('bulan'))
            ->filterTahun($request->input('tahun'))
            ->autoFilter($request->all()) // Tetap dipasang untuk memfilter kolom exact match lain (seperti nama_pengeluaran)
            ->orderBy('tanggal_pengeluaran', 'desc');

        // 2. KONDISI OVERRIDE UNTUK LAPORAN BULANAN & EXCEL (all = true)
        if ($request->boolean('all')) {
            return response()->json($query->get(), 200); // Ambil semua pengeluaran tanpa batasan 10 baris
        }

        // 3. Default untuk Tabel CRUD Pengeluaran Biasa
        return response()->json($query->paginate(10), 200);
    }

    // Catat Pengeluaran Baru
    public function store(Request $request)
    {
        $request->validate([
            'nama_pengeluaran' => 'required|string|max:255', // Sesuai kolom seeder[cite: 1]
            'nominal' => 'required|numeric|min:0', // Sesuai kolom seeder[cite: 1]
            'tanggal_pengeluaran' => 'required|date', // Sesuai kolom seeder[cite: 1]
            'keterangan' => 'nullable|string' // Sesuai kolom seeder[cite: 1]
        ]);

        $pengeluaran = Pengeluaran::create($request->all());

        return response()->json(['message' => 'Data pengeluaran kas RT berhasil dicatat.', 'data' => $pengeluaran], 201);
    }

    // Ubah Data Pengeluaran
    public function update(Request $request, $id)
    {
        $pengeluaran = Pengeluaran::findOrFail($id);

        $request->validate([
            'nama_pengeluaran' => 'required|string|max:255', // Sesuai kolom seeder[cite: 1]
            'nominal' => 'required|numeric|min:0', // Sesuai kolom seeder[cite: 1]
            'tanggal_pengeluaran' => 'required|date', // Sesuai kolom seeder[cite: 1]
            'keterangan' => 'nullable|string' // Sesuai kolom seeder[cite: 1]
        ]);

        $pengeluaran->update($request->all());

        return response()->json(['message' => 'Catatan pengeluaran berhasil diperbarui.'], 200);
    }

    // Hapus Log Pengeluaran
    public function destroy($id)
    {
        $pengeluaran = Pengeluaran::findOrFail($id);
        $pengeluaran->delete();

        return response()->json(['message' => 'Catatan pengeluaran berhasil dihapus dari pembukuan.'], 200);
    }
}