import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import { listUsers, setUserActive } from '../api/admin';
import { useAuthStore } from '../store/authStore';
import { toastError, toastSuccess } from '../store/uiStore';
import { ROLE_LABELS, ROLE_TONES, formatDate } from '../utils';

const LIMIT = 20;

const TABS = [
  { value: '', label: 'Tous' },
  { value: 'CLIENT', label: 'Clients' },
  { value: 'TRANSPORTER', label: 'Transporteurs' },
  { value: 'ADMIN', label: 'Administrateurs' },
];

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.user);

  const role = searchParams.get('role') || '';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: LIMIT, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listUsers({ role, search, page, limit: LIMIT })
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
  }, [role, search, page, reload]);

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

  const handleSearch = useCallback(
    (value) => updateParams({ search: value, page: 1 }),
    [updateParams]
  );

  const confirmToggle = async () => {
    setBusy(true);
    try {
      const nextActive = !target.isActive;
      const updated = await setUserActive(target.id, nextActive);
      // The endpoint returns a partial user, so merge it into the existing row.
      setData((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === target.id ? { ...item, ...updated } : item
        ),
      }));
      toastSuccess(
        nextActive
          ? `Le compte de ${target.fullName} a été réactivé.`
          : `Le compte de ${target.fullName} a été désactivé.`
      );
      setTarget(null);
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Utilisateur',
      render: (row) => (
        <>
          <div className="cell-primary">{row.fullName}</div>
          <div className="cell-sub">{row.email}</div>
        </>
      ),
    },
    {
      key: 'phone',
      header: 'Téléphone',
      render: (row) => <span className="cell-mono">{row.phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (row) => (
        <Badge tone={ROLE_TONES[row.role] || 'neutral'}>{ROLE_LABELS[row.role] || row.role}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Inscription',
      render: (row) => <span className="cell-sub">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'isActive',
      header: 'État',
      render: (row) => (
        <Badge tone={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Actif' : 'Désactivé'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const isSelf = row.id === currentUser?.id;
        return (
          <div className="table__actions">
            <Button
              size="sm"
              variant={row.isActive ? 'danger' : 'success'}
              disabled={isSelf}
              title={isSelf ? 'Vous ne pouvez pas désactiver votre propre compte.' : undefined}
              onClick={() => setTarget(row)}
            >
              {row.isActive ? 'Désactiver' : 'Réactiver'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="page__header">
        <div>
          <h1 className="page__title">Utilisateurs</h1>
          <p className="page__desc">
            Gérez l'accès des clients, des transporteurs et des administrateurs.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              className={`tab${role === tab.value ? ' is-active' : ''}`}
              onClick={() => updateParams({ role: tab.value, page: 1 })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SearchInput value={search} onChange={handleSearch} placeholder="Nom ou e-mail…" />
      </div>

      <DataTable
        columns={columns}
        rows={data.items}
        loading={loading}
        error={error}
        onRetry={() => setReload((value) => value + 1)}
        emptyTitle="Aucun utilisateur"
        emptyDescription={
          search || role
            ? 'Aucun compte ne correspond à ces critères de recherche.'
            : "Aucun compte n'est enregistré sur la plateforme."
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

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.isActive ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
        message={
          target?.isActive
            ? `${target?.fullName} (${target?.email}) ne pourra plus se connecter à AlloTruck tant que son compte reste désactivé.`
            : `${target?.fullName} (${target?.email}) pourra de nouveau se connecter à AlloTruck.`
        }
        confirmLabel={target?.isActive ? 'Désactiver' : 'Réactiver'}
        variant={target?.isActive ? 'danger' : 'primary'}
        loading={busy}
        onConfirm={confirmToggle}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
