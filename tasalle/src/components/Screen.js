import { View, Text, Pressable, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

/** Conteneur d'écran : fond crème, zones sûres, barre d'état accordée au thème. */
export function Screen({ children, edges = ['top'], style }) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.cream }, style]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.cream} />
      {children}
    </SafeAreaView>
  );
}

/** En-tête d'écran avec retour optionnel et actions à droite. */
export function Header({ title, subtitle, onBack, right, center = false, bordered = true }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: bordered ? 1 : 0,
        borderBottomColor: colors.border,
        backgroundColor: colors.cream,
      }}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={{ padding: 2 }}
        >
          <Ionicons name={'arrow-back'} size={22} color={colors.dark} />
        </Pressable>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text
          style={[typography.title, { color: colors.dark, textAlign: center ? 'center' : 'left' }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[typography.caption, { color: colors.warmGray, textAlign: center ? 'center' : 'left' }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? (onBack ? <View style={{ width: 22 }} /> : null)}
    </View>
  );
}

/** Corps scrollable avec marge basse pour les barres flottantes. */
export function Body({ children, contentStyle, bottomInset = 0, refreshControl }) {
  const { spacing } = useTheme();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      contentContainerStyle={[
        { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl + bottomInset },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

/** Barre d'action collée en bas (§4.3 « sticky bottom bar »). */
export function StickyBar({ children }) {
  const { colors, spacing, shadows } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadows.sticky,
      }}
    >
      {children}
    </View>
  );
}
