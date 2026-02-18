import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { NotFoundPage } from './components/layout/NotFoundPage';
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
          {/* Guest-only routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthPage />} />
          </Route>

          {/* All authenticated routes share the same layout */}
          <Route element={<ProtectedRoute allowedRoles={['encoder', 'broker', 'supervisor', 'manager', 'admin']} />}>
            <Route element={<MainLayout />}>
              {/* Shared dashboard (content differs by role via AdminDashboard component) */}
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

          {/* Smart redirect based on role */}
          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;