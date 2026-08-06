import {
  escapeHtml,
  buildContractHtml,
  buildPlanningHtml,
  buildInvoiceHtml,
} from './pdfTemplates';
import fr from '../i18n/fr';

const months = fr.months;
const weekdays = fr.weekdays;

/**
 * Ramène toutes les variantes d'espace à l'espace ordinaire.
 * Les montants sont formatés avec une espace fine insécable (U+202F), la
 * convention typographique française pour les milliers : les assertions
 * portent sur le montant, pas sur le codet du séparateur.
 */
const normaliser = (s) => s.replace(/[\s  ]/g, ' ');

const salle = {
  id: 'salle-001',
  name: 'Salle El Widad',
  address: 'Rue des Frères Bouadou, Alger',
  city: 'Alger',
};

const pro = { full_name: 'Karim Belkacem', ccp: '0021458796 clé 33' };

const reservation = {
  id: 'resa-1',
  reference: 'TAS-2026-0001',
  client_name: 'Amina Cherif',
  client_phone: '+213661234567',
  event_date: '2026-08-21',
  event_type: 'mariage',
  guest_count: 320,
  formula: { name: 'Tout inclus' },
  total_amount: 74900,
  deposit_amount: 30000,
  deposit_paid: true,
  status: 'confirmed',
  signed_at: '2026-08-01T10:12:00Z',
};

describe('échappement HTML', () => {
  it('neutralise les caractères de balisage', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('échappe guillemets et esperluettes', () => {
    expect(escapeHtml('Traiteur "Delice" & Fils')).toBe(
      'Traiteur &quot;Delice&quot; &amp; Fils'
    );
  });

  it('rend une chaîne vide pour null ou undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('laisse les accents intacts', () => {
    expect(escapeHtml('Fiançailles à Béjaïa')).toBe('Fiançailles à Béjaïa');
  });
});

describe('contrat de réservation', () => {
  const html = buildContractHtml({ reservation, salle, pro, months });

  it('porte la référence et les deux parties', () => {
    expect(html).toContain('TAS-2026-0001');
    expect(html).toContain('Salle El Widad');
    expect(html).toContain('Karim Belkacem');
    expect(html).toContain('Amina Cherif');
  });

  it('affiche le téléphone au format algérien lisible', () => {
    expect(html).toContain('0661 23 45 67');
  });

  it('détaille les montants, acompte et solde', () => {
    const texte = normaliser(html);
    expect(texte).toContain('74 900 DA'); // total
    expect(texte).toContain('30 000 DA'); // acompte
    expect(texte).toContain('44 900 DA'); // solde = total - acompte
  });

  it('mentionne le compte CCP quand un acompte est demandé', () => {
    expect(html).toContain('0021458796 clé 33');
  });

  it('atteste la signature électronique par PIN', () => {
    expect(html).toContain('Signé électroniquement');
    expect(html).toContain('code confidentiel à 4 chiffres');
  });

  it('signale une réservation non signée au lieu de l’affirmer', () => {
    const brouillon = buildContractHtml({
      reservation: { ...reservation, signed_at: null },
      salle,
      pro,
      months,
    });
    expect(brouillon).toContain('non encore signée');
    expect(brouillon).not.toContain('Signé électroniquement');
  });

  it('omet acompte et CCP quand aucun acompte n’est demandé', () => {
    const sansAcompte = buildContractHtml({
      reservation: { ...reservation, deposit_amount: null },
      salle,
      pro,
      months,
    });
    expect(sansAcompte).not.toContain('Acompte demandé');
    expect(sansAcompte).not.toContain('0021458796');
  });

  it('neutralise le balisage présent dans un nom de client', () => {
    const piege = buildContractHtml({
      reservation: { ...reservation, client_name: '<img src=x onerror=alert(1)>' },
      salle,
      pro,
      months,
    });
    expect(piege).not.toContain('<img src=x');
    expect(piege).toContain('&lt;img src=x');
  });

  it('produit un document HTML complet', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('</html>');
  });
});

describe('planning mensuel', () => {
  const availability = {
    '2026-08-13': 'held',
    '2026-08-21': 'booked',
    '2026-08-14': 'blocked',
  };
  const byDay = {
    '2026-08-21': {
      event_date: '2026-08-21',
      client_name: 'Amina Cherif',
      event_type: 'mariage',
      guest_count: 320,
      total_amount: 74900,
      status: 'confirmed',
    },
  };

  const html = buildPlanningHtml({
    salle,
    year: 2026,
    month: 7, // août
    availability,
    byDay,
    months,
    weekdays,
  });

  it('titre le mois et nomme la salle', () => {
    expect(html).toContain('Août 2026');
    expect(html).toContain('Salle El Widad');
  });

  it('rend une grille de 7 colonnes avec les jours de la semaine', () => {
    weekdays.forEach((d) => expect(html).toContain(`<th>${d}</th>`));
  });

  it('colore chaque état de jour', () => {
    expect(html).toContain('class="reserve"');
    expect(html).toContain('class="attente"');
    expect(html).toContain('class="bloque"');
  });

  it('récapitule les réservations du mois', () => {
    expect(html).toContain('Amina Cherif');
    expect(normaliser(html)).toContain('74 900 DA');
  });

  it('le dit quand le mois est vide plutôt que d’afficher un tableau creux', () => {
    const vide = buildPlanningHtml({
      salle,
      year: 2026,
      month: 7,
      availability: {},
      byDay: {},
      months,
      weekdays,
    });
    expect(vide).toContain('Aucune réservation ce mois-ci');
  });

  it('grise les jours débordant sur les mois voisins', () => {
    expect(html).toContain('class="hors"');
  });
});

describe('libellés traduits', () => {
  const labels = {
    events: { mariage: 'Mariage', fiancailles: 'Fiançailles' },
    statuses: { confirmed: 'Confirmée', pending: 'En attente' },
  };

  it('traduit le type d’événement dans le contrat', () => {
    const html = buildContractHtml({ reservation, salle, pro, months, labels });
    expect(html).toContain('Mariage');
    expect(html).not.toContain('<td>mariage</td>');
  });

  it('traduit type et statut dans le planning', () => {
    const html = buildPlanningHtml({
      salle, year: 2026, month: 7,
      availability: { '2026-08-21': 'booked' },
      byDay: { '2026-08-21': { event_date: '2026-08-21', client_name: 'Amina', event_type: 'mariage', guest_count: 320, total_amount: 74900, status: 'confirmed' } },
      months, weekdays, labels,
    });
    expect(html).toContain('<td>Mariage</td>');
    expect(html).toContain('<td>Confirmée</td>');
  });

  it('retombe sur la valeur brute plutôt que d’afficher un vide', () => {
    const html = buildContractHtml({ reservation, salle, pro, months });
    expect(html).toContain('mariage');
  });
});

describe('facture d’abonnement', () => {
  const invoice = {
    id: 'inv-001',
    pro_id: 'user-pro-001',
    period: 'Septembre 2026',
    description: 'Abonnement mensuel',
    amount: 500,
    status: 'paid',
    issued_at: '2026-09-01T09:00:00Z',
  };
  const salles = [
    { id: 'salle-001', name: 'Salle El Widad', city: 'Alger' },
    { id: 'salle-002', name: 'Espace Andalous', city: 'Alger' },
  ];
  const labels = { invoiceStatuses: { paid: 'Payée', pending: 'En attente' } };

  const html = buildInvoiceHtml({
    invoice,
    pro: { full_name: 'Karim Belkacem', phone: '+213555100001', ccp: '0021458796 clé 33' },
    salles,
    labels,
  });

  it('porte la marque en en-tête', () => {
    // Garde-fou du renommage : la marque vit aussi dans les documents.
    expect(html).toContain('TASALLE');
    expect(html).toContain('class="sigle"');
  });

  it('porte le numéro de facture', () => {
    expect(html).toContain('INV-001');
  });

  it('affiche la période, la description et le montant', () => {
    const texte = normaliser(html);
    expect(texte).toContain('Septembre 2026');
    expect(texte).toContain('Abonnement mensuel');
    expect(texte).toContain('500 DA');
  });

  it('identifie le client et son CCP', () => {
    expect(html).toContain('Karim Belkacem');
    expect(html).toContain('0021458796 clé 33');
  });

  it('traduit le statut', () => {
    expect(html).toContain('Payée');
    expect(html).not.toContain('>paid<');
  });

  /**
   * Le point de la facturation par propriétaire : le document doit montrer
   * que les 500 DA couvrent toutes les salles, pas une seule.
   */
  it('énumère les salles couvertes', () => {
    expect(html).toContain('Salle El Widad');
    expect(html).toContain('Espace Andalous');
    expect(html).toContain('quel qu');
  });

  it('omet la section des salles quand la liste est vide', () => {
    const seul = buildInvoiceHtml({ invoice, pro: { full_name: 'X' } });
    expect(seul).not.toContain('Salles couvertes');
  });

  it('signale qu’une période d’essai ne doit rien', () => {
    const essai = buildInvoiceHtml({
      invoice: { ...invoice, amount: 0, period: 'Essai gratuit' },
      pro: { full_name: 'Karim Belkacem' },
    });
    expect(essai).toContain('aucun montant n');
    expect(essai).not.toContain('Règlement par versement');
  });

  it('échappe les valeurs venant de l’utilisateur', () => {
    const piege = buildInvoiceHtml({
      invoice: { ...invoice, description: '<script>alert(1)</script>' },
      pro: { full_name: 'Karim <b>Belkacem</b>' },
    });
    expect(piege).not.toContain('<script>');
    expect(piege).toContain('&lt;script&gt;');
    expect(piege).toContain('Karim &lt;b&gt;Belkacem&lt;/b&gt;');
  });

  it('reste lisible sans libellés traduits', () => {
    const brut = buildInvoiceHtml({ invoice, pro: { full_name: 'Karim' } });
    expect(brut).toContain('Payée');
  });
});
