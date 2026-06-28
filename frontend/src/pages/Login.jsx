import React, { useState } from 'react';
import api from '../api/axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Tembak API Login Laravel Sanctum
            const response = await api.post('/login', { email, password });

            // Simpan token ke localStorage browser
            localStorage.setItem('rt_token', response.data.token);
            localStorage.setItem('user_data', JSON.stringify(response.data.user));

            // Redirect manual/pindah ke halaman dashboard terproteksi
            window.location.href = '/dashboard';
        } catch (err) {
            // Tangkap pesan error dari response backend
            const errorMessage = err.response?.data?.message || 'Gagal terhubung ke server backend.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-emerald-400 tracking-tight">Sistem Management RT</h2>
                    <p className="mt-2 text-sm text-slate-400">Silakan masuk untuk mengelola rumah dan uang kas warga</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Admin</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="rt@rt.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Memvalidasi Kredensial...' : 'Masuk Aplikasi'}
                    </button>
                </form>
            </div>
        </div>
    );
}