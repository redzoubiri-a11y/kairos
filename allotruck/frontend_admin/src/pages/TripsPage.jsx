import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import {
  TRIP_STATUS_LABELS,
  TRUCK_TYPE_LABELS,
  VERIFICATION_LABELS,
  formatDateTime,
  formatDzd,
  formatNumber,
  statusTone,
} from '../utils';
import { listTrips } from '../api/admin';

const LIMIT = 20;

const TABS = [
  { value: '', label: 'Tous' },
  { value: 'SCHEDULED', label: 'Planifiés' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminés' },
  { value: 'CANCELLED', label: 'Annulés' },
];

export default function TripsPage() {
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

    listTrips({ status, page, limit: LIMIT })
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
      header: 'Trajet',
      render: (row) => (
        <>
          <span className="route cell-primary">
            {row.originCity}
            <span className="route__arrow">→</span>
            {row.destinationCity}
          </span>
          <div className="cell-sub">Départ : {formatDateTime(row.departureAt)}</div>
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
            {row.transporter.user.fullName} ·{' '}
            {VERIFICATION_LABELS[row.transporter.verificationStatus]}
          </div>
        </>
      ),
    },
    {
      key: 'truck',
      header: 'Camion',
      render: (row) => (
        <>
          <div className="cell-mono">{row.truck.plateNumber}</div>
          <div className="cell-sub">{TRUCK_TYPE_LABELS[row.truck.type] || row.truck.type}</div>
        </>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacité libre',
      align: 'right',
      render: (row) => (
        <>
          <div className="cell-num">{formatNumber(row.freeVolumeM3)} m³</div>
          <div className="cell-sub cell-num">{formatNumber(row.freeWeightKg)} kg</div>
        </>
      ),
    },
    {
      key: 'pricePerM3',
      header: 'Prix / m³',
      align: 'right',
      render: (row) => <span className="cell-num">{formatDzd(row.pricePerM3)}</span>,
    },
    {
      key: 'goodsTypes',
      header: 'Marchandises',
      render: (row) =>
        row.goodsTypes.length > 0 ? (
          <span className="cell-sub">{row.goodsTypes.join(', ')}</span>
        ) : (
          <span className="cell-sub">—</span>
        ),
    },
    {
      key: 'missions',
      header: 'Missions',
      align: 'center',
      render: (row) => <span className="cell-num">{formatNumber(row._count.missions)}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => (
        <Badge tone={statusTone(row.status)}>{TRIP_STATUS_LABELS[row.status] || row.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <div className="page__header">
        <div>
          <h1 className="page__title">Trajets</h1>
          <p className="page__desc">
            Ensemble des trajets déclarés, y compris ceux des transporteurs non vérifiés.
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
        emptyTitle="Aucun trajet"
        emptyDescription={
          status
            ? 'Aucun trajet ne correspond à ce statut.'
            : "Aucun trajet n'a encore été publié sur la plateforme."
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
