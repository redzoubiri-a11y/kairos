// Utilitaires partagés pour restaurants.opening_hours — utilisé par useExplorer.js
// (filtre "Ouvert") et RestaurantInfosTab.js (bandeau horaires de la Fiche Restaurant),
// regroupés ici pour éviter la duplication entre un hook et un composant écran.

const DOW_LABEL = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
// Ordre d'affichage : la semaine commence le lundi, pas le dimanche (qui vaut 0
// dans Date.getDay()).
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// "Tous les jours", "Lun–Ven", ou "Lun, Mar, Jeu" selon les jours fournis.
function joursLabel(days) {
  const presents = WEEK_ORDER.filter(d => days.includes(d));
  if (presents.length === 7) return 'Tous les jours';
  if (presents.length === 0) return '';
  const idx = presents.map(d => WEEK_ORDER.indexOf(d));
  const contigus = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (contigus && presents.length > 2)
    return `${DOW_LABEL[presents[0]]}–${DOW_LABEL[presents[presents.length - 1]]}`;
  // 5 ou 6 jours sur 7 : la liste devient illisible sur une ligne, l'exception
  // se lit mieux que l'énumération.
  if (presents.length >= 5) {
    const absents = WEEK_ORDER.filter(d => !presents.includes(d));
    return `Tous les jours sauf ${absents.map(d => DOW_LABEL[d]).join(' et ')}`;
  }
  return presents.map(d => DOW_LABEL[d]).join(', ');
}

export function fmtHours(oh) {
  if (!oh) return null;
  if (typeof oh === 'string') return oh;
  if (!Array.isArray(oh) || oh.length === 0) return null;
  const hm = s => (s || '').replace(':', 'h');
  if (typeof oh[0].day === 'number') {
    // Les jours sont regroupés par créneau identique. Avant le 30/08/2026 cette
    // branche affichait "Lun–Sam" EN DUR dès que deux jours différaient : un
    // restaurant ouvert 7j/7 avec un seul jour décalé était annoncé fermé le
    // dimanche, ce qui coûtait des réservations.
    const groupes = new Map();
    for (const d of oh) {
      const cle = `${d.open}|${d.close}`;
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push(d.day);
    }
    const parts = [...groupes.entries()]
      .sort((a, b) => Math.min(...a[1].map(d => WEEK_ORDER.indexOf(d)))
                    - Math.min(...b[1].map(d => WEEK_ORDER.indexOf(d))))
      .map(([cle, days]) => {
        const [open, close] = cle.split('|');
        return `${joursLabel(days)}  ${hm(open)} – ${hm(close)}`;
      });
    if (parts.length <= 2) return parts.join('  ·  ');
    // Trop de variantes pour tenir sur une ligne : on résume sur l'amplitude,
    // mais avec les vrais jours d'ouverture.
    const minOpen  = oh.reduce((mn, d) => d.open  < mn ? d.open  : mn, oh[0].open);
    const maxClose = oh.reduce((mx, d) => d.close > mx ? d.close : mx, oh[0].close);
    return `${joursLabel(oh.map(d => d.day))}  ${hm(minOpen)} – ${hm(maxClose)}`;
  }
  return oh.map(d => `${d.day}  ${hm(d.open)} – ${hm(d.close)}`).join('  ·  ');
}

// Horaires du jour (pas de fmtHours, qui résume toute la semaine) — pour le
// bandeau "Ouvert aujourd'hui" de la Fiche Restaurant. Le modèle de données
// actuel ne stocke qu'un seul créneau par jour (pas de split midi/soir) : on
// n'affiche donc pas l'exemple "12:00–15:00 · 19:00–23:00" de la maquette,
// qui suppose un modèle multi-créneaux inexistant côté données.
export function todaysHours(oh) {
  if (!oh || typeof oh === 'string' || !Array.isArray(oh) || oh.length === 0) return null;
  const day = new Date().getDay();
  const today = oh.find(d => d.day === day);
  if (!today) return null;
  const hm = s => (s || '').replace(':', 'h');
  return `${hm(today.open)} – ${hm(today.close)}`;
}

export function isOpenNow(oh) {
  if (!oh || typeof oh === 'string' || !Array.isArray(oh) || oh.length === 0) return null;
  const now = new Date();
  const day = now.getDay();
  const today = oh.find(d => d.day === day);
  if (!today) return null;
  const toMin = s => { const [h, m] = (s || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= toMin(today.open) && nowMin <= toMin(today.close);
}

// Créneaux d'affichage MVP (15/08/2026) — PAS une vraie disponibilité : aucune
// vérification de capacité (check_capacity), seulement 3 horaires plausibles dérivés du
// créneau d'ouverture du jour demandé (aujourd'hui par défaut). Repris pour le widget
// "Réservation en ligne" de la fiche restaurant (refonte visuelle du 16/08/2026).
export function mvpSlots(oh, day = new Date().getDay()) {
  if (!oh || typeof oh === 'string' || !Array.isArray(oh) || oh.length === 0) return [];
  const today = oh.find(d => d.day === day);
  if (!today) return [];
  const toMin = s => { const [h, m] = (s || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const toHM  = min => { const h = Math.floor(min / 60) % 24; const m = min % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
  const open  = toMin(today.open);
  const close = toMin(today.close);
  if (close <= open) return [];
  const span = close - open;
  return [0.3, 0.5, 0.7].map(f => toHM(Math.round((open + span * f) / 30) * 30));
}

const DOW_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Les n prochains jours (aujourd'hui inclus) pour la bande de dates de la fiche
// restaurant — { day: jour de la semaine 0-6, num, dow, date } par entrée.
export function nextDays(n = 5) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({ day: d.getDay(), num: d.getDate(), dow: DOW_SHORT[d.getDay()], date: d });
  }
  return out;
}
