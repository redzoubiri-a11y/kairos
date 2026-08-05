import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../data';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      setUser,
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
    }),
    [user, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
