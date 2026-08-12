import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';

export const CUISINE_OPTIONS = [
  { id: 'algerien',     label: 'Algérien' },
  { id: 'mediterraneen',label: 'Méditerranéen' },
  { id: 'fast_casual',  label: 'Fast-food' },
  { id: 'italien',      label: 'Italien' },
  { id: 'japonais',     label: 'Japonais' },
  { id: 'turc',         label: 'Turc' },
  { id: 'libanais',     label: 'Libanais' },
  { id: 'francais',     label: 'Français' },
  { id: 'autre',        label: 'Autre' },
];

const STEP_COUNT = 3;

export default function useProInscription() {
  const [form,      setFormState] = useState({ nom:'', prenom:'', telephone:'', email:'', restaurant:'', adresse:'', ville:'', cuisine_type:'' });
  const [step,      setStep]      = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [approved,  setApproved]  = useState(false);
  const [rejected,  setRejected]  = useState(false);
  const [requestId, setRequestId] = useState(null);
  const channelRef = useRef(null);
  const submittingRef = useRef(false);

  const set = useCallback((key) => (val) => { setError(''); setFormState(prev => ({ ...prev, [key]: val })); }, []);

  const nextStep = useCallback(() => {
    if (step === 0 && (!form.restaurant || !form.cuisine_type || !form.adresse || !form.telephone)) {
      setError('Nom du restaurant, cuisine, adresse et téléphone sont obligatoires');
      return;
    }
    if (step === 1 && (!form.prenom || !form.nom || !form.email)) {
      setError('Prénom, nom et email sont obligatoires');
      return;
    }
    setError('');
    setStep(s => Math.min(s + 1, STEP_COUNT - 1));
  }, [step, form]);

  const prevStep = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

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
    if (submittingRef.current) return;
    if (!form.nom || !form.prenom || !form.restaurant || !form.telephone || !form.email) {
      setError('Nom, prénom, téléphone, email et restaurant sont obligatoires');
      return;
    }
    submittingRef.current = true;
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
        cuisine_type:    form.cuisine_type,
        status:          'pending',
      }).select('id').single();
      if (err) { setError(err.message); return; }
      setRequestId(inserted.id);
      setSuccess(true);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }, [form]);

  return { form, step, loading, error, success, approved, rejected, set, nextStep, prevStep, soumettre };
}
