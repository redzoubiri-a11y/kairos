import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';

export default function useProInscription() {
  const [form,      setFormState] = useState({ nom:'', prenom:'', telephone:'', email:'', restaurant:'', adresse:'', ville:'' });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [approved,  setApproved]  = useState(false);
  const [rejected,  setRejected]  = useState(false);
  const [requestId, setRequestId] = useState(null);
  const channelRef = useRef(null);

  const set = useCallback((key) => (val) => setFormState(prev => ({ ...prev, [key]: val })), []);

  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel('pro_request_' + requestId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pro_requests',
        filter: `id=eq.${requestId}`,
      }, async (payload) => {
        if (payload.new?.status === 'approved') {
          await supabase.auth.refreshSession();
          setApproved(true);
        } else if (payload.new?.status === 'rejected') {
          setRejected(true);
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [requestId]);

  const soumettre = useCallback(async () => {
    if (!form.nom || !form.prenom || !form.restaurant || !form.telephone || !form.email) {
      setError('Nom, prénom, téléphone, email et restaurant sont obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Vous devez être connecté pour soumettre une demande.'); return; }
      const { data: inserted, error: err } = await supabase.from('pro_requests').insert({
        user_id:         session.user.id,
        first_name:      form.prenom,
        last_name:       form.nom,
        restaurant_name: form.restaurant,
        address:         form.adresse,
        city:            form.ville,
        phone:           form.telephone,
        email:           form.email,
        status:          'pending',
      }).select('id').single();
      if (err) { setError(err.message); return; }
      setRequestId(inserted.id);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }, [form]);

  return { form, loading, error, success, approved, rejected, set, soumettre };
}
