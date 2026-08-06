// Gabarits des documents PDF — planning mensuel et contrat de réservation
// (§12 Phase 3, Annexe C).
//
// Ce module est volontairement pur : aucune dépendance à React Native ni à
// Expo. Il se teste sans moteur de rendu et se prévisualise dans un simple
// navigateur. L'écriture du fichier vit dans pdf.js.
//
// Toute valeur venant d'un utilisateur passe par `escapeHtml` : un nom de
// client contenant « < » casserait la mise en page, et un message bien choisi
// pourrait injecter du balisage dans le contrat.

import { formatDA, formatLongDate, displayPhone, monthGrid } from '../lib/format';

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/** Feuille de style commune, alignée sur les tokens du design system (§3). */
const STYLES = `
  @page { margin: 18mm 15mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
         color: #1A1A1A; font-size: 12px; line-height: 1.5; margin: 0; }
  .marque { display: flex; align-items: center; gap: 11px; margin-bottom: 4px; }
  /* Monogramme TS dans son filet circulaire, repris du document de marque.
     L'or n'y sert qu'au logo — jamais au texte, où il serait illisible. */
  .sigle { position: relative; width: 36px; height: 36px; border-radius: 50%;
           border: 1px solid #BE9A5E; color: #BE9A5E;
           font-family: Georgia, 'Times New Roman', serif; line-height: 1; }
  /* Mêmes proportions que le monogramme de l'application : le S descend sous
     la ligne du T et mord sur son pied. */
  .sigle i { position: absolute; font-style: normal; left: 50%; top: 50%; }
  .sigle .t { font-size: 19px; transform: translate(-66%, -66%); }
  .sigle .s { font-size: 16px; transform: translate(-16%, -44%); }
  .nom { font-size: 15px; font-weight: 600; letter-spacing: .16em; }
  h1 { font-size: 19px; font-weight: 600; margin: 18px 0 2px; }
  .meta { color: #8B7E72; font-size: 11px; margin-bottom: 18px; }
  h2 { font-size: 12px; font-weight: 600; text-transform: uppercase;
       letter-spacing: .06em; color: #8B7E72; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  .infos td { padding: 5px 0; vertical-align: top; }
  .infos td:first-child { color: #8B7E72; width: 38%; }
  .grille td, .grille th { border: 1px solid #E8E4DF; padding: 5px 3px;
                           text-align: center; font-size: 10px; height: 34px; }
  .grille th { background: #FAFAF8; color: #8B7E72; font-weight: 600; height: auto; }
  .hors { color: #C9C4BD; }
  .reserve { background: rgba(11,110,95,.12); color: #084F44; font-weight: 600; }
  .attente { background: rgba(212,168,83,.18); color: #8B6914; font-weight: 600; }
  .bloque  { background: #F1EFEC; color: #8B7E72; }
  .liste td { border-bottom: 1px solid #E8E4DF; padding: 7px 4px; font-size: 11px; }
  .liste th { text-align: left; border-bottom: 1px solid #1A1A1A; padding: 6px 4px;
              font-size: 10px; text-transform: uppercase; color: #8B7E72; }
  .total { font-size: 15px; font-weight: 600; color: #0B6E5F; }
  .clauses li { margin-bottom: 5px; }
  .signature { margin-top: 26px; border: 1px solid #E8E4DF; border-radius: 8px;
               padding: 12px 14px; background: #FAFAF8; }
  .cachet { color: #0B6E5F; font-weight: 600; }
  footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #E8E4DF;
           color: #8B7E72; font-size: 10px; }
`;

function enTete(titre, sousTitre) {
  return `
    <div class="marque"><div class="sigle"><i class="t">T</i><i class="s">S</i></div><div class="nom">TASALLE</div></div>
    <h1>${escapeHtml(titre)}</h1>
    <div class="meta">${escapeHtml(sousTitre)}</div>`;
}

function document(titre, corps) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
    <title>${escapeHtml(titre)}</title><style>${STYLES}</style></head>
    <body>${corps}
      <footer>Document généré par Tasalle le ${escapeHtml(
        new Date().toLocaleDateString('fr-FR')
      )} — tasalle.dz</footer>
    </body></html>`;
}

// ── Contrat de réservation (Annexe C) ─────────────────────────────────────

/**
 * Contrat d'une réservation confirmée.
 * `pro` porte le nom du propriétaire et son numéro CCP.
 */
export function buildContractHtml({ reservation, salle, pro, months, deposit, labels = {} }) {
  // Les énumérations viennent de la base en anglais : sans libellés fournis,
  // on retombe sur la valeur brute plutôt que d'afficher un vide.
  const libelle = (dict, cle) => labels[dict]?.[cle] ?? cle;
  const acompte = deposit ?? reservation.deposit_amount;
  const solde = (reservation.total_amount || 0) - (acompte || 0);

  const ligne = (libelle, valeur) =>
    `<tr><td>${escapeHtml(libelle)}</td><td>${escapeHtml(valeur)}</td></tr>`;

  const corps = `
    ${enTete('Contrat de réservation', `Référence ${reservation.reference}`)}

    <h2>Les parties</h2>
    <table class="infos">
      ${ligne('Salle', salle?.name)}
      ${ligne('Adresse', salle?.address || salle?.city)}
      ${ligne('Propriétaire', pro?.full_name)}
      ${ligne('Client', reservation.client_name)}
      ${ligne('Téléphone du client', displayPhone(reservation.client_phone))}
    </table>

    <h2>L'événement</h2>
    <table class="infos">
      ${ligne('Date', formatLongDate(reservation.event_date, months))}
      ${ligne('Type', libelle('events', reservation.event_type))}
      ${ligne('Invités attendus', `${reservation.guest_count}`)}
      ${ligne('Formule', reservation.formula?.name || '—')}
    </table>

    <h2>Montants</h2>
    <table class="infos">
      <tr><td>Total</td><td class="total">${escapeHtml(formatDA(reservation.total_amount))}</td></tr>
      ${acompte ? ligne('Acompte demandé', formatDA(acompte)) : ''}
      ${acompte ? ligne('Solde à régler', formatDA(solde)) : ''}
      ${acompte && pro?.ccp ? ligne('Compte CCP', pro.ccp) : ''}
      ${ligne('Acompte reçu', reservation.deposit_paid ? 'Oui' : 'Non')}
    </table>

    <h2>Conditions</h2>
    <ol class="clauses">
      <li>La salle est réservée pour la seule date indiquée ci-dessus. Aucune
          autre réservation ne peut y être confirmée le même jour.</li>
      <li>L'acompte est réglé hors application, par versement CCP ou BaridiMob,
          puis vérifié par le propriétaire.</li>
      <li>Le solde est dû au plus tard le jour de l'événement.</li>
      <li>Tant que la demande est en attente, le client peut l'annuler sans
          frais. Après confirmation, l'annulation relève de l'accord des parties.</li>
      <li>Tasalle met les parties en relation et n'est pas partie au contrat.</li>
    </ol>

    <div class="signature">
      ${
        reservation.signed_at
          ? `<div class="cachet">✓ Signé électroniquement par le propriétaire</div>
             <div class="meta" style="margin:4px 0 0">
               Le ${escapeHtml(new Date(reservation.signed_at).toLocaleString('fr-FR'))},
               par saisie d'un code confidentiel à 4 chiffres. Référence ${escapeHtml(
                 reservation.reference
               )}.
             </div>`
          : `<div>Réservation non encore signée par le propriétaire.</div>`
      }
    </div>`;

  return document(`Contrat ${reservation.reference}`, corps);
}

// ── Facture d'abonnement (§11.2) ──────────────────────────────────────────

/**
 * Facture d'un mois d'abonnement.
 *
 * L'abonnement se facture **par propriétaire**, pas par salle : le document
 * énumère donc les salles couvertes pour que le montant soit lisible sans
 * ambiguïté chez un propriétaire qui en gère plusieurs.
 */
export function buildInvoiceHtml({ invoice, pro, salles = [], labels = {} }) {
  const numero = invoice.reference || String(invoice.id || '').toUpperCase();
  const emise = invoice.issued_at ? new Date(invoice.issued_at) : null;

  const ligne = (cle, valeur) =>
    `<tr><td>${escapeHtml(cle)}</td><td>${escapeHtml(valeur)}</td></tr>`;

  const etat =
    labels.invoiceStatuses?.[invoice.status] ??
    (invoice.status === 'paid' ? 'Payée' : 'En attente');

  const couvertes = salles.length
    ? `<h2>Salles couvertes</h2>
       <table class="liste">
         <thead><tr><th>Salle</th><th>Ville</th></tr></thead>
         <tbody>
           ${salles
             .map(
               (s) => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.city)}</td></tr>`
             )
             .join('')}
         </tbody>
       </table>
       <div class="meta" style="margin-top:6px">
         L'abonnement couvre l'ensemble des salles du compte, quel qu'en soit
         le nombre.
       </div>`
    : '';

  const corps = `
    ${enTete('Facture', `N° ${numero}`)}

    <h2>Émetteur</h2>
    <table class="infos">
      ${ligne('Société', 'Tasalle')}
      ${ligne('Objet', "Abonnement à l'espace professionnel")}
    </table>

    <h2>Client</h2>
    <table class="infos">
      ${ligne('Nom', pro?.full_name)}
      ${pro?.phone ? ligne('Téléphone', displayPhone(pro.phone)) : ''}
      ${pro?.ccp ? ligne('Compte CCP', pro.ccp) : ''}
    </table>

    <h2>Détail</h2>
    <table class="liste">
      <thead><tr><th>Période</th><th>Description</th><th style="text-align:right">Montant</th></tr></thead>
      <tbody>
        <tr>
          <td>${escapeHtml(invoice.period)}</td>
          <td>${escapeHtml(invoice.description)}</td>
          <td style="text-align:right">${escapeHtml(formatDA(invoice.amount))}</td>
        </tr>
      </tbody>
    </table>

    <table class="infos" style="margin-top:14px">
      <tr><td>Total</td><td class="total">${escapeHtml(formatDA(invoice.amount))}</td></tr>
      ${ligne('Statut', etat)}
      ${emise ? ligne("Date d'émission", emise.toLocaleDateString('fr-FR')) : ''}
    </table>

    ${couvertes}

    <div class="signature">
      ${
        invoice.amount === 0
          ? "Période d'essai : aucun montant n'est dû."
          : 'Règlement par versement CCP ou BaridiMob, hors application.'
      }
    </div>`;

  return document(`Facture ${numero}`, corps);
}

// ── Planning mensuel (§5.3) ───────────────────────────────────────────────

const CLASSE_ETAT = { booked: 'reserve', held: 'attente', blocked: 'bloque' };

export function buildPlanningHtml({
  salle, year, month, availability = {}, byDay = {}, months, weekdays, labels = {},
}) {
  const libelle = (dict, cle) => labels[dict]?.[cle] ?? cle;
  const cells = monthGrid(year, month);

  const semaines = [];
  for (let i = 0; i < cells.length; i += 7) semaines.push(cells.slice(i, i + 7));

  const grille = `
    <table class="grille">
      <thead><tr>${weekdays.map((d) => `<th>${escapeHtml(d)}</th>`).join('')}</tr></thead>
      <tbody>
        ${semaines
          .map(
            (semaine) => `<tr>${semaine
              .map((cell) => {
                if (!cell.inMonth) return `<td class="hors">${cell.day}</td>`;
                const etat = availability[cell.iso];
                const resa = byDay[cell.iso];
                const classe = CLASSE_ETAT[etat] || '';
                const nom = resa ? `<br><span style="font-size:8px">${escapeHtml(
                  (resa.client_name || '').split(' ')[0]
                )}</span>` : '';
                return `<td class="${classe}">${cell.day}${nom}</td>`;
              })
              .join('')}</tr>`
          )
          .join('')}
      </tbody>
    </table>`;

  const reservations = Object.values(byDay).sort((a, b) =>
    a.event_date < b.event_date ? -1 : 1
  );

  const liste = reservations.length
    ? `<h2>Réservations du mois</h2>
       <table class="liste">
         <thead><tr><th>Date</th><th>Client</th><th>Type</th><th>Invités</th><th>Montant</th><th>Statut</th></tr></thead>
         <tbody>
           ${reservations
             .map(
               (r) => `<tr>
                 <td>${escapeHtml(formatLongDate(r.event_date, months))}</td>
                 <td>${escapeHtml(r.client_name)}</td>
                 <td>${escapeHtml(libelle('events', r.event_type))}</td>
                 <td>${escapeHtml(String(r.guest_count ?? ''))}</td>
                 <td>${escapeHtml(formatDA(r.total_amount))}</td>
                 <td>${escapeHtml(libelle('statuses', r.status))}</td>
               </tr>`
             )
             .join('')}
         </tbody>
       </table>`
    : '<h2>Réservations du mois</h2><p class="meta">Aucune réservation ce mois-ci.</p>';

  const corps = `
    ${enTete(`Planning — ${months[month]} ${year}`, salle?.name || '')}
    ${grille}
    <div class="meta" style="margin-top:8px">
      Vert : confirmée · Or : en attente · Gris : bloqué
    </div>
    ${liste}`;

  return document(`Planning ${months[month]} ${year}`, corps);
}
