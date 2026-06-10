import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

/* Usage:
   <ErrorState type="network" onRetry={load} />
   <ErrorState type="404" onBack={() => navigation.goBack()} />
   <ErrorState type="empty" title="Aucun résultat" sub="..." />
   <ErrorState type="server" onRetry={load} />
*/

const PRESETS = {
  network: {
    icon: '📡',
    title: 'Pas de connexion',
    sub: 'Vérifie ta connexion internet et réessaie.',
    retryLabel: '🔄  Réessayer',
  },
  server: {
    icon: '⚙️',
    title: 'Erreur serveur',
    sub: 'Une erreur inattendue s\'est produite. Notre équipe a été notifiée.',
    retryLabel: '🔄  Réessayer',
  },
  404: {
    icon: '🍽️',
    title: 'Page introuvable',
    sub: 'Cette page n\'existe pas ou a été déplacée.',
  },
  empty: {
    icon: '📭',
    title: 'Aucun contenu',
    sub: 'Rien à afficher pour le moment.',
  },
};

export default function ErrorState({
  type = 'empty',
  icon,
  title,
  sub,
  onRetry,
  retryLabel,
  onBack,
  backLabel = 'Retour',
  style,
}) {
  const preset = PRESETS[type] || PRESETS.empty;
  const displayIcon  = icon  || preset.icon;
  const displayTitle = title || preset.title;
  const displaySub   = sub   || preset.sub;
  const displayRetry = retryLabel || preset.retryLabel;

  return (
    <View style={[s.wrap, style]}>
      <View style={s.iconWrap}>
        <Text style={s.icon}>{displayIcon}</Text>
      </View>
      <Text style={s.title}>{displayTitle}</Text>
      <Text style={s.sub}>{displaySub}</Text>
      <View style={s.actions}>
        {onRetry && (
          <TouchableOpacity style={s.primaryBtn} onPress={onRetry} activeOpacity={0.8}>
            <Text style={s.primaryBtnTxt}>{displayRetry}</Text>
          </TouchableOpacity>
        )}
        {onBack && (
          <TouchableOpacity style={s.ghostBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={s.ghostBtnTxt}>{backLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl || 48, gap: spacing.lg },
  iconWrap:   { width: 72, height: 72, borderRadius: 0, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  icon:       { fontSize: 32 },
  title:      { color: colors.text, fontSize: typography.size.heading3, fontWeight: '300', textAlign: 'center' },
  sub:        { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  actions:    { gap: spacing.md, width: '100%', marginTop: spacing.md },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.lg, alignItems: 'center' },
  primaryBtnTxt: { color: colors.bg, fontSize: typography.size.bodyLg || 15, fontWeight: typography.weight.bold },
  ghostBtn:   { borderRadius: radius.xl, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  ghostBtnTxt:{ color: colors.textMuted, fontSize: typography.size.bodyLg || 15 },
});
