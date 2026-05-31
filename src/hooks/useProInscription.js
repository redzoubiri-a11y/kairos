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
      console.log('[Supabase error]', err);
      if (err) { setError(err.message); return; }
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer re_4r96SqBU_Bx1ad4EV3s93NvieWfMMEs3a',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'KAIROS <onboarding@resend.dev>',
          to: ['red.zoubiri@gmail.com'],
          subject: `Nouvelle demande PRO — ${form.restaurant}`,
          html: `
            <h2>Nouvelle demande d'accès PRO</h2>
            <table cellpadding="8" style="border-collapse:collapse">
              <tr><td><b>Prénom :</b></td><td>${form.prenom}</td></tr>
              <tr><td><b>Nom :</b></td><td>${form.nom}</td></tr>
              <tr><td><b>Restaurant :</b></td><td>${form.restaurant}</td></tr>
              <tr><td><b>Téléphone :</b></td><td>${form.telephone}</td></tr>
              <tr><td><b>Adresse :</b></td><td>${form.adresse || '—'}</td></tr>
              <tr><td><b>Ville :</b></td><td>${form.ville || '—'}</td></tr>
              <tr><td><b>Email :</b></td><td>${session.user.email}</td></tr>
              <tr><td><b>Date :</b></td><td>${new Date().toLocaleString('fr-FR')}</td></tr>
            </table>
          `,
        }),
      });
      const resendData = await resendRes.json();
      console.log('[Resend]', JSON.stringify(resendData));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }, [form]);

  return { form, loading, error, success, set, soumettre };
}
