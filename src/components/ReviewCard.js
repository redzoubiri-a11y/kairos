import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { supabase } from '../../supabase';
import { colors, typography, spacing, radius } from '../theme';
import { formatDate, initials, avatarColor } from '../hooks/useProAvis';

export default function ReviewCard({ review, onSaveResponse, onApprove, onReject }) {
  const [replying, setReplying] = useState(false);
  const [text,     setText]     = useState(review.pro_response || '');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(!!review.pro_response);
  const [moderating, setModerating] = useState(false);

  const isPending = review.moderation_status === 'pending';

  const handleApprove = useCallback(async () => {
    setModerating(true);
    try { await onApprove?.(review.id); } finally { setModerating(false); }
  }, [review.id, onApprove]);

  const handleReject = useCallback(async () => {
    setModerating(true);
    try { await onReject?.(review.id); } finally { setModerating(false); }
  }, [review.id, onReject]);

  const name        = [review.users?.first_name, review.users?.last_name].filter(Boolean).join(' ') || 'Client';
  const col         = avatarColor(name);
  const ini         = initials(review.users?.first_name, review.users?.last_name);
  const stars       = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const ratingColor = review.rating >= 4 ? colors.green : review.rating === 3 ? colors.accent : colors.red;

  const save = useCallback(async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await supabase.from('reviews').update({ pro_response: text.trim() }).eq('id', review.id);
      setSaved(true);
      setReplying(false);
      onSaveResponse?.(review.id, text.trim());
    } finally {
      setSaving(false);
    }
  }, [text, review.id, onSaveResponse]);

  return (
    <View style={[s.card, isPending && s.cardPending]}>
      {isPending && (
        <View style={s.pendingBanner}>
          <Text style={s.pendingBannerTxt}>⏳  En attente de modération</Text>
        </View>
      )}
      <View style={s.top}>
        <View style={[s.avatar, { backgroundColor: col + '22', borderColor: col + '55' }]}>
          <Text style={[s.avatarTxt, { color: col }]}>{ini}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.date}>{formatDate(review.created_at)}</Text>
        </View>
        <View>
          <Text style={[s.stars, { color: ratingColor }]}>{stars}</Text>
        </View>
      </View>

      {!!review.comment && (
        <Text style={s.comment}>"{review.comment}"</Text>
      )}

      {saved && !replying && (
        <View style={s.responseWrap}>
          <View style={s.responseHeader}>
            <Text style={s.responseIcon}>🏪</Text>
            <Text style={s.responseLabel}>Votre réponse</Text>
            <TouchableOpacity onPress={() => setReplying(true)}>
              <Text style={s.editTxt}>Modifier</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.responseTxt}>{text}</Text>
        </View>
      )}

      {isPending ? (
        <View style={s.moderateRow}>
          <TouchableOpacity style={s.rejectBtn} onPress={handleReject} disabled={moderating}>
            <Text style={s.rejectTxt}>{moderating ? '···' : '✕  Rejeter'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.approveBtn} onPress={handleApprove} disabled={moderating}>
            <Text style={s.approveTxt}>{moderating ? '···' : '✓  Approuver'}</Text>
          </TouchableOpacity>
        </View>
      ) : replying ? (
        <View style={s.replyBox}>
          <TextInput
            style={s.replyInput}
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Répondre à cet avis…"
            placeholderTextColor={colors.textDim}
            autoFocus
          />
          <View style={s.replyActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setReplying(false); setText(review.pro_response || ''); }}>
              <Text style={s.cancelTxt}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              <Text style={s.saveTxt}>{saving ? '···' : 'Publier'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !saved && (
        <TouchableOpacity style={s.replyBtn} onPress={() => setReplying(true)}>
          <Text style={s.replyBtnTxt}>💬  Répondre à cet avis</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:           { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, marginHorizontal: spacing.xl, marginBottom: spacing.lg, padding: spacing.xl, gap: spacing.lg },
  cardPending:    { borderColor: 'rgba(232,160,69,0.4)', borderLeftWidth: 3, borderLeftColor: colors.accent },
  pendingBanner:  { backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  pendingBannerTxt: { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.regular },
  moderateRow:    { flexDirection: 'row', gap: spacing.md },
  rejectBtn:      { flex: 1, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(224,90,90,0.35)', backgroundColor: 'rgba(224,90,90,0.08)' },
  rejectTxt:      { color: colors.red, fontSize: typography.size.body },
  approveBtn:     { flex: 2, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', backgroundColor: colors.green },
  approveTxt:     { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },
  top:            { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar:         { width: 38, height: 38, borderRadius: 0, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontSize: typography.size.bodyLg || 15, fontWeight: typography.weight.medium },
  name:           { color: colors.text, fontSize: typography.size.subheading, fontWeight: '300' },
  date:           { color: colors.textDim, fontSize: typography.size.caption, marginTop: spacing.xxs },
  stars:          { fontSize: typography.size.bodyLg || 15, letterSpacing: 1 },
  comment:        { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 20, fontStyle: 'italic' },
  responseWrap:   { backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.accent },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  responseIcon:   { fontSize: 13 },
  responseLabel:  { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold, flex: 1 },
  editTxt:        { color: colors.textDim, fontSize: typography.size.xs },
  responseTxt:    { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18 },
  replyBtn:       { backgroundColor: 'rgba(200,151,90,0.14)', borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  replyBtnTxt:    { color: colors.accent, fontSize: typography.size.body },
  replyBox:       { gap: spacing.md },
  replyInput:     { backgroundColor: colors.bg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, color: colors.text, fontSize: typography.size.body, minHeight: 90, textAlignVertical: 'top' },
  replyActions:   { flexDirection: 'row', gap: spacing.md },
  cancelBtn:      { flex: 1, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  cancelTxt:      { color: colors.textMuted, fontSize: typography.size.body },
  saveBtn:        { flex: 2, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', backgroundColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  saveTxt:        { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },
});
