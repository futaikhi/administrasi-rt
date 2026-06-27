<?php

namespace Database\Seeders;

use App\Models\MasterIuran;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MasterIuranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MasterIuran::create([
            'nama_iuran' => 'Satpam',
            'nominal' => 100000.00
        ]);

        MasterIuran::create([
            'nama_iuran' => 'Kebersihan',
            'nominal' => 15000.00
        ]);
    }
}
