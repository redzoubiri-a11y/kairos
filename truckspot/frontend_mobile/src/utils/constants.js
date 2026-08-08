export const TRUCK_TYPES = [
  { value: 'FOURGON', label: 'Fourgon', icon: 'van-utility' },
  { value: 'PLATEAU', label: 'Plateau', icon: 'truck-flatbed' },
  { value: 'BENNE', label: 'Benne', icon: 'dump-truck' },
  { value: 'FRIGO', label: 'Frigorifique', icon: 'snowflake' },
  { value: 'CITERNE', label: 'Citerne', icon: 'tanker-truck' },
  { value: 'PORTE_CHAR', label: 'Porte-char', icon: 'truck-trailer' },
  { value: 'SEMI_REMORQUE', label: 'Semi-remorque', icon: 'truck' },
];

export const TRUCK_TYPE_LABELS = Object.fromEntries(TRUCK_TYPES.map((t) => [t.value, t.label]));

export const GOODS_TYPES = [
  'Palettes',
  'Colis',
  'Electromenager',
  'Materiaux de construction',
  'Produits frais',
  'Mobilier',
  'Vehicules',
  'Cereales',
  'Autre',
];

export const ALGERIAN_CITIES = [
  { name: 'Alger', latitude: 36.7538, longitude: 3.0588 },
  { name: 'Oran', latitude: 35.6971, longitude: -0.6308 },
  { name: 'Constantine', latitude: 36.365, longitude: 6.6147 },
  { name: 'Annaba', latitude: 36.9, longitude: 7.7667 },
  { name: 'Blida', latitude: 36.4703, longitude: 2.8277 },
  { name: 'Setif', latitude: 36.1898, longitude: 5.4108 },
  { name: 'Batna', latitude: 35.5559, longitude: 6.1741 },
  { name: 'Bejaia', latitude: 36.7509, longitude: 5.0567 },
  { name: 'Tlemcen', latitude: 34.8828, longitude: -1.315 },
  { name: 'Ouargla', latitude: 31.9497, longitude: 5.3253 },
  { name: 'Ghardaia', latitude: 32.4911, longitude: 3.6736 },
  { name: 'Tizi Ouzou', latitude: 36.7169, longitude: 4.0497 },
];

export const DOCUMENT_TYPES = [
  { value: 'RC', label: 'Registre de commerce' },
  { value: 'PATENTE', label: 'Patente' },
  { value: 'CARTE_GRISE', label: 'Carte grise' },
  { value: 'ID_CARD', label: "Piece d'identite" },
];

export const DEFAULT_REGION = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};
