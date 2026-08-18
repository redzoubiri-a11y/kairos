import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { useAuthStore } from '../store/authStore';

function initials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Topbar({ title, subtitle }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__heading">
        <div className="topbar__title">{title}</div>
        {subtitle && <div className="topbar__crumb">{subtitle}</div>}
      </div>

      <div className="topbar__spacer" />

      <div className="topbar__user">
        <span className="avatar">{initials(user?.fullName) || 'AD'}</span>
        <span className="topbar__meta">
          <span className="topbar__name">{user?.fullName}</span>
          <span className="topbar__role">{user?.email}</span>
        </span>
      </div>

      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Déconnexion
      </Button>
    </header>
  );
}
