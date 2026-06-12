import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
  Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, radius } from '../theme';
import { supabase } from '../../supabase';

function ToggleRow({ label, sub, value, onChange }) {
  return (
    <TouchableOpacity style={tr.row} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={tr.label}>{label}</Text>
        {!!sub && <Text style={tr.sub}>{sub}</Text>}
      </View>
      <View style={[tr.track, value && tr.trackOn]}>
        <View style={[tr.thumb, value && tr.thumbOn]} />
      </View>
    </TouchableOpacity>
  );
}
const tr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  label:   { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  sub:     { color: colors.textDim, fontSize: typography.size.caption, marginTop: spacing.xxs },
  track:   { width: 38, height: 22, borderRadius: 0, backgroundColor: colors.cardBorder, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', paddingHorizontal: 3 },
  trackOn: { backgroundColor: colors.accent, borderColor: colors.accentDim },
  thumb:   { width: 16, height: 16, borderRadius: 0, backgroundColor: colors.textDim, alignSelf: 'flex-start' },
  thumbOn: { backgroundColor: colors.bg, alignSelf: 'flex-end' },
});

export default function DishForm({ initial, categories, isEdit, restaurantId, onSave, onCancel, onDelete, onTerminer }) {
  const [form,      setForm]      = useState(initial);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [uploading, setUploading] = useState(false);

  const set     = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const canSave = form.name.trim().length > 0 && form.price.trim().length > 0 && form.category;

  const pickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const uri  = result.assets[0].uri;
      const path = restaurantId
        ? `${restaurantId}/${Date.now()}.jpg`
        : `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

      const response    = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: upErr } = await supabase.storage
        .from('dishes')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from('dishes').getPublicUrl(path);
      set('photo', data.publicUrl);
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer la photo. Réessayez.");
    } finally {
      setUploading(false);
    }
  }, [restaurantId]);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }, [canSave, onSave, form]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Supprimer ce plat',
      `Supprimer "${form.name}" du menu ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try { await onDelete(); } finally { setDeleting(false); }
        }},
      ]
    );
  }, [onDelete, form.name]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onCancel}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>{isEdit ? 'MODIFIER LE PLAT' : 'NOUVEAU PLAT'}</Text>
          <Text style={s.headerTitle}>{isEdit ? (form.name || 'Plat') : 'Ajouter un plat'}</Text>
        </View>
        {isEdit ? (
          <TouchableOpacity onPress={handleDelete} style={{ width: 64, alignItems: 'flex-end' }} disabled={deleting}>
            <Text style={[f.deleteBtn, deleting && { opacity: 0.4 }]}>{deleting ? '···' : 'Supprimer'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={f.body}>

          {/* Photo */}
          <View style={f.field}>
            <Text style={f.label}>Photo du plat</Text>
            <TouchableOpacity style={f.photoBox} onPress={pickPhoto} disabled={uploading} activeOpacity={0.85}>
              {form.photo ? (
                <>
                  <Image source={{ uri: form.photo }} style={f.photoImg} resizeMode="cover" />
                  <View style={f.photoOverlay}>
                    {uploading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={f.photoOverlayTxt}>📷  Changer</Text>
                    }
                  </View>
                </>
              ) : (
                <View style={f.photoPlaceholder}>
                  {uploading
                    ? <ActivityIndicator color={colors.accent} size="small" />
                    : <>
                        <Text style={f.photoPlaceholderIcon}>📷</Text>
                        <Text style={f.photoPlaceholderTxt}>Ajouter une photo</Text>
                        <Text style={f.photoPlaceholderHint}>JPG, PNG · max 5 Mo</Text>
                      </>
                  }
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Nom */}
          <View style={f.field}>
            <Text style={f.label}>Nom du plat *</Text>
            <View style={[f.inputWrap, form.name && f.inputWrapActive]}>
              <Text style={f.inputIcon}>🍽️</Text>
              <TextInput
                style={f.input}
                value={form.name}
                onChangeText={v => set('name', v)}
                placeholder="Ex : Brochettes mixtes"
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>

          {/* Description */}
          <View style={f.field}>
            <Text style={f.label}>Description</Text>
            <Text style={f.hint}>Aide les clients à faire leur choix</Text>
            <View style={[f.inputWrap, { alignItems: 'flex-start', paddingTop: spacing.md }, form.description && f.inputWrapActive]}>
              <Text style={[f.inputIcon, { marginTop: 2 }]}>📝</Text>
              <TextInput
                style={[f.input, { minHeight: 60 }]}
                value={form.description}
                onChangeText={v => set('description', v)}
                placeholder="Ingrédients, préparation…"
                placeholderTextColor={colors.textDim}
                multiline
              />
            </View>
          </View>

          {/* Prix */}
          <View style={f.field}>
            <Text style={f.label}>Prix (DA) *</Text>
            <View style={[f.inputWrap, form.price && f.inputWrapActive]}>
              <Text style={f.inputIcon}>💰</Text>
              <TextInput
                style={f.input}
                value={form.price}
                onChangeText={v => set('price', v.replace(/[^0-9]/g, ''))}
                placeholder="Ex : 1400"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Catégorie */}
          <View style={f.field}>
            <Text style={f.label}>Catégorie *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.xs }}>
                {categories.map(cat => {
                  const active = form.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[f.catChip, active && f.catChipOn]}
                      onPress={() => set('category', cat)}
                    >
                      <Text style={[f.catChipTxt, active && f.catChipTxtOn]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Toggles */}
          <View style={f.togglesWrap}>
            <ToggleRow label="Disponible dès maintenant" sub="Visible par les clients"   value={form.isAvailable}  onChange={v => set('isAvailable', v)}  />
            <ToggleRow label="Plat du jour"              sub="Mis en avant sur ta fiche" value={form.isDishOfDay}  onChange={v => set('isDishOfDay', v)}  />
            <ToggleRow label="Contient des allergènes"   sub="Gluten, lactose, noix…"    value={form.hasAllergens} onChange={v => set('hasAllergens', v)} />
          </View>

        </View>

        <View style={{ paddingHorizontal: spacing.xxl, paddingBottom: 60 }}>
          <TouchableOpacity
            style={[s.saveBtn, (!canSave || saving || uploading) && { opacity: 0.45 }]}
            onPress={handleSave}
            disabled={!canSave || saving || uploading}
            activeOpacity={0.8}
          >
            <Text style={s.saveBtnTxt}>{saving ? '···' : isEdit ? 'Enregistrer →' : 'Ajouter au menu →'}</Text>
          </TouchableOpacity>
          {onTerminer && (
            <TouchableOpacity style={s.terminerBtn} onPress={onTerminer}>
              <Text style={s.terminerTxt}>Terminer → Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:     { width: 36, height: 36, borderRadius: 0, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  backBtnTxt:  { color: colors.text, fontSize: typography.size.heading2 },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: '300', letterSpacing: 1 },
  saveBtn:     { backgroundColor: '#c8975a', borderRadius: radius.xl, paddingVertical: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  saveBtnTxt:  { color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.bold, letterSpacing: 0.3 },
  terminerBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  terminerTxt: { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.medium },
});

const f = StyleSheet.create({
  body:           { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.xxs },
  field:          { marginBottom: spacing.xl },
  label:          { color: colors.textMuted, fontSize: typography.size.caption, fontWeight: typography.weight.semibold, marginBottom: spacing.sm, letterSpacing: 0.5 },
  hint:           { color: colors.textDim, fontSize: typography.size.xs, marginBottom: spacing.sm, marginTop: -spacing.xs },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  inputWrapActive:{ borderColor: 'rgba(232,160,69,0.5)' },
  inputIcon:      { fontSize: typography.size.subheading, flexShrink: 0 },
  input:          { flex: 1, color: colors.text, fontSize: typography.size.body, paddingVertical: spacing.xs },
  catChip:        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  catChipOn:      { backgroundColor: colors.accentSoft, borderColor: 'rgba(232,160,69,0.4)' },
  catChipTxt:     { color: colors.textMuted, fontSize: typography.size.body },
  catChipTxtOn:   { color: colors.accent, fontWeight: typography.weight.semibold },
  togglesWrap:    { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  deleteBtn:      { color: colors.red, fontSize: typography.size.body },

  photoBox:         { borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder, height: 160 },
  photoImg:         { width: '100%', height: '100%' },
  photoOverlay:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,13,11,0.6)', paddingVertical: spacing.md, alignItems: 'center' },
  photoOverlayTxt:  { color: '#fff', fontSize: typography.size.body, fontWeight: typography.weight.medium },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.card },
  photoPlaceholderIcon: { fontSize: 32 },
  photoPlaceholderTxt:  { color: colors.textMuted, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  photoPlaceholderHint: { color: colors.textDim, fontSize: typography.size.xs },
});
