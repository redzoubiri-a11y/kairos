import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase.js';

/** Session Supabase de l'artisan connecté — un seul point d'accès à l'auth. */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [enChargement, setEnChargement] = useState(true);

  useEffect(() => {
    let annule = false;

    supabase.auth.getSession().then(({ data }) => {
      if (annule) return;
      setSession(data.session);
      setEnChargement(false);
    });

    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, nouvelleSession) => {
      if (annule) return;
      setSession(nouvelleSession);
    });

    return () => {
      annule = true;
      abonnement.subscription.unsubscribe();
    };
  }, []);

  const inscrire = (email, motDePasse) => supabase.auth.signUp({ email, password: motDePasse });
  const connecter = (email, motDePasse) => supabase.auth.signInWithPassword({ email, password: motDePasse });
  const deconnecter = () => supabase.auth.signOut();

  return {
    session,
    userId: session?.user?.id ?? null,
    enChargement,
    estConnecte: Boolean(session),
    inscrire,
    connecter,
    deconnecter,
  };
}
