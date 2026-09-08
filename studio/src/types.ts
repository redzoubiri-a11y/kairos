/**
 * Formes partagées du studio.
 *
 * ⚠️ Ces types sont une LECTURE INFÉRÉE de la spec : KAIROS_STUDIO_SPEC.md n'a
 * pas pu être lu au moment de l'écriture (il n'est ni dans ce dépôt ni dans
 * fz-consulting). Les sections 3.1 et 3.3 sont donc reconstituées d'après le
 * besoin réel. À confronter à la spec avant de considérer le contrat gelé.
 */

export type EntityKind = 'restaurant';

/** Portée d'un accord de communication, telle que stockée côté application. */
export type MarketingScope = 'name' | 'photos' | 'logo' | 'promotions' | 'reviews';

export interface MarketingConsent {
  granted: boolean;
  scopes: MarketingScope[];
  grantedAt: string | null;
}

export interface EntityPhoto {
  url: string;
  /** 1 = photo de couverture, celle que l'app met en tête. */
  position: number;
}

export interface EntityPromotion {
  title: string;
  description: string | null;
  type: string;
  percentValue: number | null;
  fixedValue: number | null;
  startDate: string | null;
  endDate: string | null;
}

export interface EntityReview {
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Résumé : ce que rend une recherche, sans le détail coûteux. */
export interface AppEntitySummary {
  externalId: string;
  kind: EntityKind;
  name: string;
  slug: string | null;
  city: string | null;
  neighbourhood: string | null;
  photoCount: number;
  consentGranted: boolean;
}

/**
 * Fiche complète, normalisée.
 *
 * Volontairement indépendante du schéma de l'application source : le générateur
 * et le gabarit visuel ne doivent rien savoir des colonnes de Mida, sinon
 * brancher une deuxième application demandera de les réécrire.
 */
export interface AppEntity extends AppEntitySummary {
  description: string | null;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  averageTicket: number | null;
  capacity: number | null;
  /** Faits binaires vérifiés en base : 'terrasse', 'parking', 'click_and_collect'. */
  amenities: string[];
  photos: EntityPhoto[];
  promotions: EntityPromotion[];
  reviews: EntityReview[];
  consent: MarketingConsent;
  fetchedAt: string;
}
