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
        Schema::create('pembayaran_iuran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rumah_id')->constrained('rumah')->onDelete('restrict');
            $table->foreignId('penghuni_id')->constrained('penghuni')->onDelete('restrict'); // Siapa yang membayar saat itu
            $table->foreignId('master_iuran_id')->constrained('master_iuran')->onDelete('restrict');
            $table->tinyInteger('bulan_iuran'); // 1 - 12 (Iuran untuk bulan apa)
            $table->year('tahun_iuran');        // Iuran untuk tahun apa
            $table->decimal('jumlah_bayar', 12, 2); // Nominal yang dibayarkan
            $table->date('tanggal_bayar');     // Waktu eksekusi pembayaran
            $table->timestamps();

            // Index krusial untuk mempercepat query laporan bulanan/tahunan
            $table->index(['rumah_id', 'bulan_iuran', 'tahun_iuran', 'master_iuran_id'], 'idx_pembayaran_lookup');
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
