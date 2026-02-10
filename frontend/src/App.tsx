import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth';
import { AuthPage } from './features/auth/components/AuthPage';
import { ExportList, ImportList, MainLayout, TrackingDetails } from './features/tracking';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        {/* Tracking Routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<ImportList />} />
          <Route path="/export" element={<ExportList />} />
          <Route path="/tracking/:referenceId" element={<TrackingDetails />} />
        </Route>

        {/* Redirect root ("/") to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;