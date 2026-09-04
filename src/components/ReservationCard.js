import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image,
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
  confirmed: { label: 'CONFIRMÉE',  color: colors.statusConfirmedText, bg: colors.statusConfirmedBg },
  pending:   { label: 'EN ATTENTE', color: colors.statusPendingText,   bg: colors.statusPendingBg   },
  cancelled: { label: 'ANNULÉE',    color: colors.statusCancelledText, bg: colors.statusCancelledBg },
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
  stepLabel:     { fontFamily: typography.bodyMedium, color: colors.text, fontSize: typography.size.bodyLg },
  stepRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepBtn:       { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  stepBtnDis:    { opacity: 0.35 },
  stepBtnTxt:    { fontFamily: typography.bodyMedium, color: colors.text, fontSize: typography.size.heading1, lineHeight: 22 },
  stepBtnTxtDis: { color: colors.textMuted },
  stepVal:       { fontFamily: typography.display, color: colors.text, fontSize: typography.size.heading2, minWidth: 28, textAlign: 'center' },
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

  // Pastille date en tête de carte — Mes réservations.dc.html : "Aujourd'hui ·
  // 20:00" / "Ven. 21 août · 13:00", en accent au-dessus du statut.
  const dateBadgeLabel = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((new Date(r.date + 'T00:00:00') - today) / 86400000);
    let dayPart;
    if (diffDays === 0) dayPart = "Aujourd'hui";
    else if (diffDays === 1) dayPart = 'Demain';
    else {
      const raw = new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      dayPart = raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return `${dayPart} · ${timeLabel}`;
  }, [r.date, timeLabel]);

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
      <View style={c.cardTop}>
        <Text style={c.dateBadge} numberOfLines={1}>{dateBadgeLabel}</Text>
        <View style={[c.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[c.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <View style={c.header}>
        <View style={c.photoWrap}>
          {r.restaurants?.photos?.[0]
            ? <Image source={{ uri: r.restaurants.photos[0] }} style={c.photo} resizeMode="cover" />
            : <View style={[c.photo, c.photoPlaceholder]} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={c.restoName} numberOfLines={1}>
            {r.restaurants?.name ?? '—'}
          </Text>
          <Text style={c.meta}>
            {partyCount} personne{partyCount > 1 ? 's' : ''}{r.restaurants?.quartier ? ` · ${r.restaurants.quartier}` : ''}
          </Text>
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
                <Text style={c.btnCancelTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{acting ? '···' : 'Annuler la réservation'}</Text>
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
  card:       { marginHorizontal: spacing.xl, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.lg + 1, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  cardDimmed: { opacity: 0.55 },

  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.lg + 2 },
  dateBadge: { flex: 1, fontFamily: typography.bodyBold, fontSize: typography.size.caption - 1, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.3 },

  header:    { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl, paddingTop: spacing.md },
  photoWrap: { width: 56, height: 56, flexShrink: 0, borderRadius: radius.md, overflow: 'hidden' },
  photo:     { width: '100%', height: '100%' },
  photoPlaceholder: { backgroundColor: colors.cardHover },
  restoName: { color: colors.text, fontFamily: typography.display, fontSize: typography.size.subheading - 1, letterSpacing: -0.2 },
  meta:      { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.caption + 0.5, marginTop: 3 },
  badge:     { flexShrink: 0, borderRadius: radius.sm + 2, paddingHorizontal: spacing.sm, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.xs + 0.5, letterSpacing: 0.2 },

  feedbackBanner:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginBottom: spacing.md, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  feedbackTxt:     { fontFamily: typography.bodyMedium, flex: 1, fontSize: typography.size.bodyLg, lineHeight: 18 },
  feedbackDismiss: { fontFamily: typography.bodyBold, fontSize: typography.size.caption },

  actions:   { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  btnMod:    { flex: 1, backgroundColor: colors.bg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center' },
  btnModTxt: { fontFamily: typography.bodyMedium, color: colors.text, fontSize: typography.size.body },
  btnCancel: { backgroundColor: 'transparent', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: spacing.md, alignItems: 'center' },
  btnCancelTxt: { fontFamily: typography.bodySemibold, color: colors.red, fontSize: typography.size.bodyLg },
  btnDis:    { opacity: 0.5 },

  panel:        { marginHorizontal: spacing.xl, marginBottom: spacing.xl, backgroundColor: colors.bg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.md },
  panelHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle:   { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.heading3 },
  panelSubtitle:{ fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.caption, letterSpacing: 1, marginTop: spacing.xs },
  panelClose:   { color: colors.textMuted, fontSize: typography.size.heading2 },

  chipScroll:   { marginHorizontal: -spacing.xs },
  chipContent:  { paddingHorizontal: spacing.xs, gap: spacing.sm, flexDirection: 'row' },
  chip:         { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  chipSel:      { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt:      { fontFamily: typography.bodyMedium, color: colors.textMuted, fontSize: typography.size.body },
  chipTxtSel:   { color: colors.card },

  btnConfirm:    { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.xs },
  btnConfirmTxt: { fontFamily: typography.bodyBold, color: colors.card, fontSize: typography.size.bodyLg, letterSpacing: 0.3 },
});
