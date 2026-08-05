import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

/**
 * Logo Tasale — initiale dans un carré arrondi, dégradé émeraude → terracotta.
 * L'initiale reste latine dans les deux langues : la translittération arabe ou
 * tifinagh de la marque n'est pas arrêtée.
 */
export default function TasaleLogo({ size = 36, showText = true, tone = 'default' }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  const onDark = tone === 'onDark';

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: colors.logoBg,
          alignItems: 'center',
          justifyContent: 'center',
          // Le carré est sombre : ce liseré le détache du fond en thème sombre
          // sans se voir sur fond blanc.
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255,255,255,0.16)',
        }}
      >
        <Text
          style={{
            fontSize: size * 0.55,
            color: colors.logoInk,
            fontWeight: '600',
            lineHeight: size * 0.8,
          }}
        >
          T
        </Text>
      </View>

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
