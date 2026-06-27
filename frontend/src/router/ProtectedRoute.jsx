import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('rt_token');
    
    // Jika ada token, izinkan akses komponen anak (Outlet). Jika tidak, lempar ke login
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;