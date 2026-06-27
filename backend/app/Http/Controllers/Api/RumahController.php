<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PembayaranIuran;
use App\Models\Penghuni;
use App\Models\Rumah;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RumahController extends Controller
{
    // 1. Tampilkan Semua Rumah
    public function index(Request $request)
    {
        $rumah = Rumah::with(['penghuniAktif', 'riwayatHunian', 'pembayaranIuran.penghuni', 'pembayaranIuran.masterIuran'])
            ->autoFilter($request->all())
            ->get();

        $rumah->each(function ($item) {
            $item->append('status_iuran_bulan_ini');
        });

        return response()->json($rumah, 200);
    }

    // 2. Tambah Unit Rumah Baru
    public function store(Request $request)
    {
        $request->validate([
            'nomor_rumah' => 'required|string|unique:rumah,nomor_rumah',
        ]);

        $rumah = Rumah::create([
            'nomor_rumah' => $request->nomor_rumah,
            'status_rumah' => 'tidak_dihuni' // Default awal pasti kosong
        ]);

        return response()->json(['message' => 'Unit rumah baru berhasil ditambahkan', 'data' => $rumah], 201);
    }

    // 3. Ubah Data Unit Rumah
    public function update(Request $request, $id)
    {
        $rumah = Rumah::findOrFail($id);

        $request->validate([
            'nomor_rumah' => 'required|string|unique:rumah,nomor_rumah,' . $id,
            'status_rumah' => 'required|in:dihuni,tidak_dihuni'
        ]);

        $rumah->update([
            'nomor_rumah' => $request->nomor_rumah,
            'status_rumah' => $request->status_rumah
        ]);

        return response()->json(['message' => 'Data unit rumah berhasil diperbarui'], 200);
    }

    // 4. Hapus Unit Rumah
    public function destroy($id)
    {
        $rumah = Rumah::findOrFail($id);

        // Cek apakah masih ada warga yang aktif di sana
        $adaOrang = $rumah->penghuniAktif()->exists();
        if ($adaOrang) {
            return response()->json(['message' => 'Gagal menghapus! Rumah masih memiliki penghuni aktif.'], 400);
        }

        $rumah->delete();
        return response()->json(['message' => 'Unit rumah berhasil dihapus dari sistem'], 200);
    }

    // Fitur Tambah Penghuni ke Rumah ini (Bisa warga baru atau pindahan dari rumah lain)
    public function tambahPenghuni(Request $request, $id)
    {
        $request->validate([
            'penghuni_id' => 'required|exists:penghuni,id',
            'tanggal_masuk' => 'required|date'
        ]);

        $idRumahBaru = $id;
        $idPenghuni = $request->penghuni_id;

        DB::beginTransaction();
        try {
            $penghuni = Penghuni::findOrFail($idPenghuni);
            
            // 1. Cek apakah warga ini punya rumah aktif sebelumnya. Jika ada, nyatakan pindah (tutup riwayatnya)
            $rumahLama = $penghuni->rumahAktif()->first();
            if ($rumahLama) {
                $penghuni->rumahAktif()->updateExistingPivot($rumahLama->id, [
                    'tanggal_keluar' => Carbon::now()->toDateString()
                ]);

                // SINKRONISASI: Jika rumah lama ditinggalkan dan kosong, set 'tidak_dihuni'
                $sisaOrang = DB::table('history_hunian')->where('rumah_id', $rumahLama->id)->whereNull('tanggal_keluar')->exists();
                if (!$sisaOrang) {
                    Rumah::where('id', $rumahLama->id)->update(['status_rumah' => 'tidak_dihuni']);
                }
            }

            // 2. Hubungkan warga ke rumah yang baru di tabel junction
            $penghuni->rumahAktif()->attach($idRumahBaru, [
                'tanggal_masuk' => $request->tanggal_masuk,
                'tanggal_keluar' => null
            ]);

            // 3. Set status rumah baru menjadi 'dihuni'
            Rumah::where('id', $idRumahBaru)->update(['status_rumah' => 'dihuni']);

            DB::commit();
            return response()->json(['message' => 'Warga berhasil dimasukkan ke rumah ini.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal memproses: ' . $e->getMessage()], 500);
        }
    }

    // Fitur Keluarkan/Pindahkan warga dari rumah ini
    public function keluarkanPenghuni(Request $request, $id)
    {
        $request->validate([
            'penghuni_id' => 'required|exists:penghuni,id'
        ]);

        $rumah = Rumah::findOrFail($id);

        // Tutup riwayat hunian warga tersebut di rumah ini
        $rumah->penghuniAktif()->updateExistingPivot($request->penghuni_id, [
            'tanggal_keluar' => Carbon::now()->toDateString()
        ]);

        // SINKRONISASI: Jika setelah dikeluarkan rumah ini jadi kosong melompong, ubah statusnya
        if (!$rumah->penghuniAktif()->exists()) {
            $rumah->update(['status_rumah' => 'tidak_dihuni']);
        }

        return response()->json(['message' => 'Warga berhasil dikeluarkan dari rumah ini.'], 200);
    }
}