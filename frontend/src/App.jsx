import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import MainLayout from './layouts/MainLayout'; // Import layout
import './App.css';

// Lazy loading pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AddAssetPage = lazy(() => import('./pages/AddAssetPage'));
const AssetDetailsPage = lazy(() => import('./pages/AssetDetailsPage'));
const RepairHistoryPage = lazy(() => import('./pages/RepairHistoryPage'));
const AssetHistoryPage = lazy(() => import('./pages/AssetHistoryPage'));
const GlobalAssetHistoryPage = lazy(() => import('./pages/GlobalAssetHistoryPage'));
const GlobalRepairHistoryPage = lazy(() => import('./pages/GlobalRepairHistoryPage'));
const AddUserPage = lazy(() => import('./pages/AddUserPage'));
const EmployeeListPage = lazy(() => import('./pages/EmployeeListPage'));

// Komponen untuk melindungi route dan menggunakan MainLayout
const ProtectedLayout = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Jika tidak ada token, arahkan ke halaman login
    return <Navigate to="/login" replace />;
  }
  // Jika ada token, tampilkan layout utama dengan konten halaman (via Outlet)
  return <MainLayout />;
};

// Komponen Suspense Fallback
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rute yang dilindungi di dalam MainLayout */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/add" element={<AddAssetPage />} />
          <Route path="/add-user" element={<AddUserPage />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/assets/:id/details" element={<AssetDetailsPage />} />
          <Route path="/assets/:id/repairs" element={<RepairHistoryPage />} />
          <Route path="/assets/:id/history" element={<AssetHistoryPage />} />
          <Route path="/history" element={<GlobalAssetHistoryPage />} />
          <Route path="/repairs" element={<GlobalRepairHistoryPage />} />
        </Route>

        {/* Fallback jika URL tidak cocok */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;