<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * 1. REGISTER API
     * Digunakan untuk pendaftaran akun Pak RT / Admin baru
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed', // Wajib sertakan password_confirmation di frontend
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Otomatis buat token setelah sukses mendaftar
        $token = $user->createToken('rt_admin_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email
            ]
        ], 201);
    }

    /**
     * 2. LOGIN API
     * Memvalidasi kredensial dan memberikan Bearer Token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Cek ketersediaan user dan kecocokan password biner
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Kredensial yang Anda masukkan salah atau belum terdaftar.'
            ], 401); // 401 Unauthorized
        }

        // Generate token Sanctum baru
        $token = $user->createToken('rt_admin_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email
            ]
        ], 200);
    }

    /**
     * 3. LOGOUT API
     * Merevoke / menghapus token yang sedang digunakan agar tidak bisa dipakai lagi
     */
    public function logout(Request $request)
    {
        // Menghapus token spesifik yang mengirim request saat ini
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil, token telah dicabut.'
        ], 200);
    }
}
