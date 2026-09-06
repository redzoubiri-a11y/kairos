/**
 * Formatage des montants, sans passer par `toLocaleString`.
 *
 * `rendu.js` du moteur (usage CLI/Node) utilise `toLocaleString('fr-FR', …)`,
 * qui dépend d'ICU — non garanti sous Hermes selon la configuration du
 * build React Native. Ce formateur manuel fonctionne partout, sans surprise.
 */

export function formaterEuros(valeur) {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return '—';

  const arrondi = Math.round(valeur * 100) / 100;
  const [partieEntiere, decimales = '00'] = Math.abs(arrondi).toFixed(2).split('.');
  const avecEspaces = partieEntiere.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const signe = arrondi < 0 ? '−' : '';

  return `${signe}${avecEspaces},${decimales} €`;
}

export function formaterPourcent(valeurDecimale, decimales = 1) {
  if (typeof valeurDecimale !== 'number' || !Number.isFinite(valeurDecimale)) return '—';
  return `${(valeurDecimale * 100).toFixed(decimales).replace('.', ',')} %`;
}
