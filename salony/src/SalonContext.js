import React, { createContext, useContext } from 'react';

// Salon actif du compte pro. Passer par un contexte (plutôt que par les params
// de navigation) évite les avertissements React Navigation sur les valeurs non
// sérialisables, et permet de changer de salon depuis n'importe quel écran.
const SalonContext = createContext({
  salonId: null,
  salons: [],
  choisirSalon: () => {},
  rechargerSalons: () => {},
});

export function SalonProvider({ value, children }) {
  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  return useContext(SalonContext);
}

export default SalonContext;
