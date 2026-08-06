import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './fr';
import ar from './ar';

const TRADUCTIONS = { fr, ar };
const CLE_STOCKAGE = '@salony/langue';

export const LANGUES = [
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
];

// Résout "reglages.titre" dans l'objet de traduction, avec repli sur le
// français puis sur la clé elle-même : un libellé manquant ne doit jamais
// faire planter un écran ni afficher du vide.
function resoudre(langue, cle) {
  const chemin = cle.split('.');
  for (const source of [TRADUCTIONS[langue], TRADUCTIONS.fr]) {
    let valeur = source;
    for (const segment of chemin) {
      valeur = valeur?.[segment];
      if (valeur === undefined) break;
    }
    if (typeof valeur === 'string') return valeur;
  }
  return cle;
}

// Interpolation simple : t('recherche.distance', { n: 3 }) -> "à 3 km"
function interpoler(texte, params) {
  if (!params) return texte;
  return texte.replace(/\{\{(\w+)\}\}/g, (_, nom) =>
    params[nom] !== undefined ? String(params[nom]) : `{{${nom}}}`
  );
}

const I18nContext = createContext({
  langue: 'fr',
  t: (cle) => cle,
  changerLangue: () => {},
  estRTL: false,
  locale: 'fr-FR',
});

export function I18nProvider({ children }) {
  const [langue, setLangue] = useState('fr');
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      const enregistree = await AsyncStorage.getItem(CLE_STOCKAGE);
      if (enregistree && TRADUCTIONS[enregistree]) setLangue(enregistree);
      setPret(true);
    })();
  }, []);

  const t = useCallback(
    (cle, params) => interpoler(resoudre(langue, cle), params),
    [langue]
  );

  // Retourne true si un redémarrage est nécessaire (bascule LTR <-> RTL).
  // React Native ne peut pas inverser la mise en page à chaud : forceRTL ne
  // prend effet qu'au prochain lancement de l'application.
  const changerLangue = useCallback(async (code) => {
    if (!TRADUCTIONS[code]) return false;

    await AsyncStorage.setItem(CLE_STOCKAGE, code);
    setLangue(code);

    const rtlVoulu = LANGUES.find((l) => l.code === code)?.rtl ?? false;
    if (I18nManager.isRTL !== rtlVoulu) {
      I18nManager.allowRTL(rtlVoulu);
      I18nManager.forceRTL(rtlVoulu);
      return true;
    }
    return false;
  }, []);

  const estRTL = LANGUES.find((l) => l.code === langue)?.rtl ?? false;
  const locale = langue === 'ar' ? 'ar-DZ' : 'fr-FR';

  if (!pret) return null;

  return (
    <I18nContext.Provider value={{ langue, t, changerLangue, estRTL, locale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// Raccourci : const t = useT();
export function useT() {
  return useI18n().t;
}
