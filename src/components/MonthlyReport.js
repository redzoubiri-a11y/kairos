import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius, alpha } from '../theme';
import MLoader from './MLoader';

function StatRow({ icon, label, value, color }) {
  return (
    <View style={r.statRow}>
      <Text style={r.statIcon}>{icon}</Text>
      <Text style={r.statLabel}>{label}</Text>
      <Text style={[r.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function MonthlyReport({ report, loading, error, onRefetch }) {
  if (error) return null;

  return (
    <View style={r.card}>
      <View style={r.header}>
        <View>
          <Text style={r.title}>Bilan du mois</Text>
          {report?.month && <Text style={r.subtitle}>{report.month}</Text>}
        </View>
        <TouchableOpacity onPress={onRefetch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={r.refresh}>{loading ? '···' : '↺'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ gap: spacing.md }}>
          {[1, 2, 3, 4].map(i => (
            <MLoader key={i} width="100%" height={20} borderRadius={radius.sm} />
          ))}
        </View>
      ) : report ? (
        <>
          {/* Temps économisé — highlight */}
          <View style={r.highlight}>
            <Text style={r.highlightVal}>{report.hoursSaved}h</Text>
            <Text style={r.highlightLbl}>économisées ce mois</Text>
          </View>

          <View style={r.divider} />

          <StatRow
            icon="📅"
            label="Réservations totales"
            value={report.totalReservations}
            color={alpha(colors.ivory, 0.85)}
          />
          <StatRow
            icon="✅"
            label="No-shows évités"
            value={report.noShowsAvoided}
            color={colors.green}
          />
          <StatRow
            icon="❌"
            label="No-shows"
            value={report.noShows}
            color={colors.red}
          />
          <StatRow
            icon="🔄"
            label="Annulations self-service"
            value={report.selfServiceCancellations}
            color={colors.accent}
          />
        </>
      ) : null}
    </View>
  );
}

const r = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xxl,
    marginVertical: spacing.lg,
    backgroundColor: alpha(colors.onDark, 0.05),
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: alpha(colors.gold, 0.2),
    padding: spacing.xl,
  },

  header:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg },
  title:    { color: colors.ivory, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold, letterSpacing: 0.3 },
  subtitle: { color: alpha(colors.ivory, 0.4), fontSize: typography.size.caption, textTransform: 'capitalize', marginTop: spacing.xxs },
  refresh:  { color: colors.gold, fontSize: typography.size.heading2 },

  highlight:    { alignItems: 'center', paddingVertical: spacing.lg },
  highlightVal: { color: colors.gold, fontSize: typography.size.display, fontWeight: '200', lineHeight: 40 },
  highlightLbl: { color: alpha(colors.ivory, 0.5), fontSize: typography.size.caption, letterSpacing: 1, marginTop: spacing.xs },

  divider: { height: 1, backgroundColor: alpha(colors.onDark, 0.08), marginVertical: spacing.lg },

  statRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  statIcon:  { fontSize: 14, width: 20, textAlign: 'center' },
  statLabel: { flex: 1, color: alpha(colors.ivory, 0.55), fontSize: typography.size.bodyLg },
  statValue: { fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
});
