import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

function StarPicker({ value, onChange }) {
  return (
    <View style={s.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={8}>
          <Text style={[s.star, i <= value && s.starOn]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const LABELS = { 1: 'Très décevant', 2: 'Décevant', 3: 'Correct', 4: 'Très bien', 5: 'Excellent !' };

export default function ReviewModal({ resa, visible, onClose, onSubmit, submitting }) {
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

          <Text style={s.title}>Votre avis</Text>
          {!!resa?.restaurants?.name && (
            <Text style={s.sub}>{resa.restaurants.name}</Text>
          )}

          <StarPicker value={rating} onChange={setRating} />

          {rating > 0 && (
            <Text style={s.label}>{LABELS[rating]}</Text>
          )}

          {!!error && <Text style={s.error}>{error}</Text>}

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
              : <Text style={s.btnSubmitTxt}>PUBLIER L'AVIS</Text>
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

  title:        { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.regular, textAlign: 'center' },
  sub:          { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', marginTop: -spacing.sm },

  stars:        { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  star:         { fontSize: 38, color: colors.cardBorder },
  starOn:       { color: colors.accent },
  label:        { color: colors.accent, fontSize: typography.size.body, textAlign: 'center', marginTop: -spacing.md },

  error:        { color: colors.red, fontSize: typography.size.body, textAlign: 'center' },

  inputWrap:    { backgroundColor: colors.bg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder },
  input:        { color: colors.text, fontSize: typography.size.bodyLg, padding: spacing.xl, minHeight: 90 },
  charCount:    { color: colors.textDim, fontSize: typography.size.sm, textAlign: 'right', paddingRight: spacing.lg, paddingBottom: spacing.sm },

  btnSubmit:    { backgroundColor: colors.accent, borderRadius: radius.xxl, paddingVertical: 15, alignItems: 'center' },
  btnDim:       { opacity: 0.4 },
  btnSubmitTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },
  btnCancel:    { alignItems: 'center', paddingVertical: spacing.md },
  btnCancelTxt: { color: colors.textMuted, fontSize: typography.size.bodyLg },
});
