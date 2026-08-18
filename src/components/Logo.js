import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

// Lockup officiel MIDA (icône + wordmark) — mark vectoriel exact du logo 3D
// validé sur Claude Design (projet "Logo Mida 3D"), pas une approximation.
export default function Logo({ size = 32, textColor = colors.text }) {
  const fontSize = Math.round(size * 0.5);
  const gap = Math.round(size * 0.35);

  return (
    <View style={[st.row, { gap }]}>
      <Image
        source={require('../../assets/logo-mark.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      <Text style={[st.text, { fontSize, lineHeight: fontSize, color: textColor, letterSpacing: -fontSize * 0.015 }]}>
        MIDA
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center' },
  text: { fontFamily: typography.display },
});
