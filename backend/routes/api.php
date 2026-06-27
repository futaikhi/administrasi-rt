<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\MasterIuranController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\PengeluaranController;
use App\Http\Controllers\Api\PenghuniController;
use App\Http\Controllers\Api\RumahController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [LaporanController::class, 'summaryChart'])->name('api.dashboard');

    Route::get('/laporan/detail', [LaporanController::class, 'detailBulanan'])->name('laporan.detail');

    // Master Rumah
    Route::get('/rumah', [RumahController::class, 'index'])->name('rumah.index');
    Route::post('/rumah', [RumahController::class, 'store'])->name('rumah.store');
    Route::put('/rumah/{id}', [RumahController::class, 'update'])->name('rumah.update');
    Route::delete('/rumah/{id}', [RumahController::class, 'destroy'])->name('rumah.destroy');
    Route::post('/rumah/{id}/tambah-penghuni', [RumahController::class, 'tambahPenghuni']);
    Route::post('/rumah/{id}/kembangkan-penghuni', [RumahController::class, 'keluarkanPenghuni']);

    // Master Penghuni
    Route::get('/penghuni', [PenghuniController::class, 'index'])->name('penghuni.index');
    Route::post('/penghuni', [PenghuniController::class, 'store'])->name('penghuni.store');
    Route::put('/penghuni/{id}', [PenghuniController::class, 'update'])->name('penghuni.update');
    Route::delete('/penghuni/{id}', [PenghuniController::class, 'destroy'])->name('penghuni.destroy');

    // Master Pengeluaran
    Route::get('/pengeluaran', [PengeluaranController::class, 'index'])->name('pengeluaran.index');
    Route::post('/pengeluaran', [PengeluaranController::class, 'store'])->name('pengeluaran.store');

    // Transaksi Pembayaran Iuran
    Route::get('/pembayaran', [PembayaranController::class, 'index']);
    Route::post('/pembayaran', [PembayaranController::class, 'store']);

    Route::get('/master-iuran', [MasterIuranController::class, 'index']);

    Route::get('/dashboard/summary-tahunan', [App\Http\Controllers\Api\DashboardController::class, 'getSummaryTahunan']);
});