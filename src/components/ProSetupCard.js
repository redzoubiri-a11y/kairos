import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { SETUP_STEPS } from '../hooks/useProOnboarding';

export default function ProSetupCard({ navigation, restaurantId, visited, onVisit, onDismiss, onReset }) {
  const total      = SETUP_STEPS.length;
  const done       = SETUP_STEPS.filter(s => visited[s.key]).length;
  const allDone    = done === total;
  const activeStep = SETUP_STEPS.find(s => !visited[s.key]);

  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => onDismiss(), 800);
      return () => clearTimeout(timer);
    }
  }, [allDone, onDismiss]);

  const handleStep = (step) => {
    const params = {
      ...(step.screen === 'ProPhotos' ? { restaurantId } : {}),
      onSetupComplete: () => onVisit(step.key),
    };
    navigation.navigate(step.screen, params);
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Configurez votre restaurant</Text>
          <Text style={s.cardSub}>{done}/{total} étapes complètes</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
          {onReset && done > 0 && (
            <TouchableOpacity onPress={onReset} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.resetTxt}>↺</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.dismissTxt}>{allDone ? 'Terminer ✓' : 'Passer'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${(done / total) * 100}%` }]} />
      </View>

      {/* Étapes complétées */}
      {SETUP_STEPS.filter(s => visited[s.key]).map((step) => (
        <View key={step.key} style={s.doneRow}>
          <View style={s.doneIcon}>
            <Text style={s.doneCheck}>✓</Text>
          </View>
          <Text style={s.doneLabel}>{step.label}</Text>
        </View>
      ))}

      {/* Étape active */}
      {activeStep && (
        <TouchableOpacity style={s.activeCard} onPress={() => handleStep(activeStep)} activeOpacity={0.85}>
          <View style={s.activeTop}>
            <View style={s.activeIcon}>
              <Text style={s.activeEmoji}>{activeStep.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.activeLabel}>{activeStep.label}</Text>
              <Text style={s.activeDesc}>{activeStep.desc}</Text>
            </View>
          </View>
          <View style={s.activeBtn}>
            <Text style={s.activeBtnTxt}>Commencer →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Étapes à venir (toutes accessibles) */}
      {activeStep && SETUP_STEPS.filter(s => !visited[s.key] && s.key !== activeStep.key).map((step) => (
        <TouchableOpacity key={step.key} style={s.pendingRow} onPress={() => handleStep(step)} activeOpacity={0.65}>
          <View style={s.pendingIcon}>
            <Text style={s.pendingEmoji}>{step.icon}</Text>
          </View>
          <Text style={s.pendingLabel}>{step.label}</Text>
          <Text style={s.pendingArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(200,151,90,0.3)',
    overflow: 'hidden',
    paddingBottom: spacing.lg,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  cardTitle:  { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.body },
  cardSub:    { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  dismissTxt: { color: colors.gold, fontSize: typography.size.caption },
  resetTxt:   { color: colors.textDim, fontSize: 18 },

  progressBar:  { height: 3, backgroundColor: colors.cardBorder, marginHorizontal: spacing.xl, borderRadius: 2, marginBottom: spacing.md },
  progressFill: { height: 3, backgroundColor: colors.gold, borderRadius: 2 },

  // Étapes complétées
  doneRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, opacity: 0.5 },
  doneIcon:  { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)', alignItems: 'center', justifyContent: 'center' },
  doneCheck: { fontFamily: typography.bodyBold, color: colors.green, fontSize: 13 },
  doneLabel: { color: colors.textMuted, fontSize: typography.size.caption, textDecorationLine: 'line-through' },

  // Étape active
  activeCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(200,151,90,0.4)',
    padding: spacing.xl,
  },
  activeTop:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg },
  activeIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(200,151,90,0.2)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)', alignItems: 'center', justifyContent: 'center' },
  activeEmoji: { fontSize: 20 },
  activeLabel: { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.body },
  activeDesc:  { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 3 },
  activeBtn:   { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  activeBtnTxt:{ fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.caption },

  // Étapes à venir
  pendingRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, opacity: 0.55, marginTop: spacing.xs },
  pendingIcon:  { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  pendingEmoji: { fontSize: 13 },
  pendingLabel: { flex: 1, color: colors.textMuted, fontSize: typography.size.caption },
  pendingArrow: { color: colors.gold, fontSize: 14 },
});
