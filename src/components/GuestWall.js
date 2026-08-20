import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

export default function GuestWall({ title, message }) {
  const navigation = useNavigation();
  const goAuth = () => navigation.navigate('Auth');

  return (
    <SafeAreaView style={s.root}>
      {navigation.canGoBack() && (
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={16} color={colors.text} />
        </TouchableOpacity>
      )}
      <View style={s.inner}>
        <View style={s.iconWrap}>
          <Image source={require('../../assets/logo.png')} style={s.icon} resizeMode="cover" />
        </View>
        <Text style={s.title}>{title || 'Connexion requise'}</Text>
        <Text style={s.message}>
          {message || 'Crée un compte gratuit pour accéder à cette fonctionnalité.'}
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={goAuth} activeOpacity={0.85}>
          <Text style={s.primaryTxt}>Se connecter  →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={goAuth} activeOpacity={0.7}>
          <Text style={s.secondaryTxt}>Créer un compte gratuit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bg },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.tagNeutralBg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginLeft: spacing.xl },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: spacing.xl },

  iconWrap: {
    width: 88, height: 88, borderRadius: radius.full,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: { width: 88, height: 88 },

  title:   { color: colors.text, fontFamily: typography.display, fontSize: typography.size.title, fontWeight: typography.weight.bold, letterSpacing: -0.3, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22 },

  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    paddingVertical: spacing.xl - 2, paddingHorizontal: spacing.xxxl,
    alignItems: 'center', width: '100%',
  },
  primaryTxt: { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold, letterSpacing: 0.5 },

  secondaryBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl },
  secondaryTxt: { color: colors.blue, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
});
