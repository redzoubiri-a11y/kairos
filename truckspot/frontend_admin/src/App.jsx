import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Spinner from './components/Spinner';
import Toast from './components/Toast';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MissionsPage from './pages/MissionsPage';
import NotFoundPage from './pages/NotFoundPage';
import TransporterDetailPage from './pages/TransporterDetailPage';
import TransportersPage from './pages/TransportersPage';
import TripsPage from './pages/TripsPage';
import UsersPage from './pages/UsersPage';
import { fetchMe } from './api/auth';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}

/**
 * Revalidates a token restored from localStorage before the first render of a
 * protected page, so a revoked or expired session never shows stale data.
 */
function useSessionBootstrap() {
  const [ready, setReady] = useState(() => !useAuthStore.getState().token);

  useEffect(() => {
    const { token, setUser, logout } = useAuthStore.getState();
    if (!token) {
      setReady(true);
      return;
    }

    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (cancelled) return;
        if (user.role !== 'ADMIN') logout();
        else setUser(user);
      })
      .catch(() => {
        // A 401 already cleared the store through the response interceptor;
        // any other failure keeps the persisted session so the page can retry.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}

export default function App() {
  const ready = useSessionBootstrap();

  if (!ready) {
    return (
      <div className="login">
        <Spinner size={28} label="Vérification de la session…" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transporters" element={<TransportersPage />} />
          <Route path="/transporters/:id" element={<TransporterDetailPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}
