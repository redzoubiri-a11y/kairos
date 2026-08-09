import { useCallback, useEffect, useState } from 'react';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import StatCard from '../components/StatCard';
import { getStats } from '../api/admin';
import { MISSION_STATUS_LABELS, formatNumber, statusTone } from '../utils';

const icons = {
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="9.5" cy="8" r="3.3" />
      <path d="M3.5 20a6 6 0 0 1 12 0M16.5 5.4a3.3 3.3 0 0 1 0 6.2M17.5 14.6a6 6 0 0 1 3 5.4" />
    </svg>
  ),
  pending: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  ),
  verified: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.2 19.5 6v5.6c0 4.3-3.1 7.7-7.5 9.2-4.4-1.5-7.5-4.9-7.5-9.2V6Z" />
      <path d="m8.9 12.1 2.2 2.2 4-4.3" />
    </svg>
  ),
  truck: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
    </svg>
  ),
  route: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6h5a3.5 3.5 0 0 1 0 7h-3a3.5 3.5 0 0 0 0 7h5" />
    </svg>
  ),
  mission: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4h6v3H9zM15 5.5h3.5v15H5.5v-15H9" />
      <path d="m8.8 12.4 2 2 4.2-4.2" />
    </svg>
  ),
};

function CompletionGauge({ rate }) {
  const size = 108;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, rate)) / 100;

  return (
    <div className="gauge">
      <svg className="gauge__figure" width={size} height={size} role="img" aria-label={`Taux de complétion ${rate}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--success)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * progress} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div>
        <div className="gauge__value">{rate}%</div>
        <div className="gauge__label">
          Missions menées à terme sur l'ensemble des demandes enregistrées.
        </div>
      </div>
    </div>
  );
}

function MissionBars({ byStatus }) {
  const entries = Object.keys(MISSION_STATUS_LABELS)
    .map((status) => ({ status, count: byStatus[status] ?? 0 }))
    .filter((entry) => entry.count > 0);

  if (entries.length === 0) {
    return <EmptyState title="Aucune mission" description="Aucune mission n'a encore été créée sur la plateforme." />;
  }

  const max = Math.max(...entries.map((entry) => entry.count));

  return (
    <div className="bars">
      {entries.map(({ status, count }) => (
        <div className="bar-row" key={status}>
          <span className="bar-row__label">{MISSION_STATUS_LABELS[status]}</span>
          <div className="bar-row__track">
            <div
              className="bar-row__fill"
              style={{
                width: `${(count / max) * 100}%`,
                background: `var(--${statusTone(status)})`,
              }}
            />
          </div>
          <span className="bar-row__value">{formatNumber(count)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) {
    return <Spinner size={26} label="Chargement des statistiques…" />;
  }

  if (error) {
    return (
      <EmptyState
        title="Impossible de charger le tableau de bord"
        description={error}
        action={
          <Button onClick={load} style={{ marginTop: 12 }}>
            Réessayer
          </Button>
        }
      />
    );
  }

  const { users, transporters, trucks, trips, missions } = stats;

  return (
    <>
      <div className="page__header">
        <div>
          <h1 className="page__title">Tableau de bord</h1>
          <p className="page__desc">Activité en temps réel de la plateforme TruckSpot.</p>
        </div>
        <div className="page__actions">
          <Button onClick={load}>Actualiser</Button>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard
          label="Utilisateurs"
          value={formatNumber(users.total)}
          hint={`${formatNumber(users.clients)} clients · ${formatNumber(users.transporters)} transporteurs`}
          icon={icons.users}
          to="/users"
        />
        <StatCard
          label="Dossiers en attente"
          value={formatNumber(transporters.pending)}
          hint="Transporteurs à valider"
          icon={icons.pending}
          tone="warn"
          to="/transporters?status=PENDING"
        />
        <StatCard
          label="Transporteurs vérifiés"
          value={formatNumber(transporters.verified)}
          hint="Autorisés à publier des trajets"
          icon={icons.verified}
          tone="success"
          to="/transporters?status=VERIFIED"
        />
        <StatCard
          label="Camions disponibles"
          value={`${formatNumber(trucks.available)} / ${formatNumber(trucks.total)}`}
          hint="Flotte déclarée sur la plateforme"
          icon={icons.truck}
          tone="info"
        />
        <StatCard
          label="Trajets actifs"
          value={formatNumber(trips.active)}
          hint={`${formatNumber(trips.total)} trajets au total`}
          icon={icons.route}
          to="/trips"
        />
        <StatCard
          label="Missions"
          value={formatNumber(missions.total)}
          hint={`Taux de complétion : ${missions.completionRate}%`}
          icon={icons.mission}
          to="/missions"
        />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Répartition des missions par statut</h2>
          </div>
          <div className="card__body">
            <MissionBars byStatus={missions.byStatus} />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Taux de complétion</h2>
          </div>
          <div className="card__body">
            <CompletionGauge rate={missions.completionRate} />
          </div>
        </section>
      </div>
    </>
  );
}
