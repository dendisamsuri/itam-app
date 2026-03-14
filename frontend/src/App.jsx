import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import MainLayout from './layouts/MainLayout'; // Import layout
import { PermissionsProvider } from './PermissionsContext';
import PermissionGuard from './components/PermissionGuard';
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
const UserListPage = lazy(() => import('./pages/UserListPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Komponen untuk melindungi route dan menggunakan MainLayout
const ProtectedLayout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Jika tidak ada token, arahkan ke halaman login
        return <Navigate to="/login" replace />;
    }
    // Jika ada token, tampilkan layout utama dengan konten halaman (via Outlet)
    return (
        <PermissionsProvider>
            <MainLayout />
        </PermissionsProvider>
    );
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
                    <Route path="/" element={<PermissionGuard permKey="asset_list"><DashboardPage /></PermissionGuard>} />
                    <Route path="/add" element={<PermissionGuard permKey="add_asset" defaultAccessLevel="admin"><AddAssetPage /></PermissionGuard>} />
                    <Route path="/add-user" element={<PermissionGuard permKey="add_user" defaultAccessLevel="superadmin"><AddUserPage /></PermissionGuard>} />
                    <Route path="/employees" element={<PermissionGuard permKey="employee_list"><EmployeeListPage /></PermissionGuard>} />
                    <Route path="/users" element={<PermissionGuard permKey="user_list" defaultAccessLevel="admin"><UserListPage /></PermissionGuard>} />
                    <Route path="/assets/:id/details" element={<PermissionGuard permKey="asset_list"><AssetDetailsPage /></PermissionGuard>} />
                    <Route path="/assets/:id/repairs" element={<PermissionGuard permKey="repair_history"><RepairHistoryPage /></PermissionGuard>} />
                    <Route path="/assets/:id/history" element={<PermissionGuard permKey="asset_history"><AssetHistoryPage /></PermissionGuard>} />
                    <Route path="/history" element={<PermissionGuard permKey="asset_history"><GlobalAssetHistoryPage /></PermissionGuard>} />
                    <Route path="/repairs" element={<PermissionGuard permKey="repair_history"><GlobalRepairHistoryPage /></PermissionGuard>} />
                    <Route path="/settings" element={<PermissionGuard permKey="settings" defaultAccessLevel="admin"><SettingsPage /></PermissionGuard>} />
                </Route>

                {/* Fallback jika URL tidak cocok */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Suspense>
    );
}

export default App;