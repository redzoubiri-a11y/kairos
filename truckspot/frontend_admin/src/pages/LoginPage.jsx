import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { toastSuccess } from '../store/uiStore';

export default function LoginPage() {
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await login({ email: email.trim(), password });

      if (data.user?.role !== 'ADMIN') {
        setError(
          "Accès refusé : cette console est réservée aux administrateurs. Utilisez l'application mobile TruckSpot avec ce compte."
        );
        return;
      }

      setAuth(data.token, data.user);
      toastSuccess(`Bienvenue, ${data.user.fullName}.`);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <span className="sidebar__logo" style={{ width: 38, height: 38, fontSize: 16 }}>
            TS
          </span>
          <div>
            <div className="login__title">TruckSpot</div>
            <div className="sidebar__subtitle">Console d'administration</div>
          </div>
        </div>

        <p className="login__desc">
          Connectez-vous avec votre compte administrateur pour gérer les transporteurs,
          les trajets et les missions.
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              placeholder="admin@truckspot.dz"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            block
            loading={submitting}
            disabled={!email || !password}
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>

        <p className="login__hint">Accès strictement réservé au personnel autorisé.</p>
      </div>
    </div>
  );
}
