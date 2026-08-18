import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../data';
import { setupPush } from '../services/push';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // §13 — un pro possède une salle OU un traiteur OU un halouadji (au MVP,
  // pas les deux) ; `ProTabs` (App.js) est spécifique aux salles, donc il
  // faut savoir laquelle avant de choisir quel espace pro afficher.
  const [businessType, setBusinessType] = useState(null);
  const [businessTypeLoading, setBusinessTypeLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const session = await api.getSession();
      setUser(session);
      return session;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (user?.role !== ROLES.PRO) {
      setBusinessType(null);
      return;
    }
    let cancelled = false;
    setBusinessTypeLoading(true);
    (async () => {
      const [salles, traiteurs, halouadjis] = await Promise.all([
        api.proListSalles().catch(() => []),
        api.proListPartners('traiteur').catch(() => []),
        api.proListPartners('halouadji').catch(() => []),
      ]);
      if (cancelled) return;
      if (salles.length) setBusinessType('salle');
      else if (traiteurs.length) setBusinessType('traiteur');
      else if (halouadjis.length) setBusinessType('halouadji');
      else setBusinessType('salle'); // pas encore de fiche : sans objet ici, ProTabs gère déjà ce cas.
      setBusinessTypeLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role, user?.id]);

  // L'appareil s'enregistre dès qu'un compte est actif. L'échec est sans
  // conséquence : la fonction renonce d'elle-même sur web, en simulateur ou
  // sans projet EAS.
  useEffect(() => {
    if (!user) return;
    setupPush().catch(() => {});
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      setUser,
      businessType,
      businessTypeLoading,
      isPro: user?.role === ROLES.PRO,
      isClient: user?.role === ROLES.CLIENT,
      /** Le compte existe mais le parcours d'inscription n'est pas terminé. */
      needsProfile: Boolean(user && (!user.role || !user.full_name)),
      async login(phone, code) {
        const { user: u } = await api.verifyOtp(phone, code);
        setUser(u);
        return u;
      },
      async logout() {
        await api.signOut();
        setUser(null);
      },
      async updateProfile(patch) {
        const u = await api.updateProfile(patch);
        setUser(u);
        return u;
      },
      async registerSalle(payload) {
        const { user: u } = await api.registerSalle(payload);
        setUser(u);
        return u;
      },
      /** §13 — même geste que `registerSalle`, pour un traiteur ou un halouadji. */
      async registerPartner(type, payload) {
        const register = type === 'traiteur' ? api.registerTraiteur : api.registerHalouadji;
        const { user: u } = await register(payload);
        setUser(u);
        return u;
      },
    }),
    [user, loading, refresh, businessType, businessTypeLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
