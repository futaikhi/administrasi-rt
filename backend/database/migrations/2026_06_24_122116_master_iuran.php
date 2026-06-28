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
        Schema::create('master_iuran', function (Blueprint $table) {
            $table->id();
            $table->string('nama_iuran'); // Satpam / Kebersihan 
            $table->decimal('nominal', 12, 2); // 100000.00 / 15000.00 [cite: 12, 13]
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
