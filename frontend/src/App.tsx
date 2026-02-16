import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { NotFoundPage } from './components/layout/NotFoundPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, GuestRoute, ProtectedRoute, RoleRedirect } from './features/auth';
import { AuthPage } from './features/auth/components/AuthPage';
import { Documents, ExportList, ImportList, MainLayout, Profile, TrackingDashboard, TrackingDetails } from './features/tracking';

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

          {/* Employee-only routes (encoder, broker, supervisor, manager) */}
          <Route element={<ProtectedRoute allowedRoles={['encoder', 'broker', 'supervisor', 'manager']} />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<TrackingDashboard />} />
              <Route path="/imports" element={<ImportList />} />
              <Route path="/exports" element={<ExportList />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/tracking/:referenceId" element={<TrackingDetails />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<div className="flex h-screen items-center justify-center text-text-secondary"><p className="text-lg">Admin Panel — Coming Soon</p></div>} />
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