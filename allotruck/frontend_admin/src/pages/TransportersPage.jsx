import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import { listTransporters, verifyTransporter } from '../api/admin';
import { toastError, toastSuccess } from '../store/uiStore';
import { VERIFICATION_LABELS, formatDate, formatNumber, statusTone } from '../utils';

const LIMIT = 20;

const TABS = [
  { value: '', label: 'Tous' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'VERIFIED', label: 'Vérifiés' },
  { value: 'REJECTED', label: 'Refusés' },
];

export default function TransportersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: LIMIT, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listTransporters({ status, search, page, limit: LIMIT })
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
  }, [status, search, page, reload]);

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

  const applyStatus = async (transporter, nextStatus, reason) => {
    setActionId(transporter.id);
    try {
      await verifyTransporter({
        transporterId: transporter.id,
        status: nextStatus,
        reason,
      });
      toastSuccess(
        nextStatus === 'VERIFIED'
          ? `${transporter.companyName} a été vérifié.`
          : `${transporter.companyName} a été refusé.`
      );
      setReload((value) => value + 1);
      return true;
    } catch (err) {
      toastError(err.message);
      return false;
    } finally {
      setActionId(null);
    }
  };

  const submitRejection = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Un motif est obligatoire pour refuser un dossier.');
      return;
    }
    const ok = await applyStatus(rejectTarget, 'REJECTED', reason);
    if (ok) {
      setRejectTarget(null);
      setRejectReason('');
      setRejectError('');
    }
  };

  const columns = [
    {
      key: 'companyName',
      header: 'Entreprise',
      render: (row) => (
        <>
          <Link to={`/transporters/${row.id}`} className="cell-primary" style={{ color: 'var(--accent)' }}>
            {row.companyName}
          </Link>
          <div className="cell-sub">{row.city}</div>
        </>
      ),
    },
    {
      key: 'user',
      header: 'Responsable',
      render: (row) => (
        <>
          <div>{row.user.fullName}</div>
          <div className="cell-sub">{row.user.email}</div>
        </>
      ),
    },
    {
      key: 'identifiers',
      header: 'RC / NIF',
      render: (row) => (
        <>
          <div className="cell-mono">{row.rcNumber || '—'}</div>
          <div className="cell-mono">{row.nifNumber || '—'}</div>
        </>
      ),
    },
    {
      key: 'documents',
      header: 'Docs',
      align: 'center',
      render: (row) => <span className="cell-num">{row.documents.length}</span>,
    },
    {
      key: 'counts',
      header: 'Camions / Trajets',
      align: 'center',
      render: (row) => (
        <span className="cell-num">
          {formatNumber(row._count.trucks)} / {formatNumber(row._count.trips)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Inscription',
      render: (row) => <span className="cell-sub">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'verificationStatus',
      header: 'Statut',
      render: (row) => (
        <Badge tone={statusTone(row.verificationStatus)}>
          {VERIFICATION_LABELS[row.verificationStatus]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="table__actions">
          {row.verificationStatus !== 'VERIFIED' && (
            <Button
              size="sm"
              variant="success"
              loading={actionId === row.id}
              onClick={() => applyStatus(row, 'VERIFIED')}
            >
              Vérifier
            </Button>
          )}
          {row.verificationStatus !== 'REJECTED' && (
            <Button
              size="sm"
              variant="danger"
              disabled={actionId === row.id}
              onClick={() => {
                setRejectTarget(row);
                setRejectReason('');
                setRejectError('');
              }}
            >
              Refuser
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page__header">
        <div>
          <h1 className="page__title">Transporteurs</h1>
          <p className="page__desc">
            Validez les dossiers d'inscription et consultez les pièces justificatives.
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

        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Entreprise, ville ou e-mail…"
        />
      </div>

      <DataTable
        columns={columns}
        rows={data.items}
        loading={loading}
        error={error}
        onRetry={() => setReload((value) => value + 1)}
        emptyTitle="Aucun transporteur"
        emptyDescription={
          search || status
            ? 'Aucun dossier ne correspond à ces critères de recherche.'
            : "Aucun transporteur n'est encore inscrit sur la plateforme."
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

      <Modal
        open={Boolean(rejectTarget)}
        title={`Refuser ${rejectTarget?.companyName ?? ''}`}
        onClose={() => setRejectTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              loading={actionId === rejectTarget?.id}
              onClick={submitRejection}
            >
              Confirmer le refus
            </Button>
          </>
        }
      >
        <p className="modal__text" style={{ marginBottom: 14 }}>
          Le motif est transmis au transporteur dans sa notification de refus. Il est
          obligatoire.
        </p>
        {rejectError && <div className="form-error">{rejectError}</div>}
        <div className="field">
          <label className="field__label" htmlFor="reject-reason">
            Motif du refus
          </label>
          <textarea
            id="reject-reason"
            className="textarea"
            maxLength={300}
            value={rejectReason}
            placeholder="Ex : le registre de commerce fourni est illisible."
            onChange={(event) => {
              setRejectReason(event.target.value);
              if (rejectError) setRejectError('');
            }}
          />
          <span className="cell-sub">{rejectReason.length}/300 caractères</span>
        </div>
      </Modal>
    </>
  );
}
