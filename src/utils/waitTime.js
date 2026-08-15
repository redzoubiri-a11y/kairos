// Estimation d'attente Click & Collect (Lot 3) — valeur saisie à la main par le
// restaurateur par tranche horaire (`restaurants.wait_time_estimates`), aucun calcul
// automatique. Ce fichier ne fait que trouver la tranche qui couvre l'heure actuelle.

function toMin(hm) {
  const [h, m] = (hm || '0:0').split(':').map(Number);
  return h * 60 + (m || 0);
}

// estimates: [{ from: "12:00", to: "14:00", minutes: 20 }, ...]
export function estimateWaitMinutes(estimates, now = new Date()) {
  if (!Array.isArray(estimates) || estimates.length === 0) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const e of estimates) {
    const from = toMin(e.from);
    const to = toMin(e.to);
    const inBracket = to > from
      ? nowMin >= from && nowMin < to
      : nowMin >= from || nowMin < to; // tranche à cheval sur minuit
    if (inBracket) return e.minutes;
  }
  return null;
}
