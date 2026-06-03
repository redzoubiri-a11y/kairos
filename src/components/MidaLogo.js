import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function MidaLogo({ showTagline = true, style }) {
  return (
    <View style={[s.wrap, style]}>
      <Text style={s.logo}>mida</Text>
      {showTagline && <Text style={s.tagline}>La bonne table, au bon moment.</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { alignItems: 'center' },
  logo:    { color: colors.accent, fontSize: typography.size.display, fontWeight: typography.weight.black, letterSpacing: -1, fontFamily: 'Georgia', marginBottom: spacing.xs },
  tagline: { color: colors.textMuted, fontSize: typography.size.body, fontStyle: 'italic', letterSpacing: 0.5 },
});
