import { useState, useCallback } from 'react';
import { supabase } from '../../supabase';

export default function useProInscription() {
  const [form,    setFormState] = useState({ nom:'', prenom:'', restaurant:'', adresse:'', ville:'', telephone:'' });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState(false);

  const set = useCallback((key) => (val) => setFormState(prev => ({ ...prev, [key]: val })), []);

  const soumettre = useCallback(async () => {
    if (!form.nom || !form.prenom || !form.restaurant || !form.telephone) {
      setError('Nom, prénom, restaurant et téléphone sont obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Vous devez être connecté pour soumettre une demande.'); return; }
      const { error: err } = await supabase.from('pro_requests').insert({
        user_id:         session.user.id,
        first_name:      form.prenom,
        last_name:       form.nom,
        restaurant_name: form.restaurant,
        address:         form.adresse,
        city:            form.ville,
        phone:           form.telephone,
        status:          'pending',
      });
      if (err) { setError(err.message); return; }
      const { error: fnErr } = await supabase.functions.invoke('pro-inscription', {
        body: { ...form, email: session.user.email },
      });
      if (fnErr) { setError("Une erreur est survenue lors de l'activation. Réessayez."); return; }
      supabase.auth.refreshSession().catch(() => {});
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }, [form]);

  return { form, loading, error, success, set, soumettre };
}
