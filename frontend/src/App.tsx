import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainLayout } from './components/layout/MainLayout';
import { ThemeProvider } from './context/ThemeContext';
import { AdminDashboard } from './features/admin-dashboard';
import { ArchivesPage } from './features/archives';
import { AuditLogs } from './features/audit-logs';
import { AuthProvider, GuestRoute, ProtectedRoute } from './features/auth';
import { AuthPage } from './features/auth/components/AuthPage';
import { ClientManagement } from './features/clients';
import { Documents, DocumentsDetail } from './features/documents';
import { FormsPage } from './features/forms';
import { LawFirmPage } from './features/law-firm';
import { TransactionOversight } from './features/oversight';
import { ReportsAnalytics } from './features/reports';
import { Help, Profile } from './features/settings';
import { AdminLiveTracking, ExportList, ImportList, TrackingDashboard, TrackingDetails } from './features/tracking';
import { UserManagement } from './features/users';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <ErrorBoundary>
          <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest-only routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthPage />} />
          </Route>

          {/* All authenticated users — outer guard prevents MainLayout from rendering for guests */}
          <Route element={<ProtectedRoute allowedRoles={['encoder', 'broker', 'supervisor', 'manager', 'admin']} />}>
            <Route element={<MainLayout />}>

              {/* Routes accessible by ALL roles */}
              <Route path="/tracking" element={<TrackingDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/help" element={<Help />} />
              <Route path="/imports" element={<ImportList />} />
              <Route path="/exports" element={<ExportList />} />
              <Route path="/export" element={<ExportList />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/documents/:ref" element={<DocumentsDetail />} />
              <Route path="/tracking/:referenceId" element={<TrackingDetails />} />

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/clients" element={<ClientManagement />} />
                <Route path="/transactions" element={<TransactionOversight />} />
                <Route path="/reports" element={<ReportsAnalytics />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/archives" element={<ArchivesPage />} />
                  <Route path="/law-firm" element={<LawFirmPage />} />
                  <Route path="/forms" element={<FormsPage />} />
                </Route>

            </Route>

            {/* Standalone admin: no sidebar */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/live-tracking" element={<AdminLiveTracking />} />
            </Route>
          </Route>

          {/* Redirect /admin to /dashboard */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;