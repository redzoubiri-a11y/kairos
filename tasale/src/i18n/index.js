import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './fr';
import ar from './ar';

const STORAGE_KEY = 'tasale.lang';
const DICTS = { fr, ar };

const I18nContext = createContext(null);

/** Résout "a.b.c" dans le dictionnaire, avec repli sur le français. */
function resolve(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), dict);
}

/** Remplace les jetons {{x}} par les valeurs fournies. */
function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'fr' || saved === 'ar') setLang(saved);
      })
      .finally(() => setReady(true));
  }, []);

  const changeLang = useCallback((next) => {
    setLang(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => {
    const isRTL = lang === 'ar';
    const dict = DICTS[lang] || fr;

    // §1.4 — RTL natif. On ne force pas I18nManager (qui exige un redémarrage
    // natif) : la direction est appliquée au niveau des styles via `dir`,
    // ce qui fonctionne aussi bien sur natif que sur le web.
    const t = (path, vars) => {
      const found = resolve(dict, path) ?? resolve(fr, path);
      if (typeof found !== 'string') return path;
      return interpolate(found, vars);
    };

    return {
      lang,
      setLang: changeLang,
      isRTL,
      t,
      /** Tableaux (mois, jours) exposés directement. */
      list: (path) => resolve(dict, path) ?? resolve(fr, path) ?? [],
      /** Direction de rangée à appliquer aux conteneurs horizontaux. */
      dir: isRTL ? 'row-reverse' : 'row',
      /** Alignement de texte cohérent avec la langue. */
      align: isRTL ? 'right' : 'left',
      /** `writingDirection` pour les blocs de texte mixtes. */
      writing: isRTL ? 'rtl' : 'ltr',
      forcedRTL: I18nManager.isRTL,
    };
  }, [lang, changeLang]);

  if (!ready) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans un I18nProvider');
  return ctx;
}
