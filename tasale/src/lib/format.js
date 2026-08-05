// Formatage monétaire et calendaire — DA (dinar algérien), semaine lundi→dimanche.

/** 45000 → "45 000 DA" (espace insécable fine, comme en usage algérien). */
export function formatDA(amount, currency = 'DA') {
  if (amount == null || Number.isNaN(Number(amount))) return `— ${currency}`;
  const rounded = Math.round(Number(amount));
  const withSpaces = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${withSpaces} ${currency}`;
}

/** 540000 → "540K DA" pour les KPI compacts (§5.2). */
export function formatDACompact(amount, currency = 'DA') {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M ${currency}`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K ${currency}`;
  return formatDA(n, currency);
}

/** Date → "2026-08-15" (clé de comparaison, indépendante du fuseau). */
export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "2026-08-15" → Date locale à minuit (évite les décalages UTC). */
export function fromISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "2026-08-15" → "15 Août 2026" (ou équivalent arabe). */
export function formatLongDate(iso, months) {
  const d = fromISODate(iso);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-08-15" → "15 Août" */
export function formatShortDate(iso, monthsShort) {
  const d = fromISODate(iso);
  return `${d.getDate()} ${monthsShort[d.getMonth()]}`;
}

/** Différence en jours entiers entre deux dates ISO (b - a). */
export function daysBetween(aISO, bISO) {
  const a = fromISODate(aISO).getTime();
  const b = fromISODate(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Ajoute n jours à une date ISO. */
export function addDays(iso, n) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Aujourd'hui au format ISO. */
export function todayISO() {
  return toISODate(new Date());
}

/**
 * Grille du mois : 6 semaines × 7 jours commençant un lundi.
 * Chaque case porte { iso, day, inMonth }.
 */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  // getDay(): 0 = dimanche → on ramène à une semaine lundi-first
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({
      iso: toISODate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

/** Horodatage relatif court : "il y a 5 min", "hier", "12 Août". */
export function timeAgo(timestamp, t, monthsShort) {
  const then = new Date(timestamp).getTime();
  const diffMin = Math.floor((Date.now() - then) / 60_000);
  if (diffMin < 1) return t('common.today');
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} j`;
  return formatShortDate(toISODate(new Date(then)), monthsShort);
}

/** Référence de réservation : TAS-2026-0042 (§8.1). */
export function makeReference(seq, year = new Date().getFullYear()) {
  return `TAS-${year}-${String(seq).padStart(4, '0')}`;
}

/** Normalise un numéro algérien : "0555 12 34 56" → "+213555123456". */
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+213')) return digits;
  if (digits.startsWith('213')) return `+${digits}`;
  if (digits.startsWith('0')) return `+213${digits.slice(1)}`;
  return digits;
}

/** Valide un mobile algérien (05/06/07 + 8 chiffres). */
export function isValidPhone(raw) {
  const n = normalizePhone(raw);
  return /^\+213[5-7]\d{8}$/.test(n);
}

/** "+213555123456" → "0555 12 34 56" pour l'affichage. */
export function displayPhone(raw) {
  const n = normalizePhone(raw);
  if (!/^\+213\d{9}$/.test(n)) return raw || '';
  const local = `0${n.slice(4)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
}
