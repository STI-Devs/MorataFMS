import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { NotFoundPage } from './components/layout/NotFoundPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, GuestRoute, ProtectedRoute } from './features/auth';
import { AuthPage } from './features/auth/components/AuthPage';
import { Documents, ExportList, ImportList, MainLayout, TrackingDashboard, TrackingDetails } from './features/tracking';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* Guest-only routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<ImportList />} />
              <Route path="/export" element={<ExportList />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/tracking" element={<TrackingDashboard />} />
              <Route path="/tracking/:referenceId" element={<TrackingDetails />} />
            </Route>
          </Route>

          {/* Default redirects & 404 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;