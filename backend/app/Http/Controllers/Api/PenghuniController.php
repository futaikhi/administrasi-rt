<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Penghuni;
use App\Models\Rumah;
use App\Models\HistoryHunian;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PenghuniController extends Controller
{
    public function index(Request $request)
    {
        // Mengambil parameter jumlah data per halaman dari frontend, default 5 data
        $perPage = $request->input('per_page', 5);

        $warga = Penghuni::with('rumahAktif')
            ->autoFilter($request->all()) // Trait filter cerdas kita kemarin
            ->orderBy('created_at', 'desc') // Urutkan dari yang terbaru
            ->paginate($perPage); // Mengganti ->get() menjadi ->paginate()

        // Laravel otomatis menyertakan metadata pagination (total, last_page, dll.)
        return response()->json($warga, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'foto_ktp' => 'required|image|mimes:jpeg,png,jpg|max:2048', // Max 2MB
            'status_penghuni' => 'required|in:tetap,kontrak',
            'nomor_telepon' => 'required|string|max:20',
            'status_pernikahan' => 'required|in:menikah,belum_menikah',
            'rumah_id' => 'required|exists:rumah,id',
            'tanggal_masuk' => 'required|date'
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Handle Upload Foto KTP
            $path = $request->file('foto_ktp')->store('foto_ktp', 'public');

            // 2. Simpan Data Penghuni
            $penghuni = Penghuni::create([
                'nama_lengkap' => $request->nama_lengkap,
                'foto_ktp' => Storage::url($path),
                'status_penghuni' => $request->status_penghuni,
                'nomor_telepon' => $request->nomor_telepon,
                'status_pernikahan' => $request->status_pernikahan,
            ]);

            // 3. Daftarkan ke History Hunian Rumah
            HistoryHunian::create([
                'rumah_id' => $request->rumah_id,
                'penghuni_id' => $penghuni->id,
                'tanggal_masuk' => $request->tanggal_masuk,
                'tanggal_keluar' => null
            ]);

            // 4. Update Status Rumah menjadi 'dihuni'
            Rumah::where('id', $request->rumah_id)->update(['status_rumah' => 'dihuni']);

            return response()->json(['message' => 'Data penghuni berhasil ditambahkan dan rumah telah terisi.'], 201);
        });
    }

    /**
     * Fitur hapus / warga pindah (Soft Delete)
     */
    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            $penghuni = Penghuni::findOrFail($id);

            // Set tanggal keluar pada hunian yang aktif saat ini
            $hunianAktif = HistoryHunian::where('penghuni_id', $id)->whereNull('tanggal_keluar')->first();
            if ($hunianAktif) {
                $hunianAktif->update(['tanggal_keluar' => now()->toDateString()]);

                // Ubah kembali rumah menjadi tidak dihuni
                Rumah::where('id', $hunianAktif->rumah_id)->update(['status_rumah' => 'tidak_dihuni']);
            }

            $penghuni->delete(); // Soft Delete bawaan Laravel

            return response()->json(['message' => 'Penghuni berhasil dihapus / dinyatakan pindah.'], 200);
        });
    }

    public function update(Request $request,int $id)
    {
        // 1. Validasi Input (foto_ktp diset 'nullable' karena tidak wajib ganti saat edit)
        $request->validate([
            'nama_lengkap' => 'required|string',
            'status_penghuni' => 'required|in:tetap,kontrak',       
            'nomor_telepon' => 'required|string',
            'status_pernikahan' => 'required|in:menikah,belum_menikah',
            'rumah_id' => 'required|exists:rumah,id',
            'tanggal_masuk' => 'required|date',
            'foto_ktp' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $penghuni = Penghuni::findOrFail($id);

        // Gunakan Database Transaction agar jika salah satu proses gagal, data otomatis ditarik kembali (Rollback)
        DB::beginTransaction();

        try {
            // 2. LOGIKA UPDATE FILE KTP (Hanya jika mengunggah file baru)
            if ($request->hasFile('foto_ktp')) {
                // Hapus file fisik KTP yang lama dari storage
                if ($penghuni->foto_ktp) {
                    $oldPath = str_replace('/storage/', '', $penghuni->foto_ktp);
                    Storage::disk('public')->delete($oldPath);
                }
                
                // Simpan file KTP yang baru
                $path = $request->file('foto_ktp')->store('uploads/ktp', 'public');
                $penghuni->foto_ktp = Storage::url($path);
            }

            // Update data personal warga
            $penghuni->nama_lengkap = $request->nama_lengkap;
            $penghuni->status_penghuni = $request->status_penghuni;
            $penghuni->nomor_telepon = $request->nomor_telepon;
            $penghuni->status_pernikahan = $request->status_pernikahan;
            $penghuni->save();

            // 3. LOGIKA RELASI HISTORY HUNIAN & SINKRONISASI STATUS RUMAH
            // Ambil ID rumah tempat dia tinggal saat ini sebelum diupdate
            $rumahAktifLama = $penghuni->rumahAktif()->first();
            $idRumahLama = $rumahAktifLama ? $rumahAktifLama->id : null;
            $idRumahBaru = $request->rumah_id;

            // Kasus A: Jika warga ternyata pindah rumah
            if ($idRumahLama && $idRumahLama != $idRumahBaru) {
                
                // A.1. Tutup riwayat di rumah lama (Isi tanggal_keluar dengan hari ini)
                $penghuni->rumahAktif()->updateExistingPivot($idRumahLama, [
                    'tanggal_keluar' => Carbon::now()->toDateString()
                ]);

                // A.2. Buka riwayat baru di rumah baru
                $penghuni->rumahAktif()->attach($idRumahBaru, [
                    'tanggal_masuk' => $request->tanggal_masuk,
                    'tanggal_keluar' => null
                ]);

                // A.3. Cek rumah lama: Apakah masih ada orang lain yang tinggal di sana?
                $sisaPenghuniLama = DB::table('history_hunian')
                                      ->where('rumah_id', $idRumahLama)
                                      ->whereNull('tanggal_keluar')
                                      ->exists();

                if (!$sisaPenghuniLama) {
                    // Jika kosong melompong ditinggal pindah, set rumah lama jadi 'tidak_dihuni'
                    Rumah::where('id', $idRumahLama)->update(['status_rumah' => 'tidak_dihuni']);
                }

                // A.4. Pastikan rumah baru statusnya berubah menjadi 'dihuni'
                Rumah::where('id', $idRumahBaru)->update(['status_rumah' => 'dihuni']);
            } 
            // Kasus B: Rumahnya tetap sama, cuma edit info personal / update tanggal masuk
            else {
                if ($idRumahLama) {
                    $penghuni->rumahAktif()->updateExistingPivot($idRumahLama, [
                        'tanggal_masuk' => $request->tanggal_masuk
                    ]);
                } else {
                    // Jaga-jaga jika data seeder awal ada yang corrupt / tidak punya rumah aktif
                    $penghuni->rumahAktif()->attach($idRumahBaru, [
                        'tanggal_masuk' => $request->tanggal_masuk,
                        'tanggal_keluar' => null
                    ]);
                    Rumah::where('id', $idRumahBaru)->update(['status_rumah' => 'dihuni']);
                }
            }

            DB::commit(); // Semua aman? Eksekusi permanen ke database!
            return response()->json(['message' => 'Data profil dan riwayat hunian warga berhasil diperbarui'], 200);

        } catch (\Exception $e) {
            DB::rollBack(); // Ada error? Batalkan semua perubahan data agar tidak corrupt
            return response()->json(['message' => 'Gagal memperbarui data: ' . $e->getMessage()], 500);
        }
    }
}