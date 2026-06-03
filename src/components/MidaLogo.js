import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function MidaLogo({ showTagline = true, style }) {
  return (
    <View style={[s.wrap, style]}>
      <View style={s.logoWrap}>
        <Text style={[s.logo, s.d4]}>mida</Text>
        <Text style={[s.logo, s.d3]}>mida</Text>
        <Text style={[s.logo, s.d2]}>mida</Text>
        <Text style={[s.logo, s.d1]}>mida</Text>
        <Text style={[s.logo, s.shine]}>mida</Text>
        <Text style={s.logo}>mida</Text>
      </View>
      {showTagline && <Text style={s.tagline}>La bonne table, au bon moment.</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { alignItems: 'center' },
  logoWrap:{ position: 'relative', opacity: 0.72 },
  logo:    { color: colors.accent, fontSize: typography.size.display, fontWeight: typography.weight.black, letterSpacing: -1, fontFamily: 'Georgia', marginBottom: spacing.xs, textShadowColor: '#3D2008', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 },
  d1:      { position: 'absolute', top: 1,  left: 1,  color: '#C47830' },
  d2:      { position: 'absolute', top: 2,  left: 2,  color: '#9A5820' },
  d3:      { position: 'absolute', top: 3,  left: 3,  color: '#6B3A10' },
  d4:      { position: 'absolute', top: 4,  left: 4,  color: '#3D2008' },
  shine:   { position: 'absolute', top: -1, left: -1, color: 'rgba(255,220,140,0.55)' },
  tagline: { color: colors.textMuted, fontSize: typography.size.body, fontStyle: 'italic', letterSpacing: 0.5 },
});
