const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const numberFormatter = new Intl.NumberFormat('fr-FR');

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function formatNumber(value) {
  return typeof value === 'number' ? numberFormatter.format(value) : '—';
}

export function formatDzd(value) {
  return typeof value === 'number' ? `${numberFormatter.format(value)} DZD` : '—';
}

export function formatBytes(bytes) {
  if (typeof bytes !== 'number' || bytes <= 0) return '—';
  const units = ['o', 'Ko', 'Mo'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export const VERIFICATION_LABELS = {
  PENDING: 'En attente',
  VERIFIED: 'Vérifié',
  REJECTED: 'Refusé',
};

export const TRIP_STATUS_LABELS = {
  SCHEDULED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export const MISSION_STATUS_LABELS = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const ROLE_LABELS = {
  CLIENT: 'Client',
  TRANSPORTER: 'Transporteur',
  ADMIN: 'Administrateur',
};

export const DOCUMENT_LABELS = {
  RC: 'Registre de commerce',
  PATENTE: 'Patente',
  CARTE_GRISE: 'Carte grise',
  ID_CARD: "Pièce d'identité",
};

export const TRUCK_TYPE_LABELS = {
  FOURGON: 'Fourgon',
  PLATEAU: 'Plateau',
  BENNE: 'Benne',
  FRIGO: 'Frigo',
  CITERNE: 'Citerne',
  PORTE_CHAR: 'Porte-char',
  SEMI_REMORQUE: 'Semi-remorque',
};

const STATUS_TONES = {
  PENDING: 'accent',
  VERIFIED: 'success',
  REJECTED: 'danger',
  SCHEDULED: 'info',
  IN_PROGRESS: 'info',
  ACCEPTED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

export function statusTone(status) {
  return STATUS_TONES[status] || 'neutral';
}

export const ROLE_TONES = {
  CLIENT: 'info',
  TRANSPORTER: 'success',
  ADMIN: 'warn',
};

export function isImage(mimeType) {
  return typeof mimeType === 'string' && mimeType.startsWith('image/');
}
