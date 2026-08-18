const DATE_OPTS = { day: '2-digit', month: 'short', year: 'numeric' };
const TIME_OPTS = { hour: '2-digit', minute: '2-digit' };

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', DATE_OPTS);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('fr-FR', DATE_OPTS)} a ${d.toLocaleTimeString('fr-FR', TIME_OPTS)}`;
}

export function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('fr-FR', TIME_OPTS);
}

export function formatRelative(value) {
  if (!value) return '';
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return formatDate(value);
}

// Le serveur ecarte deja les positions trop anciennes. Ce seuil-ci ne sert qu'a
// distinguer, parmi celles qui restent, celle d'un camion qui roule en ce
// moment de celle d'un camion vu ce matin.
export const LIVE_POSITION_MINUTES = 15;

export function isPositionLive(lastPositionAt) {
  if (!lastPositionAt) return false;
  return Date.now() - new Date(lastPositionAt).getTime() <= LIVE_POSITION_MINUTES * 60000;
}

export function formatPrice(value) {
  if (value === null || value === undefined) return 'A negocier';
  return `${Number(value).toLocaleString('fr-FR')} DA`;
}

export function formatVolume(value) {
  return `${Number(value).toLocaleString('fr-FR')} m³`;
}

export function formatWeight(kg) {
  if (kg >= 1000) return `${(kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`;
  return `${Number(kg).toLocaleString('fr-FR')} kg`;
}

export function formatDistance(km) {
  if (km === null || km === undefined) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

export function initials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
