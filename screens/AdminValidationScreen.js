import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import { supabase } from '../supabase';
import useAdminValidation from '../src/hooks/useAdminValidation';
import { CUISINE_OPTIONS } from '../src/hooks/useProInfo';

function scoreColor(score) {
  if (score >= 70) return colors.green;
  if (score >= 40) return colors.gold;
  return colors.red;
}

function QuickEditForm({ r, onSave, saving }) {
  const [description, setDescription] = useState(r.description || '');
  const [cuisineType, setCuisineType] = useState(r.cuisine_type || 'autre');
  const [avgTicket,   setAvgTicket]   = useState(r.avg_ticket ? String(r.avg_ticket) : '');
  const [phone,        setPhone]      = useState(r.phone || '');

  return (
    <View style={s.editForm}>
      <Text style={s.editLabel}>DESCRIPTION</Text>
      <TextInput
        style={[s.editInput, { height: 70 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description du restaurant…"
        placeholderTextColor={colors.textDim}
        multiline
      />
      <Text style={s.editLabel}>TYPE DE CUISINE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {CUISINE_OPTIONS.map(o => (
          <TouchableOpacity
            key={o.value}
            style={[s.cuisineChip, cuisineType === o.value && s.cuisineChipOn]}
            onPress={() => setCuisineType(o.value)}
          >
            <Text style={[s.cuisineChipTxt, cuisineType === o.value && s.cuisineChipTxtOn]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={s.editLabel}>PRIX MOYEN (DA)</Text>
          <TextInput
            style={s.editInput}
            value={avgTicket}
            onChangeText={setAvgTicket}
            placeholder="2000"
            placeholderTextColor={colors.textDim}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.editLabel}>TÉLÉPHONE</Text>
          <TextInput
            style={s.editInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+213 6XX XXX XXX"
            placeholderTextColor={colors.textDim}
            keyboardType="phone-pad"
          />
        </View>
      </View>
      <TouchableOpacity
        style={[s.saveBtn, saving && { opacity: 0.6 }]}
        disabled={saving}
        onPress={() => onSave({
          description: description.trim(),
          cuisine_type: cuisineType,
          avg_ticket: avgTicket ? parseInt(avgTicket, 10) : 0,
          phone: phone.trim(),
        })}
      >
        <Text style={s.saveBtnTxt}>{saving ? '···' : 'Enregistrer'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminValidationScreen({ navigation }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const role = data?.user?.app_metadata?.role || data?.user?.user_metadata?.role;
      setIsAdmin(role === 'admin');
      setChecking(false);
    })();
  }, []);

  const { restaurants, loading, refreshing, acting, onRefresh, activate, reject, quickEdit } = useAdminValidation();

  const toggleExpand = useCallback((id) => setExpanded(p => p === id ? null : id), []);

  if (checking) {
    return <SafeAreaView style={s.root}><ActivityIndicator style={{ marginTop: 60 }} color={colors.text} /></SafeAreaView>;
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={s.deniedWrap}>
          <Text style={{ fontSize: 44 }}>🔒</Text>
          <Text style={s.deniedTitle}>Accès réservé</Text>
          <Text style={s.deniedSub}>Cet écran est réservé aux comptes administrateur.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>VALIDATION RESTAURANTS</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.text} />
        ) : restaurants.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={{ fontSize: 44 }}>✅</Text>
            <Text style={s.emptyTitle}>Aucune demande en attente</Text>
          </View>
        ) : (
          restaurants.map(r => {
            const isActing = acting.has(r.id);
            const isExpanded = expanded === r.id;
            return (
              <View key={r.id} style={s.card}>
                <TouchableOpacity style={s.cardTop} onPress={() => toggleExpand(r.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>{r.name}</Text>
                    <Text style={s.sub}>{r.city || '—'}{r.quartier ? ` · ${r.quartier}` : ''}</Text>
                  </View>
                  <View style={[s.scoreBadge, { borderColor: scoreColor(r.completion.score) }]}>
                    <Text style={[s.scoreTxt, { color: scoreColor(r.completion.score) }]}>{r.completion.score}%</Text>
                  </View>
                </TouchableOpacity>

                {r.completion.missing.length > 0 && (
                  <View style={s.missingRow}>
                    {r.completion.missing.map(f => (
                      <View key={f.key} style={s.missingChip}>
                        <Text style={s.missingTxt}>{f.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {isExpanded && (
                  <QuickEditForm
                    r={r}
                    saving={isActing}
                    onSave={async (fields) => {
                      const { error } = await quickEdit(r.id, fields);
                      if (!error) setExpanded(null);
                    }}
                  />
                )}

                <View style={s.actions}>
                  <TouchableOpacity style={s.editToggle} onPress={() => toggleExpand(r.id)}>
                    <Text style={s.editToggleTxt}>{isExpanded ? 'Fermer' : 'Édition rapide'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => reject(r)} disabled={isActing}>
                    <Text style={s.rejectTxt}>✕ Rejeter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.activateBtn} onPress={() => activate(r)} disabled={isActing}>
                    <Text style={s.activateTxt}>{isActing ? '···' : '✓ Activer'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerTitle: { flex: 1, color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: 2, textAlign: 'center' },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 22 },

  deniedWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.section },
  deniedTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight: '300' },
  deniedSub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section * 2, gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: '300' },

  card:      { margin: spacing.xl, marginBottom: 0, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  name:      { color: colors.text, fontSize: typography.size.subheading, fontWeight: '500' },
  sub:       { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 2, textTransform: 'capitalize' },
  scoreBadge:{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1.5 },
  scoreTxt:  { fontSize: typography.size.body, fontWeight: typography.weight.bold },

  missingRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  missingChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xxs + 2, borderRadius: radius.full, backgroundColor: colors.redSoft, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  missingTxt:  { color: colors.red, fontSize: typography.size.xs },

  editForm:   { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: spacing.lg },
  editLabel:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1.5, marginBottom: spacing.xxs },
  editInput:  { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, color: colors.text, fontSize: typography.size.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md, textAlignVertical: 'top' },
  cuisineChip:  { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.cardBorder, marginRight: spacing.sm },
  cuisineChipOn:{ backgroundColor: colors.primaryDim, borderColor: colors.primary },
  cuisineChipTxt:  { color: colors.textMuted, fontSize: typography.size.caption },
  cuisineChipTxtOn:{ color: colors.primary, fontWeight: '600' },
  saveBtn:    { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  saveBtnTxt: { color: '#FFFFFF', fontSize: typography.size.body, fontWeight: typography.weight.medium },

  actions:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.cardBorder },
  editToggle:   { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.cardBorder },
  editToggleTxt:{ color: colors.textMuted, fontSize: typography.size.caption },
  rejectBtn:    { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.cardBorder },
  rejectTxt:    { color: colors.red, fontSize: typography.size.caption, fontWeight: '600' },
  activateBtn:  { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  activateTxt:  { color: colors.green, fontSize: typography.size.caption, fontWeight: '600' },
});
