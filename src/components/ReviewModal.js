import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

function fmtVisitDate(iso) {
  if (!iso) return null;
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function StarPicker({ value, onChange }) {
  return (
    <View style={s.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[s.star, i <= value && s.starOn]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const LABELS = { 1: 'Très décevant', 2: 'Décevant', 3: 'Correct', 4: 'Très bien', 5: 'Excellent !' };

export default function ReviewModal({ resa, visible, onClose, onSubmit, submitting, serverError }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [error,   setError]   = useState('');

  const handleSubmit = () => {
    if (rating === 0) { setError('Choisissez une note pour continuer.'); return; }
    setError('');
    onSubmit(resa, rating, comment.trim());
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.sheet}>

          <View style={s.drag} />

          <Text style={s.title}>Laisser un avis</Text>

          {!!resa?.restaurants?.name && (
            <View style={s.rCtx}>
              {resa.restaurants.photos?.[0]
                ? <Image source={{ uri: resa.restaurants.photos[0] }} style={s.rPhoto} resizeMode="cover" />
                : <View style={[s.rPhoto, { backgroundColor: colors.cardHover }]} />
              }
              <View>
                <Text style={s.rName}>{resa.restaurants.name}</Text>
                {!!fmtVisitDate(resa.date) && <Text style={s.rDate}>Visite du {fmtVisitDate(resa.date)}</Text>}
              </View>
            </View>
          )}

          <Text style={s.starPrompt}>Comment était votre expérience ?</Text>
          <StarPicker value={rating} onChange={setRating} />

          {rating > 0 && (
            <Text style={s.label}>{LABELS[rating]}</Text>
          )}

          {!!(error || serverError) && <Text style={s.error}>{error || serverError}</Text>}

          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Partagez votre expérience… (optionnel)"
              placeholderTextColor={colors.textDim}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{comment.length}/500</Text>
          </View>

          <TouchableOpacity
            style={[s.btnSubmit, (rating === 0 || submitting) && s.btnDim]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={s.btnSubmitTxt}>Publier l'avis</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.btnCancel} onPress={handleClose} disabled={submitting}>
            <Text style={s.btnCancelTxt}>Annuler</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xxl, paddingBottom: 40, gap: spacing.xl, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  drag:         { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder, alignSelf: 'center', marginBottom: spacing.sm },

  title:        { color: colors.text, fontFamily: typography.display, fontSize: typography.size.subheading + 2, textAlign: 'center' },
  sub:          { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', marginTop: -spacing.sm },

  rCtx:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2, backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.lg + 2 },
  rPhoto:   { width: 44, height: 44, borderRadius: radius.md + 1 },
  rName:    { fontFamily: typography.display, fontSize: typography.size.body + 1, color: colors.text },
  rDate:    { fontFamily: typography.body, fontSize: typography.size.xs + 1.5, color: colors.textDim, marginTop: 2 },

  starPrompt: { fontFamily: typography.display, fontSize: typography.size.subheading, color: colors.text, textAlign: 'center' },
  stars:        { flexDirection: 'row', justifyContent: 'center', gap: spacing.md + 2 },
  star:         { fontSize: 34, color: colors.cardBorder },
  starOn:       { color: colors.star },
  label:        { fontFamily: typography.bodyMedium, color: colors.star, fontSize: typography.size.body, textAlign: 'center', marginTop: -spacing.md },

  error:        { fontFamily: typography.body, color: colors.red, fontSize: typography.size.body, textAlign: 'center' },

  inputWrap:    { backgroundColor: 'transparent', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder },
  input:        { fontFamily: typography.body, color: colors.text, fontSize: typography.size.body, padding: spacing.lg + 2, minHeight: 100 },
  charCount:    { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.sm, textAlign: 'right', paddingRight: spacing.lg, paddingBottom: spacing.sm },

  btnSubmit:    { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
  btnDim:       { opacity: 0.4 },
  btnSubmitTxt: { fontFamily: typography.display, color: '#FFFFFF', fontSize: typography.size.subheading - 1 },
  btnCancel:    { alignItems: 'center', paddingVertical: spacing.md },
  btnCancelTxt: { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.bodyLg },
});
