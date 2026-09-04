import { useEffect, useRef } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useProInfo, { CUISINE_OPTIONS, OCCASION_OPTIONS } from '../src/hooks/useProInfo';

function Skeleton() {
  return (
    <View style={{ padding: spacing.xl, gap: spacing.lg }}>
      {[...Array(5)].map((_, i) => (
        <MLoader key={i} width="100%" height={52} borderRadius={radius.md} />
      ))}
    </View>
  );
}

export default function ProInfoScreen({ navigation, route }) {
  const onSetupComplete = route?.params?.onSetupComplete;
  const completedRef = useRef(false);

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  const {
    form, loading, saving, saved, error, set, toggleTag, save,
    generating, aiError, generateWithAI,
  } = useProInfo();

  useEffect(() => {
    if (saved && onSetupComplete && !completedRef.current) {
      completedRef.current = true;
      onSetupComplete();
      navigation.goBack();
    }
  }, [saved, onSetupComplete, navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          {!onSetupComplete && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backBtnTxt}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={s.title}>Mes informations</Text>
        </View>
        <TouchableOpacity
          style={[s.saveBtn, (saving || saved) && s.saveBtnActive]}
          onPress={save}
          disabled={saving}
        >
          <Text style={s.saveBtnTxt}>
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? <Skeleton /> : (
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Identité */}
          <Text style={s.section}>Identité</Text>

          <Text style={s.label}>Nom du restaurant *</Text>
          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={set('name')}
            placeholder="Nom du restaurant"
            placeholderTextColor={colors.textDim}
          />

          <View style={s.labelRow}>
            <Text style={s.label}>Description</Text>
            <TouchableOpacity
              style={[s.aiBtn, generating && s.aiBtnActive]}
              onPress={generateWithAI}
              disabled={generating}
            >
              <Text style={s.aiBtnTxt}>{generating ? 'Génération…' : '✨ Générer avec l\'IA'}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[s.input, s.inputMulti]}
            value={form.description}
            onChangeText={set('description')}
            placeholder="Décrivez votre restaurant…"
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {!!aiError && <Text style={s.error}>{aiError}</Text>}

          {/* Contact */}
          <Text style={s.section}>Contact & Localisation</Text>

          <Text style={s.label}>Téléphone</Text>
          <TextInput
            style={s.input}
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="0x xx xx xx xx"
            placeholderTextColor={colors.textDim}
            keyboardType="phone-pad"
          />

          <Text style={s.label}>Adresse</Text>
          <TextInput
            style={s.input}
            value={form.address}
            onChangeText={set('address')}
            placeholder="Adresse complète"
            placeholderTextColor={colors.textDim}
          />

          <View style={s.twoCol}>
            <View style={s.colItem}>
              <Text style={s.label}>Quartier</Text>
              <TextInput
                style={s.input}
                value={form.quartier}
                onChangeText={set('quartier')}
                placeholder="Quartier"
                placeholderTextColor={colors.textDim}
              />
            </View>
            <View style={s.colItem}>
              <Text style={s.label}>Ville</Text>
              <TextInput
                style={s.input}
                value={form.city}
                onChangeText={set('city')}
                placeholder="alger"
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>

          {/* Équipements */}
          <Text style={s.section}>Équipements</Text>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Terrasse</Text>
            <Switch
              value={form.terrasse}
              onValueChange={set('terrasse')}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Parking</Text>
            <Switch
              value={form.parking}
              onValueChange={set('parking')}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Espace famille</Text>
            <Switch
              value={form.espace_famille}
              onValueChange={set('espace_famille')}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
          <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
            <Text style={s.toggleLabel}>Salle fête</Text>
            <Switch
              value={form.salle_fete}
              onValueChange={set('salle_fete')}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          {/* Cuisine */}
          <Text style={s.section}>Type de cuisine</Text>
          <View style={s.chips}>
            {CUISINE_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[s.chip, form.cuisine_type === o.value && s.chipOn]}
                onPress={() => set('cuisine_type')(o.value)}
              >
                <Text style={[s.chipTxt, form.cuisine_type === o.value && s.chipTxtOn]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Occasions */}
          <Text style={s.section}>Occasions</Text>
          <View style={s.chips}>
            {OCCASION_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[s.chip, form.occasion_tags.includes(o.value) && s.chipOn]}
                onPress={() => toggleTag(o.value)}
              >
                <Text style={[s.chipTxt, form.occasion_tags.includes(o.value) && s.chipTxtOn]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Capacité */}
          <Text style={s.section}>Capacité & Ticket</Text>
          <View style={s.twoCol}>
            <View style={s.colItem}>
              <Text style={s.label}>Couverts</Text>
              <TextInput
                style={s.input}
                value={form.capacity}
                onChangeText={set('capacity')}
                placeholder="Ex: 50"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>
            <View style={s.colItem}>
              <Text style={s.label}>Ticket moyen (DA)</Text>
              <TextInput
                style={s.input}
                value={form.avg_ticket}
                onChangeText={set('avg_ticket')}
                placeholder="Ex: 3500"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Enfants */}
          <Text style={s.section}>Espace enfants</Text>

          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Menu enfant</Text>
            <Switch
              value={form.has_kids_menu}
              onValueChange={set('has_kids_menu')}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={form.has_kids_menu ? colors.card : '#bbb'}
            />
          </View>
          <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
            <Text style={s.toggleLabel}>Chaises bébé</Text>
            <Switch
              value={form.has_kids_chairs}
              onValueChange={set('has_kids_chairs')}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={form.has_kids_chairs ? colors.card : '#bbb'}
            />
          </View>

          {/* Click & Collect */}
          <Text style={s.section}>Click & Collect</Text>
          <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={s.toggleLabel}>Activer la commande à emporter</Text>
              <Text style={s.toggleSub}>Les clients pourront commander depuis votre menu et venir récupérer sur place. Paiement au retrait.</Text>
            </View>
            <Switch
              value={form.click_collect_enabled}
              onValueChange={set('click_collect_enabled')}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={form.click_collect_enabled ? colors.card : '#bbb'}
            />
          </View>

          {form.click_collect_enabled && (
            <>
              {/* Temps d'attente par tranche horaire — Lot 3, saisie manuelle, pas de calcul auto */}
              <Text style={s.label}>Temps d'attente estimé (par tranche horaire)</Text>
              {form.wait_time_estimates.map((b, i) => (
                <View key={i} style={s.waitRow}>
                  <TextInput
                    style={[s.input, s.waitInput]}
                    placeholder="12:00"
                    placeholderTextColor={colors.textDim}
                    value={b.from}
                    onChangeText={(v) => {
                      const next = [...form.wait_time_estimates];
                      next[i] = { ...next[i], from: v };
                      set('wait_time_estimates')(next);
                    }}
                  />
                  <Text style={s.waitSep}>→</Text>
                  <TextInput
                    style={[s.input, s.waitInput]}
                    placeholder="14:00"
                    placeholderTextColor={colors.textDim}
                    value={b.to}
                    onChangeText={(v) => {
                      const next = [...form.wait_time_estimates];
                      next[i] = { ...next[i], to: v };
                      set('wait_time_estimates')(next);
                    }}
                  />
                  <TextInput
                    style={[s.input, s.waitInputMin]}
                    placeholder="min"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                    value={b.minutes != null ? String(b.minutes) : ''}
                    onChangeText={(v) => {
                      const next = [...form.wait_time_estimates];
                      next[i] = { ...next[i], minutes: parseInt(v, 10) || 0 };
                      set('wait_time_estimates')(next);
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => set('wait_time_estimates')(form.wait_time_estimates.filter((_, j) => j !== i))}
                  >
                    <Text style={s.waitRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={s.waitAddBtn}
                onPress={() => set('wait_time_estimates')([...form.wait_time_estimates, { from: '12:00', to: '14:00', minutes: 15 }])}
              >
                <Text style={s.waitAddTxt}>+ Ajouter une tranche</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.qrLinkBtn} onPress={() => navigation.navigate('ProTableQr')}>
                <Text style={s.qrLinkTxt}>🔳 Générer les QR codes des tables</Text>
              </TouchableOpacity>
            </>
          )}

          {!!error && <Text style={s.error}>{error}</Text>}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
      <View style={s.terminerBar}>
        <TouchableOpacity style={s.terminerBtn} onPress={() => navigation.navigate('Main', { screen: 'Manager' })}>
          <Text style={s.terminerTxt}>Terminer → Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  backBtn:     { marginRight: spacing.sm, padding: spacing.xs },
  backBtnTxt:  { color: colors.text, fontSize: 22, fontFamily: typography.body },
  title:       { color: colors.text, fontSize: typography.size.heading2, fontFamily: typography.display },
  terminerBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  terminerBtn: { alignItems: 'center', paddingVertical: spacing.md },
  terminerTxt: { color: colors.primary, fontSize: typography.size.body, fontFamily: typography.bodyMedium },
  saveBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, opacity: 1 },
  saveBtnActive:{ opacity: 0.75 },
  saveBtnTxt:  { color: '#fff', fontSize: typography.size.caption, fontFamily: typography.bodyBold },

  content:     { padding: spacing.xl, gap: 0 },
  section:     { color: colors.textMuted, fontSize: typography.size.xs, fontFamily: typography.bodySemibold, letterSpacing: 1, textTransform: 'uppercase', marginTop: spacing.xxl, marginBottom: spacing.md },
  label:       { color: colors.text, fontSize: typography.size.caption, fontFamily: typography.bodyMedium, marginBottom: spacing.xs, marginTop: spacing.md },
  labelRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiBtn:       { borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs },
  aiBtnActive: { opacity: 0.6 },
  aiBtnTxt:    { color: colors.primary, fontSize: typography.size.xs, fontFamily: typography.bodySemibold },
  input:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: typography.size.body, fontFamily: typography.body },
  inputMulti:  { minHeight: 80, paddingTop: spacing.md },

  waitRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  waitInput:   { flex: 1, paddingVertical: spacing.sm + 2 },
  waitInputMin:{ width: 60, paddingVertical: spacing.sm + 2 },
  waitSep:     { color: colors.textMuted },
  waitRemove:  { color: colors.red, fontSize: typography.size.subheading, paddingHorizontal: spacing.xs },
  waitAddBtn:  { alignSelf: 'flex-start', marginTop: spacing.xs, marginBottom: spacing.lg },
  waitAddTxt:  { color: colors.primary, fontSize: typography.size.caption, fontFamily: typography.bodySemibold },
  qrLinkBtn:   { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  qrLinkTxt:   { color: colors.text, fontSize: typography.size.body, fontFamily: typography.bodySemibold },

  twoCol:      { flexDirection: 'row', gap: spacing.md },
  colItem:     { flex: 1 },

  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip:        { borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chipOn:      { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt:     { color: colors.textMuted, fontSize: typography.size.caption, fontFamily: typography.bodyMedium },
  chipTxtOn:   { color: '#fff', fontFamily: typography.bodySemibold },

  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  toggleLabel: { color: colors.text, fontSize: typography.size.body, fontFamily: typography.body },
  toggleSub:   { color: colors.textDim, fontSize: typography.size.caption, marginTop: 2, fontFamily: typography.body },

  error:       { color: colors.red, fontSize: typography.size.caption, marginTop: spacing.lg, textAlign: 'center', fontFamily: typography.body },
});
