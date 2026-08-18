import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUiStore } from '../store/uiStore';
import { getStats } from '../api/admin';

const PAGE_META = [
  { match: (path) => path === '/', title: 'Tableau de bord', subtitle: "Vue d'ensemble de la plateforme" },
  { match: (path) => path.startsWith('/transporters/'), title: 'Détail transporteur', subtitle: 'Transporteurs' },
  { match: (path) => path.startsWith('/transporters'), title: 'Transporteurs', subtitle: 'Validation des dossiers' },
  { match: (path) => path.startsWith('/trips'), title: 'Trajets', subtitle: 'Trajets déclarés par les transporteurs' },
  { match: (path) => path.startsWith('/missions'), title: 'Missions', subtitle: 'Demandes de transport' },
  { match: (path) => path.startsWith('/users'), title: 'Utilisateurs', subtitle: 'Comptes de la plateforme' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const pendingRequests = useUiStore((state) => state.pendingRequests);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getStats()
      .then((stats) => {
        if (!cancelled) setPendingCount(stats.transporters.pending);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const meta = PAGE_META.find((entry) => entry.match(pathname));

  return (
    <div className="app-shell">
      {pendingRequests > 0 && <div className="global-progress" />}
      <Sidebar pendingCount={pendingCount} />
      <div className="main">
        <Topbar title={meta?.title || 'AlloTruck'} subtitle={meta?.subtitle} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
