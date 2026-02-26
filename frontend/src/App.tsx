import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './components/LandingPage';
import NotFoundPage from './components/NotFoundPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, GuestRoute, ProtectedRoute, RoleRedirect } from './features/auth';
import { AuthPage } from './features/auth/components/AuthPage';
import { AdminLiveTracking, Documents, DocumentsDetail, ExportList, Help, ImportList, MainLayout, Profile, TrackingDashboard, TrackingDetails } from './features/tracking';
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

          {/* All authenticated routes — single ProtectedRoute wrapping MainLayout */}
          <Route element={<ProtectedRoute allowedRoles={['encoder', 'broker', 'supervisor', 'manager', 'admin']} />}>
            <Route element={<MainLayout />}>
              {/* Dashboard — role-based redirect */}
              <Route path="/dashboard" element={<RoleRedirect />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/help" element={<Help />} />

              {/* Employee routes */}
              <Route path="/tracking" element={<TrackingDashboard />} />
              <Route path="/imports" element={<ImportList />} />
              <Route path="/export" element={<ExportList />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/documents/:ref" element={<DocumentsDetail />} />
              <Route path="/tracking/:referenceId" element={<TrackingDetails />} />

              {/* Admin-only routes (role guard enforced in MainLayout) */}
              <Route path="/transactions" element={<TransactionOversight />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/clients" element={<ClientManagement />} />
              <Route path="/reports" element={<ReportsAnalytics />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
            </Route>
            {/* Standalone admin routes — protected but no sidebar */}
            <Route path="/live-tracking" element={<AdminLiveTracking />} />
          </Route>

          {/* Redirect /admin to /dashboard */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;