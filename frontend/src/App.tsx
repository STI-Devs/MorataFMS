import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './components/LandingPage';
import NotFoundPage from './components/NotFoundPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, GuestRoute, ProtectedRoute, RoleRedirect } from './features/auth';
import { AuthPage } from './features/auth/components/AuthPage';
import { AdminDashboard, Documents, ExportList, ImportList, MainLayout, Profile, TrackingDetails } from './features/tracking';
import { UserManagement, ClientManagement, TransactionOversight, ReportsAnalytics, AuditLogs } from './features/admin';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest-only routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthPage />} />
          </Route>

          {/* All authenticated routes share the same layout */}
          <Route element={<ProtectedRoute allowedRoles={['encoder', 'broker', 'supervisor', 'manager', 'admin']} />}>
            <Route element={<MainLayout />}>
              {/* Shared dashboard (content differs by role) */}
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/profile" element={<Profile />} />

              {/* Employee routes */}
              <Route element={<ProtectedRoute allowedRoles={['encoder', 'broker', 'supervisor', 'manager']} />}>
                <Route path="/imports" element={<ImportList />} />
                <Route path="/export" element={<ExportList />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/tracking/:referenceId" element={<TrackingDetails />} />
              </Route>

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/users" element={<UserManagement />} />
                <Route path="/clients" element={<ClientManagement />} />
                <Route path="/transactions" element={<TransactionOversight />} />
                <Route path="/reports" element={<ReportsAnalytics />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
              </Route>
            </Route>
          </Route>

          {/* Redirect /admin to /dashboard */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

          {/* Smart redirect for authenticated users hitting /home */}
          <Route path="/home" element={<RoleRedirect />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;