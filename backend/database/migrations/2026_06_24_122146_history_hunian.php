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
        Schema::create('history_hunian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rumah_id')->constrained('rumah')->onDelete('restrict');
            $table->foreignId('penghuni_id')->constrained('penghuni')->onDelete('restrict');
            $table->date('tanggal_masuk');
            $table->date('tanggal_keluar')->nullable(); // Jika null, berarti masih menghuni [cite: 49]
            $table->timestamps();

            $table->index(['rumah_id', 'penghuni_id']);
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
