import { describe, expect, it } from 'vitest';

import {
  DOCUMENT_LABELS,
  MISSION_STATUS_LABELS,
  ROLE_LABELS,
  TRIP_STATUS_LABELS,
  TRUCK_TYPE_LABELS,
  VERIFICATION_LABELS,
  formatBytes,
  formatDate,
  formatDzd,
  formatNumber,
  isImage,
  statusTone,
} from './utils';

describe('formatage', () => {
  // Une date absente ou invalide ne doit jamais afficher « Invalid Date »
  // dans un tableau de moderation.
  it('remplace une valeur absente ou invalide par un tiret', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('pas-une-date')).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatDzd(null)).toBe('—');
  });

  it('formate une date ISO au format francais', () => {
    expect(formatDate('2026-08-09T10:30:00.000Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('formate un montant en dinars', () => {
    expect(formatDzd(45000)).toMatch(/45\s?000 DZD/);
  });

  it('formate zero comme une valeur, pas comme une absence', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatDzd(0)).toMatch(/^0 DZD$/);
  });

  it('choisit l unite de taille adaptee', () => {
    expect(formatBytes(512)).toBe('512 o');
    expect(formatBytes(2048)).toBe('2.0 Ko');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 Mo');
    expect(formatBytes(0)).toBe('—');
    expect(formatBytes(undefined)).toBe('—');
  });
});

describe('libelles', () => {
  // Un statut renvoye par l'API sans libelle correspondant afficherait une
  // constante brute a l'ecran : ces jeux doivent rester alignes sur les enums.
  it('couvre tous les statuts de verification du backend', () => {
    expect(Object.keys(VERIFICATION_LABELS).sort()).toEqual(
      ['PENDING', 'REJECTED', 'VERIFIED'].sort()
    );
  });

  it('couvre tous les statuts de trajet', () => {
    expect(Object.keys(TRIP_STATUS_LABELS).sort()).toEqual(
      ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].sort()
    );
  });

  it('couvre tous les statuts de mission', () => {
    expect(Object.keys(MISSION_STATUS_LABELS).sort()).toEqual(
      ['PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].sort()
    );
  });

  it('couvre tous les roles et types de documents', () => {
    expect(Object.keys(ROLE_LABELS).sort()).toEqual(['ADMIN', 'CLIENT', 'TRANSPORTER'].sort());
    expect(Object.keys(DOCUMENT_LABELS).sort()).toEqual(
      ['RC', 'PATENTE', 'CARTE_GRISE', 'ID_CARD'].sort()
    );
  });

  it('couvre tous les types de camion', () => {
    expect(Object.keys(TRUCK_TYPE_LABELS).sort()).toEqual(
      ['FOURGON', 'PLATEAU', 'BENNE', 'FRIGO', 'CITERNE', 'PORTE_CHAR', 'SEMI_REMORQUE'].sort()
    );
  });
});

describe('presentation', () => {
  it('distingue les statuts favorables des statuts defavorables', () => {
    expect(statusTone('VERIFIED')).not.toBe(statusTone('REJECTED'));
    expect(statusTone('COMPLETED')).not.toBe(statusTone('CANCELLED'));
  });

  it('reste defini pour un statut inconnu', () => {
    expect(statusTone('STATUT_INEXISTANT')).toBeDefined();
  });

  it('ne propose un apercu inline que pour les images', () => {
    expect(isImage('image/png')).toBe(true);
    expect(isImage('image/jpeg')).toBe(true);
    expect(isImage('application/pdf')).toBe(false);
    expect(isImage(undefined)).toBe(false);
  });
});
