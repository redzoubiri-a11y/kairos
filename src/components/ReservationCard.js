import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

// ── Time / Date helpers ─────────────────────────────────────────────────────

const TIME_SLOTS = (() => {
  const s = [];
  for (let h = 11; h <= 23; h++) {
    s.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 23) s.push(`${String(h).padStart(2, '0')}:30`);
  }
  return s;
})();

function getNextDays(n = 14) {
  const days = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
    days.push({ dateStr, label });
  }
  return days;
}

const NEXT_DAYS = getNextDays();

// ── Status display (thème clair) ───────────────────────────────────────────

const STATUS = {
  confirmed: { label: 'CONFIRMÉE',  color: colors.green,  bg: colors.greenSoft  },
  pending:   { label: 'EN ATTENTE', color: colors.accent,  bg: colors.accentSoft },
  cancelled: { label: 'ANNULÉE',    color: colors.red,     bg: colors.redSoft    },
};

// ── Feedback banner ────────────────────────────────────────────────────────

function feedbackStyle(status) {
  if (status === 'ok')                  return { backgroundColor: colors.greenSoft,  borderColor: 'rgba(76,175,130,0.30)' };
  if (status === 'pending_validation')  return { backgroundColor: colors.blueSoft,   borderColor: 'rgba(90,155,224,0.30)' };
  return                                       { backgroundColor: colors.redSoft,    borderColor: 'rgba(224,90,90,0.30)'  };
}

function feedbackTextColor(status) {
  if (status === 'ok')                  return colors.green;
  if (status === 'pending_validation')  return colors.blue;
  return                                       colors.red;
}

function feedbackMessage(fb) {
  if (fb.status === 'ok')                 return '✓  Modification enregistrée.';
  if (fb.status === 'pending_validation') return '⏳  Demande envoyée au restaurant. Vous serez notifié.';
  return `✕  ${fb.reason || 'Action refusée.'}`;
}

// ── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ label, value, onMinus, onPlus, min = 0 }) {
  return (
    <View style={st.stepWrap}>
      <Text style={st.stepLabel}>{label}</Text>
      <View style={st.stepRow}>
        <TouchableOpacity style={[st.stepBtn, value <= min && st.stepBtnDis]} onPress={onMinus} disabled={value <= min}>
          <Text style={[st.stepBtnTxt, value <= min && st.stepBtnTxtDis]}>−</Text>
        </TouchableOpacity>
        <Text style={st.stepVal}>{value}</Text>
        <TouchableOpacity style={st.stepBtn} onPress={onPlus}>
          <Text style={st.stepBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  stepWrap:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  stepLabel:     { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
  stepRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepBtn:       { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  stepBtnDis:    { opacity: 0.35 },
  stepBtnTxt:    { color: colors.text, fontSize: typography.size.heading1, lineHeight: 22, fontWeight: typography.weight.medium },
  stepBtnTxtDis: { color: colors.textMuted },
  stepVal:       { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold, minWidth: 28, textAlign: 'center' },
});

// ── ReservationCard ────────────────────────────────────────────────────────

export default function ReservationCard({
  r,
  onCancel,
  onModifyTime,
  onModifyParty,
  acting,       // boolean — this resa is loading
  feedback,     // ActionResult | null
  onClearFeedback,
}) {
  const [panel, setPanel] = useState(null); // null | 'time' | 'party'

  const [selDate, setSelDate] = useState(r.date);
  const [selSlot, setSelSlot] = useState(r.time_slot?.slice(0, 5) ?? '12:00');
  const [adults,  setAdults]  = useState(r.nb_adults  ?? 1);
  const [children, setChildren] = useState(r.nb_children ?? 0);

  const cfg        = STATUS[r.status] ?? STATUS.pending;
  const isCancelled = r.status === 'cancelled';
  const partyCount  = (r.nb_adults ?? 0) + (r.nb_children ?? 0);

  const dateLabel = useMemo(
    () => new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    }),
    [r.date],
  );
  const timeLabel = r.time_slot?.slice(0, 5);

  const openPanel = useCallback((p) => {
    onClearFeedback?.();
    setSelDate(r.date);
    setSelSlot(r.time_slot?.slice(0, 5) ?? '12:00');
    setAdults(r.nb_adults ?? 1);
    setChildren(r.nb_children ?? 0);
    setPanel(p);
  }, [r, onClearFeedback]);

  const closePanel = useCallback(() => setPanel(null), []);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Annuler la réservation',
      `Voulez-vous vraiment annuler chez ${r.restaurants?.name ?? 'ce restaurant'} le ${dateLabel} à ${timeLabel} ?`,
      [
        { text: 'Retour', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive', onPress: () => {
          onClearFeedback?.();
          setPanel(null);
          onCancel(r.id);
        }},
      ],
    );
  }, [r, dateLabel, timeLabel, onCancel, onClearFeedback]);

  const handleConfirmTime = useCallback(() => {
    setPanel(null);
    onModifyTime(r.id, selDate, selSlot + ':00');
  }, [r.id, selDate, selSlot, onModifyTime]);

  const handleConfirmParty = useCallback(() => {
    setPanel(null);
    onModifyParty(r.id, adults, children);
  }, [r.id, adults, children, onModifyParty]);

  return (
    <View style={[c.card, isCancelled && c.cardDimmed]}>

      {/* ── Header ────────────────────────────────────────────── */}
      <View style={c.header}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={c.restoName} numberOfLines={1}>
            {r.restaurants?.name ?? '—'}
          </Text>
          <Text style={c.meta}>
            {dateLabel}  ·  {timeLabel}  ·  {partyCount} pers.
          </Text>
        </View>
        <View style={[c.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[c.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* ── Feedback banner ──────────────────────────────────── */}
      {feedback && (
        <TouchableOpacity
          style={[c.feedbackBanner, feedbackStyle(feedback.status)]}
          onPress={onClearFeedback}
          activeOpacity={0.75}
        >
          <Text style={[c.feedbackTxt, { color: feedbackTextColor(feedback.status) }]}>
            {feedbackMessage(feedback)}
          </Text>
          <Text style={[c.feedbackDismiss, { color: feedbackTextColor(feedback.status) }]}>✕</Text>
        </TouchableOpacity>
      )}

      {/* ── Action zones (non-cancelled uniquement) ──────────── */}
      {!isCancelled && (
        <>
          {/* Boutons principaux */}
          {panel === null && (
            <View style={c.actions}>
              <View style={c.actionRow}>
                <TouchableOpacity
                  style={[c.btnMod, acting && c.btnDis]}
                  disabled={acting}
                  onPress={() => openPanel('time')}
                >
                  <Text style={c.btnModTxt}>{acting ? '···' : '🕐  Modifier l\'heure'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[c.btnMod, acting && c.btnDis]}
                  disabled={acting}
                  onPress={() => openPanel('party')}
                >
                  <Text style={c.btnModTxt}>{acting ? '···' : '👥  Modifier les couverts'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[c.btnCancel, acting && c.btnDis]}
                disabled={acting}
                onPress={handleCancel}
              >
                <Text style={c.btnCancelTxt}>{acting ? '···' : 'Annuler la réservation'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Panel : Modifier l'heure ─────────────────────── */}
          {panel === 'time' && (
            <View style={c.panel}>
              <View style={c.panelHeader}>
                <Text style={c.panelTitle}>Nouvelle date</Text>
                <TouchableOpacity onPress={closePanel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={c.panelClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Date chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={c.chipScroll}
                contentContainerStyle={c.chipContent}
              >
                {NEXT_DAYS.map(({ dateStr, label }) => (
                  <TouchableOpacity
                    key={dateStr}
                    style={[c.chip, selDate === dateStr && c.chipSel]}
                    onPress={() => setSelDate(dateStr)}
                  >
                    <Text style={[c.chipTxt, selDate === dateStr && c.chipTxtSel]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={c.panelSubtitle}>Heure</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={c.chipScroll}
                contentContainerStyle={c.chipContent}
              >
                {TIME_SLOTS.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[c.chip, selSlot === slot && c.chipSel]}
                    onPress={() => setSelSlot(slot)}
                  >
                    <Text style={[c.chipTxt, selSlot === slot && c.chipTxtSel]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={c.btnConfirm} onPress={handleConfirmTime}>
                <Text style={c.btnConfirmTxt}>Confirmer le changement</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Panel : Modifier les couverts ────────────────── */}
          {panel === 'party' && (
            <View style={c.panel}>
              <View style={c.panelHeader}>
                <Text style={c.panelTitle}>Nombre de personnes</Text>
                <TouchableOpacity onPress={closePanel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={c.panelClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Stepper
                label="Adultes"
                value={adults}
                min={1}
                onMinus={() => setAdults(v => Math.max(1, v - 1))}
                onPlus={() => setAdults(v => v + 1)}
              />
              <Stepper
                label="Enfants"
                value={children}
                min={0}
                onMinus={() => setChildren(v => Math.max(0, v - 1))}
                onPlus={() => setChildren(v => v + 1)}
              />

              <TouchableOpacity style={c.btnConfirm} onPress={handleConfirmParty}>
                <Text style={c.btnConfirmTxt}>Confirmer — {adults + children} pers.</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const c = StyleSheet.create({
  card:       { marginHorizontal: spacing.xl, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  cardDimmed: { opacity: 0.55 },

  header:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, padding: spacing.xl },
  restoName: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  meta:      { color: colors.textMuted, fontSize: typography.size.bodyLg, lineHeight: 18 },
  badge:     { borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, alignSelf: 'flex-start' },
  badgeTxt:  { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 0.5 },

  feedbackBanner:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginBottom: spacing.md, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  feedbackTxt:     { flex: 1, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, lineHeight: 18 },
  feedbackDismiss: { fontSize: typography.size.caption, fontWeight: typography.weight.bold },

  actions:   { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  btnMod:    { flex: 1, backgroundColor: colors.bg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center' },
  btnModTxt: { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  btnCancel: { backgroundColor: colors.redSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)', paddingVertical: spacing.md, alignItems: 'center' },
  btnCancelTxt: { color: colors.red, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold },
  btnDis:    { opacity: 0.5 },

  panel:        { marginHorizontal: spacing.xl, marginBottom: spacing.xl, backgroundColor: colors.bg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.md },
  panelHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle:   { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.semibold },
  panelSubtitle:{ color: colors.textMuted, fontSize: typography.size.caption, letterSpacing: 1, marginTop: spacing.xs },
  panelClose:   { color: colors.textMuted, fontSize: typography.size.heading2 },

  chipScroll:   { marginHorizontal: -spacing.xs },
  chipContent:  { paddingHorizontal: spacing.xs, gap: spacing.sm, flexDirection: 'row' },
  chip:         { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  chipSel:      { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt:      { color: colors.textMuted, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  chipTxtSel:   { color: '#FFFFFF' },

  btnConfirm:    { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.xs },
  btnConfirmTxt: { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold, letterSpacing: 0.3 },
});
