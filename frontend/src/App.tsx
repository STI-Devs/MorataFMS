import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth';
import { ThemeProvider } from './context/ThemeContext';
import { AuthPage } from './features/auth/components/AuthPage';
import { Documents, ExportList, ImportList, MainLayout, Profile, TrackingDetails } from './features/tracking';
import NotFoundPage from './components/NotFoundPage';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Tracking Routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<ImportList />} />
            <Route path="/export" element={<ExportList />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tracking/:referenceId" element={<TrackingDetails />} />
          </Route>

          {/* 404 Pages (Full Screen) */}
          <Route path="/profile" element={<NotFoundPage />} />
          <Route path="/help" element={<NotFoundPage />} />
          <Route path="/notifications" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;