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
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.xxl, marginBottom: spacing.md, backgroundColor: colors.goldSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  icon: { fontSize: 14 },
  txt:  { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 16 },
  bold: { color: colors.gold, fontWeight: typography.weight.semibold },
});
