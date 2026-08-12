import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { STATUS_LABEL } from '../hooks/useProPromos';
import EmptyState from './EmptyState';

const BADGE_STYLE = {
  active:    { bg: colors.gold,           text: colors.noir },
  scheduled: { bg: colors.statusPendingBg, text: colors.statusPendingText },
  ended:     { bg: colors.tagNeutralBg,    text: colors.textMuted },
  paused:    { bg: colors.tagNeutralBg,    text: colors.textMuted },
};

export default function PromoListView({ activePromo, otherPromos, onCreate, onTogglePause, onIncrementUse }) {
  const hasAny = !!activePromo || otherPromos.length > 0;

  if (!hasAny) {
    return (
      <View style={{ padding: spacing.xl }}>
        <EmptyState
          icon={<Text style={{ fontSize: 20 }}>🏷️</Text>}
          title="Aucune promotion"
          subtitle={"Créez votre première promotion pour la rendre\nvisible sur votre fiche MIDA."}
          actionLabel="+ Créer une promotion"
          onAction={onCreate}
        />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>

        {activePromo && (
          <View style={s.activeCard}>
            <View style={s.activeGlow} pointerEvents="none" />
            <View style={[s.badge, { backgroundColor: BADGE_STYLE.active.bg }]}>
              <Text style={[s.badgeTxt, { color: BADGE_STYLE.active.text }]}>{STATUS_LABEL.active}</Text>
            </View>
            <Text style={s.activeTitle}>{activePromo.title}</Text>
            {!!activePromo.description && <Text style={s.activeDesc}>{activePromo.description}</Text>}

            <View style={s.statsRow}>
              <Text style={s.statVal}>{activePromo.use_count || 0}</Text>
              <Text style={s.statLbl}>utilisations</Text>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={s.useBtn} onPress={() => onIncrementUse(activePromo)}>
                <Text style={s.useBtnTxt}>+1 utilisation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.pauseBtn} onPress={() => onTogglePause(activePromo)}>
                <Text style={s.pauseBtnTxt}>⏸ Suspendre</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {otherPromos.map((p) => {
          const badge = BADGE_STYLE[p.status] || BADGE_STYLE.ended;
          const isEnded = p.status === 'ended';
          return (
            <View key={p.id} style={[s.card, isEnded && { opacity: 0.6 }]}>
              <View style={[s.badge, { backgroundColor: badge.bg }]}>
                <Text style={[s.badgeTxt, { color: badge.text }]}>{STATUS_LABEL[p.status]}</Text>
              </View>
              <Text style={s.cardTitle}>{p.title}</Text>
              <Text style={s.cardDesc}>
                {isEnded ? `${p.use_count || 0} utilisations au total` : p.description}
              </Text>
              {p.status === 'paused' && (
                <TouchableOpacity style={s.resumeBtn} onPress={() => onTogglePause(p)}>
                  <Text style={s.resumeBtnTxt}>▶ Reprendre</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  badge:    { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, marginBottom: spacing.md },
  badgeTxt: { fontFamily: typography.bodyBold, fontSize: 9.5, letterSpacing: 0.4 },

  activeCard: { backgroundColor: colors.noir, borderRadius: radius.xl, padding: spacing.xl, overflow: 'hidden' },
  activeGlow: { position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: colors.goldSoft },
  activeTitle: { fontFamily: typography.display, fontSize: typography.size.title - 6, color: '#FFFFFF', letterSpacing: -0.2 },
  activeDesc: { fontFamily: typography.body, fontSize: typography.size.body, color: 'rgba(255,255,255,0.55)', marginTop: 5, lineHeight: 17 },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: spacing.lg },
  statVal: { fontFamily: typography.display, fontSize: typography.size.heading2, color: '#FFFFFF' },
  statLbl: { fontFamily: typography.bodyMedium, fontSize: 9.5, color: 'rgba(255,255,255,0.5)' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  useBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  useBtnTxt: { color: '#FFFFFF', fontSize: typography.size.caption, fontFamily: typography.bodyBold },
  pauseBtn: { flex: 1, backgroundColor: colors.redSoft, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(224,90,90,0.2)' },
  pauseBtnTxt: { color: colors.red, fontSize: typography.size.caption, fontFamily: typography.bodyBold },

  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.xl, padding: spacing.xl },
  cardTitle: { fontFamily: typography.display, fontSize: typography.size.heading2, color: colors.text },
  cardDesc: { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted, marginTop: 5, lineHeight: 17 },
  resumeBtn: { alignSelf: 'flex-start', marginTop: spacing.lg, borderWidth: 1.5, borderColor: 'rgba(10,10,10,0.16)', borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 1 },
  resumeBtnTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.bodyLg - 1.5, color: colors.text },
});
