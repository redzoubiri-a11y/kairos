import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PointsHistoryModal({ visible, onClose, balance, history, loading, erreur, onRetry }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.drag} />

          <Text style={s.title}>Historique des points</Text>
          {/* Sur erreur, le solde réel est inconnu — mieux vaut le taire
              que d'afficher 0 pts, qui laisserait croire à une perte. */}
          <Text style={s.balance}>{erreur ? '—' : balance.toLocaleString('fr-FR') + ' pts'}</Text>

          {loading ? (
            <ActivityIndicator color={colors.text} style={{ marginVertical: spacing.xxl }} />
          ) : erreur ? (
            <View style={{ alignItems: 'center', marginVertical: spacing.xxl }}>
              <Text style={s.empty}>
                {erreur === 'network' ? 'Pas de connexion. Vérifie ta connexion internet.' : 'Une erreur est survenue.'}
              </Text>
              <TouchableOpacity onPress={onRetry} style={s.retryBtn}>
                <Text style={s.retryBtnTxt}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : history.length === 0 ? (
            <Text style={s.empty}>Aucun mouvement pour l'instant.</Text>
          ) : (
            <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
              {history.map((p, i) => (
                <View key={p.id} style={[s.row, i < history.length - 1 && s.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowLabel}>{p.label}</Text>
                    <Text style={s.rowDate}>{fmtDate(p.created_at)}</Text>
                  </View>
                  <Text style={s.rowAmount}>+{p.montant}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xxl, paddingBottom: 40, maxHeight: '75%' },
  drag:    { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder, alignSelf: 'center', marginBottom: spacing.lg },

  title:   { fontFamily: typography.display, color: colors.text, fontSize: typography.size.heading2, textAlign: 'center' },
  balance: { fontFamily: typography.display, color: colors.primary, fontSize: 32, textAlign: 'center', marginTop: spacing.xs },

  empty: { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center', marginVertical: spacing.xxl },

  list: { marginTop: spacing.xl },
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
  rowBorder:{ borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  rowLabel: { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.body },
  rowDate:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.caption, marginTop: 2 },
  rowAmount:{ fontFamily: typography.bodyBold, color: colors.statusConfirmedText, fontSize: typography.size.subheading },

  retryBtn:    { marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  retryBtnTxt: { fontFamily: typography.bodyMedium, color: colors.primary, fontSize: typography.size.body },
  closeBtn:    { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.md },
  closeBtnTxt: { fontFamily: typography.bodyMedium, color: colors.textMuted, fontSize: typography.size.bodyLg },
});
