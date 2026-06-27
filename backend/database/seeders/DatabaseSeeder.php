<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            MasterIuranSeeder::class,
            RumahDanPenghuniSeeder::class,
            TransaksiKeuanganSeeder::class,
        ]);

        User::factory()->create([
            'name' => 'Pak RT',
            'email' => 'rt@rt.com',
            'password' => Hash::make('rt-2026'),
        ]);
    }
}
