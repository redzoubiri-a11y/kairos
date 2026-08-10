import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';
import { useGuestContext } from '../context/GuestContext';

export default function GuestWall({ title, message }) {
  const { exitGuestMode } = useGuestContext();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.inner}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>✦</Text>
        </View>
        <Text style={s.title}>{title || 'Connexion requise'}</Text>
        <Text style={s.message}>
          {message || 'Crée un compte gratuit pour accéder à cette fonctionnalité.'}
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={exitGuestMode} activeOpacity={0.85}>
          <Text style={s.primaryTxt}>Se connecter  →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={exitGuestMode} activeOpacity={0.7}>
          <Text style={s.secondaryTxt}>Créer un compte gratuit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: spacing.xl },

  iconWrap: {
    width: 88, height: 88, borderRadius: radius.xxl,
    backgroundColor: colors.accentSoft,
    borderWidth: 1.5, borderColor: 'rgba(232,160,69,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: { color: colors.accent, fontSize: 32 },

  title:   { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.3, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22 },

  primaryBtn: {
    backgroundColor: colors.gold, borderRadius: radius.xl,
    paddingVertical: spacing.xl - 2, paddingHorizontal: spacing.xxxl,
    alignItems: 'center', width: '100%',
    shadowColor: colors.shadow, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7,
  },
  primaryTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold, letterSpacing: 0.5 },

  secondaryBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl },
  secondaryTxt: { color: colors.blue, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
});
