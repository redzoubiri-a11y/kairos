import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

/**
 * Logo Mawsim — lettre arabe « م » dans un carré arrondi,
 * dégradé émeraude → terracotta (Annexe A).
 */
export default function MawsimLogo({ size = 36, showText = true, tone = 'default' }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  const onDark = tone === 'onDark';

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.55, color: '#FFFFFF', fontWeight: '500', lineHeight: size * 0.8 }}>
          م
        </Text>
      </LinearGradient>

      {showText && (
        <View>
          <Text
            style={[
              typography.title,
              { color: onDark ? '#FFFFFF' : colors.dark, letterSpacing: 0.3 },
            ]}
          >
            {t('common.appName')}
          </Text>
          <Text style={[typography.caption, { color: onDark ? 'rgba(255,255,255,0.75)' : colors.warmGray }]}>
            {t('common.tagline')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
