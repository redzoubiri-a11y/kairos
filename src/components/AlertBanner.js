import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function AlertBanner({ pendingCount, upcomingCount }) {
  if (pendingCount === 0 && upcomingCount === 0) return null;
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>{pendingCount > 0 ? '⚠️' : '🔔'}</Text>
      <View style={{ flex: 1 }}>
        {pendingCount > 0 && (
          <Text style={s.txt}>
            <Text style={s.bold}>{pendingCount} réservation{pendingCount > 1 ? 's' : ''}</Text> en attente de confirmation
          </Text>
        )}
        {upcomingCount > 0 && (
          <Text style={s.txt}>
            <Text style={s.bold}>{upcomingCount} table{upcomingCount > 1 ? 's' : ''}</Text> dans moins d'une heure
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginHorizontal: spacing.xxl, marginBottom: spacing.lg, backgroundColor: colors.accentSoft, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', padding: spacing.lg },
  icon: { fontSize: 18 },
  txt:  { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18 },
  bold: { color: colors.accent, fontWeight: typography.weight.medium },
});
