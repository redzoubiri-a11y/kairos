import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { listMissions } from '../api/admin';
import {
  MISSION_STATUS_LABELS,
  formatDateTime,
  formatDzd,
  formatNumber,
  statusTone,
} from '../utils';

const LIMIT = 20;

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACCEPTED', label: 'Acceptées' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminées' },
  { value: 'REJECTED', label: 'Refusées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

export default function MissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: LIMIT, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listMissions({ status, page, limit: LIMIT })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, page, reload]);

  const updateParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) next.delete(key);
        else next.set(key, String(value));
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const columns = [
    {
      key: 'route',
      header: 'Itinéraire',
      render: (row) => (
        <>
          <span className="route cell-primary">
            {row.pickupCity}
            <span className="route__arrow">→</span>
            {row.dropoffCity}
          </span>
          <div className="cell-sub">Enlèvement : {formatDateTime(row.pickupAt)}</div>
        </>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (row) => (
        <>
          <div className="cell-primary">{row.client.fullName}</div>
          <div className="cell-sub">{row.client.email}</div>
        </>
      ),
    },
    {
      key: 'transporter',
      header: 'Transporteur',
      render: (row) => (
        <>
          <Link
            to={`/transporters/${row.transporter.id}`}
            className="cell-primary"
            style={{ color: 'var(--accent)' }}
          >
            {row.transporter.companyName}
          </Link>
          <div className="cell-sub">
            {row.truck ? row.truck.plateNumber : 'Aucun camion assigné'}
          </div>
        </>
      ),
    },
    {
      key: 'goods',
      header: 'Marchandise',
      render: (row) => (
        <>
          <div>{row.goodsType}</div>
          <div className="cell-sub cell-num">
            {formatNumber(row.volumeM3)} m³ · {formatNumber(row.weightKg)} kg
          </div>
        </>
      ),
    },
    {
      key: 'budgetDzd',
      header: 'Budget',
      align: 'right',
      render: (row) => <span className="cell-num">{formatDzd(row.budgetDzd)}</span>,
    },
    {
      key: 'trip',
      header: 'Trajet lié',
      render: (row) =>
        row.trip ? (
          <span className="route cell-sub">
            {row.trip.originCity}
            <span className="route__arrow">→</span>
            {row.trip.destinationCity}
          </span>
        ) : (
          <span className="cell-sub">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Créée le',
      render: (row) => <span className="cell-sub">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => (
        <>
          <Badge tone={statusTone(row.status)}>
            {MISSION_STATUS_LABELS[row.status] || row.status}
          </Badge>
          {row.statusReason && (
            <div className="cell-sub" title={row.statusReason}>
              {row.statusReason}
            </div>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <div className="page__header">
        <div>
          <h1 className="page__title">Missions</h1>
          <p className="page__desc">
            Demandes de transport émises par les clients et leur suivi opérationnel.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              className={`tab${status === tab.value ? ' is-active' : ''}`}
              onClick={() => updateParams({ status: tab.value, page: 1 })}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data.items}
        loading={loading}
        error={error}
        onRetry={() => setReload((value) => value + 1)}
        emptyTitle="Aucune mission"
        emptyDescription={
          status
            ? 'Aucune mission ne correspond à ce statut.'
            : "Aucune mission n'a encore été créée sur la plateforme."
        }
        footer={
          !loading &&
          !error && (
            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              limit={data.limit}
              onPageChange={(next) => updateParams({ page: next })}
            />
          )
        }
      />
    </>
  );
}
