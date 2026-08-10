import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export const CUISINE_OPTIONS = [
  { value: 'algerien',     label: 'Algérien' },
  { value: 'mediterraneen',label: 'Méditerranéen' },
  { value: 'italien',      label: 'Italien' },
  { value: 'asiatique',    label: 'Asiatique' },
  { value: 'turc',         label: 'Turc' },
  { value: 'libanais',     label: 'Libanais' },
  { value: 'francais',     label: 'Français' },
  { value: 'fast_casual',  label: 'Fast Casual' },
  { value: 'autre',        label: 'Autre' },
];

export const OCCASION_OPTIONS = [
  { value: 'famille',  label: 'Famille' },
  { value: 'couple',   label: 'Couple' },
  { value: 'business', label: 'Business' },
  { value: 'rapide',   label: 'Rapide' },
];

const DEFAULTS = {
  name: '', description: '', phone: '', address: '', quartier: '', city: '',
  cuisine_type: 'autre', occasion_tags: [], capacity: '', avg_ticket: '',
  has_kids_menu: false, has_kids_chairs: false, click_collect_enabled: false,
};

export default function useProInfo() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [form,    setForm]    = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError,    setAiError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: ownerRows } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .limit(1);
      const owner = ownerRows?.[0] ?? null;
      if (!owner?.restaurant_id) return;
      setRestaurantId(owner.restaurant_id);
      const { data: r } = await supabase
        .from('restaurants')
        .select('name, description, phone, address, quartier, city, cuisine_type, occasion_tags, capacity, avg_ticket, has_kids_menu, has_kids_chairs, click_collect_enabled')
        .eq('id', owner.restaurant_id)
        .maybeSingle();
      if (r && r.description) {
        setForm({
          name:           r.name           ?? '',
          description:    r.description    ?? '',
          phone:          r.phone          ?? '',
          address:        r.address        ?? '',
          quartier:       r.quartier       ?? '',
          city:           r.city           ?? '',
          cuisine_type:   r.cuisine_type   ?? 'autre',
          occasion_tags:  r.occasion_tags  ?? [],
          capacity:       r.capacity != null ? String(r.capacity) : '',
          avg_ticket:     r.avg_ticket != null ? String(r.avg_ticket) : '',
          has_kids_menu:  r.has_kids_menu  ?? false,
          has_kids_chairs:r.has_kids_chairs ?? false,
          click_collect_enabled: r.click_collect_enabled ?? false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const set = useCallback((key) => (val) => setForm(prev => ({ ...prev, [key]: val })), []);

  const toggleTag = useCallback((tag) => {
    setForm(prev => ({
      ...prev,
      occasion_tags: prev.occasion_tags.includes(tag)
        ? prev.occasion_tags.filter(t => t !== tag)
        : [...prev.occasion_tags, tag],
    }));
  }, []);

  const save = useCallback(async () => {
    if (!restaurantId) return;
    if (!form.name.trim()) { setError('Le nom du restaurant est obligatoire'); return; }
    setSaving(true);
    setError('');
    try {
      const { error: err } = await supabase.from('restaurants').update({
        name:            form.name.trim(),
        description:     form.description.trim(),
        phone:           form.phone.trim(),
        address:         form.address.trim(),
        quartier:        form.quartier.trim(),
        city:            form.city.trim().toLowerCase(),
        cuisine_type:    form.cuisine_type,
        occasion_tags:   form.occasion_tags,
        capacity:        form.capacity ? parseInt(form.capacity) : 0,
        avg_ticket:      form.avg_ticket ? parseInt(form.avg_ticket) : 0,
        has_kids_menu:   form.has_kids_menu,
        has_kids_chairs: form.has_kids_chairs,
        click_collect_enabled: form.click_collect_enabled,
      }).eq('id', restaurantId);
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [restaurantId, form]);

  // ── Génération IA (description + tags) — jamais auto-sauvegardée ─────────
  const generateWithAI = useCallback(async () => {
    if (!restaurantId) return;
    setGenerating(true);
    setAiError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('generate-restaurant-content', {
        body: { restaurant_id: restaurantId },
      });
      if (err || !data?.ok) {
        setAiError(data?.error || err?.message || 'Erreur lors de la génération.');
        return;
      }
      setForm(prev => ({
        ...prev,
        description: data.description ?? prev.description,
        occasion_tags: data.occasion_tags ?? prev.occasion_tags,
      }));
    } catch {
      setAiError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setGenerating(false);
    }
  }, [restaurantId]);

  return {
    form, loading, saving, saved, error, set, toggleTag, save,
    generating, aiError, generateWithAI,
  };
}
