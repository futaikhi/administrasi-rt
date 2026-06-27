<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('penghuni', function (Blueprint $table) {
            $table->id();
            $table->string('nama_lengkap'); // [cite: 27]
            $table->string('foto_ktp'); // [cite: 29]
            $table->enum('status_penghuni', ['tetap', 'kontrak']); // [cite: 31]
            $table->string('nomor_telepon'); // [cite: 33]
            $table->enum('status_pernikahan', ['menikah', 'belum_menikah']); // [cite: 35]
            $table->softDeletes(); // Mengamankan data jika ada penghuni yang dihapus
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
