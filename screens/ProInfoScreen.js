import { useEffect, useRef } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useProInfo, { CUISINE_OPTIONS, OCCASION_OPTIONS } from '../src/hooks/useProInfo';
import BottomTabBar from '../src/components/BottomTabBar';

const PRO_ACCENT = '#c8975a';

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

  const { form, loading, saving, saved, error, set, toggleTag, save } = useProInfo();

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

          <Text style={s.label}>Description</Text>
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
              trackColor={{ false: colors.cardBorder, true: `${PRO_ACCENT}55` }}
              thumbColor={form.has_kids_menu ? PRO_ACCENT : '#bbb'}
            />
          </View>
          <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
            <Text style={s.toggleLabel}>Chaises bébé</Text>
            <Switch
              value={form.has_kids_chairs}
              onValueChange={set('has_kids_chairs')}
              trackColor={{ false: colors.cardBorder, true: `${PRO_ACCENT}55` }}
              thumbColor={form.has_kids_chairs ? PRO_ACCENT : '#bbb'}
            />
          </View>

          {!!error && <Text style={s.error}>{error}</Text>}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
      <BottomTabBar navigation={navigation} isPro={true} activeTab={null} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  backBtn:     { marginRight: spacing.sm, padding: spacing.xs },
  backBtnTxt:  { color: colors.text, fontSize: 22 },
  title:       { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  saveBtn:     { backgroundColor: PRO_ACCENT, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, opacity: 1 },
  saveBtnActive:{ opacity: 0.75 },
  saveBtnTxt:  { color: '#fff', fontSize: typography.size.caption, fontWeight: typography.weight.extrabold },

  content:     { padding: spacing.xl, gap: 0 },
  section:     { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 1, textTransform: 'uppercase', marginTop: spacing.xxl, marginBottom: spacing.md },
  label:       { color: colors.text, fontSize: typography.size.caption, fontWeight: typography.weight.medium, marginBottom: spacing.xs, marginTop: spacing.md },
  input:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.text, fontSize: typography.size.body },
  inputMulti:  { minHeight: 80, paddingTop: spacing.md },

  twoCol:      { flexDirection: 'row', gap: spacing.md },
  colItem:     { flex: 1 },

  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip:        { borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chipOn:      { backgroundColor: PRO_ACCENT, borderColor: PRO_ACCENT },
  chipTxt:     { color: colors.textMuted, fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  chipTxtOn:   { color: '#fff', fontWeight: typography.weight.semibold },

  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  toggleLabel: { color: colors.text, fontSize: typography.size.body },

  error:       { color: colors.red, fontSize: typography.size.caption, marginTop: spacing.lg, textAlign: 'center' },
});
