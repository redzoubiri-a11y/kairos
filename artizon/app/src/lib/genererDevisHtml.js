import { colors } from '../theme.js';
import { formaterEuros, formaterPourcent } from './format.js';

/**
 * Le PDF envoyé au client ne montre jamais la chaîne de calcul interne
 * (déboursé, frais généraux, marge, coefficient) — seulement le prix de
 * vente HT/TTC. Ce sont deux publics différents : SyntheseDevis.js est pour
 * l'artisan, ce fichier est pour son client.
 */

function echapper(valeur) {
  return String(valeur ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function formaterDateLongue(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function genererDevisHtml({ profil, devis, resultat }) {
  const { entreprise } = profil;
  const { chaine, tva, totalTTC } = resultat;
  const ouvrage = echapper(devis.ouvrage.libelle || 'Prestation');
  const client = echapper(devis.client.nom || 'Client');
  const prixVenteHT = formaterEuros(chaine.prixVente);
  const montantTva = formaterEuros(chaine.prixVente * tva.taux);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    color: #1C1F24;
    padding: 32px;
    font-size: 13px;
    line-height: 1.5;
  }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .entreprise-nom { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .devis-titre { text-align: right; }
  .devis-titre .titre { font-size: 22px; font-weight: 700; color: ${colors.primary}; }
  .section-titre {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #5B6470;
    margin-bottom: 4px;
  }
  .bloc { margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #DDE1E6; padding: 8px 10px; text-align: left; }
  th { background: #F6F7F9; font-size: 11px; text-transform: uppercase; }
  td:last-child, th:last-child { text-align: right; }
  .totaux { width: 260px; margin-left: auto; margin-bottom: 20px; }
  .ligne-total { display: flex; justify-content: space-between; padding: 4px 0; }
  .ligne-total.total-ttc { font-weight: 700; font-size: 15px; border-top: 1px solid #DDE1E6; margin-top: 4px; padding-top: 8px; }
  .mentions { font-size: 11px; color: #5B6470; margin-bottom: 20px; }
  .mentions div { margin-bottom: 2px; }
  .alerte { color: #9A6300; font-weight: 600; margin-bottom: 20px; }
  .signature { margin-top: 40px; }
  .signature-espace { height: 60px; border: 1px dashed #DDE1E6; margin-top: 8px; }
</style>
</head>
<body>
  <div class="entete">
    <div>
      <div class="entreprise-nom">${echapper(entreprise.nom || 'Entreprise')}</div>
      ${entreprise.forme ? `<div>${echapper(entreprise.forme)}</div>` : ''}
      ${entreprise.siret ? `<div>SIRET : ${echapper(entreprise.siret)}</div>` : ''}
      ${entreprise.tvaIntracommunautaire ? `<div>TVA intracommunautaire : ${echapper(entreprise.tvaIntracommunautaire)}</div>` : ''}
    </div>
    <div class="devis-titre">
      <div class="titre">DEVIS</div>
      <div>Établi le ${formaterDateLongue(new Date())}</div>
    </div>
  </div>

  <div class="bloc">
    <div class="section-titre">Client</div>
    <div>${client}</div>
  </div>

  <table>
    <thead>
      <tr><th>Désignation</th><th>Qté</th><th>Prix unitaire HT</th><th>Total HT</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${ouvrage} — fourniture et pose</td>
        <td>1</td>
        <td>${prixVenteHT}</td>
        <td>${prixVenteHT}</td>
      </tr>
    </tbody>
  </table>

  <div class="totaux">
    <div class="ligne-total"><span>Total HT</span><span>${prixVenteHT}</span></div>
    <div class="ligne-total"><span>TVA (${formaterPourcent(tva.taux, 1)})</span><span>${montantTva}</span></div>
    <div class="ligne-total total-ttc"><span>Total TTC</span><span>${formaterEuros(totalTTC)}</span></div>
  </div>

  <div class="mentions">
    <div>${echapper(tva.motif)}</div>
    ${(tva.conditions ?? []).map((c) => `<div>• ${echapper(c)}</div>`).join('')}
  </div>

  ${!devis.fourniture.ferme && devis.fourniture.prix > 0
    ? '<div class="alerte">Prix établi sur une estimation fournisseur non confirmée — à valider avant tout engagement définitif.</div>'
    : ''}

  ${entreprise.assuranceDecennale?.assureur
    ? `<div class="mentions">
        <div>Assurance décennale : ${echapper(entreprise.assuranceDecennale.assureur)}${
          entreprise.assuranceDecennale.contrat ? ` — contrat n° ${echapper(entreprise.assuranceDecennale.contrat)}` : ''
        }</div>
      </div>`
    : ''}

  <div class="mentions">
    <div>Devis valable 30 jours à compter de sa date d'émission.</div>
  </div>

  <div class="signature">
    <div class="section-titre">Bon pour accord</div>
    <div>Date : ____________________</div>
    <div>Signature du client précédée de la mention « Bon pour accord » :</div>
    <div class="signature-espace"></div>
  </div>
</body>
</html>
`;
}
