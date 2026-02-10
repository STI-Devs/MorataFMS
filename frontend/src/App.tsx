import { Navigate, Route, Routes } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { AuthProvider } from './features/auth';
import { AuthPage } from './features/auth/components/AuthPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Redirect root ("/") to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* TODO: Add other protected routes */}
      </Routes>
    </AuthProvider>
  );
}

export default App;