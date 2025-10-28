import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './routes/PrivateRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DevicesPage from './pages/DevicesPage';
// import AlertsPage from './pages/AlertsPage';
import ExportPage from './pages/ExportPage';
import DeviceConfigPage from './pages/DeviceConfigPage';
// import UserManagement from './components/UserManagement';
import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/ErrorBoundary';

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        currentUser ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="devices" element={<DevicesPage />} />
        {/* <Route path="alerts" element={<AlertsPage />} /> */}
        <Route path="device-config" element={<DeviceConfigPage />} />
        <Route path="export" element={
          <PrivateRoute requiredPermission="canExportData">
            <ExportPage />
          </PrivateRoute>
        } />
        {/* <Route path="users" element={
          <PrivateRoute requiredRole="admin">
            <UserManagement />
          </PrivateRoute>
        } /> */}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <AppRoutes />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;