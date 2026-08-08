import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { fetchDocumentBlobUrl, getTransporter, verifyTransporter } from '../api/admin';
import { toastError, toastSuccess } from '../store/uiStore';
import {
  DOCUMENT_LABELS,
  VERIFICATION_LABELS,
  formatBytes,
  formatDateTime,
  formatNumber,
  isImage,
  statusTone,
} from '../utils';

function DocumentCard({ document: doc }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  // The document route is authenticated: load the bytes, then hand the browser a
  // blob URL. Revoked on unmount so the tab does not accumulate them.
  useEffect(() => {
    let revoked = false;
    let url;

    fetchDocumentBlobUrl(doc.id)
      .then((next) => {
        if (revoked) {
          URL.revokeObjectURL(next);
          return;
        }
        url = next;
        setBlobUrl(next);
      })
      .catch(() => setImageFailed(true));

    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc.id]);

  const renderInline = isImage(doc.mimeType) && !imageFailed && blobUrl;

  return (
    <a
      className="doc-card"
      href={blobUrl ?? undefined}
      target="_blank"
      rel="noreferrer"
      aria-disabled={!blobUrl}
    >
      <div className="doc-card__thumb">
        {renderInline ? (
          <img
            src={blobUrl}
            alt={DOCUMENT_LABELS[doc.type] || doc.type}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="doc-card__fallback">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M14 3H7a1.8 1.8 0 0 0-1.8 1.8v14.4A1.8 1.8 0 0 0 7 21h10a1.8 1.8 0 0 0 1.8-1.8V7.8Z" />
              <path d="M14 3v5h4.8" />
            </svg>
            {imageFailed ? 'Aperçu indisponible' : blobUrl ? 'Document' : 'Chargement…'}
          </span>
        )}
      </div>
      <div className="doc-card__meta">
        <span className="doc-card__type">{DOCUMENT_LABELS[doc.type] || doc.type}</span>
        <span className="doc-card__sub" title={doc.originalName}>
          {doc.originalName}
        </span>
        <span className="doc-card__sub">
          {doc.mimeType} · {formatBytes(doc.sizeBytes)}
        </span>
        <span className="doc-card__link">{blobUrl ? 'Ouvrir le fichier →' : 'Chargement…'}</span>
      </div>
    </a>
  );
}

export default function TransporterDetailPage() {
  const { id } = useParams();

  const [transporter, setTransporter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getTransporter(id)
      .then(setTransporter)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const applyStatus = async (status, reason) => {
    setBusy(true);
    try {
      const updated = await verifyTransporter({ transporterId: id, status, reason });
      setTransporter(updated);
      toastSuccess(status === 'VERIFIED' ? 'Transporteur vérifié.' : 'Dossier refusé.');
      return true;
    } catch (err) {
      toastError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitRejection = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Un motif est obligatoire pour refuser un dossier.');
      return;
    }
    const ok = await applyStatus('REJECTED', reason);
    if (ok) {
      setRejectOpen(false);
      setRejectReason('');
      setRejectError('');
    }
  };

  if (loading) {
    return <Spinner size={26} label="Chargement du dossier…" />;
  }

  if (error) {
    return (
      <EmptyState
        title="Dossier indisponible"
        description={error}
        action={
          <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
            <Button onClick={load}>Réessayer</Button>
            <Link to="/transporters">
              <Button variant="ghost">Retour à la liste</Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="page__header">
        <div>
          <div className="row" style={{ gap: 12 }}>
            <h1 className="page__title">{transporter.companyName}</h1>
            <Badge tone={statusTone(transporter.verificationStatus)}>
              {VERIFICATION_LABELS[transporter.verificationStatus]}
            </Badge>
          </div>
          <p className="page__desc">
            <Link to="/transporters" style={{ color: 'var(--accent)' }}>
              Transporteurs
            </Link>{' '}
            · {transporter.city}
          </p>
        </div>

        <div className="page__actions">
          {transporter.verificationStatus !== 'VERIFIED' && (
            <Button variant="success" loading={busy} onClick={() => applyStatus('VERIFIED')}>
              Vérifier le dossier
            </Button>
          )}
          {transporter.verificationStatus !== 'REJECTED' && (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                setRejectOpen(true);
                setRejectReason('');
                setRejectError('');
              }}
            >
              Refuser
            </Button>
          )}
        </div>
      </div>

      {transporter.verificationStatus === 'REJECTED' && transporter.rejectionReason && (
        <div className="reject-note">
          <strong>Motif du refus :</strong> {transporter.rejectionReason}
        </div>
      )}

      <div className="detail-grid">
        <div className="stack">
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Informations de l'entreprise</h2>
            </div>
            <div className="card__body">
              <dl className="info-list">
                <dt>Raison sociale</dt>
                <dd>{transporter.companyName}</dd>
                <dt>Ville</dt>
                <dd>{transporter.city}</dd>
                <dt>Adresse</dt>
                <dd>{transporter.address || '—'}</dd>
                <dt>N° RC</dt>
                <dd className="cell-mono">{transporter.rcNumber || '—'}</dd>
                <dt>N° NIF</dt>
                <dd className="cell-mono">{transporter.nifNumber || '—'}</dd>
                <dt>Inscription</dt>
                <dd>{formatDateTime(transporter.createdAt)}</dd>
                <dt>Vérifié le</dt>
                <dd>{transporter.verifiedAt ? formatDateTime(transporter.verifiedAt) : '—'}</dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">
                Pièces justificatives ({transporter.documents.length})
              </h2>
            </div>
            <div className="card__body">
              {transporter.documents.length === 0 ? (
                <EmptyState
                  title="Aucun document"
                  description="Ce transporteur n'a téléversé aucune pièce justificative."
                />
              ) : (
                <div className="doc-grid">
                  {transporter.documents.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Responsable du compte</h2>
            </div>
            <div className="card__body">
              <dl className="info-list">
                <dt>Nom</dt>
                <dd>{transporter.user.fullName}</dd>
                <dt>E-mail</dt>
                <dd>{transporter.user.email}</dd>
                <dt>Téléphone</dt>
                <dd>{transporter.user.phone || '—'}</dd>
                <dt>Compte créé</dt>
                <dd>{formatDateTime(transporter.user.createdAt)}</dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Activité</h2>
            </div>
            <div className="card__body">
              <div className="count-grid">
                <div className="count-tile">
                  <div className="count-tile__value">{formatNumber(transporter._count.trucks)}</div>
                  <div className="count-tile__label">Camions</div>
                </div>
                <div className="count-tile">
                  <div className="count-tile__value">{formatNumber(transporter._count.trips)}</div>
                  <div className="count-tile__label">Trajets</div>
                </div>
                <div className="count-tile">
                  <div className="count-tile__value">{formatNumber(transporter._count.missions)}</div>
                  <div className="count-tile__label">Missions</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={rejectOpen}
        title={`Refuser ${transporter.companyName}`}
        onClose={() => setRejectOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" loading={busy} onClick={submitRejection}>
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
          <label className="field__label" htmlFor="detail-reject-reason">
            Motif du refus
          </label>
          <textarea
            id="detail-reject-reason"
            className="textarea"
            maxLength={300}
            value={rejectReason}
            placeholder="Ex : la carte grise ne correspond pas au camion déclaré."
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
